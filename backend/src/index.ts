import Fastify, { type FastifyInstance, type RouteShorthandOptions } from 'fastify';
import prismaPlugin from './plugins/prisma.ts';

const server : FastifyInstance = Fastify({
	logger: true
});

// ===================== TESTING =========================
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
// ========================================================


// Main of the backend server
const start = async () => {
	try {
		await server.register(prismaPlugin);
		await server.listen({ port: 6000, host: '127.0.0.1' });
	} catch (error) {
		server.log.error(error);
		process.exit(1);
	}
}

// Handler to shut down prisma properly on being signaled
const stop = async () => {
	try {
		await server.close();
	} catch (error) {
		server.log.error(error);
	} finally {
		process.exit(0);
	}
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start();
