import type { FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";

export default async function chatUsersComponent(server: FastifyInstance)
{
	  //Aina added to get ONE user
	server.get("/chat/users/:username", { preHandler: authenticate }, async (req, reply) => {
		if (!req.user) {
		reply.code(401);
		return { error: "Unauthorized" };
		}

		const { userId } = req.user as { userId: string };
		const targetUsername = (req.params as { username: string }).username;

		const currentUser = await server.prisma.user.findUnique({ where: { id: userId } });
		if (currentUser?.username === targetUsername) {
		reply.code(400);
		return { error: "Cannot fetch your own profile here" };
		}

		const u = await server.prisma.user.findUnique({
		where: { username: targetUsername },
		select: {
			id: true,
			username: true,
			avatar: true,
			playerStats: true,
		},
		});

		if (!u) {
		reply.code(404);
		return { error: "User not found" };
		}

		if (u.id === userId) {
		reply.code(400);
		return { error: "Cannot fetch your own profile here" };
		}

		const blockedByMe = await server.prisma.block.findFirst({
		where: { blockerId: userId, blockedId: u.id },
		});

		const blockedByThem = await server.prisma.block.findFirst({
		where: { blockerId: u.id, blockedId: userId },
		});

		  const friendship = await server.prisma.friendship.findFirst({
			where: {
			OR: [
				{ userId, friendId: u.id },
				{ userId: u.id, friendId: userId },
			],
			},
			select: {
			status: true,
			},
		});

		return {
		id: u.id,
		username: u.username ?? "(no name)",
		profile: u.avatar ?? "",
		stats: u.playerStats ?? null,
		isFriend: friendship?.status === "accepted",
		friendshipStatus: friendship?.status ?? null,
		isBlockedByMe: Boolean(blockedByMe),
		hasBlockedMe: Boolean(blockedByThem),
		};

	});


  server.get("/chat/users", { preHandler: authenticate }, async (req, reply) => {

    //auth check
    if (!req.user)
    {
        reply.code(401);
        return { error: "Unauthorized" };
    }
    const { userId } = req.user as { userId: string };

    const users = await server.prisma.user.findMany({
      where: {
        id: { not: userId }, // everyone except me
      },
      select: {
        id: true, // remove id maybe?
        username: true,
        avatar: true,
		    playerStats: true,
        friendships: {
          where: { userId },
          select: { status: true },
        },
        friendOf: {
          where: { friendId: userId },
          select: { status: true },
        },
        blockedUsers: {
          where: { blockerId: userId },
          select: { id: true },
        },
        blockedBy: {
          where: { blockedId: userId },
          select: { id: true },
        },
      },
      orderBy: { username: "asc" },
    });

    return users.map((u: any) => {
      const friendship =
        u.friendships[0] ?? u.friendOf[0] ?? null;

      const isFriend = friendship?.status === "accepted";
      const friendshipStatus = friendship?.status ?? null;

      const isBlockedByMe = u.blockedUsers.length > 0;
      const hasBlockedMe = u.blockedBy.length > 0;
      return {
        id: u.id,
        username: u.username ?? "(no name)",
        profile: u.avatar ?? "",
        stats: u.playerStats ?? null,

        isFriend,
        friendshipStatus,
        isBlockedByMe,
        hasBlockedMe,
      };
    });
  });

}
