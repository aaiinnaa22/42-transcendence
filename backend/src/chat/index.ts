import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";

import { addUser, removeUser } from "./presence.ts";
import { sendDM } from "./directMessage.ts";
import { onlineUsers } from "./state.ts";
import { isBlocked, blockUser, unblockUser } from "./blocking.ts";
import { createInvite } from "./invites.ts";

const clients = new Map<WebSocket, number>();

// TO DO: add prehandler authenticate (?)
export default async function chatComponent(server: FastifyInstance) {
	server.get("/chat", { websocket: true }, (socket, req) => {

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

			socket.send(JSON.stringify({
				type: "me",
				userId,
			}));
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
					console.log(`User ${userId} sent a game invite to ${data.to}`);
					createInvite(userId, data.to);
				}
			});

		// 3. ON DISCONNECT
		socket.on("close", () => {
			console.log(`User ${userId} disconnected.`);
			removeUser(userId, socket);
		});
	});
}