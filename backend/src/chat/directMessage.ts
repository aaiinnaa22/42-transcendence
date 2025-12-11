import { onlineUsers } from "./state.ts";
import WebSocket from "ws";

export function sendDM(
	from: string,
	to: string,
	message: string
): boolean {
	const targets = onlineUsers.get(to);
	if (!targets) 
	{
		console.log("no online users found");
		return false;
	}

	const payload = JSON.stringify({
		type: "dm",
		from,
		message
	});

	for (const socket of targets)
	{
		if (socket.readyState === WebSocket.OPEN)
		{
			socket.send(payload);
			console.log("DM sent to", to, " sockets:", targets.size);		}
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
		if (socket.readyState === WebSocket.OPEN)
		{
			socket.send(payload);
			console.log("invite sent");
		}
	}

	return true;
}