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
			let userId: string;
			try
			{
				const user = req.user as { userId: string } | undefined;
				if ( !user )
				{
					socket.close( 1008, "Unauthorized" );
					return;
				}

				userId = user.userId;

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
			}
			catch ( err )
			{
				server.log.error( { err }, "from chat socket" );
				try
				{
					socket.close( 1011, "Internal server error" );
				}
				catch {}
				return;
			}

			socket.on( "message", async ( message: any ) =>
			{
				try
				{
					// TODO: Validate the messages parsed from sockets
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
					if ( data.type === "dm" || data.type === "invite" )
					{
						if ( !data.to ) return;

						const blocked = await isBlocked( server, userId, data.to );
						if ( blocked )
						{
							socket.send( JSON.stringify( {
								type: "error",
								reason: "blocked"
							} ) );
							console.log( "block detected" );
							return;
						}
					}
					if ( data.type === "dm" )
					{
						sendDM( userId, data.to, data.message );
					}
					if ( data.type === "invite" )
					{
						server.log.info(
							{ user: pseudonym( userId ), to: pseudonym( data.to ) },
								 "message type: invite"
						);
						const created = createInvite( userId, data.to );
						if ( !created )
						{
							socket.send( JSON.stringify( {
								type: "invite:rejected",
								reason: "active",
								retryAfterMs: 60_000
							} ) );
						}
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
