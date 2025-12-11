import type { WebSocket } from "@fastify/websocket";
import { onlineUsers } from "./state.ts";

export function addUser(userId: string, socket: WebSocket) 
{
	let sockets = onlineUsers.get(userId);

	if (!sockets) 
	{
		sockets = new Set();
		onlineUsers.set(userId, sockets);
		broadcastPresence(userId, true);
	}

	sockets.add(socket);
	console.log("ADD USER", userId);
	console.log("ONLINE USERS:", [...onlineUsers.keys()]);
}

export function removeUser(userId: string, socket: WebSocket) 
{
	const sockets = onlineUsers.get(userId);
	if (!sockets) return;

	sockets.delete(socket);

	if (sockets.size === 0) 
	{
		onlineUsers.delete(userId);
		broadcastPresence(userId, false);
		console.log("REMOVE USER", userId);
		console.log("ONLINE USERS:", [...onlineUsers.keys()]);
	}
}

export function broadcastPresence(userId: string, online: boolean) 
{
	const payload = JSON.stringify({
		type: "presence",
		userId,
		online
	});

	for (const sockets of onlineUsers.values()) 
	{
		for (const socket of sockets) {
			if (socket.readyState === socket.OPEN) 
			{
				socket.send(payload);
			}
		}
	}
}