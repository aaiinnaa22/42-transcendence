import { env } from './config/environment.js' // IMPORTANT: validation happens first

import Fastify, { type FastifyInstance } from "fastify";
import prismaPlugin from './plugins/prisma.js';
import jwtPlugin from './plugins/jwt.js';
import fastifyCookie from "@fastify/cookie";
import gameComponent from './pong/init.js';
import leaderboardComponent from './leaderboard/leaderboard.route.js';
import chatComponent from './chat/index.js';
import chatUsersComponent from './chat/usersRoute.js';

const server : FastifyInstance = Fastify( {
	logger: env.NODE_ENV === "production"
		? {
			level: "warn",
			redact: {
				paths: [
					'req.headers.authorization',
					'req.headers.cookie',
					'req.body.password',
					'req.headers["set-cookie"]',
				],
				censor: "[REDACTED]"
			}
		}
		: {
			level: "debug",
			transport: {
				target: "pino-pretty",
				options: {
					translateTime: "SYS:HH:MM:ss Z",
					ignore: "pid,hostname,reqId",
					colorize: true,
					levelFirst: true,
					hideObject: true,
					messageFormat: "{msg} {req.method} {req.url} {res.statusCode} {responseTime}"
				}
			},
			serializers: {
				responseTime(value) {
					return typeof value === "number" ? `(${value.toFixed(2)}ms)` : value;
				}
			}
		}
} );

// Main of the backend server
const start = async () =>
{
	try
	{
		// Register CORS plugin FIRST
		await server.register( fastifyCookie, {
			secret: env.COOKIE_SECRET,
			parseOptions:{
				sameSite: "strict",
				httpOnly: true,
				secure: env.NODE_ENV === "production",
			}
		} );
		await server.register( import( "@fastify/cors" ), {
			origin: [
				`${env.HTTP_PROTO}${env.FRONTEND_HOST}:${env.FRONTEND_PORT}`,
				`${env.HTTP_PROTO}localhost:${env.FRONTEND_PORT}`,
				`${env.HTTP_PROTO}127.0.0.1:${env.FRONTEND_PORT}`,
			],
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
		} );

		// Multipart for file handling
		await server.register( import( "@fastify/multipart" ), {
			limits: {
				fileSize: 4 * 1024 * 1024, // 4MB
				files: 1
			}
		} );

		await server.register( prismaPlugin );
		await server.register( jwtPlugin );

		await server.register( import( "@fastify/websocket" ), {
			options: { maxPayload: 1048576 }
		} );

		// Register healthcheck as a non-api route
		await server.register( import( './routes/healthcheck.route.js' ) );

		// Register HTTP routes with a '/api' prefix
		await server.register( async (apiServer: FastifyInstance) => {
			await apiServer.register( import( './routes/auth.route.js' ) );
			await apiServer.register( import( './routes/user.route.js' ) );
			await apiServer.register( import( './routes/avatar.route.js' ) );
			await apiServer.register( import( './routes/stats.route.js' ) );
			await apiServer.register( import ( './routes/friends.route.js' ) );

			await apiServer.register( chatUsersComponent );
			await apiServer.register( leaderboardComponent );
		}, { prefix: "/api" });

		// Register WebSocket routes with '/ws' prefix
		await server.register( async (wsServer: FastifyInstance) => {
			await wsServer.register( gameComponent );
			await wsServer.register( chatComponent );
		}, { prefix: "/ws" });

		// Grab the configuration from env
		const host = env.HOSTNAME;
		const port = env.PORT;

		await server.listen( { port, host } );
		console.log(server.printRoutes());
	}
	catch ( error )
	{
		server.log.error( error );
		process.exit( 1 );
	}
};

// Handler to shut down prisma properly on being signaled
const stop = async () =>
{
	try
	{
		await server.close();
	}
	catch ( error )
	{
		server.log.error( error );
	}
	finally
	{
		process.exit( 0 );
	}
};

process.on( "SIGINT", stop );
process.on( "SIGTERM", stop );

start();
