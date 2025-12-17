import { onlineUsers } from "./state.js";
import WebSocket from "ws";

export function sendDM(
	from: string,
	to: string,
	message: string
): boolean
{
	const targets = onlineUsers.get( to );
	if ( !targets ) return false;

	const payload = JSON.stringify( {
		type: "dm",
		from,
		message
	} );

	for ( const socket of targets )
	{
		if ( socket.readyState === WebSocket.OPEN )
		{
			socket.send( payload );
		}
	}

	return true;
}

export function sendInvite(
	from: string,
	to: string,
	message: string,
	timestamp: number
): boolean
{
	const targets = onlineUsers.get( to );
	if ( !targets )
	{
		return false;
	}

	const payload = JSON.stringify( {
		type: "invite",
		from,
		message,
		timestamp
	} );

	for ( const socket of targets )
	{
		if ( socket.readyState === WebSocket.OPEN )
		{
			socket.send( payload );
		}
	}

	return true;
}
