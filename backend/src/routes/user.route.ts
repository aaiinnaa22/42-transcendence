import { type FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";

const userRoutes = async (server: FastifyInstance) => {
  // Get user profile (protected route)
  server.get("/users/profile", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
<<<<<<< HEAD

=======
      
>>>>>>> f1cd474 (Implement auth API and merge database changes)
      const user = await server.prisma.user.findUnique({
        where: { id: userId },
        include: { playerStats: true }
      });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      reply.send(user);
    } catch (err: any) {
      server.log.error(`Get user profile failed: ${err?.message}`);
      reply.code(500).send({ error: "Failed to get user profile" });
    }
  });

  // Update user profile (protected route)
  server.put("/users/profile", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { userId } = request.user as { userId: string };
<<<<<<< HEAD
      const { username } = request.body as { username?: string };

=======
      const { username, avatarUrl } = request.body as { username?: string; avatarUrl?: string };
      
>>>>>>> f1cd474 (Implement auth API and merge database changes)
      const user = await server.prisma.user.update({
        where: { id: userId },
        data: {
          username: username || undefined,
<<<<<<< HEAD
=======
          avatarUrl: avatarUrl || undefined,
>>>>>>> f1cd474 (Implement auth API and merge database changes)
        },
        include: { playerStats: true }
      });

      reply.send(user);
    } catch (err: any) {
      server.log.error(`Update user profile failed: ${err?.message}`);
      reply.code(500).send({ error: "Failed to update user profile" });
    }
  });
};

export default userRoutes;
