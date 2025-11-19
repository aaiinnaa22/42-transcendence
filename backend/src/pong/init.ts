import type { FastifyInstance, FastifyRequest } from "fastify";
import Game, { Location } from "./game.ts";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import type { WebSocket } from "@fastify/websocket";
import { Prisma, type User } from "@prisma/client";
import type Player from "./player.ts";
import { INITIAL_ELO_RANGE, ELO_RANGE_INCREASE, MAX_ELO_RANGE, RANGE_INCREASE_INTERVAL } from "./constants.ts";


type UserId = string;
type GameId = string;

type PlayerConnection = {
	userId: UserId;
	socket: WebSocket;
	gameId: GameId | null;
	eloRating: number;
	joinedAt: number;
};

type WaitingPlayer = {
	userId: UserId;
	eloRating: number;
	joinedAt: number;
};

const gameComponent = async ( server: FastifyInstance ) =>
{
	// This stores the game rooms (should be let)
	const games : Record<GameId, Game>  = {};
	const activePlayers: Map<UserId, PlayerConnection> = new Map();
	const playerQueue: WaitingPlayer[] = [];


	// Helper for queueing new players
	const queuePlayerForTournament = async ( id: UserId, socket: WebSocket ) => {
		const stats = await server.prisma.playerStats.findUnique( {
			where: { userId: id },
			select: { eloRating: true }
		} );

		const eloRating = stats?.eloRating ?? 1200;
		const joinedAt = Date.now();

		// Create player connection profile
		const playerConnection: PlayerConnection = {
			userId: id,
			socket,
			gameId: null,
			eloRating,
			joinedAt
		};
		const waitingPlayer: WaitingPlayer = {
			userId: id,
			eloRating,
			joinedAt
		};

		// Store connection info and queue the player
		activePlayers.set( id, playerConnection );
		playerQueue.push( waitingPlayer );

		server.log.info( `Game: Player ${id} with elo ${eloRating} joined the queue.`);
		socket.send( JSON.stringify({
			type: "waiting",
			position: playerQueue.length,
			eloRating
		}));

		matchmakingLoop();
	};

	// Helper for creating tournament games
	const createMultiplayerSession = ( player1: PlayerConnection, player2: PlayerConnection ) => {
		const gameId: GameId = Date.now().toString();
		const game = new Game( gameId, [player1.socket, player2.socket] );

		game.addPlayer( Location.Left, player1.userId );
		game.addPlayer( Location.Right, player2.userId );

		player1.gameId = gameId;
		player2.gameId = gameId;

		games[gameId] = game;

		// Game begins (Alternatively send a message with a type taht announces the game start)
		const gameState = game.getState();				// Get game state
		const payload = JSON.stringify( gameState );	// Serialize the game state
		player1.socket.send( payload );
		player2.socket.send( payload );
	};

	// Helper for pairing up players by their elo (Fine-tune variables in constants file)
	const matchmakingLoop = () => {
		// Not enough queued players
		if ( playerQueue.length < 2 ) return;

		const now = Date.now();
		const matched: Set<UserId> = new Set();

		// Loop through players and find  asuitable match against them
		for ( let i = 0; i < playerQueue.length; ++i )
		{
			if ( matched.has( playerQueue[i]!.userId )) continue;

			const player1 = playerQueue[i];
			if ( !player1 ) continue;
			const timeWaited = now - player1!.joinedAt;

			const eloRange = Math.min(
                INITIAL_ELO_RANGE + Math.floor( timeWaited / RANGE_INCREASE_INTERVAL ) * ELO_RANGE_INCREASE,
                MAX_ELO_RANGE
            );

			let bestMatch: WaitingPlayer | undefined = undefined;
			let smallestDifference = Infinity;

			// Attempt to find a player match within the Elo range of the player1
			// Potentially check from earlier elements in the array
            for ( let j = i + 1; j < playerQueue.length; ++j )
            {
                if ( matched.has( playerQueue[j]!.userId ) ) continue;

                const player2 = playerQueue[j];
				if ( !player2 ) continue;
                const eloDiff = Math.abs( player1.eloRating - player2.eloRating );

                if ( eloDiff <= eloRange && eloDiff < smallestDifference )
                {
                    bestMatch = player2;
                    smallestDifference = eloDiff;
                }
            }

			// Create a new game instance if a match is found
			if ( bestMatch )
			{
				const connection1 = activePlayers.get( player1.userId );
				const connection2 = activePlayers.get( bestMatch.userId );

				if ( connection1 && connection2 )
				{
					createMultiplayerSession( connection1, connection2 );

					matched.add( player1.userId );
					matched.add( bestMatch.userId );
				}
			}
		}

		// Remove any matched players from the waiting queue
		playerQueue.splice( 0, playerQueue.length, ...playerQueue.filter( p => !matched.has( p.userId ) ));
	};
	const matchmakingInterval = setInterval( matchmakingLoop, 2000 /* Interval when to check */ );

	// Multiplayer game handler
	server.get( "/game/multiplayer",
		{ websocket: true, preHandler: authenticate },
		async ( socket: WebSocket, request: FastifyRequest ) =>
	{
        const { userId } = request.user as { userId: string };

		// Check if the player is already in a match
		if ( activePlayers.has( userId ) )
		{
			socket.send(JSON.stringify( {
				type: "error",
				message: "Already in a match"
			} ));
			socket.close();
			return;
		}

		// Queue the connected player
		await queuePlayerForTournament( userId, socket );

		socket.on( "message", ( message: any ) =>
		{
			const data = JSON.parse( message.toString() );
			const playerConnection = activePlayers.get( userId );

			// Fetch the active game
			if ( !playerConnection?.gameId ) return;
			const game = games[playerConnection.gameId];

			// Moves the player based on their userId.
			if ( data.type === "move" && game )
			{
				game.movePlayer( userId, data.dx, data.dy );

				const gameState = game.getState(); // Get game state
				const payload = JSON.stringify( gameState ); // Serialize the game state
				socket.send( payload );
			}
		} );

		socket.on( "close", () =>
		{
			const playerConnection = activePlayers.get( userId );

			// Was the player in a game or were they queueing
			if (playerConnection?.gameId)
			{
				const game = games[playerConnection.gameId];
				if ( !game ) return;

				// TODO: Update players stats
				// TODO: Send message to the winner and loser

				// Clean up the session
				server.log.info( `Game: Player disconnect, ending session ${game.id}` );
				game.destroy();
				delete games[game.id];
			}
			else
			{
				const index = playerQueue.findIndex( p => p.userId === userId );
				if ( index > -1 ) playerQueue.splice( index, 1 );

				server.log.info( `Game: Player ${userId} was removed from the queue.` );
			}
		} );
	} );

	server.addHook( "onClose", () => {
		clearInterval( matchmakingInterval );
	});
};

export default gameComponent;
