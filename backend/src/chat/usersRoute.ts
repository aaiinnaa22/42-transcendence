import type { FastifyInstance } from "fastify";
import { authenticate } from '../shared/middleware/auth.middleware.js';
import type { Prisma } from "@prisma/client";

type UserSelect = Prisma.UserGetPayload<{
	select: {
		username: true;
		avatar: true;
	}
}>;

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
        username: true,
        avatar: true,
      },
      orderBy: { username: "asc" },
    });

    return users.map( (u : UserSelect) => ({
      username: u.username ?? "Unknown",
      profile: u.avatar ?? "",
    }));
  });
}
