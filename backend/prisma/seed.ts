import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Seed the database for the development environment
const seedDev = async () =>
{
	const salt_rounds = process.env.SALT_ROUNDS ? parseInt( process.env.SALT_ROUNDS, 10 ) : 10;
	const trashmanPassword = await bcrypt.hash( "Trashman123", salt_rounds );
	const wildcardPassword = await bcrypt.hash( "wildCard456", salt_rounds );

	const frank = await prisma.user.upsert( {
		where: { email: "trashman@example.com" },
		update: {},
		create: {
			email: "trashman@example.com",
			username: "Trashman",
			lastLogin: new Date(),
			playerStats: {
				create: {}
			},
			credential: { create: {
				password: trashmanPassword
			} }
		}
	} );
	const charlie = await prisma.user.upsert( {
		where: { email: "wildcard@example.com" },
		update: {},
		create: {
			email: "wildcard@example.com",
			username: "The Wildcard",
			lastLogin: new Date(),
			playerStats: {
				create: {}
			},
			credential: { create: {
				password: wildcardPassword
			} }
		}
	} );

	console.log( { frank, charlie } );
};


const main = async () =>
{
	if ( process.env.NODE_ENV === "development" ) await seedDev();
};

main()
	.then( async () =>
	{
		await prisma.$disconnect();
	} )
	.catch( async ( err ) =>
	{
		console.error( err );
		await prisma.$disconnect();
		process.exit( 1 );
	} );
