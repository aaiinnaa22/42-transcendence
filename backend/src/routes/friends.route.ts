import { type FastifyInstance } from "fastify";
import { authenticate } from '../shared/middleware/auth.middleware.js';
import { sendFriendRequest, acceptFriendRequest, removeFriend } from '../chat/friends.js';
import type { Prisma } from "@prisma/client";

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

			return friendships.map((f: FriendSelect) => {
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
}
