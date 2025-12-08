import { env } from "./config/environment.ts" // IMPORTANT: validation happens first

import Fastify, { type FastifyInstance } from "fastify";
import prismaPlugin from "./plugins/prisma.ts";
import jwtPlugin from "./plugins/jwt.ts";
import fastifyCookie from "@fastify/cookie";
import gameComponent from "./pong/init.ts";
import leaderboardComponent from "./leaderboard/leaderboard.route.ts";
import chatComponent from "./chat/index.ts";

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

		// Register routes
		await server.register( import( "./routes/healthcheck.route.ts" ) );

		// Auth route
		await server.register( import( "./routes/auth.route.ts" ) );

		// User route
		await server.register( import( "./routes/user.route.ts" ) );

		await server.register( import( "./routes/avatar.route.ts" ) );

		await server.register( import( "./routes/stats.route.ts" ) );

		// Game module initialization

		await server.register( import( "@fastify/websocket" ), {
	  		options: { maxPayload: 1048576 }
		} );

		await server.register( gameComponent );
		await server.register( leaderboardComponent );
		await server.register( chatComponent );

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
