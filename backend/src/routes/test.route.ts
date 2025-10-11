import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import userSchema from "../schemas/user.schema.ts"

// Trying to check if we get the correct schema from a GET method
const testRoutes = async (server: FastifyInstance) => {
	server.get('/test/:id' , {
		schema: {
			response: {
				200: userSchema.userResponseSchema
			}
		}
	}, async (request: FastifyRequest, response: FastifyReply) => {
		const { id } = request.params as { id: string };
		const user = await server.prisma.user.findUnique({ where: { id } });
		if (!user) {
			return response.code(404).send({ message: 'User not found' });
		}
		response.send(user);
	}
)};

export default testRoutes;
