import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket as WsWebSocket } from "ws";
import { addUser, removeUser } from "./presence.js";
import { sendDM, sendInvite } from "./directMessage.js";
import { onlineUsers } from "./state.js";
import { isBlocked } from "./blocking.js";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import { pseudonym } from "../shared/utility/anonymize.utility..js";

// TODO: add prehandler authenticate (?)
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

			// initial presence list
			socket.send( JSON.stringify( {
				type: "presence:list",
				users: [...onlineUsers.keys()]
			} ) );

			socket.on( "message", async ( message: any ) =>
			{
				try
				{
					// TODO: Validate the messages parsed from sockets
					const data = JSON.parse( message.toString() );
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
						server.log.info( { user: pseudonym( userId ), to: pseudonym( data.to ) }, "Game invite sent" );
						sendInvite( userId, data.to, data.message, data.timestamp );
					}
				}
				catch
				{
					return;
				}
			} );

			// 3. ON DISCONNECT
			socket.on( "close", () =>
			{
				server.log.info( { userId }, "User disconnected" );
				removeUser( userId, socket );
			} );
		}
	);
}
