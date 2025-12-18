import { type FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "../chat/friends.ts";

export default async function friendsRoutes(server: FastifyInstance) {
	// GET /friends
	server.get(
		"/friends",
		{ preHandler: authenticate },
		async (req) => {
			const { userId } = req.user as { userId: string };

			const friendships = await server.prisma.friendship.findMany({
				where: {
					userId,
					status: "accepted",
				},
				include: {
					user: { select: { id: true, username: true, avatar: true, }, },
					friend: { select: { id: true, username: true, avatar: true, }, },
				},
			});

			return friendships.map(f => {
				const other =
					f.userId === userId ? f.friend : f.user;

				return {
					id: other.id,
					username: other.username,
					profile: other.avatar ?? "",
				};
			});
		}
	);

	// POST /friends/request
	server.post(
		"/friends/request",
		{ preHandler: authenticate },
		async (req, reply) => {
			const { userId } = req.user as { userId: string };
			const { toUserId } = req.body as { toUserId: string };

			const ok = await sendFriendRequest(server, userId, toUserId);
			if (!ok) {
				return reply.code(400).send({ error: "Invalid friend request" });
			}

			reply.send({ ok: true });
		}
	);

	//DELETE friend request (reject it)
	server.delete(
		"/friends/request/:fromUserId",
		{ preHandler: authenticate },
		async (req, reply) => {
			const { userId } = req.user as { userId: string };
			const { fromUserId } = req.params as { fromUserId: string };

			const deleted = await server.prisma.friendship.deleteMany({
			where: {
				userId: fromUserId, // requester
				friendId: userId,   // me
				status: "pending",
			},
			});

			if (deleted.count === 0) {
			return reply.code(400).send({ error: "No pending request to reject" });
			}

			reply.send({ ok: true });
		}
	);

	// POST /friends/accept
	server.post(
		"/friends/accept",
		{ preHandler: authenticate },
		async (req, reply) => {
			const { userId } = req.user as { userId: string };
			const { fromUserId } = req.body as { fromUserId: string };

			const ok = await acceptFriendRequest(server, fromUserId, userId);
			if (!ok) {
				return reply.code(400).send({ error: "No pending request" });
			}

			reply.send({ ok: true });
		}
	);

	// DELETE /friends/:userId
	server.delete(
	"/friends/:userId",
	{ preHandler: authenticate },
	async (req, reply) => {
		const { userId } = req.user as { userId: string };
		const friendId = (req.params as { userId: string }).userId;

		const ok = await removeFriend(server, userId, friendId);
		reply.send({ ok });
	}
  );

	server.get("/friends/request-list", { preHandler: authenticate }, async (req, reply) => {
		if (!req.user) {
			reply.code(401);
			return { error: "Unauthorized" };
		}

		const { userId } = req.user as { userId: string };

		const pendingRequests = await server.prisma.friendship.findMany({
			where: {
			friendId: userId,   // requests sent TO me
			status: "pending",
			},
			select: {
			id: true,          // friendship id
			user: {            // requester
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
		});

		return pendingRequests.map(req => ({
			requestId: req.id,
			fromUserId: req.user.id,
			fromUsername: req.user.username ?? "(no name)",
			fromAvatar: req.user.avatar ?? "",
		}));
	});
}