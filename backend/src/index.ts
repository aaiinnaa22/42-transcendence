import * as dotenv from 'dotenv';
dotenv.config();

import Fastify, { type FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http'; // TODO: Change to https once viable
import prismaPlugin from './plugins/prisma.ts';
import jwtPlugin from './plugins/jwt.ts';

const server : FastifyInstance = Fastify({
	logger: true
});

// Main of the backend server
const start = async () => {
	try {
		await server.register(prismaPlugin);

		// NOTE: Testing database
		if (process.env.NODE_ENV === 'development') {
			await server.register(import('./routes/test.route.ts'));
		}

		// Register routes
		await server.register(import('./routes/healthcheck.route.ts'));

		// Auth route
		await server.register(import('./routes/auth.route.ts'));

		// Grab the configuration from env
		const host = process.env.HOST || process.env.HOSTNAME || '127.0.0.1';
		const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4241;

		await server.listen({ port, host });
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
