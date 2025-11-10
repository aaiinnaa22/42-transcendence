import { type FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import {} from "@prisma/client";

const statsRoutes = async ( server: FastifyInstance ) =>
{
	// Get player statistics
	server.get( "/stats/me", { preHandler: authenticate }, async ( request, response ) =>
	{
		try
		{
			const { userId } = request.user as { userId: string };

			const playerStats = await server.prisma.playerStats.findUnique( {
				where: { userId }
			} );

			if ( !playerStats )
			{
				return response.code( 404 ).send( { error: "statistics not found"} );
			}
			response.send( playerStats );
		}
		catch ( error: any )
		{
			server.log.error( `Get statistics failed: ${error?.message}` );
			response.code( 500 ).send( {error: "Failed to get player stats"} );
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
