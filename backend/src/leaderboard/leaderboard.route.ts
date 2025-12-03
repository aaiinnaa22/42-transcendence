import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import LeaderboardService from "./leaderboard.class.ts";
import { authenticate } from "../shared/middleware/auth.middleware.ts";

const leaderboardComponent = async ( server: FastifyInstance ) =>
{
	const leaderboard: LeaderboardService = new LeaderboardService(server.prisma);

	// Returns all leaderboard entries
	server.get( "/leaderboard",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			// TODO: Fetch all the entries
		}
	);

	// Fetch the user's own rank
	server.get( "/leaderboard/me",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = request.user as { userId: string };

			// TODO: Fetch user-specific rank
		}
	);

	// Fetch specific set of ten users for lazy loading
	server.get( "/leaderboard/:page",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{

			// TODO: Fetch leaderboard page
		}
	);
};

export default leaderboardComponent;
