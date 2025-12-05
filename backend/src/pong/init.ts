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
			elo: eloRating
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
		for (const [gameId, game] of Object.entries(games)) {
			if ( game.hasEnded ) continue;

			const now = Date.now();

			// Check inactive players in singleplayer games
			if ( game.mode === GameMode.Singleplayer )
			{
				const player = game.players[0];
				if ( !player ) continue;

				const playerConnection = activePlayers.get(player.userId);
				if (playerConnection)
				{
					const inactiveTime = now - playerConnection.lastActivityAt;
					if (inactiveTime > INACTIVITY_TIMEOUT)
					{
						server.log.info(`Game: Ending singleplayer game ${gameId} due to inactivity`);
						const data : GameEndData = {
							reason: "inactivity",
							winner: null,
							loser: null
						};
						handleGameEnd(game.id, data);
                    }
				}
			}
			// Inactive player forfeits the game
			else if ( game.mode === GameMode.Tournament )
			{
				// Find inactive player in tournament game
				const loserPlayer = game.players.find( player => {
					const playerConnection = activePlayers.get(player.userId);
					if ( !playerConnection ) return false;

            	    const inactiveTime = now - playerConnection.lastActivityAt;

					if (inactiveTime > INACTIVITY_TIMEOUT) {
            	        server.log.info(`Game: Player ${player.userId} inactive for ${Math.floor(inactiveTime / 1000)}s in game ${gameId}`);
						return true;
            	    }
					return false;
				});

				// End game if any player is inactive
            	if ( loserPlayer )
				{
            	    server.log.info(`Game: Ending tournament game ${gameId} due to player inactivity`);

					const winnerPlayer = game.players.find( player => player.userId !== loserPlayer.userId );

					const data : GameEndData = {
						reason: "inactivity",
						winner: winnerPlayer ?? null,
						loser: loserPlayer
					};
					handleGameEnd(game.id, data);
				}
			}
        }
    };

	const inactivityCheckInterval = setInterval( checkInactivity, 30000 /* 30 second interval */ );
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

			// TODO: Implement a strict schema for checking user messages
			if (!data) return;

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
		} );

		socket.on( "close", () =>
		{
			const playerConnection = activePlayers.get( userId );

			// Player was in game
			if (playerConnection?.gameId)
			{
				const game = games[playerConnection.gameId];
				if ( game && !game.hasEnded )
				{
					server.log.info( `Game: Player disconnect in game ${game.id}` );

					const disconnectedPlayer = game.players.find( player => player.userId === userId );
					const remainingPlayer = game.players.find( player => player.userId !== userId );

					const data: GameEndData = {
						reason: "disconnect",
						winner: remainingPlayer ?? null,
						loser: disconnectedPlayer ?? null
					};

					handleGameEnd( game.id, data );
				}
			}
			// Player was in queue
			else
			{
				// Remove inactive player from the activePlayers map
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

			// TODO: Implement a strict schema for checking user messages
			if (!data) return;

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

			if ( playerConnection?.gameId )
			{
				const game = games[playerConnection.gameId];
				if ( game && !game.hasEnded )
				{
					server.log.info( `Game: Player disconnect in singleplayer game ${game.id}` );

					const data: GameEndData = {
						reason: "disconnect",
						winner: null,
						loser: null
					};

					handleGameEnd( game.id, data );
				}
			}
			else
			{
				activePlayers.delete( userId );
			}
		});
	} );

	// ============= GAME END =============

	// Hanler for recalculating elo rating and ending the game
	const handleGameEnd = async ( gameId: GameId, data: GameEndData ) => {
		const game = games[gameId];
		if ( !game ) return;

		// Ending singleplayer game
		if ( game.mode === GameMode.Singleplayer )
		{
			const [ leftPlayer, rightPlayer ] = game.players;
			if ( leftPlayer && rightPlayer )
			{
				const playerConnection = activePlayers.get( leftPlayer.userId );

				if ( playerConnection )
				{
					let endStateMessage;
					if ( data.reason === "win" )
					{
						// Pick the winner and message the player
						let winnerPlayer: Player = rightPlayer;
						let loserPlayer: Player = leftPlayer;
						if ( leftPlayer.points > rightPlayer.points )
						{
							winnerPlayer = leftPlayer;
							loserPlayer = rightPlayer;
						}

						endStateMessage = {
							type: "end",
							mode: "singleplayer",
							winner: winnerPlayer.location === Location.Left ? "left" : "right",
							loser: loserPlayer.location === Location.Left ? "left" : "right",
							score: {
								winner: winnerPlayer.points,
								loser: loserPlayer.points
							},
							message: "Game ended"
						};
					}
					else
					{
						endStateMessage = {
							type: "end",
							mode: "singleplayer",
							score: {
								left: leftPlayer.points,
								right: rightPlayer.points
							},
							message: data.reason === "inactivity"
								? "Game ended due to inactivity"
								: "Game ended due to disconnect"
						};
					}

					playerConnection.socket.send( JSON.stringify( endStateMessage ) );
				}
			}
			endGame(game);
			return;
		}
		// Ending tournament game
		else if ( game.mode === GameMode.Tournament )
		{
			if ( !data.winner || !data.loser )
			{
				server.log.warn( `Game ${gameId}: Missing winner or loser, skipping ELO calculation` );

				game.players.forEach( player => {
					const playerConnection = activePlayers.get( player.userId );
					if ( playerConnection )
					{
						const endStateMessage = {
							type: "end",
							mode: "tournament",
							message: "Game ended unexpectedly"
						};
						playerConnection.socket.send( JSON.stringify( endStateMessage ) );
					}
				});

				endGame(game);
				return;
			}

			try
			{
				const winnerConnection = activePlayers.get(data.winner.userId);
				const loserConnection = activePlayers.get(data.loser.userId);

				if ( !winnerConnection || !loserConnection )
				{
					server.log.error( `Game ${gameId}: Missing connection info, skipping ELO calculation` );
					endGame( game );
					return;
				}

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

				// TODO: Create a route for fetching avatars based on username
				const endStateMessage = {
					type: "end",
					mode: "tournament",
					winner: winnerConnection.userName,
					loser: loserConnection.userName,
					elo: {
						winner:updatedWinner.eloRating,
						loser: updatedLoser.eloRating
					},
					oldElo: {
						winner: winnerConnection.eloRating,
						loser: loserConnection.eloRating
					},
					score: {
						winner: data.winner.points,
						loser: data.loser.points
					},
					message: data.reason === "inactivity"
						? `Inactive player ${loserConnection.userName} forfeited the game`
						: data.reason === "disconnect"
						? `Disconnected player ${loserConnection.userName} forfeited the game`
						: `${winnerConnection.userName} won!`
				}

				// Message the players
				winnerConnection.socket.send( JSON.stringify(endStateMessage) );
				loserConnection.socket.send( JSON.stringify(endStateMessage) );
			}
			catch (error)
			{
				server.log.error( `Game ${gameId}: Elo update failed: ${error}` );
			}
		}

		endGame(game);
	};

	const endGame = ( game: Game ) => {
		server.log.info( `Game ${game.id}: ending session` );
		// Remove players from the active players
		game.players.forEach( player => {
			activePlayers.delete(player.userId);
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
