import { env } from "../config/environment.ts";

import { type FastifyInstance } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { blockUser, unblockUser } from "../chat/blocking.ts";
import { HttpError, NotFoundError, sendErrorReply, sendErrorReplyForAuth } from "../shared/utility/error.utility.ts";
import { validateRequest } from "../shared/utility/validation.utility.ts";
import { UpdateUserSchema } from "../schemas/user.schema.ts";

const userRoutes = async (server: FastifyInstance) => {
    // Get user profile (protected route)
    server.get("/users/me", { preHandler: authenticate }, async (request, reply) => {
        try
        {
            const { userId } = request.user as { userId: string };
            const user = await server.prisma.user.findUnique( {
                where: { id: userId },
                include: { playerStats: true }
            } );

            if ( !user ) throw NotFoundError( "User not found" );
            reply.send(user);
        }
        catch ( err: any )
        {
            server.log.error( `Get user profile failed: ${err?.message}` );
            return sendErrorReply( reply, err, "Failed to get user profile" );
        }
    });

    // Update user profile (protected route)
    server.put("/users/me", { preHandler: authenticate }, async (request, reply) => {
        try
        {
            const { userId } = request.user as { userId: string };
            const { username, avatar, email, password } = validateRequest(UpdateUserSchema, request.body);

            // Prepare the data to update only provided fields
            const dataToUpdate: Record<string, any> = {};
            if (username !== undefined) dataToUpdate.username = username;
            if (avatar !== undefined) dataToUpdate.avatar = avatar;
            if (email !== undefined) dataToUpdate.email = email;
            // This block is to handle password update
            // Perform updates in a single transaction. If a password is provided,
            // upsert the credential row to handle users without existing credentials (e.g. OAuth users).
            const user = await server.prisma.$transaction(async (tx) => {
                if (password !== undefined)
                {
                    const salt_rounds = env.SALT_ROUNDS;
                    const hashedPassword = await bcrypt.hash(password, salt_rounds);
                    await tx.credential.upsert({
                        where: { userId },
                        update: { password: hashedPassword },
                        create: { userId, password: hashedPassword },
                    });
                }

                // Update the User record with only provided fields
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: dataToUpdate,
                    include: { playerStats: true },
                });

                return updatedUser;
            });

            // Log successful update
            server.log.info(`User ${userId} profile updated successfully. Fields updated: ${Object.keys(dataToUpdate).join(', ')}`);

            reply.send({
                message: "Profile updated successfully",
                updatedFields: Object.keys(dataToUpdate),
                user: user
            });
        }
        catch (err: any)
        {
			if (err instanceof HttpError)
				return sendErrorReplyForAuth( reply, err );


            // Handle known Prisma errors for better UX
            if (err instanceof Prisma.PrismaClientKnownRequestError)
            {
                // Unique constraint failed on the {target}
                if (err.code === 'P2002')
                {
                    const target = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : String(err.meta?.target ?? 'unknown');
                    server.log.warn({ err }, 'Unique constraint violation while updating profile');
                    return reply.code(409).send({ error: 'Unique constraint failed', target });
                }
                // Record to update not found
                if (err.code === 'P2025')
                {
                    server.log.warn({ err }, 'User not found while updating profile');
                    return reply.code(404).send({ error: 'User not found' });
                }
            }

            server.log.error({ err }, `Update user profile failed`);
            reply.code(500).send({ error: "Failed to update user profile" });
        }
    });

    //Block user
    server.post(
        "/users/:id/block",
        { preHandler: authenticate },
        async (request, reply) => {
            try 
            {
                const { userId } = request.user as { userId: string };
                const { id: targetUserId } = request.params as { id: string };

                const success = await blockUser(server, userId, targetUserId);

                if (!success) {
                    return reply.code(400).send({ error: "Invalid block request" });
                }

                reply.send({ ok: true });
            } 
            catch (err: any) 
            {
                server.log.error({ err }, "Block user failed");
                reply.code(500).send({ error: "Failed to block user" });
            }
        }
    );

    //Unblock user
    server.delete(
        "/users/:id/block",
        { preHandler: authenticate },
        async (request, reply) => {
            try 
            {
                const { userId } = request.user as { userId: string };
                const { id: targetUserId } = request.params as { id: string };

                const success = await unblockUser(server, userId, targetUserId);

                reply.send({ ok: success });
            } 
            catch (err: any) 
            {
                server.log.error({ err }, "Unblock user failed");
                reply.code(500).send({ error: "Failed to unblock user" });
            }
        }
    );

    server.delete("/users/me", { preHandler: authenticate }, async (request, reply) => {
        try
        {
            const { userId } = request.user as { userId: string };

            // Delete user and related data in a transaction
            await server.prisma.$transaction(async (tx) => {
                // Delete credentials
                await tx.credential.deleteMany({ where: { userId } });
                // Delete player stats
                await tx.playerStats.deleteMany({ where: { userId } });
                // Delete the user
                await tx.user.delete({ where: { id: userId } });
            });

            server.log.info(`User ${userId} profile deleted successfully.`);

            reply.send({ message: "User profile deleted successfully" });
        }
        catch (err: any)
        {
            server.log.error({ err }, `Delete user profile failed`);
            reply.code(500).send({ error: "Failed to delete user profile" });
        }
    });
};

export default userRoutes;


