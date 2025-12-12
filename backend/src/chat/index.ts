import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket as WsWebSocket } from "ws";
import { addUser, removeUser } from './presence.js';
import { sendDM, sendInvite } from './directMessage.js';
import { onlineUsers } from './state.js';
import { isBlocked } from './blocking.js';

// const clients = new Map<WebSocket, number>();

// TODO: add prehandler authenticate (?)
export default async function chatComponent(server: FastifyInstance) {
	server.get("/chat", { websocket: true }, (socket: WsWebSocket, req: FastifyRequest) => {

			let userId: string;
			try
			{
				const signed = req.cookies.accessToken;
				if (!signed) {
					socket.close();
					return;
				}

				const unsign = req.unsignCookie(signed);
				if (!unsign.valid) {
					socket.close();
					return;
				}

				const payload = server.jwt.verify(unsign.value) as { userId: string };

				req.user = payload;
				userId = payload.userId;
			}
			catch (err)
			{
				socket.close();
				return;
			}

			console.log("WS authenticated user:", userId);
			addUser(userId, socket);

			// initial presence list
			socket.send(JSON.stringify({
				type: "presence:list",
				users: [...onlineUsers.keys()]
			}));

			socket.on("message", async (message: any) => {
				let data;
				try {
					data = JSON.parse(message.toString());
				} catch {
					return;
				}

				if (data.type === "dm") {
					const blocked = await isBlocked(server, userId, data.to);

					if (blocked)
					{
						socket.send(JSON.stringify({
						type: "error",
						reason: "blocked"
						}));
						return;
					}
					sendDM(userId, data.to, data.message);
				}

				if (data.type === "invite") {
					console.log(`User ${userId} sent a game invite`);

					sendInvite(userId, data.to, data.message, data.timestamp);


				// broadcast TO EVERYONE EXCEPT THE SENDER
				// for (const client of clients) {
				// 	if (client !== socket && client.readyState === client.OPEN) {
				// 		client.send(payload);
				// 	}
				// }
			}
			});

		// 3. ON DISCONNECT
		socket.on("close", () => {
			console.log(`User ${userId} disconnected.`);
			removeUser(userId, socket);
		});
	});
}
