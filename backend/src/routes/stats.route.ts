import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import {} from "@prisma/client";
import { NotFoundError, sendErrorReply } from "../shared/utility/error.utility.ts";
import { validateRequest } from "../shared/utility/validation.utility.ts";
import { GetStatsUsernameSchema } from "../schemas/stats.schema.ts";

const statsRoutes = async ( server: FastifyInstance ) =>
{
	// Get player statistics
	server.get( "/stats/me", { preHandler: authenticate }, async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { userId } = request.user as { userId: string };

			const playerStats = await server.prisma.playerStats.findUnique( {
				where: { userId },
				omit: { userId: true }
			} );
			if ( !playerStats ) throw NotFoundError( "Statistics not found" );

			reply.send( playerStats );
		}
		catch ( err: any )
		{
			server.log.error( `Get statistics failed: ${err?.message}` );
			return sendErrorReply( reply, err, "Failed to get player stats" );
		}
	} );

	// Get statistics of another player
	server.get( "/stats/user/:username", { preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { username } = validateRequest(GetStatsUsernameSchema, request.params);

			const playerStats = await server.prisma.user.findUnique( {
				where: { username },
				select: {
					username: true,
					playerStats: { omit: { userId: true } }
				 }
			} );

			if ( !playerStats ) throw NotFoundError( "Player not found" );

			reply.send( playerStats );
		}
		catch ( err: any )
		{
			server.log.error( `Get statistics failed: ${err?.message}` );
			return sendErrorReply( reply, err, "Failed to get player stats" );
		}
	} );
};

export default statsRoutes;
