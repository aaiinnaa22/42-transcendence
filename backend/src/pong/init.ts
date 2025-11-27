import type { FastifyInstance, FastifyRequest } from "fastify";
import Game, { GameMode, Location, type GameEndData } from "./game.ts";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import type { WebSocket } from "@fastify/websocket";
import { INITIAL_ELO_RANGE, ELO_RANGE_INCREASE, MAX_ELO_RANGE, RANGE_INCREASE_INTERVAL, INACTIVITY_TIMEOUT, ELO_K_FACTOR } from "./constants.ts";
import type { GameState } from "../schemas/game.states.schema.ts";
import type Player from "./player.ts";


type UserId = string;
type GameId = string;
type UserName = string;

type PlayerConnection = {
	userName: UserName;
	userId: UserId;
	socket: WebSocket;
	gameId: GameId | null;
	eloRating: number;
	joinedAt: number;
	lastActivityAt: number;
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
			select: { eloRating: true, user: { select: { username: true }} },
		} );

		const eloRating = stats?.eloRating ?? 1000;
		const userName = stats?.user?.username ?? "Unknown";
		const joinedAt = Date.now();

		// Create player connection profile
		const playerConnection: PlayerConnection = {
			userName,
			userId: id,
			socket,
			gameId: null,
			eloRating,
			joinedAt,
			lastActivityAt: joinedAt
		};
		const waitingPlayer: WaitingPlayer = {
			userId: id,
			eloRating,
			joinedAt
		};

		// Store connection info and queue the player
		activePlayers.set( id, playerConnection );
		playerQueue.push( waitingPlayer );

		server.log.info( `Game: Player ${userName} with elo ${eloRating} joined the queue.`);
		socket.send( JSON.stringify({
			type: "waiting",
			position: playerQueue.length,
			eloRating
		}));

		matchmakingLoop();
	};

	// Helper for starting single player games
	const startSinglePlayerGame = async ( id: UserId, socket: WebSocket ) => {
			const stats = await server.prisma.playerStats.findUnique( {
			where: { userId: id },
			select: { eloRating: true, user: { select: { username: true }} },
		} );

		const eloRating = stats?.eloRating ?? 1200;
		const userName = stats?.user?.username ?? "Unknown";
		const joinedAt = Date.now();

		const playerConnection: PlayerConnection = {
			userName,
			userId: id,
			socket,
			gameId: null,
			eloRating,
			joinedAt,
			lastActivityAt: joinedAt
		};

		activePlayers.set( id, playerConnection );

		const gameId: GameId = Date.now().toString();
		const game = new Game(
			gameId,
			[socket],
			GameMode.Singleplayer,
			(data) => handleGameEnd( gameId, data ) );

		game.addPlayer( Location.Left, id, playerConnection.userName);
		game.addPlayer( Location.Right, id, playerConnection.userName);

		playerConnection.gameId = gameId;

		games[gameId] = game;

		// Game begins
		const gameState: GameState = game.getState();
		const payload = JSON.stringify( gameState );
		socket.send( payload );
	};

	// Helper for creating tournament games
	const createMultiplayerSession = ( player1: PlayerConnection, player2: PlayerConnection ) => {
		const gameId: GameId = Date.now().toString();
		const game = new Game(
			gameId,
			[player1.socket, player2.socket],
			GameMode.Tournament,
			(data) => handleGameEnd( gameId, data ) );

		game.addPlayer( Location.Left, player1.userId, player1.userName );
		game.addPlayer( Location.Right, player2.userId, player2.userName );

		player1.gameId = gameId;
		player2.gameId = gameId;
		player1.lastActivityAt = Date.now();
        player2.lastActivityAt = Date.now();

		games[gameId] = game;

		// Game begins (Alternatively send a message with a type taht announces the game start)
		const gameState : GameState = game.getState();				// Get game state
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

	// Inactivity checker
    const checkInactivity = () => {
        const now = Date.now();

        for (const [gameId, game] of Object.entries(games)) {
			if (game.hasEnded) continue;

            let hasInactivePlayer = false;
			let loserPlayer : Player | undefined;

            // Check each player in the game
            game.players.forEach( player => {
                const playerConnection = activePlayers.get(player.userId);
                if (playerConnection) {
                    const inactiveTime = now - playerConnection.lastActivityAt;
                    if (inactiveTime > INACTIVITY_TIMEOUT) {
                        hasInactivePlayer = true;
						loserPlayer = player;
                        server.log.warn(`Game: Player ${player.userId} inactive for ${Math.floor(inactiveTime / 1000)}s in game ${gameId}`);
                    }
                }
            });

            // End game if any player is inactive
            if (hasInactivePlayer && loserPlayer )
			{
                server.log.info(`Game: Ending game ${gameId} due to player inactivity`);
				//Message players about game ending due to inactivity

				const winnerPlayer = game.players[0]?.userId !== loserPlayer.userId
					? game.players[0] : game.players[1];

				const data : GameEndData = {
					reason: "inactivity",
					winner: winnerPlayer ?? null,
					loser: loserPlayer
				};
				handleGameEnd(game.id, data);
			}
            endGame(game);
        }
    };

	const inactivityCheckInterval = setInterval(checkInactivity, 30000);
	const matchmakingInterval = setInterval( matchmakingLoop, 2000 /* Interval when to check */ );

	// Multiplayer game handler with matchmaking
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
			if ( !game || game.hasEnded ) return;

			// Update last activity time
            playerConnection.lastActivityAt = Date.now();

			// Moves the player based on their userId.
			if ( data.type === "move" )
			{
				game.movePlayer( userId, data.dy );

				const gameState : GameState = game.getState();	// Get game state
				const payload = JSON.stringify( gameState );	// Serialize the game state
				socket.send( payload );
			}

			// TODO: Figure out a fair win condition
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
				endGame( game );
			}
			else
			{
				// Remove inactive player from the activePlayers map
				playerConnection?.socket.close();
				activePlayers.delete( userId );

				// Remove inactive player from the queue
				const index = playerQueue.findIndex( p => p.userId === userId );
				if ( index > -1 ) playerQueue.splice( index, 1 );

				server.log.info( `Game: Player ${userId} was removed from the queue.` );
			}
		} );
	} );

	server.get( "/game/singleplayer",
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

		await startSinglePlayerGame( userId, socket );

		socket.on( "message", ( message: any ) =>
		{
			const data = JSON.parse( message.toString() );
			const playerConnection = activePlayers.get( userId );
			if ( !playerConnection?.gameId ) return;
			const game = games[playerConnection.gameId];
			if ( !game || game.hasEnded ) return;

			// Update last activity time
            playerConnection.lastActivityAt = Date.now();

			// Moves the player based on their userId.
			if ( data.type === "move" )
			{
				game.movePlayer( data.id, data.dy );

				const gameState: GameState = game.getState();	// Get game state
				const payload = JSON.stringify( gameState );	// Serialize the game state
				socket.send( payload );
			}
		});

		socket.on( "close", () =>
		{
			// Single player -> no elo calculations needed
			const playerConnection = activePlayers.get( userId );

			// Remove disconnected player
			if ( activePlayers.has( userId ))
				activePlayers.delete( userId );

			if ( !playerConnection?.gameId ) return;
			const game = games[playerConnection.gameId];
			if ( game )
			{
				server.log.info( `Game: Player disconnect, ending session ${game.id}` );
				endGame( game );
			}
		} );
	} );

	// ============= GAME END =============

	// Hanler for recalculating elo rating and ending the game
	const handleGameEnd = async ( gameId: GameId, data: GameEndData ) => {
		const game = games[gameId];
		if ( !game ) return;

		if ( game.mode === GameMode.Tournament && data.winner && data.loser )
		{
			// TODO: Recalculate elo and message the users about their new elo
			try
			{
				const winnerConnection = activePlayers.get(data.winner.userId);
				const loserConnection = activePlayers.get(data.loser.userId);

				if ( winnerConnection && loserConnection )
				{
					// Mathematically symmetrical score calculation
					const expectedScore = 1 / (1 + Math.pow(10,
						(loserConnection.eloRating - winnerConnection.eloRating) / 400));

					const eloChange = ELO_K_FACTOR * (1 - expectedScore);

					// Update winner rating
					const updatedWinner = await server.prisma.playerStats.update({
						where: { userId: data.winner.userId },
						data: {
							eloRating: { increment: eloChange },
							wins: { increment: 1 },
							playedGames: { increment: 1 }
						},
						select: { eloRating: true }
					});

					// Update loser rating
					const updatedLoser = await server.prisma.playerStats.update({
						where: { userId: data.loser.userId },
						data: {
							eloRating: { decrement: eloChange },
							losses: { increment: 1 },
							playedGames: { increment: 1 }
						},
						select: { eloRating: true }
					});

					// Coulld optionally pack the user avatars
					const endStateMessage = {
						type: "end",
						winner: winnerConnection.userName,
						loser: loserConnection.userName,
						elo: {
							winnerElo:updatedWinner.eloRating,
							loserElo: updatedLoser.eloRating
						},
						oldElo: {
							winner: winnerConnection.eloRating,
							loser: loserConnection.eloRating
						},
						score: {
							winner: data.winner.points,
							loser: data.loser.points
						},
						message: `${winnerConnection.userName} won!`
					}

					if ( data.reason === "inactivity" )
					{
						endStateMessage.message = "Game ended due to inactivity";
					}

					// Message the players
					winnerConnection.socket.send( JSON.stringify(endStateMessage) );
					loserConnection.socket.send( JSON.stringify(endStateMessage) );
				}
			}
			catch (error)
			{
				server.log.error( `Game: Elo update failed: ${error}` );
			}
		}

		endGame(game);
	};

	const endGame = ( game: Game ) => {
		// Remove players from the active players
		game.players.forEach( p => {
			activePlayers.delete(p.userId);
		} );

		// Destroy the game
		game.destroy();
		delete games[game.id];
	};

	server.addHook( "onClose", () => {
		clearInterval( inactivityCheckInterval );
		clearInterval( matchmakingInterval );
	});
};

export default gameComponent;
