import type { FastifyInstance } from "fastify";

export async function isBlocked(
	server: FastifyInstance,
	userA: string,
	userB: string
): Promise<boolean>
{
	const block = await server.prisma.block.findFirst( {
		where: {
			OR: [
				{ blockerId: userA, blockedId: userB },
				{ blockerId: userB, blockedId: userA }
			]
		}
	} );

	return !!block;
}

export async function blockUser(
	server: FastifyInstance,
	blockerId: string,
	blockedId: string
): Promise<boolean>
{
	if ( blockerId === blockedId ) return false;

	try
	{
		await server.prisma.block.create( {
			data: {
				blockerId,
				blockedId
			}
		} );

		return true;
	}
	catch ( err: any )
	{
		// Already blocked → still success
		if ( err.code === "P2002" ) return true;
		throw err;
	}
}

export async function unblockUser(
	server: FastifyInstance,
	blockerId: string,
	blockedId: string
): Promise<boolean>
{
	if ( blockerId === blockedId ) return false;

	const result = await server.prisma.block.deleteMany( {
		where: {
			blockerId,
			blockedId
		}
	} );

	return result.count > 0;
}
