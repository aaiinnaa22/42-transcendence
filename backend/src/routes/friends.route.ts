import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "../chat/friends.js";
import type { Prisma } from "@prisma/client";
import { validateRequest } from "../shared/utility/validation.utility.js";
import { FriendRequestDeleteSchema } from "../schemas/friends.schema.js";
import { blockUser, unblockUser } from "../chat/blocking.js";

type FriendSelect = Prisma.FriendshipGetPayload<{
	include: {
		user: { select: {
			id: true;
			username: true;
			avatar: true;
		}};
		friend: { select: {
			id: true;
			username: true;
			avatar: true;
		}};
	};
}>;

export default async function friendsRoutes( server: FastifyInstance )
{
	// GET /friends
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
					user: { select: { id: true, username: true, avatar: true, }, },
					friend: { select: { id: true, username: true, avatar: true, }, },
				},
			} );

			return friendships.map( ( f: FriendSelect ) =>
			{
				const other =
					f.userId === userId ? f.friend : f.user;

				return {
					id: other.id,
					username: other.username,
					profile: other.avatar ?? "",
				};
			} );
		}
	);

	// POST /friends/request
	server.post(
		"/friends/request",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			// TODO: validate body
			const { toUserId } = req.body as { toUserId: string };

			const ok = await sendFriendRequest( server, userId, toUserId );
			if ( !ok )
			{
				return reply.code( 400 ).send( { error: "Invalid friend request" } );
			}

			reply.send( { ok: true } );
		}
	);

	//DELETE friend request (reject it)
	server.delete(
		"/friends/request/:id",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			const { id } = validateRequest( FriendRequestDeleteSchema, req.params );

			const deleted = await server.prisma.friendship.deleteMany( {
				where: {
					userId: id, 		// requester
					friendId: userId, // me
					status: "pending",
				},
			} );

			if ( deleted.count === 0 )
			{
				return reply.code( 400 ).send( { error: "No pending request to reject" } );
			}

			reply.send( { ok: true } );
		}
	);

	// POST /friends/accept
	server.post(
		"/friends/accept/:id",
		{ preHandler: authenticate },
		async ( req: FastifyRequest, reply: FastifyReply ) =>
		{
			const { userId } = req.user as { userId: string };
			// TODO: validate params
			const { id } = req.params as { id: string };

			const ok = await acceptFriendRequest( server, id, userId );
			if ( !ok )
			{
				return reply.code( 400 ).send( { error: "No pending request" } );
			}

			reply.send( { ok: true } );
		}
	);

	// DELETE /friends/:userId
	server.delete(
		"/friends/:userId",
		{ preHandler: authenticate },
		async ( req, reply ) =>
		{
			const { userId } = req.user as { userId: string };
			// TODO: validate params
			const friendId = ( req.params as { userId: string } ).userId;

			const ok = await removeFriend( server, userId, friendId );
			reply.send( { ok } );
		}
	);

	server.get(
		"/friends/request-list",
		{ preHandler: authenticate },
		async ( req, reply ) =>
		{
			if ( !req.user )
			{
				return reply.code( 401 ).send( { error: "Unauthorized" } );
			}

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
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			} );

			return pendingRequests.map( req => ( {
				requestId: req.id,
				fromUserId: req.user.id,
				fromUsername: req.user.username ?? "(no name)",
				fromAvatar: req.user.avatar ?? "",
			} ) );
		}
	);

	// Block user
	server.post(
		"/friends/block/:id",
		{ preHandler: authenticate },
		async ( request, reply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const { id: targetUserId } = request.params as { id: string };

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

	// Unblock user
	server.delete(
		"/friends/block/:id",
		{ preHandler: authenticate },
		async ( request, reply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const { id: targetUserId } = request.params as { id: string };

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
