import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seed the database for the development environment
const seedDev = async () => {
	const frank = await prisma.user.upsert({
		where: { email: 'trashman@hive.fi' },
		update: {},
		create: {
			email: 'trashman@hive.fi',
			googleId: 'frank-reynolds-google-id',
			userName: 'TrashMan',
			avatarUrl: null,
			lastLogin: new Date(),
			playerStats: {
				create: {}
			}
		}
	});
	const charlie = await prisma.user.upsert({
		where: { email: 'wildcard@hive.fi' },
		update: {},
		create: {
			email: 'wildcard@hive.fi',
			googleId: 'charlie-kelly-google-id',
			userName: 'The Wildcard',
			avatarUrl: null,
			lastLogin: new Date(),
			playerStats: {
				create: {}
			}
		}
	});

	console.log({ frank, charlie });
}


const main = async () => {
	if (process.env.NODE_ENV === 'development')
		await seedDev();
};

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (err) => {
		console.error(err);
		await prisma.$disconnect();
		process.exit(1);
	});
