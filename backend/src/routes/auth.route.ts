import { env } from "../config/environment.ts";

import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { OAuth2Client } from "google-auth-library";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import bcrypt from "bcrypt";
import { validateRequest } from "../shared/utility/validation.utility.ts";
import { BadRequestError, InternalServerError, ServiceUnavailableError, sendErrorReply, NotFoundError, ConflictError, UnauthorizedError } from "../shared/utility/error.utility.ts";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { LoginSchema, RegisterSchema, TwoFADisableSchema, TwoFALoginSchema, TwoFAVerifySchema } from "../schemas/auth.schema.ts";

// Augment Fastify instance with oauth2 namespace added by the plugin
declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

function generate2FATempToken(server: FastifyInstance, userId: string) {
  return server.jwt.sign({ userId }, { expiresIn: "5m" });
}

function setAuthCookies( reply: FastifyReply, accessToken: string, refreshToken: string )
{
	reply
		.setCookie( "accessToken", accessToken, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: env.NODE_ENV === "production",
			signed: true,
			maxAge: 60 * 15,
		} )
		.setCookie( "refreshToken", refreshToken, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: env.NODE_ENV === "production",
			signed: true,
			maxAge: 60 * 60 * 24 * 7, // 7 days
		} );
}
// check if user is already logged in (refresh change for Leo - to be checked)
function isLoggedIn(request: FastifyRequest)
{
  return Boolean(request.cookies?.accessToken);
}

