import type { FastifyInstance } from "fastify";

export async function sendFriendRequest(
	server: FastifyInstance,
	fromId: string,
	toId: string
): Promise<boolean> {
	if (fromId === toId)
		return false;
	const blocked = await server.prisma.block.findFirst({
		where: {
		OR: [
			{ blockerId: fromId, blockedId: toId },
			{ blockerId: toId, blockedId: fromId },
		],
		},
	});

	if (blocked) return false;
	
	try {
		await server.prisma.friendship.create({
			data: {
			userId: fromId,
			friendId: toId,
			status: "pending",
			},
		});
	} 
	catch (e: any) {
		if (e.code === "P2002") return true; // already requested
		throw e;
	}
  	return true;
}

export async function acceptFriendRequest(
	server: FastifyInstance,
	fromId: string,
	toId: string
): Promise<boolean> {
	return await server.prisma.$transaction(async (tx) => {
		const updated = await tx.friendship.updateMany({
		where: {
    		userId: fromId,
        	friendId: toId,
        	status: "pending",
      	},
      	data: { status: "accepted" },
    	});

    if (updated.count === 0) return false;

    await tx.friendship.create({
    	data: {
        	userId: toId,
        	friendId: fromId,
        	status: "accepted",
    	},
    });

    return true;
	});
}

export async function removeFriend(
	server: FastifyInstance,
	fromId: string,
	toId: string
): Promise<boolean> {
	const res = await server.prisma.friendship.deleteMany({
		where: {
			OR: [
				{ userId: fromId, friendId: toId },
				{ userId: toId, friendId: fromId },
			],
		},
	});
	return res.count > 0;
}