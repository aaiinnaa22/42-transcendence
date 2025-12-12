import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import LeaderboardService from './leaderboard.class.js';
import { authenticate } from '../shared/middleware/auth.middleware.js';
import { NotFoundError, sendErrorReply, ServiceUnavailableError } from '../shared/utility/error.utility.js';
import { validateRequest } from '../shared/utility/validation.utility.js';
import { GetLeaderboardPageSchema } from '../schemas/leaderboard.schema.js';

const leaderboardComponent = async ( server: FastifyInstance ) =>
{
	const leaderboard: LeaderboardService = new LeaderboardService(server.prisma);

	server.addHook( "onClose", () => { leaderboard.destroy() } );

	// Returns all leaderboard entries
	server.get( "/leaderboard",
		{ preHandler: authenticate },
		( request: FastifyRequest, reply: FastifyReply ) =>
		{
			void request;

			try
			{
				const entries = leaderboard.getCache(0);

				if (!entries) throw ServiceUnavailableError("Leaderboard unavailable");

				return reply.send(entries);
			}
			catch (error)
			{
				sendErrorReply(reply, error, "Failed to fetch leaderboard");
			}
		}
	);

	// Fetch specific set of ten users for lazy loading
	server.get( "/leaderboard/:page",
		{ preHandler: authenticate },
		( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { page } = validateRequest(GetLeaderboardPageSchema, request.params);
				const entries = leaderboard.getCache(page);

				if ( !entries ) throw NotFoundError(`Page ${page} not found`);

				return reply.send(entries);
			}
			catch (error)
			{
				sendErrorReply(reply, error, "Failed to fetch leaderboard page");
			}
		}
	);

	// Fetch the user's own rank
	server.get( "/leaderboard/me",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };

				const entry = await leaderboard.getUserRank(userId);
				if ( !entry ) throw NotFoundError("User not yet ranked");

				return reply.send(entry);
			}
			catch (error)
			{
				sendErrorReply(reply, error, "Failed to fetch user rank");
			}
		}
	);
};

export default leaderboardComponent;
