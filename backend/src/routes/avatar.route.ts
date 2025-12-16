import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import fs from "fs/promises";
import { BadRequestError, NotFoundError, sendErrorReply } from "../shared/utility/error.utility.js";
import { validateRequest } from "../shared/utility/validation.utility.js";
import { GetAvatarByUsernameSchema } from "../schemas/avatar.schema.js";

const AVATAR_DIR = path.join( process.cwd(), "upload", "avatars" );
const MAX_FILESIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

const avatarRoutes = async ( server: FastifyInstance ) =>
{
	// Create the directory for local avatars
	try
	{
		await fs.access( AVATAR_DIR );
	}
	catch
	{
		await fs.mkdir( AVATAR_DIR, { recursive: true } );
	}

	// Set the user's avatar
	server.post(
		"/users/avatar",
		 { preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const data = await request.file();

				if ( !data ) throw BadRequestError( "No file uploaded" );

				if ( !ALLOWED_FORMATS.includes( data.mimetype ) ) throw BadRequestError( "Erroneous file format" );

				const imageBuffer = await data.toBuffer();
				if ( imageBuffer.length > MAX_FILESIZE ) throw BadRequestError( "File too large. 4MB max." );

				// Convert the image file into webp
				const processedImage = await sharp( imageBuffer ).resize( 128 ).webp( {quality: 80} ).toBuffer();
				const filename = `${uuidv4()}.webp`;
				const filepath = path.join( AVATAR_DIR, filename );

				// Save to disk
				await fs.writeFile( filepath, processedImage );

				// Remove old avatar if it exists (not a point of exit)
				const user = await server.prisma.user.findUnique( {
					where: { id: userId },
					select: { avatar: true, avatarType: true }
				} );

				if ( user?.avatarType === "local" && user.avatar )
				{
					const oldAvatarPath = path.join( AVATAR_DIR, user.avatar );
					await fs.unlink( oldAvatarPath ).catch( ( error: any ) =>
					{
						server.log.info( `Avatar unlink failed: ${error}` );
					} );
				}

				// Update the database with the new avatar filepath
				await server.prisma.user.update( {
					where: {id: userId},
					data: {
						avatar: filename,
						avatarType: "local"
					}
				} );

				reply.send( {
					message: "Avatar updated successfully",
					avatarUrl: `/avatars/${filename}`
				} );
			}
			catch ( err: any )
			{
				server.log.error( `Image upload failed ${err}` );
				return sendErrorReply( reply, err, "Failed to upload avatar" );
			}
		}
	);

	// Get avatar for a given username
	server.get(
		"/users/avatar/:username",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { username } = validateRequest( GetAvatarByUsernameSchema, request.params );

				const user = await server.prisma.user.findUnique( {
					where: { username },
					select: { avatar: true, avatarType: true }
				} );

				// Check if the user has an uploaded avatar
				if ( user?.avatar )
				{
					if ( user.avatarType === "provider" )
					{
						return reply.send( {
							message: "External avatar retrieved successfully",
							avatarUrl: user.avatar
						} );
					}
					else if ( user.avatarType === "local" )
					{
						const filepath = path.join( AVATAR_DIR, user.avatar );
						try
						{
							await fs.access( filepath );
						}
						catch
						{
							throw NotFoundError( "Avatar for the given user not found" );
						}

						return reply.send( {
							message: "Local avatar retrieved successfully",
							avatarUrl: `/avatars/${user.avatar}`
						} );
					}
					else
					{
						// Send back the default profile picture
						return reply.send( {
							message: "Default avatar retrieved successfully",
							avatarUrl: "/avatars/00000000-0000-0000-0000-000000000000.webp"
						} );
					}
				}
				else
				{
					throw NotFoundError( "User not found" );
				}
			}
			catch ( err: any )
			{
				return sendErrorReply( reply, err, "No avatar found for given user" );
			}
		}
	);

	// Get the user's avatar
	server.get(
		"/users/avatar",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const user = await server.prisma.user.findUnique( {
					where: { id: userId },
					select: { avatar: true, avatarType: true }
				} );

				if ( user?.avatar )
				{
					if ( user.avatarType === "provider" )
					{
						return reply.send( {
							message: "External avatar retrieved successfully",
							avatarUrl: user.avatar
						} );
					}
					else if ( user.avatarType === "local" )
					{
						const filepath = path.join( AVATAR_DIR, user.avatar );

						// Check if the file exists first
						try
						{
							await fs.access( filepath );

							return reply.send( {
								message: "Local avatar retrieved successfully",
								avatarUrl: `/avatars/${user.avatar}`
							} );
						}
						catch
						{
							// If the previously stored avatar was lost then remove the entries from db
							await server.prisma.user.update( {
								where: { id: userId },
								data: { avatar: null, avatarType: null }
							} );
						}
					}
					// Send back the default profile picture if all other cases did not match
					return reply.send( {
						message: "Default avatar retrieved successfully",
						avatarUrl: "/avatars/00000000-0000-0000-0000-000000000000.webp"
					} );
				}
				else
				{
					throw NotFoundError( "User not found" );
				}
			}
			catch ( err: any )
			{
				server.log.error( `Avatar fetch failed ${err}` );
				return sendErrorReply( reply, err, "Error when retrieving avatar" );
			}
		}
	);

	// Remove the user's avatar
	server.delete(
		"/users/avatar",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { userId } = request.user as { userId: string };
				const user = await server.prisma.user.findUnique( {
					where: { id: userId },
					select: { avatar: true, avatarType: true }
				} );

				if ( !user ) throw NotFoundError( "User not found" );

				if ( user?.avatarType === "local" && user.avatar )
				{
					const filepath = path.join( AVATAR_DIR, user.avatar );
					await fs.unlink( filepath ).catch( ( error: any ) =>
					{
						server.log.info( `Avatar unlink failed: ${error}` );
					} );
				}

				await server.prisma.user.update( {
					where: { id: userId },
					data: { avatar: null, avatarType: null }
				} );

				reply.send( { message: "Avatar successfully deleted"} );
			}
			catch ( err: any )
			{
				server.log.error( `Avatar deletion failed ${err}` );
				return sendErrorReply( reply, err, "You do not have an existing avatar" );
			}
		}
	);
};

export default avatarRoutes;
