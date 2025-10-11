import * as dotenv from 'dotenv';
dotenv.config();

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
		const PORT = Number(process.env.PORT) || 4241;
		const HOST = process.env.HOST || '127.0.0.1';
		await server.listen({ port: PORT, host: HOST });

		const address = server.server.address();
		const port = typeof address === 'string' ? address : address?.port
		server.log.info(`Server running at http://${HOST}:${PORT}`);

	} catch (error) {
		server.log.error(error);
		process.exit(1);
	}
}

start();
