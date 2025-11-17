import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import fs from "fs/promises";

const AVATAR_DIR = path.join( process.cwd(), "upload", "avatars" );
const MAX_FILESIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

const avatarRoutes = async ( server: FastifyInstance ) =>
{
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

				if ( !data )
				{
					return reply.code( 400 ).send( { error: "No file uploaded"} );
				}

				if ( !ALLOWED_FORMATS.includes( data.mimetype ) )
				{
					return reply.code( 400 ).send( { error: "Erroneous file format"} );
				}

				const imageBuffer = await data.toBuffer();
				if ( imageBuffer.length > MAX_FILESIZE )
				{
					return reply.code( 400 ).send( { error: "File too large. Keep it under 4MB."} );
				}

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
				reply.code( 500 ).send( { error: "Failed to upload avatar" } );
			}
		}
	);

	// Get specific avatar
	server.get(
		"/users/avatar/:filename",
		{ preHandler: authenticate },
		async ( request: FastifyRequest, reply: FastifyReply ) =>
		{
			try
			{
				const { filename } = request.params as { filename: string };

				if ( !/^[a-f0-9-]+\.webp$/i.test( filename ) )
				{
					return reply.code( 400 ).send( { error: "Invalid filename"} );
				}

				// Check if the file exists
				const filepath = path.join( AVATAR_DIR, filename );
				await fs.access( filepath );

				const stream = await fs.readFile( filepath );
				return reply.type( "image/webp" ).send( stream );
			}
			catch ( err: any )
			{
				server.log.error( `Avatar fetch failed ${err}` );
				reply.code( 404 ).send( { error: "No such avatar" } );
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
						return reply.send( { avatarUrl: user.avatar } );
					}
					else if ( user.avatarType === "local" )
					{
						const filepath = path.join( AVATAR_DIR, user.avatar );
						await fs.access( filepath );
						const stream = await fs.readFile( filepath );
						return reply.type( "image/webp" ).send( stream );
					}
					else
					{
						reply.code( 404 ).send( { error: "You do not have an avatar" } );
					}
				}
			}
			catch ( err: any )
			{
				server.log.error( `Avatar fetch failed ${err}` );
				reply.code( 404 ).send( { error: "You do not have an avatar" } );
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
				reply.code( 404 ).send( { error: "You do not have an existing avatar" } );
			}
		}
	);

};

export default avatarRoutes;
