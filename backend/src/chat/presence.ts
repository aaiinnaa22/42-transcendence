import type { WebSocket } from "@fastify/websocket";
import { onlineUsers } from "./state.js";

export function addUser( userId: string, socket: WebSocket )
{
	let sockets = onlineUsers.get( userId );

	if ( !sockets )
	{
		sockets = new Set();
		onlineUsers.set( userId, sockets );
		broadcastPresence( userId, true );
	}

	sockets.add( socket );
}

export function removeUser( userId: string, socket: WebSocket )
{
	const sockets = onlineUsers.get( userId );
	if ( !sockets ) return;

	sockets.delete( socket );

	if ( sockets.size === 0 )
	{
		onlineUsers.delete( userId );
		broadcastPresence( userId, false );
	}
}

export function broadcastPresence( userId: string, online: boolean )
{
	let payload: string;
	try
	{
		payload = JSON.stringify( {
			type: "presence",
			userId,
			online
		} );
	}
	catch ( err )
	{
		console.error( "Failed to stringify presence payload", err );
		return;
	}

	for ( const sockets of onlineUsers.values() )
	{
		for ( const socket of sockets )
		{
			if ( socket.readyState === socket.OPEN )
			{
				try
				{
					socket.send( payload );
				}
				catch ( err )
				{
					console.error( "Failed to send presence update", err );
				}
			}
		}
	}
}
