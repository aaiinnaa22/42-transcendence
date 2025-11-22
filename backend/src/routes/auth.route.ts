import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { OAuth2Client } from "google-auth-library";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import bcrypt from "bcrypt";
import { checkPasswordStrength, checkEmailFormat } from "../shared/utility/validation.utility.ts";
import { BadRequestError, InternalServerError, ServiceUnavailableError, sendErrorReply, NotFoundError, ConflictError, UnauthorizedError } from "../shared/utility/error.utility.ts";

// Augment Fastify instance with oauth2 namespace added by the plugin
declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

function setAuthCookies( reply: FastifyReply, accessToken: string, refreshToken: string )
{
	reply
		.setCookie( "accessToken", accessToken, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 60 * 15, // 15 min
		} )
		.setCookie( "refreshToken", refreshToken, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
			signed: true,
			maxAge: 60 * 60 * 24 * 7, // 7 days
		} );
}

const authRoutes = async ( server: FastifyInstance ) =>
{
	server.register( fastifyOauth2, {
		name: "googleOAuth2",
		scope: ["openid", "email", "profile"],
		credentials: {
			client: {
				id: process.env.GOOGLE_CLIENT_ID!,
				secret: process.env.GOOGLE_CLIENT_SECRET!,
			},
			auth: {
				authorizeHost: "https://accounts.google.com",
				authorizePath: "/o/oauth2/v2/auth",
				tokenHost: "https://oauth2.googleapis.com",
				tokenPath: "/token",
			},
		},
		startRedirectPath: "/auth/google",
		callbackUri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4241/auth/google/callback",
		// Must return a string; used for CSRF state parameter
		generateStateFunction: () => Math.random().toString( 36 ).slice( 2 ),
		checkStateFunction: () => true,
	} );

	// Callback route
	server.get( "/auth/google/callback", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			if ( !server.prisma ) throw ServiceUnavailableError();

			// Step 1: Use the plugin to exchange the code for tokens
			const tokenResponse = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow( request );

			const { token } = tokenResponse;
			if ( !token ) throw InternalServerError( "Missing token object" );
			if ( !token.id_token ) throw InternalServerError( "Missing ID token" );

			// Step 2: Verifying ID token
			const client = new OAuth2Client( process.env.GOOGLE_CLIENT_ID );

			const ticket = await client.verifyIdToken( {
				idToken: token.id_token,
				audience: process.env.GOOGLE_CLIENT_ID!,
			} );

			const payload = ticket.getPayload();
			if ( !payload ) throw InternalServerError( "No payload in verified ID token" );

			// Step 3: Extract user email and name from Oauth
			const providerSource = "google";
			const { email, name, picture, sub: providerId } = payload;
			if ( !email ) throw BadRequestError( "Provider did not include an email address" );

			// Step 4: Checking for existing provider info
			const existingProvider = await server.prisma.provider.findUnique( {
				where: {
					providerSource_providerId : { providerSource, providerId }
				},
				include: { user: true },
			} );

			let user: any = null;

			// For existing users the email should've been set during the initial Oauth login or account registration
			if ( existingProvider?.user )
			{
				// Step 4.a: User exists, updating login time
				user = await server.prisma.user.update( {
					where: { id: existingProvider?.user!.id },
					data: { lastLogin: new Date() }
				} );
			}
			else
			{
				if ( await server.prisma.user.findUnique( { where:{ email }} ) )
				{
					// Step 4.b: Email from the provider already in use
					const loginRedirectUrl = process.env.CLIENT_LOGIN_REDIRECT_URL || "http://localhost:8080/login";
					return reply.code( 409 )
								.send( { error: "User with that email already exists" } )
								.redirect( loginRedirectUrl );
				}
				else
				{
					// Step 4.c: No existing records on user, creating new account
					const avatarType = picture ? "provider" : null;
					user = await server.prisma.user.create( {
						data: {
							email,
							username: name ?? null,
							lastLogin: new Date(),
							avatar: picture ?? null,
							avatarType,
							playerStats: { create: {} },
							providers: {
								create: [
									{
										providerSource,
										providerId,
									}
								]
							}
						}
					} );
				}
			}

			server.log.info( `Google Oauth: User registered (ID: ${user.id})` );

			// Step 5: Signing app JWT with JWT plugin
			const accessToken = server.jwt.sign( { userId: user.id, email: user.email }, {expiresIn: "15m"} );
			const refreshToken = server.jwt.sign( { userId: user.id }, {expiresIn: "7d"} );
			setAuthCookies( reply, accessToken, refreshToken );

			// Step 6: redirect from google auth
			const clientRedirectUrl = process.env.CLIENT_REDIRECT_URL!;
			return reply.redirect( clientRedirectUrl );

		}
		catch ( err: any )
		{
			server.log.error( `Google OAuth failure: ${err?.stack || err}` );
			return sendErrorReply( reply, err, "Google OAuth failed" );
		}
	} );

	// Get current user info (protected route)
	server.get( "/auth/me", { preHandler: authenticate }, async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { userId } = request.user as { userId: string };

			const user = await server.prisma.user.findUnique( {
				where: { id: userId },
				include: { playerStats: true }
			} );

			if ( !user ) throw NotFoundError( "User not found" );
			reply.send( user );
		}
		catch ( err: any )
		{
			server.log.error( `Get user failed: ${err?.message}` );
			return sendErrorReply( reply, err );
		}
	} );

	// Logout endpoint (now it clears cookies)
	server.post( "/auth/logout", { preHandler: authenticate }, async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		reply
			.clearCookie( "accessToken", { path: "/" } )
			.clearCookie( "refreshToken", { path: "/" } )
			.send( { message: "Logged out successfully" } );
	} );

	// Register with email/password
	server.post( "/auth/register", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { email, password, username } = request.body as {
        		email: string;
        		password: string;
        		username: string;
      		};

			// Validate email format and confirm minimum password strength requirements
			if ( !username || username === undefined ) throw BadRequestError( "Username missing" );
			if ( username.length < 3 ) throw BadRequestError( "Username too short" );
			if ( !checkEmailFormat( email ) ) throw BadRequestError( "Invalid email" );
			if ( !checkPasswordStrength( password ) ) throw BadRequestError( "Password too weak" );

			// Check if email is already in use
			if ( await server.prisma.user.findUnique( { where: { email } } ) )
				throw ConflictError( "User already exists" );

			// Check if the username is taken
			if ( username !== undefined )
			{
				const existingUsername = await server.prisma.user.findUnique( { where: { username } } );
				if ( existingUsername ) throw ConflictError( "User already exists" );
			}

			// Hash password
			const salt_rounds = process.env.SALT_ROUNDS ? parseInt( process.env.SALT_ROUNDS, 10 ) : 10;
			const hashedPassword = await bcrypt.hash( password, salt_rounds );

			// Create user
			const user = await server.prisma.user.create( {
				data: {
					email,
					username: username || null,
					lastLogin: new Date(),
					playerStats: { create: {} },
					credential: { create: {
						password: hashedPassword,
					}}
				}
			} );

			// Generate JWT (access and refresh tokens)
			const accessToken = server.jwt.sign( { userId: user.id, email: user.email }, { expiresIn: "15m" } );
			const refreshToken = server.jwt.sign( { userId: user.id }, { expiresIn: "7d" } );

			setAuthCookies( reply, accessToken, refreshToken );

			reply.send( {
				message: "Registration successful",
				user,
			} );

		}
		catch ( err: any )
		{
			server.log.error( `Registration failed: ${err?.message}` );
			return sendErrorReply( reply, err, "Registration failed" );
		}
	} );

	// Login with email/password
	server.post( "/auth/login", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const { email, password } = request.body as { email: string; password: string };

			// Find user
			const user = await server.prisma.user.findUnique( {
				where: { email },
				include: { playerStats: true }
			} );

			if ( !user ) throw BadRequestError( "Invalid user" );

			const existingCredential = await server.prisma.credential.findUnique( {
				where: { userId: user.id },
				select: { password: true },
			} );

			// Verify password
			if ( !existingCredential?.password ) throw BadRequestError( "Not a local user" );

			const isValidPassword = await bcrypt.compare( password, existingCredential.password );
			if ( !isValidPassword ) throw UnauthorizedError( "Invalid password" );

			// Update last login
			await server.prisma.user.update( {
				where: { id: user.id },
				data: { lastLogin: new Date() }
			} );

			// Generate JWT (access and refresh)
			const accessToken = server.jwt.sign( { userId: user.id, email: user.email }, { expiresIn: "15m" } );
			const refreshToken = server.jwt.sign( { userId: user.id }, { expiresIn: "7d" } );

			setAuthCookies( reply, accessToken, refreshToken );

			reply.send( {
				message: "Login successful",
				user,
			} );
		}
		catch ( err: any )
		{
			server.log.error( `Login failed: ${err?.message}` );
			return sendErrorReply(reply, err, "Login failed" );
		}
	} );

	// TO DO: /auth/refresh route
	server.post( "/auth/refresh", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			const signed = request.cookies.refreshToken;
			if ( !signed ) throw UnauthorizedError( "No refresh token" );

			const unsign = request.unsignCookie( signed );
			if ( !unsign.valid ) throw UnauthorizedError( "Invalid cookie signature" );

			const decoded = server.jwt.verify( unsign.value ) as { userId: string };
			const user = await server.prisma.user.findUnique( { where: { id: decoded.userId } } );
			if ( !user ) throw NotFoundError( "User not found" );

			const newAccess = server.jwt.sign( { userId: user.id, email: user.email }, { expiresIn: "15m" } );
			const newRefresh = server.jwt.sign( { userId: user.id }, { expiresIn: "7d" } );
			setAuthCookies( reply, newAccess, newRefresh );

			reply.send( { message: "Token refreshed" } );
		}
		catch ( err: any )
		{
			server.log.error( `Refresh failed: ${err.message}` );
			return sendErrorReply(reply, err );
		}
	} );
};

export default authRoutes;
