import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket as WsWebSocket } from "ws";
import { addUser, removeUser } from "./presence.js";
import { sendDM } from "./directMessage.js";
import { onlineUsers } from "./state.js";
import { isBlocked /* , blockUser, unblockUser */ } from "./blocking.js";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import { pseudonym } from "../shared/utility/anonymize.utility..js";
import { createInvite } from "./invites.js";
import { ChatClientMessageSchema } from "../schemas/chat.schema.js";

export default async function chatComponent( server: FastifyInstance )
{
	server.get(
		"/chat",
		{ websocket: true, preHandler: authenticate },
		( socket: WsWebSocket, req: FastifyRequest ) =>
		{
			const { userId } = req.user as { userId: string };

			server.log.info( { user: pseudonym( userId ) }, "New chat connection" );
			addUser( userId, socket );

			socket.send( JSON.stringify( {
				type: "me",
				userId,
			} ) );
			// initial presence list
			socket.send( JSON.stringify( {
				type: "presence:list",
				users: [...onlineUsers.keys()]
			} ) );

			socket.on( "message", async ( message: any ) =>
			{
				try
				{
					const raw = JSON.parse( message.toString() );
					const parsed = ChatClientMessageSchema.safeParse( raw );
					if ( !parsed.success )
					{
						socket.send( JSON.stringify( {
							type: "error",
							message: "Invalid message format"
						} ) );
						return;
					}

					const data = parsed.data;
					if ( data.type === "dm" )
					{
						const blocked = await isBlocked( server, userId, data.to );

						if ( blocked )
						{
							socket.send( JSON.stringify( {
								type: "error",
								reason: "blocked"
							} ) );
							return;
						}
						sendDM( userId, data.to, data.message );
					}

					if ( data.type === "invite" )
					{
						server.log.info( {
							user: pseudonym( userId ),
							to: pseudonym( data.to )
						}, "Game invite sent" );
						createInvite( userId, data.to );
					}
				}
				catch
				{
					socket.send( JSON.stringify( {
						type: "error",
						message: "Malformed message"
					} ) );
					return;
				}
			} );

			// 3. ON DISCONNECT
			socket.on( "close", () =>
			{
				server.log.info( { user: pseudonym( userId ) }, "User disconnected" );
				removeUser( userId, socket );
			} );
		}
	);
}
