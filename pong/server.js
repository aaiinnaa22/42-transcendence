'use strict'

const fastify = require('fastify')()

fastify.register(require('@fastify/websocket'), {
  options: { maxPayload: 1048576 }
})

let players = {};

fastify.register(async function (fastify) {
  fastify.get('/*', { websocket: true }, (socket /* WebSocket */, req /* FastifyRequest */) => {
    console.log("New conneciton");
    const id = Date.now().toString();
    players[id] = { x: 0, y: 0 };

    socket.on('message', message => {

      const data = JSON.parse(message.toString());
      if (data.type === 'move') {
        console.log("Message recieved: ", message);
        console.log("Data recieved: ", data);
        players[id].x += data.dx;
        players[id].y += data.dy;
      }
      // Broadcast player positions
      const payload = JSON.stringify({ type: 'state', players });

      console.log("Seding message: ", payload);
      socket.send(payload);
    })
  })
})

fastify.listen({ port: 4545 }, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
