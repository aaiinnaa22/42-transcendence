import Fastify, { type FastifyInstance, type RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http'; // TODO: Change to https once viable

const server : FastifyInstance = Fastify({
	logger: true
});

const opts : RouteShorthandOptions = {
	schema: {
		response: {
			200: {
				type: 'object',
				properties: {
					message: {
						type: 'string'
					}
				}
			}
		}
	}
};

server.get('/', opts, async (request, response) => {
	const address : string = request.ip;
	if ( address === '127.0.0.1' )
	{
		response.code(200).send({ message: 'successful response' });
	}
	else
	{
		response.code(403).send({ message: 'forbidden access'});
	}
});

const start = async () => {
	try {
		await server.listen({ port: 6000, host: '127.0.0.1' });

		const address = server.server.address();
		const port = typeof address === 'string' ? address : address?.port

	} catch (error) {
		server.log.error(error);
		process.exit(1);
	}
}

start();
