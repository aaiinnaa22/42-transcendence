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

export function sendInvitePayload( invite: {
	from: string;
	to: string;
	startedAt: number;
	expiresAt: number; } )
{
	// payload for invitee
	if ( invite.from === invite.to ) return;
	const receivedPayload = JSON.stringify( {
		type: "invite:received",
		from: invite.from,
		startedAt: invite.startedAt,
		expiresAt: invite.expiresAt,
	} );

	// payload for inviter
	const sentPayload = JSON.stringify( {
		type: "invite:sent",
		to: invite.to,
		startedAt: invite.startedAt,
		expiresAt: invite.expiresAt,
	} );

	// send to invitee
	const inviteeSockets = onlineUsers.get( invite.to );
	if ( inviteeSockets )
	{
		for ( const socket of inviteeSockets )
		{
			if ( socket.readyState === WebSocket.OPEN )
			{
				socket.send( receivedPayload );
			}
		}
	}

	// send to inviter
	const inviterSockets = onlineUsers.get( invite.from );
	if ( inviterSockets )
	{
		for ( const socket of inviterSockets )
		{
			if ( socket.readyState === WebSocket.OPEN )
			{
				socket.send( sentPayload );
			}
		}
	}
}


export function sendInviteExpired( a: string, b: string )
{
	const payload = JSON.stringify( {
		type: "invite:expired",
		users: [a, b],
	} );

	for ( const userId of [a, b] )
	{
		const targets = onlineUsers.get( userId );
		if ( !targets ) continue;

		for ( const socket of targets )
		{
			if ( socket.readyState === WebSocket.OPEN )
			{
				socket.send( payload );
			}
		}
	}
}
