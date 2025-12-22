import fp from "fastify-plugin";
import { type FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

// Typescript module augmentation
declare module "fastify" {
	interface FastifyInstance {
		prisma: PrismaClient
	}
}

// Make prisma available through server instance and automate disconnect on server close
const prismaPlugin: FastifyPluginAsync = fp( async ( server, options ) =>
{
	void options;

	const prisma = new PrismaClient();
	await prisma.$connect();

	server.decorate( "prisma", prisma );
	server.addHook( "onClose", async ( server ) =>
	{
		await server.prisma.$disconnect();
	} );
} );

export default prismaPlugin;
