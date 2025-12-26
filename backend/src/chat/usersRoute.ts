import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import { validateRequest } from "../shared/utility/validation.utility.js";
import { ChatUsersUsernameSchema } from "../schemas/chat.schema.js";
import {
	BadRequestError,
	NotFoundError,
	sendErrorReply,
	UnauthorizedError
} from "../shared/utility/error.utility.js";
import { getAvatarUrl } from "../shared/utility/avatar.utility.js";
import { MATCH_HISTORY_ENTRIES_MAX } from "../pong/constants.js";

export default async function chatUsersComponent( server: FastifyInstance )
{
	//Aina added to get ONE user
	server.get(
		"/chat/users/:username",
		{ preHandler: authenticate },
		async ( req : FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				if ( !req.user )
				{
					throw UnauthorizedError();
				}

				const { userId } = req.user as { userId: string };
				const query = validateRequest( ChatUsersUsernameSchema, req.params );

				const currentUser = await server.prisma.user.findUnique( { where: { id: userId } } );
				if ( currentUser?.username === query.username )
				{
					throw BadRequestError( "Cannot fetch your own profile here" );
				}

				const targetUser = await server.prisma.user.findUnique( {
					where: { username: query.username },
					select: {
						id: true,
						username: true,
						avatar: true,
						avatarType: true,
						playerStats: true,
					},
				} );

				if ( !targetUser )
				{
					throw NotFoundError( "User not found" );
				}

				if ( targetUser.id === userId )
				{
					throw BadRequestError( "Cannot fetch your own profile here" );
				}

				const blockedByMe = await server.prisma.block.findFirst( {
					where: { blockerId: userId, blockedId: targetUser.id },
				} );

				const blockedByThem = await server.prisma.block.findFirst( {
					where: { blockerId: targetUser.id, blockedId: userId },
				} );

			  const friendship = await server.prisma.friendship.findFirst( {
					where: {
						OR: [
							{ userId, friendId: targetUser.id },
							{ userId: targetUser.id, friendId: userId },
						],
					},
					select: {
						status: true,
					},
				} );

				return {
					id: targetUser.id,
					username: targetUser.username ?? "(no name)",
					profile: getAvatarUrl( targetUser.avatar, targetUser.avatarType ),
					stats: targetUser.playerStats ?? null,
					isFriend: friendship?.status === "accepted",
					friendshipStatus: friendship?.status ?? null,
					isBlockedByMe: Boolean( blockedByMe ),
					hasBlockedMe: Boolean( blockedByThem ),
				};
			}
			catch ( error )
			{
				sendErrorReply( reply, error, "An error occurred in chat" );
			}
		}
	);


	server.get( "/chat/users", { preHandler: authenticate }, async ( req, reply ) =>
	{
		try
		{
			//auth check
			if ( !req.user )
			{
				throw UnauthorizedError();
			}
			const { userId } = req.user as { userId: string };

			const users = await server.prisma.user.findMany( {
				where: { id: { not: userId } },
				select: {
					id: true,
				  	username: true,
				  	avatar: true,
				  	avatarType: true,
				  	playerStats: true,
				  	blockedUsers: {
						where: { blockerId: userId },
						select: { id: true },
					  },
				  	blockedBy: {
						where: { blockedId: userId },
						select: { id: true },
				  	},
				},
			} );


			return await Promise.all( users.map( async ( u ) =>
			{
				  	const friendship = await server.prisma.friendship.findFirst( {
					where: {
						OR: [
							{ userId, friendId: u.id },
							{ userId: u.id, friendId: userId },
						],
					},
					select: { status: true },
				  	} );

				const friendshipStatus = friendship?.status ?? null;
				const isFriend = friendshipStatus === "accepted";

				return {
					id: u.id,
					username: u.username ?? "(no name)",
					profile: getAvatarUrl( u.avatar, u.avatarType ),
					stats: u.playerStats ?? null,
					isFriend,
					friendshipStatus,
					isBlockedByMe: u.blockedUsers.length > 0,
					hasBlockedMe: u.blockedBy.length > 0,
				 	};
			} ) );
		}
		catch ( error )
		{
			sendErrorReply( reply, error, "An error occurred in chat" );
		}
	} );

	server.get(
		"/chat/users/history/:username",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				if ( !req.user )
				{
					throw UnauthorizedError();
				}

				const query = validateRequest( ChatUsersUsernameSchema , req.params );

				const targetUser = await server.prisma.user.findUnique( {
					where: { username: query.username },
					select: { id: true }
				} );

				if ( !targetUser ) throw NotFoundError( "User not found" );

				const history = await server.prisma.matchHistory.findMany( {
					where: { userId: targetUser.id },
					orderBy: { playedAt: "desc" },
					take: MATCH_HISTORY_ENTRIES_MAX,
					select: {
						opponent: true,
						result: true,
						eloChange: true,
						playedAt: true
					}
				} );

				return history;
			}
			catch ( error )
			{
				sendErrorReply( reply, error, "Failed to fetch match history" );
			}
		}
	);
}
