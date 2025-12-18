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

export function sendInvitePayload(invite: {
	from: string;
	to: string;
	startedAt: number;
	expiresAt: number;
	}) {

  	const targets = onlineUsers.get(invite.to);
  	if (!targets) return;

  	const payload = JSON.stringify({
	    type: "invite",
    	from: invite.from,
		to: invite.to,
    	startedAt: invite.startedAt,
    	expiresAt: invite.expiresAt,
  	});

  	for (const userId of [invite.from, invite.to]) 
	{
    	const targets = onlineUsers.get(userId);
    	if (!targets) continue;

    	for (const socket of targets)
		{
    		if (socket.readyState === WebSocket.OPEN) 
			{
        		socket.send(payload);
      		}
    	}
	}
}

export function sendInviteExpired(a: string, b: string) {
	const payload = JSON.stringify({
    	type: "invite:expired",
    	users: [a, b],
  	});

  	for (const userId of [a, b]) {
    	const targets = onlineUsers.get(userId);
    	if (!targets) continue;

    	for (const socket of targets) {
      	if (socket.readyState === WebSocket.OPEN) {
        	socket.send(payload);
      	}
    	}
  	}
}