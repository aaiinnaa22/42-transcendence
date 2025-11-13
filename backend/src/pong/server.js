'use strict'

const fastify = require('fastify')()
const cors = require('@fastify/cors')
const Game = require('./game.js');

const start = async () => {
	fastify.register(cors, {
	  origin: '*', // or specify: ['http://localhost:3000']
	})

	fastify.register(require('@fastify/websocket'), {
	  options: { maxPayload: 1048576 }
	})

	// This stores the game rooms
	let games = {};

	fastify.register(async function (fastify) {
	  fastify.get('/*', { websocket: true }, (socket /* WebSocket */, req /* FastifyRequest */) => {
	    console.log("New connection (creating new game room)");

	    // Create new game instance with unique name and add it to the games
	    const GameId = Date.now().toString();
	    const game = new Game(GameId);
	    // Adding two players to the game in correct postision (Could this be done during the construction of Game instance??)
	    game.addPlayer();
	    games[GameId] = game;

	    socket.on('message', message => {
	      const data = JSON.parse(message.toString());

	      // Moves the player based on it's id. Players are currently named 1 and 2
	      if (data.type === 'move')
	      {
	        //console.log("Message recieved 'move' : ", message);
	        //console.log("Data recieved: ", data);
	        games[GameId].movePlayer(data.id,data.dx, data.dy);
	        const gameState = games[GameId].getState();  // Get game state
	        const payload = JSON.stringify(gameState);  // Serialize the game state

	        //console.log("Seding message: ", payload);

	        socket.send(payload);
	      }

	      // Moves the ball
	      if (data.type === 'get_state')
	      {
	        //console.log("Message recieved 'get_state' : ", message);
	        //console.log("Data recieved: ", data);
	        games[GameId].moveBall();
	        const gameState = games[GameId].getState();  // Get game state
	        const payload = JSON.stringify(gameState);  // Serialize the game state

	        //console.log("Seding message: ", payload);

	        socket.send(payload);
	      }
	    });

	    socket.on('close', () => {
	      console.log("Connection closed for game room: " + GameId);
	      // Remove the player and game from the respective lists when they disconnect
	      delete games[GameId];
	    });
	  })
	})

	// Grab the environment (consider if the dotenv module is required here)
	const host = process.env.HOST || '0.0.0.0';
	const port = process.env.PORT ? Number(process.env.PORT) : 4545;

	fastify.listen({ port, host }, err => {
	  if (err)
	  {
	    fastify.log.error(err)
	    process.exit(1)
	  }
	  console.log('WebSocket server listening on ws://localhost:4545');
	})
};

// Launch the server from one location
start();
