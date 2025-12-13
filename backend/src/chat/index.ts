import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";

import { addUser, removeUser } from "./presence.ts";
import { sendDM, sendInvite } from "./directMessage.ts";
import { onlineUsers } from "./state.ts";
import { isBlocked, blockUser, unblockUser } from "./blocking.ts";

const clients = new Map<WebSocket, number>();

// TO DO: add prehandler authenticate (?)
export default async function chatComponent(server: FastifyInstance) {
	server.get("/chat", { websocket: true }, (socket, req) => {

			let userId: string;
			try
			{
				const signed = req.cookies.accessToken;
				if (!signed) 
					throw new Error("No cookie");

				const unsign = req.unsignCookie(signed);
				if (!unsign.valid) 
					throw new Error("Invalid cookie");

				const payload = server.jwt.verify(unsign.value) as { userId: string };

				req.user = payload;
				userId = payload.userId;
			}
			catch (err: any)
			{
				server.log.error( `Chat authentication failed: ${err?.message}` );
				socket.send(JSON.stringify({
					type: "error",
					reason: "unauthorized"
				}));
				socket.close(1008, "Unauthorized");
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
				}
				// logout test - TO DO : DELETE THIS
				if (data.type === "test:logout") {
					socket.send(JSON.stringify({
						type: "error",
						reason: "unauthorized"
					}));
					socket.close(1008, "Unauthorized");
				}
			});

		// 3. ON DISCONNECT
		socket.on("close", () => {
			console.log(`User ${userId} disconnected.`);
			removeUser(userId, socket);
		});
	});
}