import type { WebSocket } from "@fastify/websocket";
import { onlineUsers } from "./state.ts";

export function sendDM(
	from: string,
	to: string,
	message: string
): boolean {
	const targets = onlineUsers.get(to);
	if (!targets) return false;

	const payload = JSON.stringify({
		type: "dm",
		from,
		message
	});

	for (const socket of targets)
	{
		if (socket.readyState === socket.OPEN)
		{
			socket.send(payload);
		}
	}

	return true;
}

export function sendInvite(
	from: string,
	to: string,
	message: string,
	timestamp: number
): boolean {
	const targets = onlineUsers.get(to);
	if (!targets)
	{
		console.log("we failed for online users:(");
		return false;
	}

	const payload = JSON.stringify({
		type: "invite",
		from,
		message,
		timestamp
	});

	for (const socket of targets)
	{
		if (socket.readyState === socket.OPEN)
		{
			socket.send(payload);
			console.log("did we get here?");
		}
	}

	return true;
}