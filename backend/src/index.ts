import * as dotenv from "dotenv";
dotenv.config();

import Fastify, { type FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http"; // TODO: Change to https once viable
import prismaPlugin from "./plugins/prisma.ts";
import jwtPlugin from "./plugins/jwt.ts";
import fastifyCookie from "@fastify/cookie";
import gameComponent from "./pong/init.ts";

const server : FastifyInstance = Fastify( {
	logger: true
} );

// Main of the backend server
const start = async () =>
{
	try
	{
		// Register CORS plugin FIRST
		await server.register( fastifyCookie, {
			secret: process.env.COOKIE_SECRET!,
			parseOptions:{
				sameSite: "strict",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
			}
		} );
		await server.register( import( "@fastify/cors" ), {
			origin: [
				"http://localhost:8080",
				"http://127.0.0.1:8080",
				"http://frontend:8080", // Docker container name
				"http://tr_frontend:8080", // Docker container name
				"http://localhost:3000", // Alternative local port
				"http://127.0.0.1:3000" // Alternative local port
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

		// server.addHook("preHandler", async (request, reply) => {
		// 	try {
		// 		await request.jwtVerify();
		// 	} catch (_) {
		// 		// Nothing to do here
		// }});

		// NOTE: Testing database
		if ( process.env.NODE_ENV === "development" )
		{
			await server.register( import( "./routes/test.route.ts" ) );
		}

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

		// Grab the configuration from env
		const host = process.env.HOST || process.env.HOSTNAME || "127.0.0.1";
		const port = process.env.PORT ? parseInt( process.env.PORT, 10 ) : 4241;

		await server.listen( { port, host } );
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
