import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "../chat/friends.js";
import type { Prisma } from "@prisma/client";
import { validateRequest } from "../shared/utility/validation.utility.js";
import {
	FriendRequestAcceptSchema,
	FriendRequestCreateSchema,
	FriendRequestDeleteSchema,
	UserIdParamSchema
} from "../schemas/friends.schema.js";
import { blockUser, unblockUser } from "../chat/blocking.js";
import { getAvatarUrl } from "../shared/utility/avatar.utility.js";

type FriendSelect = Prisma.FriendshipGetPayload<{
	include: {
		user: { select: {
			id: true;
			username: true;
			avatar: true;
			avatarType: true;
		}};
		friend: { select: {
			id: true;
			username: true;
			avatar: true;
			avatarType: true;
		}};
	};
}>;

export default async function friendsRoutes( server: FastifyInstance )
{
	/// =================== FRIENDS =====================

	// GET /friends - List all accepted friends
	server.get(
		"/friends",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			void reply;

			const { userId } = req.user as { userId: string };

			const friendships = await server.prisma.friendship.findMany( {
				where: {
					userId,
					status: "accepted",
				},
				include: {
					user: { select: { id: true, username: true, avatar: true, avatarType: true }, },
					friend: { select: { id: true, username: true, avatar: true, avatarType: true }, },
				},
			} );

			return friendships.map( ( f: FriendSelect ) =>
			{
				const other = f.userId === userId ? f.friend : f.user;

				return {
					id: other.id,
					username: other.username,
					profile: getAvatarUrl( other.avatar, other.avatarType ),
				};
			} );
		}
	);

	// DELETE /friends/:userId - Remove a friend
	server.delete(
		"/friends/:userId",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			const { userId: friendId } = validateRequest( UserIdParamSchema, req.params );

			const ok = await removeFriend( server, userId, friendId );
			reply.send( { ok } );
		}
	);

	/// =================== FRIEND REQUESTS =====================

	// GET /friends/requests - List pending incoming requests
	server.get(
		"/friends/requests",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			void reply;

			const { userId } = req.user as { userId: string };

			const pendingRequests = await server.prisma.friendship.findMany( {
				where: {
					friendId: userId, // requests sent TO me
					status: "pending",
				},
				select: {
					id: true, // friendship id
					user: { // requester
						select: {
							id: true,
							username: true,
							avatar: true,
							avatarType: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			} );

			return pendingRequests.map( friendRequest => ( {
				requestId: friendRequest.id,
				fromUserId: friendRequest.user.id,
				fromUsername: friendRequest.user.username ?? "(no name)",
				fromAvatar: getAvatarUrl( friendRequest.user.avatar, friendRequest.user.avatarType ),
			} ) );
		}
	);

	// POST /friends/requests - Send a friend request
	server.post(
		"/friends/requests",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			const { toUserId } = validateRequest( FriendRequestCreateSchema, req.body );

			const ok = await sendFriendRequest( server, userId, toUserId );

			if ( !ok )
			{
				return reply.code( 400 ).send( { error: "Invalid friend request" } );
			}

			reply.code( 201 ).send( { ok: true } );
		}
	);

	// POST /friends/requests/accept
	server.post(
		"/friends/requests/accept",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			const { fromUserId } = validateRequest( FriendRequestAcceptSchema, req.body );

			const ok = await acceptFriendRequest( server, fromUserId, userId );
			if ( !ok )
			{
				return reply.code( 400 ).send( { error: "No pending request" } );
			}

			return reply.code( 200 ).send( { ok: true } );
		}
	);

	// DELETE /friends/requests/:userId - Reject or cancel a friend request
	server.delete(
		"/friends/requests/:userId",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			const { userId: fromUserId } = validateRequest( FriendRequestDeleteSchema, req.params );

			const deleted = await server.prisma.friendship.deleteMany( {
				where: {
					userId: fromUserId,	// requester
					friendId: userId,	// me
					status: "pending",
				},
			} );

			if ( deleted.count === 0 )
			{
				return reply.code( 404 ).send( { error: "No pending request to reject" } );
			}

			return reply.code( 204 ).send();
		}
	);

	/// =================== BLOCKING =====================

	// POST /friends/block/:userId - Block a user
	server.post(
		"/friends/block/:userId",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const { userId: targetUserId } = validateRequest( UserIdParamSchema, request.params );

				const success = await blockUser( server, userId, targetUserId );

				if ( !success )
				{
					return reply.code( 400 ).send( { error: "Invalid block request" } );
				}

				reply.send( { ok: true } );
			}
			catch ( err: any )
			{
				server.log.error( { error: err }, "Block user failed" );
				reply.code( 500 ).send( { error: "Failed to block user" } );
			}
		}
	);

	// DELETE /friends/block/:userId - Unblock a user
	server.delete(
		"/friends/block/:userId",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const { userId: targetUserId } = validateRequest( UserIdParamSchema, request.params );

				const success = await unblockUser( server, userId, targetUserId );

				reply.send( { ok: success } );
			}
			catch ( err: any )
			{
				server.log.error( { error: err }, "Unblock user failed" );
				reply.code( 500 ).send( { error: "Failed to unblock user" } );
			}
		}
	);

}
