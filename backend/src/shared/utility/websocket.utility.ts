import { z } from "zod";
import type { WebSocket } from "@fastify/websocket";

/**
 * @brief Parses and validates WebSocket messages
 * @param schema Zod scchema to validate
 * @param socket WebSocket connection of the client who sent the message
 * @param message Raw WebSoccket message
 * @returns Validated message or null in case of errors
 */
export const validateWebSocketMessage = <Schema extends z.ZodTypeAny>(
	schema: Schema,
	socket: WebSocket,
	message: any
): z.infer<Schema> | null =>
{
	try
	{
		const raw = JSON.parse( message.toString() );

		// Zod validation
		const result = schema.safeParse( raw );

		if ( !result.success )
		{
			const errors = result.error.issues
				.map( error => `${error.path.join( "." )}: ${error.message}` )
				.join( "; " );

			socket.send( JSON.stringify( {
				type: "error",
				message: "Invallid message format",
				error: errors
			} ) );
			return null;
		}

		return result.data;
	}
	catch ( error )
	{
		console.warn( "WebSocket: JSON parse error:", error );

		socket.send( JSON.stringify( {
			type: "error",
			message: "Malformed message"
		} ) );
	}
	return null;
};
