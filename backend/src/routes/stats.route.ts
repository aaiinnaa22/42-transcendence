import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import {} from "@prisma/client";
import { NotFoundError, sendErrorReply } from "../shared/utility/error.utility.ts";

const statsRoutes = async ( server: FastifyInstance ) =>
{
	// Get player statistics
	server.get( "/stats/me", { preHandler: authenticate }, async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { userId } = request.user as { userId: string };

			const playerStats = await server.prisma.playerStats.findUnique( { where: { userId } } );
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
			const { username } = request.params as { username: string };

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

	// Post new statistics
	/*
	server.post( "/stats/me", { preHandler: authenticate }, async ( request, response ) =>
	{
		try
		{
			const {userId} = request.user as {userId: string};

			const playerStats = await server.prisma.playerStats.findUnique( {
				where: { userId }
			} );

			if ( !playerStats )
			{
				return response.code( 404 ).send( { error: "statistics not found"} );
			}

			// TODO: Confirm that the user has finished the match and that we have match results for both players
			// NOTE: Once we have the matchmaking logic then the updates should be handled serverside

			// TODO: Respond with the newlly calculated Elo score along with the win-loss ratio
			// NOTE: A disconnected match will be counted as a forfeit (loss)
		}
		catch ( error : any )
		{
			server.log.error( `Failed to post statistics: ${error?.message}` );
			response.code( 500 ).send( {error: "Failed to post stats"} );
		}
	} );
	*/

	// Additional routes
};

export default statsRoutes;
