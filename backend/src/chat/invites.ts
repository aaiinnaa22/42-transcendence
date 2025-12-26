// services/inviteService.ts
import { sendInvitePayload, sendInviteExpired } from "./directMessage.js";

type GameInvite = {
	from: string;
	to: string;
	startedAt: number;
	expiresAt: number;
	timeoutId: ReturnType<typeof setTimeout>;
};

const invites = new Map<string, GameInvite>();

function convoKey( a: string, b: string )
{
	return [a, b].sort().join( ":" );
}

export function createInvite( from: string, to: string )
{
	const key = convoKey( from, to );

	const existing = invites.get( key );
	if ( existing && Date.now() < existing.expiresAt )
	{
		console.log( "invite aleady exists?" );
		return false;
	}

	const startedAt = Date.now();
	const expiresAt = startedAt + 60_000;

	const timeoutId = setTimeout( () =>
	{
		invites.delete( key );
		sendInviteExpired( from, to );
	}, 60_000 );

	invites.set( key, {
		from,
		to,
		startedAt,
		expiresAt,
		timeoutId,
	} );

	sendInvitePayload( { from, to, startedAt, expiresAt } );
	return true;
}
