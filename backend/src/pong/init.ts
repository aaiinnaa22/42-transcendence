import type { FastifyInstance, FastifyRequest } from "fastify";
import Game, { GameMode, Location, type GameEndData } from "./game.js";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import {
	INITIAL_ELO_RANGE,
	ELO_RANGE_INCREASE,
	MAX_ELO_RANGE,
	RANGE_INCREASE_INTERVAL,
	INACTIVITY_TIMEOUT,
	ELO_K_FACTOR,
	MATCH_HISTORY_ENTRIES_MAX
} from "./constants.js";
import type { GameState } from "../schemas/game.states.schema.js";
import type Player from "./player.js";
import { validateWebSocketMessage } from "../shared/utility/websocket.utility.js";
import { GameFriendNameSchema, MoveMessageSchema } from "../schemas/game.schema.js";
import type { WebSocket as WsWebSocket } from "ws";
import { sendDM } from "../chat/directMessage.js";
import { validateRequest } from "../shared/utility/validation.utility.js";
import { pseudonym } from "../shared/utility/anonymize.utility..js";
import { deleteInvite } from "../chat/invites.js";

type UserId = string;
type GameId = string;
type UserName = string;

type PlayerConnection = {
	userName: UserName;
	userId: UserId;
	socket: WsWebSocket;
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

type WaitingFriend = {
	userId: UserId;
	eloRating: number;
	joinedAt: number;
	friendName: UserName;
	userName: UserName;
	expiresAt: number;
};

const gameComponent = async ( server: FastifyInstance ) =>
{
	// This stores the game rooms (should be let)
	const games : Record<GameId, Game>  = {};
	const activePlayers: Map<UserId, PlayerConnection> = new Map();
	const playerQueue: WaitingPlayer[] = [];
	const friendQueue: WaitingFriend[] = [];

	// Helper for queueing new players
	const checkInvitation = async ( id: UserId, socket: WsWebSocket, friend: UserName, expiresAt: number ) =>
	{
		try
		{
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
				lastActivityAt: joinedAt,
			};
			const waitingFriend: WaitingFriend = {
				userId: id,
				eloRating,
				joinedAt,
				friendName: friend,
				userName: userName,
				expiresAt,
			};

			// Store connection info and queue the player
			activePlayers.set( id, playerConnection );

			//check to see if player is already in queue
			if ( friendQueue.some( f => f.userId === id ) )
			{
				socket.send( JSON.stringify( {
			  type: "waiting",
			  message: "Already waiting for friend"
				} ) );
				return;
			}

			friendQueue.push( waitingFriend );

			server.log.info( { user: pseudonym( userName ), to: pseudonym( friend )}, "Player waiting for invitee" );
			socket.send( JSON.stringify( {
				type: "waiting",
				elo: eloRating
			} ) );

			friendcheckingLoop();
		}
		catch ( error )
		{
			server.log.error( {user: pseudonym( id ), error}, "Failed to queue invite game" );
			const message: string = JSON.stringify( {
				type: "error",
				message: "Failed to join queue"
			} );
			socket.send( message );
			socket.close();
		}
	};

	const friendcheckingLoop = () =>
	{
		try
		{
			if ( friendQueue.length < 2 ) return;

			let removeI: number | null = null;
			let removeJ: number | null = null;

			for ( let i = 0; i < friendQueue.length; ++i )
			{
				for ( let j = i + 1; j < friendQueue.length; ++j )
				{
					if ( friendQueue[i]?.friendName == friendQueue[j]?.userName
						&& friendQueue[j]?.friendName == friendQueue[i]?.userName )
					{
						const now = Date.now();

						const player1 = friendQueue[i];
						const player2 = friendQueue[j];

						if ( !player1 || !player2 ) continue;
						if ( player1.expiresAt <= now || player2.expiresAt <= now ) continue;

						const connection1 = activePlayers.get( player1.userId );
						const connection2 = activePlayers.get( player2.userId );
						if ( connection1 && connection2 )
						{
							const playerNameFirst = friendQueue[i]?.userName;
							const playerNameSecond = friendQueue[j]?.userName;
							if ( playerNameFirst && playerNameSecond )
							{
								server.log.info(
									{ user: pseudonym( playerNameFirst ), to: pseudonym( playerNameSecond ) },
									"Creating invite game"
								);
							}
							createMultiplayerSession( connection1,connection2, GameMode.Invite );
						}
						removeI = i;
						removeJ = j;
						break;
					}
				}

				if ( removeI !== null ) break;
			}
			if ( removeI !== null && removeJ !== null )
			{
				const first = Math.min( removeI, removeJ );
				const second = Math.max( removeI, removeJ );

				friendQueue.splice( second, 1 );
				friendQueue.splice( first, 1 );
			}
		}
		catch ( error )
		{
			server.log.error( { error }, "Friendchecking loop error" );
			throw ( error );
		}
	};

	// Kicking out from the friend queue
	const cleanExpiredFriendInvites = () =>
	{
		const now = Date.now();

		for ( let i = friendQueue.length - 1; i >= 0; i-- )
		{
			const waiting = friendQueue[i];

			if ( !waiting ) continue;
			if ( waiting.expiresAt <= now )
			{
				console.log( `Game: Invite expired for ${waiting.userName}, removing from friend queue` );

				friendQueue.splice( i, 1 );

				const connection = activePlayers.get( waiting.userId );
				if ( connection )
				{
					connection.socket.send( JSON.stringify( {
						type: "invite:expired",
						message: "Invite expired"
					} ) );

					connection.socket.close( 1000, "Invite expired" );
					activePlayers.delete( waiting.userId );
				}
			}
		}
	};

	const friendInviteCleanupInterval = setInterval(
		cleanExpiredFriendInvites,
		1000
	);

	// Helper for queueing new players
	const queuePlayerForTournament = async ( id: UserId, socket: WsWebSocket ) =>
	{
		try
		{
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

			server.log.info( { user: pseudonym( userName ), elo: eloRating }, "Player joined tournament queue." );
			socket.send( JSON.stringify( {
				type: "waiting",
				position: playerQueue.length,
				elo: eloRating
			} ) );

			matchmakingLoop();
		}
		catch ( error )
		{
			server.log.error( { user: pseudonym( id ), error }, "Failed to queue player for toournament" );

			const message: string = JSON.stringify( {
				type: "error",
				message: "Failed to join queue"
			} );

			socket.send( message );
			socket.close();
		}
	};

	// Helper for starting single player games
	const startSinglePlayerGame = async ( id: UserId, socket: WsWebSocket ) =>
	{
		try
		{
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
				( data ) => handleGameEnd( gameId, data )
			);

			game.addPlayer( Location.Left, id, playerConnection.userName );
			game.addPlayer( Location.Right, id, playerConnection.userName );

			playerConnection.gameId = gameId;

			games[gameId] = game;

			// Game begins
			const gameState: GameState = game.getState();
			const payload = JSON.stringify( gameState );
			socket.send( payload );
		}
		catch ( error )
		{
			server.log.error( { error }, "Failed to start singleplayer match" );

			const message: string = JSON.stringify( {
				type: "error",
				message: "Failed to start game"
			} );
			socket.send( message );
		}
	};

	// Helper for creating tournament games
	const createMultiplayerSession = ( player1: PlayerConnection, player2: PlayerConnection, gamemode: GameMode ) =>
	{
		try
		{
			if ( gamemode == GameMode.Tournament )
			{
				const message = "A new tournament game started between " +
								`${player1.userName} elo ${player1.eloRating} ` +
								`and ${player2.userName} elo ${player2.eloRating}!`;
				sendDM( player1.userId,player2.userId,message );
				sendDM( player2.userId,player1.userId,message );
			}
			const gameId: GameId = Date.now().toString();
			const game = new Game(
				gameId,
				[player1.socket, player2.socket],
				gamemode,
				( data ) => handleGameEnd( gameId, data )
			);

			game.addPlayer( Location.Left, player1.userId, player1.userName );
			game.addPlayer( Location.Right, player2.userId, player2.userName );

			player1.gameId = gameId;
			player2.gameId = gameId;
			player1.lastActivityAt = Date.now();
			player2.lastActivityAt = Date.now();

			games[gameId] = game;

			// Game begins (Alternatively send a message with a type taht announces the game start)
			const gameState : GameState = game.getState();	// Get game state
			const payload = JSON.stringify( gameState );	// Serialize the game state
			player1.socket.send( payload );
			player2.socket.send( payload );
		}
		catch ( error )
		{
			server.log.error( { error }, "Failed to start multiplayer match" );

			const message: string = JSON.stringify( {
				type: "error",
				message: "Failed to start game"
			} );

			player1.socket.send( message );
			player2.socket.send( message );
		}
	};

	// Helper for pairing up players by their elo (Fine-tune variables in constants file)
	const matchmakingLoop = () =>
	{
		try
		{
			// Not enough queued players
			if ( playerQueue.length < 2 ) return;

			const now = Date.now();
			const matched: Set<UserId> = new Set();

			// Loop through players and find  asuitable match against them
			for ( let i = 0; i < playerQueue.length; ++i )
			{
				if ( matched.has( playerQueue[i]!.userId ) ) continue;

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
						createMultiplayerSession( connection1, connection2, GameMode.Tournament );

						matched.add( player1.userId );
						matched.add( bestMatch.userId );
					}
				}
			}

			// Remove any matched players from the waiting queue
			playerQueue.splice( 0, playerQueue.length, ...playerQueue.filter( p => !matched.has( p.userId ) ) );
		}
		catch ( error )
		{
			server.log.error( { error }, "Matchmaking loop error" );
		}
	};

	// Inactivity checker
	const checkInactivity = () =>
	{
		try
		{
			for ( const [gameId, game] of Object.entries( games ) )
			{
				if ( game.hasEnded ) continue;

				const now = Date.now();

				// Check inactive players in singleplayer games
				if ( game.mode === GameMode.Singleplayer )
				{
					const player = game.players[0];
					if ( !player ) continue;

					const playerConnection = activePlayers.get( player.userId );
					if ( playerConnection )
					{
						const inactiveTime = now - playerConnection.lastActivityAt;
						if ( inactiveTime > INACTIVITY_TIMEOUT )
						{
							server.log.info( { game: gameId }, "Ending singleplayer game due to inactivity" );
							const data : GameEndData = {
								reason: "inactivity",
								winner: null,
								loser: null
							};
							handleGameEnd( game.id, data );
						}
					}
				}
				// Inactive player forfeits the game
				else if ( game.mode === GameMode.Tournament || game.mode === GameMode.Invite )
				{
					// Find inactive player in tournament game
					const loserPlayer = game.players.find( player =>
					{
						const playerConnection = activePlayers.get( player.userId );
						if ( !playerConnection ) return false;

						const inactiveTime = now - playerConnection.lastActivityAt;

						if ( inactiveTime > INACTIVITY_TIMEOUT )
						{
							const timeInSeconds = Math.floor( inactiveTime / 1000 );
							server.log.info( {
								game: gameId,
								user: pseudonym( player.userId ),
								inactiveFor: timeInSeconds
							}, "Player inactive in multiplayer game" );
							return true;
						}
						return false;
					} );

					// End game if any player is inactive
					if ( loserPlayer )
					{
						server.log.info( { game: gameId }, "Ending tournament game due to inactivity" );

						const winnerPlayer = game.players.find( player => player.userId !== loserPlayer.userId );

						const data : GameEndData = {
							reason: "inactivity",
							winner: winnerPlayer ?? null,
							loser: loserPlayer
						};
						handleGameEnd( game.id, data );
					}
				}
			}
		}
		catch ( error )
		{
			server.log.error( { error }, "Inactivity check error" );
		}
	};

	const inactivityCheckInterval = setInterval( checkInactivity, 30000 /* 30 second interval */ );
	const matchmakingInterval = setInterval( matchmakingLoop, 2000 /* Interval when to check */ );

	// Multiplayer game handler with matchmaking
	server.get(
		"/game/multiplayer",
		{ websocket: true, onRequest: authenticate },
		async ( socket, request: FastifyRequest ) =>
		{
			if ( !request.user )
			{
				socket.close( 1008, "Unauthorized" );
				return;
			}

			const ws = socket as unknown as WsWebSocket;
			const { userId } = request.user as { userId: string };
			// Check if the player is already in a match
			if ( activePlayers.has( userId ) )
			{
				ws.send( JSON.stringify( {
					type: "error",
					message: "Already in a match"
				} ) );
				ws.close();
				return;
			}

			// Queue the connected player
			await queuePlayerForTournament( userId, ws );

			ws.on( "message", ( message: any ) =>
			{
				try
				{
					const data = validateWebSocketMessage( MoveMessageSchema, ws, message );
					const playerConnection = activePlayers.get( userId );

					if ( !data ) return;

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
						ws.send( payload );
					}
				}
				catch ( error )
				{
					server.log.error( { user: pseudonym( userId ), error }, "Game message handling error" );
					ws.send( JSON.stringify( {
						type: "error",
						message: "Failed to process message"
					} ) );
				}
			} );

			ws.on( "close", () =>
			{
				try
				{
					const playerConnection = activePlayers.get( userId );

					// Player was in game
					if ( playerConnection?.gameId )
					{
						const game = games[playerConnection.gameId];
						if ( game && !game.hasEnded )
						{
							server.log.info( { game: game.id }, "Player disconnect in tournament" );

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

						server.log.info( { user: pseudonym( userId )}, "Player was removed from tournament queue" );
					}
				}
				catch ( error )
				{
					server.log.error( { error }, "Unexpected error on socket close" );
				}
			} );
		}
	);

	server.get(
		"/game/singleplayer",
		{ websocket: true, onRequest: authenticate },
		async ( socket, request: FastifyRequest ) =>
		{
			if ( !request.user )
			{
				socket.close( 1008, "Unauthorized" );
				return;
			}
			const ws = socket as unknown as WsWebSocket;
			const { userId } = request.user as { userId: string };

			// Check if the player is already in a match
			if ( activePlayers.has( userId ) )
			{
				ws.send( JSON.stringify( {
					type: "error",
					message: "Already in a match"
				} ) );
				ws.close();
				return;
			}

			await startSinglePlayerGame( userId, ws );

			ws.on( "message", ( message: any ) =>
			{
				try
				{
					const data = validateWebSocketMessage( MoveMessageSchema, ws, message );
					if ( !data ) return;

					const playerConnection = activePlayers.get( userId );
					if ( !playerConnection?.gameId ) return;
					const game = games[playerConnection.gameId];
					if ( !game || game.hasEnded ) return;

					// Update last activity time
					playerConnection.lastActivityAt = Date.now();

					// Moves the player based on their userId.
					if ( data.type === "move" )
					{
						if ( data.id === undefined )
						{
							server.log.warn( "Game: Missing ID in singleplayer game" );
							return;
						}

						game.movePlayer( data.id, data.dy );

						const gameState: GameState = game.getState();	// Get game state
						const payload = JSON.stringify( gameState );	// Serialize the game state
						ws.send( payload );
					}
				}
				catch ( error )
				{
					server.log.error( { user: pseudonym( userId ), error }, "Game message handling error" );
					ws.send( JSON.stringify( {
						type: "error",
						message: "Failed to process message"
					} ) );
				}
			} );

			ws.on( "close", () =>
			{
				try
				{
				// Single player -> no elo calculations needed
					const playerConnection = activePlayers.get( userId );

					if ( playerConnection?.gameId )
					{
						const game = games[playerConnection.gameId];
						if ( game && !game.hasEnded )
						{
							server.log.info( { game: game.id }, "Player disconnect in singleplayer game" );

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
				}
				catch ( error )
				{
					server.log.error( { error }, "Unexpected error on socket close" );
				}
			} );
		}
	);

	// ============================= INVITE GAME ===============================
	server.get(
		"/game/chat",
		{ websocket: true, onRequest: authenticate },
		async ( socket , request: FastifyRequest ) =>
		{
			if ( !request.user )
			{
				socket.close( 1008, "Unauthorized" );
				return;
			}

			const ws = socket as unknown as WsWebSocket;
			const { userId } = request.user as { userId: string };

			// Check if the player is already in a match
			if ( activePlayers.has( userId ) )
			{
				socket.send( JSON.stringify( {
					type: "error",
					message: "Already in a match"
				} ) );
				socket.close();
				return;
			}

			try
			{
				const { friendName, expiresAt } = validateRequest( GameFriendNameSchema, request.query );

				// Check expiry (merged change)
				if ( expiresAt <= Date.now() )
				{
					ws.send( JSON.stringify( {
					  type: "invite:expired",
					  message: "Invite already expired",
					} ) );
					ws.close( 1000, "Invite expired" );
					return;
				}

				try
				{
					await checkInvitation( userId, ws, friendName, expiresAt );
				}
				catch
				{
					server.log.error( { user: pseudonym( userId ) }, "Failed to queue invite game player" );
					ws.send( JSON.stringify( {
						type: "error",
						message: "Failed to join invite game",
					} ) );
					ws.close();
					return;
				}
			}
			catch
			{
				ws.send( JSON.stringify( {
				  type: "error",
				  message: "Invalid invite data",
				} ) );
				ws.close();
				return;
			}

			ws.on( "message", ( message: any ) =>
			{
				try
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
				}
				catch ( error )
				{
					server.log.error( { user: pseudonym( userId ), error }, "Game message handling error" );
					ws.send( JSON.stringify( {
						type: "error",
						message: "Failed to process message"
					} ) );
				}
			} );

			ws.on( "close", () =>
			{
				try
				{
					const playerConnection = activePlayers.get( userId );

					// Player was in game
					if ( playerConnection?.gameId )
					{
						const game = games[playerConnection.gameId];
						if ( game && !game.hasEnded )
						{
							server.log.info( { game: game.id }, "Player disconnect in invite game" );

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
					// Player was in friend queue
					else
					{
						// Remove inactive player from the activePlayers map
						activePlayers.delete( userId );

						// Remove inactive player from the queue
						const index = friendQueue.findIndex( p => p.userId === userId );
						if ( index > -1 ) friendQueue.splice( index, 1 );

						server.log.info( { user: pseudonym( userId )}, "Player was removed from the friend queue" );
					}
				}
				catch ( error )
				{
					server.log.error( { error }, "Unexpected error on socket close" );
				}
			} );
		}
	);
	// ============= GAME END =============

	// Hanler for recalculating elo rating and ending the game
	const handleGameEnd = async ( gameId: GameId, data: GameEndData ) =>
	{
		try
		{
			const game = games[gameId];
			if ( !game ) return;

			// Ending singleplayer game
			if ( game.mode === GameMode.Singleplayer )
			{
				const [leftPlayer, rightPlayer] = game.players;
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
								reason: "win"
							};
						}
						else
						{
							endStateMessage = {
								type: "end",
								mode: "singleplayer",
								winner: "none",
								loser: "none",
								score: {
									left: leftPlayer.points,
									right: rightPlayer.points
								},
								reason: data.reason
							};
						}


						playerConnection.socket.send( JSON.stringify( endStateMessage ) );
					}
				}
				endGame( game );
				return;
			}
			// Ending tournament game
			else if ( game.mode === GameMode.Tournament )
			{
				if ( !data.winner || !data.loser )
				{
					server.log.warn( { game: gameId }, "Missing winner or loser, skipping ELO calculation" );

					game.players.forEach( player =>
					{
						const playerConnection = activePlayers.get( player.userId );
						if ( playerConnection )
						{
							const endStateMessage = {
								type: "end",
								mode: "tournament",
								reason: "unknown",
								message: "Game ended unexpectedly"
							};
							playerConnection.socket.send( JSON.stringify( endStateMessage ) );
						}
					} );

					endGame( game );
					return;
				}

				try
				{
					const winnerConnection = activePlayers.get( data.winner.userId );
					const loserConnection = activePlayers.get( data.loser.userId );

					if ( !winnerConnection || !loserConnection )
					{
						server.log.error( { game: gameId }, "Missing connection info, skipping ELO calculation" );
						endGame( game );
						return;
					}

					// Mathematically symmetrical score calculation
					const expectedScore = 1 / ( 1 + Math.pow(
						10,
						( loserConnection.eloRating - winnerConnection.eloRating ) / 400
					) );

					const eloChange = ELO_K_FACTOR * ( 1 - expectedScore );

					// Update winner rating
					const updatedWinner = await server.prisma.playerStats.update( {
						where: { userId: data.winner.userId },
						data: {
							eloRating: { increment: eloChange },
							wins: { increment: 1 },
							playedGames: { increment: 1 }
						},
						select: { eloRating: true }
					} );

					// Update loser rating
					const updatedLoser = await server.prisma.playerStats.update( {
						where: { userId: data.loser.userId },
						data: {
							eloRating: { decrement: eloChange },
							losses: { increment: 1 },
							playedGames: { increment: 1 }
						},
						select: { eloRating: true }
					} );

					// Async function for storing the match history on the current game
					const saveMatchHistory = async (
						userId: string,
						opponent: string,
						result: "win" | "loss",
						eloChange: number
					) =>
					{
						const existing = await server.prisma.matchHistory.findMany( {
							where: { userId },
							orderBy: { playedAt: "desc" },
							select: { id: true }
						} );

						if ( existing.length >= MATCH_HISTORY_ENTRIES_MAX )
						{
							await server.prisma.matchHistory.delete( {
								where: { id: existing[existing.length - 1]!.id }
							} );
						}

						await server.prisma.matchHistory.create( {
							data: {
								userId,
								opponent,
								result,
								eloChange,
								playedAt: new Date()
							}
						} );
					};

					// Save match history in database
					await Promise.all( [
						saveMatchHistory( data.winner.userId, loserConnection.userName, "win", eloChange ),
						saveMatchHistory( data.loser.userId, winnerConnection.userName, "loss", eloChange )
					] );

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
						reason: data.reason
					};
					// Message the players
					winnerConnection.socket.send( JSON.stringify( endStateMessage ) );
					loserConnection.socket.send( JSON.stringify( endStateMessage ) );
				}
				catch ( error )
				{
					server.log.error( { game: gameId, error }, "Elo update failed" );
				}
			}
			else if ( game.mode === GameMode.Invite )
			{
				if ( !data.winner || !data.loser )
				{
					server.log.warn( { gamme: gameId }, "Missing winner or loser, game ended unexpectedly" );

					game.players.forEach( player =>
					{
						const playerConnection = activePlayers.get( player.userId );
						if ( playerConnection )
						{
							const endStateMessage = {
								type: "end",
								mode: "invite",
								reason: "unknown",
								message: "Game ended unexpectedly"
							};
							playerConnection.socket.send( JSON.stringify( endStateMessage ) );
						}
					} );

					endGame( game );
					return;
				}
				const winnerConnection = activePlayers.get( data.winner.userId );
				const loserConnection = activePlayers.get( data.loser.userId );

				if ( !winnerConnection || !loserConnection )
				{
					server.log.error( { game: gameId }, "Missing connection info, skipping endStateMessage" );
					endGame( game );
					return;
				}

				const endStateMessage = {
					type: "end",
					mode: "invite",
					winner: winnerConnection.userName,
					loser: loserConnection.userName,
					score: {
						winner: data.winner.points,
						loser: data.winner.points
					},
					reason: data.reason
				};
				deleteInvite( data.winner.userId, data.loser.userId );
				// Message the players
				winnerConnection.socket.send( JSON.stringify( endStateMessage ) );
				loserConnection.socket.send( JSON.stringify( endStateMessage ) );
			}

			endGame( game );
		}
		catch ( error )
		{
			server.log.error( { gamme: gameId, error }, "Unexpected error when closing game" );
		}
	};

	const endGame = ( game: Game ) =>
	{
		try
		{
			server.log.info( { game: game.id }, "Ending game session" );
			// Remove players from the active players
			game.players.forEach( player =>
			{
				activePlayers.delete( player.userId );
			} );

			// Destroy the game
			game.destroy();
			delete games[game.id];
		}
		catch ( error )
		{
			server.log.error( { game: game.id, error }, "Unexpected error when closing game" );
		}
	};

	server.addHook( "onClose", () =>
	{
		clearInterval( inactivityCheckInterval );
		clearInterval( matchmakingInterval );
		clearInterval( friendInviteCleanupInterval );
	} );
};

export default gameComponent;