const authRoutes = async ( server: FastifyInstance ) =>
{
	server.register( fastifyOauth2, {
		name: "googleOAuth2",
		scope: ["openid", "email", "profile"],
		credentials: {
			client: {
				id: env.GOOGLE_CLIENT_ID,
				secret: env.GOOGLE_CLIENT_SECRET,
			},
			auth: {
				authorizeHost: "https://accounts.google.com",
				authorizePath: "/o/oauth2/v2/auth",
				tokenHost: "https://oauth2.googleapis.com",
				tokenPath: "/token",
			},
		},
		callbackUri: env.GOOGLE_CALLBACK_URL,
		// Must return a string; used for CSRF state parameter
		generateStateFunction: () => Math.random().toString( 36 ).slice( 2 ),
		checkStateFunction: () => true,
	} );

	server.get("/auth/google", async (request, reply) =>
	{
		const clientRedirectUrl = env.CLIENT_REDIRECT_URL;

		// Prevent login if already logged in
		if (request.cookies?.accessToken || request.cookies?.refreshToken) {
			return reply.redirect(clientRedirectUrl);
		}

		const url = await server.googleOAuth2.generateAuthorizationUri(request, reply);
  		return reply.redirect(url);
	});

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
			const client = new OAuth2Client( env.GOOGLE_CLIENT_ID );

			const ticket = await client.verifyIdToken( {
				idToken: token.id_token,
				audience: env.GOOGLE_CLIENT_ID,
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
					throw ConflictError("User with that email already exists");
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

			if (user.twoFAEnabled) {
				const tempToken = server.jwt.sign(
					{ userId: user.id },
					{ expiresIn: "5m" }
				);

				  return reply.redirect(
					`http://localhost:8080/login?twoFA=1&token=${tempToken}`
				);
			}

			// Step 5: Signing app JWT with JWT plugin
			const accessToken = server.jwt.sign( { userId: user.id, email: user.email }, {expiresIn: "15m"} );
			const refreshToken = server.jwt.sign( { userId: user.id }, {expiresIn: "7d"} );
			setAuthCookies( reply, accessToken, refreshToken );

			// Step 6: redirect from google auth
			const clientRedirectUrl = env.CLIENT_REDIRECT_URL;
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
			const { userId } = request.user as { userId: string }; // Validated with JWT

			const user = await server.prisma.user.findUnique({
				where: { id: userId },
					select: {
						id: true,
						email: true,
						username: true,
						avatar: true,
						avatarType: true,
						twoFAEnabled: true,
						createdAt: true,
						lastLogin: true,
						playerStats: true,
					},
			});

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
	server.post( "/auth/logout", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		reply
			.clearCookie( "accessToken", { path: "/", sameSite: "strict", secure: env.NODE_ENV === "production", signed: true, } )
			.clearCookie( "refreshToken", { path: "/", sameSite: "strict", secure: env.NODE_ENV === "production", signed: true, } )
			.send( { message: "Logged out successfully" } );
	} );

	// Register with email/password
	server.post( "/auth/register", async ( request: FastifyRequest, reply: FastifyReply ) =>
	{
		try
		{
			if (isLoggedIn(request))
			{
				throw ConflictError("Already logged in");
			}

			const { email, password, username } = validateRequest(RegisterSchema, request.body);

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
			const salt_rounds = env.SALT_ROUNDS;
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
			if (isLoggedIn(request))
			{
				throw ConflictError("Already logged in");
			}

			const { email, password } = validateRequest(LoginSchema, request.body);

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

			// 2FA check
			if (user.twoFAEnabled)
			{
				// Create short-lived temporary token
				const tempToken = generate2FATempToken(server, user.id);

				// Tell client that a 2FA step is required
				return reply.send({
					status: "TWO_FA_REQUIRED",
					tempToken,
					message: "Two-factor authentication required."
				});
			}

			// Generate JWT (access and refresh)
			const accessToken = server.jwt.sign( { userId: user.id, email: user.email }, { expiresIn: "15m" } );
			const refreshToken = server.jwt.sign( { userId: user.id }, { expiresIn: "7d" } );

			setAuthCookies( reply, accessToken, refreshToken );

			reply.send( {
				message: "Login successful",
				//user,
			} );
		}
		catch ( err: any )
		{
			server.log.error( `Login failed: ${err?.message}` );
			return sendErrorReply(reply, err, err.message ?? "Unknown error" );
		}
	} );

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

	server.post("/auth/2fa/setup", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) =>
	{
		try {
			const { userId } = request.user as { userId: string };

			const secret = authenticator.generateSecret();

			// Save secret, but do NOT enable 2FA yet
			await server.prisma.user.update({
			where: { id: userId },
			data: { twoFASecret: secret }
			});

			const user = await server.prisma.user.findUnique({ where: { id: userId } });
			if (!user?.email) throw BadRequestError("User must have email for 2FA");

			const otpauth = authenticator.keyuri(user.email, "TranscendenceApp", secret);
			const qrCode = await QRCode.toDataURL(otpauth);

			reply.send({
			qrCode,
			message: "2FA secret generated. Please scan QR code."
			});
		} catch (err: any) {
			server.log.error("2FA setup error:", err?.stack || err);
			return sendErrorReply(reply, err);
		}
	});

	server.post("/auth/2fa/verify", { preHandler: authenticate }, async (request, reply) => {
		try {
			const { code } = validateRequest(TwoFAVerifySchema, request.body);
			const { userId } = request.user as { userId: string };

			const user = await server.prisma.user.findUnique({
			where: { id: userId }
			});

			if (!user?.twoFASecret)
			throw BadRequestError("2FA has not been initialized");

			const isValid = authenticator.verify({
			token: code,
			secret: user.twoFASecret
			});

			if (!isValid) throw UnauthorizedError("Invalid 2FA code");

			await server.prisma.user.update({
			where: { id: userId },
			data: { twoFAEnabled: true }
			});

			reply.send({ message: "2FA enabled successfully" });

		} catch (err: any) {
			server.log.error("2FA verify error:", err);
			return sendErrorReply(reply, err);
		}
	});

	server.post("/auth/2fa/login", async (request, reply) => {
		try {
			const { code, tempToken } = validateRequest(TwoFALoginSchema, request.body);

			// Validate temp token (5 min expiration)
			const decoded = server.jwt.verify(tempToken) as { userId: string };
			const user = await server.prisma.user.findUnique({ where: { id: decoded.userId } });

			if (!user) throw NotFoundError("User not found");
			if (!user.twoFASecret) throw BadRequestError("2FA not set up");
			if (!user.twoFAEnabled) throw UnauthorizedError("2FA is not enabled for this user");

			const isValid = authenticator.verify({
			token: code,
			secret: user.twoFASecret
			});

			if (!isValid) throw UnauthorizedError("Invalid 2FA code");

			// 2FA Passed → Send real JWT cookies
			const accessToken = server.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: "15m" });
			const refreshToken = server.jwt.sign({ userId: user.id }, { expiresIn: "7d" });

			setAuthCookies(reply, accessToken, refreshToken);

			reply.send({
				message: "2FA login successful",
			});

		} catch (err: any) {
			server.log.error("2FA login error:", err);
			return sendErrorReply(reply, err);
		}
	});

	server.post("/auth/2fa/disable", { preHandler: authenticate }, async (request, reply) => {
		try {
			const { userId } = request.user as { userId: string };
			const { code } = validateRequest(TwoFADisableSchema, request.body);

			const user = await server.prisma.user.findUnique({ where: { id: userId } });
			if (!user?.twoFASecret) throw BadRequestError("2FA not set up");

			const isValid = authenticator.verify({
				token: code,
				secret: user.twoFASecret,
			});

			if (!isValid) throw UnauthorizedError("Invalid 2FA code");

			await server.prisma.user.update({
				where: { id: userId },
				data: {
					twoFAEnabled: false,
					twoFASecret: null,
				},
			});

			reply.send({ message: "2FA disabled" });
		} catch (err: any) {
			return sendErrorReply(reply, err);
		}
	});
};

export default authRoutes;
