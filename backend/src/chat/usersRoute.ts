import type { FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";

export default async function chatUsersComponent(server: FastifyInstance)
{
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
