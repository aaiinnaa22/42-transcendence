import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

// Checking health of the backend database
const healthcheck = async (server: FastifyInstance) => {
	server.get('/healthcheck' , {
		schema: {
			response: {
				200: {
					type: 'object',
					properties: { status: { type: 'string' } }
				},
				503: {
					type: 'object',
					properties: { status: { type: 'string' }, error: { type: 'string' } }
				}
			}
		}
	}, async (request: FastifyRequest, response: FastifyReply) => {
		void request;
		try {
			await server.prisma.$queryRaw`SELECT 1`;
			response.send({ status: "OK" });
		} catch (err) {
			server.log.error(err);
			response.code(503).send({ status: "FAIL", error: "Service Unavailable"});
		}
	}
)};

export default healthcheck;
