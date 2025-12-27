import type { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async ( request: FastifyRequest, reply: FastifyReply ) =>
{
	const signed = ( request.cookies as any )?.accessToken;
	if ( !signed )
	{
		request.log.info( "accessToken missing" );
		return reply.code( 401 ).send( { error: "Unauthorized" } );
	}

	const unsign = request.unsignCookie( signed );
	if ( !unsign.valid )
	{
		request.log.warn( "accessToken cookie signature invalid" );
		return reply.code( 401 ).send( { error: "Unauthorized" } );
	}

	try
	{
		const payload = request.server.jwt.verify( unsign.value );
		( request as any ).user = payload;
		return;
	}
	catch
	{
		request.log.warn( "cookie-contained-jwt-verify-failed" );
		return reply.code( 401 ).send( { error: "Unauthorized" } );
	}
};
