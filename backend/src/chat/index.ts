import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";

import { addUser, removeUser } from "./presence.ts";
import { sendDM } from "./directMessage.ts";
import { onlineUsers } from "./state.ts"; 
//const wsChat = new WebSocket('ws://localhost:4241/chat');

// a map mapping user id to websocket
//const connections = new Map<number, WebSocket>();

// a map for global chat implementation
//const globalChatSockets = new Set<WebSocket>();

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

			// initial presence list
			socket.send(JSON.stringify({
				type: "presence:list",
				users: [...onlineUsers.keys()]
			}));

			socket.on("message", (message: any) => {
				let data;
				try {
					data = JSON.parse(message.toString());
				} catch {
					return;
				}

				if (data.type === "dm") {
					sendDM(userId, data.to, data.message);
				}
			});

		// 3. ON DISCONNECT
		socket.on("close", () => {
			console.log(`User ${userId} disconnected.`);
			removeUser(userId, socket);
		});
	});
}

// blocking
// async function isBlocked(server: FastifyInstance, blockerId: number, senderId: number) {
// 	try {
// 		const entry = await server.prisma.block.findFirst({
// 			where: { blockerId, blockedId: senderId }
// 		});
// 		return !!entry;
// 	} catch (e) {
// 		return false;
// 	}
// }