import type { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async ( request: FastifyRequest, reply: FastifyReply ) =>
{
	const signed = ( request.cookies as any )?.accessToken;
	if ( signed )
	{
		const unsign = request.unsignCookie( signed );
		if ( unsign.valid )
		{
			try
			{
				const payload = request.server.jwt.verify( unsign.value );
				( request as any ).user = payload;
				return;
			}
			catch
			{
				request.log.debug( "cookie-contained-jwt-verify-failed" );
			}
		}
		else
		{
			request.log.debug( "accessToken cookie signature invalid" );
		}
	}

	request.log.error( "JWT verify failed" );
	reply.code( 401 ).send( { error: "Unauthorized" } );
};
