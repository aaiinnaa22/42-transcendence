import type { FastifyInstance } from "fastify";
import Game from "./game.ts";

const gameComponent = async ( server: FastifyInstance ) =>
{
	// This stores the game rooms (should be let)
	const games : Record<string, Game>  = {};

	server.get( "/*", { websocket: true }, ( socket /* WebSocket */, req /* FastifyRequest */ ) =>
	{
		void req;
		console.log( "New connection (creating new game room)" );

		// Create new game instance with unique name and add it to the games
		const GameId: string = Date.now().toString();
		const game = new Game( GameId, socket );
		// Adding two players to the game in correct postision (Could this be done during the construction of Game instance??)
		game.addPlayer();
		games[GameId] = game;

		socket.on( "message", ( message: any ) =>
		{
			const data = JSON.parse( message.toString() );

			// Moves the player based on it's id. Players are currently named 1 and 2
			if ( data.type === "move" && games[GameId] )
			{
				//console.log("Message recieved 'move' : ", message);
				//console.log("Data recieved: ", data);
				games[GameId].movePlayer( data.id,data.dx, data.dy );
				const gameState = games[GameId].getState(); // Get game state
				const payload = JSON.stringify( gameState ); // Serialize the game state

				//console.log("Seding message: ", payload);
				socket.send( payload );
			}

		} );

		socket.on( "close", () =>
		{
			console.log( "Connection closed for game room: " + GameId );
			// Remove the player and game from the respective lists when they disconnect
			delete games[GameId];
		} );
	} );
};

export default gameComponent;
