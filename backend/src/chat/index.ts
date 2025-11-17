import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";


//const wsChat = new WebSocket('ws://localhost:4241/chat');

// a map mapping user id to websocket
//const connections = new Map<number, WebSocket>();

// a map for global chat implementation
//const globalChatSockets = new Set<WebSocket>();

const clients = new Set<WebSocket>();

export default async function chatComponent(server: FastifyInstance) {
	server.get("/chat", { websocket: true }, async (socket, req) => {
		// 1. AUTHENTICATE USER
		try {
			const signed = req.cookies.accessToken;
			if (!signed) {
				socket.close();
				return;
			}

			const unsign = req.unsignCookie(signed);
			// if (!unsign.valid) {
			// 	socket.close();
			// 	return;
			// }

			const user = server.jwt.verify(unsign.value) as {
				userId: number;
			};

			req.user = "test_user"; // optional, keeps consistency
		} catch (err) {
			socket.close();
			return;
		}

		const userId = (req.user as any).userId;
		console.log(`User ${userId} connected to chat.`);
		clients.add(socket);


		// 2. HANDLE INCOMING MESSAGES
		socket.on("message", ( message: any )=> {
			let data;
			try {
				data = JSON.parse(message.toString());
			} catch (e) {
				return;
			}

			if (data.type === "chat") {
				const payload = JSON.stringify({
					type: "chat",
					from: userId,
					message: data.message
				});

				// broadcast to every connected client
				for (const client of clients) {
					if (client.readyState === 1) {
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