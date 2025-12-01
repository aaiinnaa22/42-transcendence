import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";


//const wsChat = new WebSocket('ws://localhost:4241/chat');

// a map mapping user id to websocket
//const connections = new Map<number, WebSocket>();

// a map for global chat implementation
//const globalChatSockets = new Set<WebSocket>();

const clients = new Set<WebSocket>();

export default async function chatComponent(server: FastifyInstance) {
	server.get("/chat", { websocket: true }, (socket, req) => {
		console.log("WS: Upgrade happened correctly");
		// temporary auth bypass
		req.user = { userId: Math.floor(Math.random() * 10000) }; 
		// or: req.user = { userId: 123 };

		const userId = (req.user as { userId: number }).userId;
		console.log(`User ${userId} connected to chat.`);
		clients.add(socket);
		
		// 1. AUTHENTICATE USER
		// try {
		// 	const signed = req.cookies.accessToken;
		// 	if (!signed) {
		// 		console.log("Not signed");
		// 		socket.close();
		// 		return;
		// 	}

		// 	const unsign = req.unsignCookie(signed);
		// 	if (!unsign.valid) {
		// 		console.log("Unsign fail")
		// 		socket.close();
		// 		return;
		// 	}

		// 	const user = server.jwt.verify(unsign.value) as { userId: number; };

		// 	req.user = user;
		// } catch (err) {
		// 	socket.close();
		// 	return;
		// }

		// console.log(`User ${userId} connected to chat.`);
		// clients.add(socket);


		// 2. HANDLE INCOMING MESSAGES
		socket.on("message", ( message: any )=> {
			console.log("MESSAGE RECEIVED:", message.toString());
			let data;
			try {
				data = JSON.parse(message.toString());
			} catch (e) {
				return;
			}

			if (data.type === "chat") {
				console.log(`Broadcasting from ${userId}:`, data.message);
				const payload = JSON.stringify({
					type: "chat",
					from: userId,
					message: data.message
				});

				// broadcast to every connected client
				for (const client of clients) {
					if (client.readyState === client.OPEN) {
						client.send(payload);
					}
				}
			}
		});

		// 3. ON DISCONNECT
		socket.on("close", () => {
			console.log(`User ${userId} disconnected.`);
			clients.delete(socket);
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