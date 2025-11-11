import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { OAuth2Client } from "google-auth-library";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import bcrypt from "bcrypt";

//TO DO: redirecting the user back to the client 

// Augment Fastify instance with oauth2 namespace added by the plugin
declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply
    .setCookie('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      maxAge: 60 * 15, // 15 min
    })
    .setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

const authRoutes = async (server: FastifyInstance) => {
  server.register(fastifyOauth2, {
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
    generateStateFunction: () => Math.random().toString(36).slice(2),
    checkStateFunction: () => true,
  });

  // Callback route
  server.get("/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      server.log.info("Step 1: Exchanging code for tokens...");

      // Use the plugin to exchange the code for tokens
      const tokenResponse = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      server.log.info("Step 1 DONE: Got token response");
      const { token } = tokenResponse;
      if (!token) {
        server.log.error("Missing token object");
        throw new Error("Missing token object");
      }
      const idToken = token.id_token;
      if (!idToken) {
        server.log.error("Missing id_token");
        return reply.code(400).send({ error: "Missing ID token" });
      }

      server.log.info("Step 2: Verifying ID token...");
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });
      server.log.info("Step 2 DONE: ID token verified");
      const payload = ticket.getPayload();

      if (!payload) {
        server.log.error("No payload in verified ID token");
        return reply.code(400).send({ error: "Invalid ID token" });
      }

      const providerSource = "google";
      const { email, name, sub: providerId } = payload;
      if (!email) {
        server.log.error("Provider did not return an email address");
        return reply.code(400).send({ error: "Email not provided by provider" });
      }
      const verifiedEmail: string = email;
      server.log.info(`Step 3: Extracted user info: ${email} (${name})`);

      if (!server.prisma) {
        server.log.error("Prisma plugin not registered");
        throw new Error("Prisma not available on server");
      }

      server.log.info("Step 4: Checking for existing provider info...");
      const existingProvider = await server.prisma.provider.findUnique({
        where: {
            providerSource_providerId : { providerSource, providerId }
        },
        include: { user: true },
      });

      let user: any = null;

      // For existing users the email should've been set during the initial Oauth login or account registration
      if (existingProvider?.user) {
        server.log.info("Step 4.a: User exists, updating login time...");
        user = await server.prisma.user.update({
            where: { id: existingProvider?.user!.id },
            data: {
                lastLogin: new Date(),
            }
        });
      } else {
    if (await server.prisma.user.findUnique({ where:{ email: verifiedEmail }})) {
            // TODO: redirect to login page
            server.log.info("Step 4.b: Email from the provider already in use...");
            return reply.code(400).send({ error: "User with that email already exists" });
        } else {
            server.log.info("Step 4.c: No existing records on user, creating new account...")
            user = await server.prisma.user.create({
                data: {
          email: verifiedEmail,
          username: name ?? null,
                    lastLogin: new Date(),
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
            });
        }
      }

      server.log.info(`Step 4 DONE: User upserted (ID: ${user.id})`);

      // jwt creation with JWT plugin
      server.log.info("Step 5: Signing app JWT...");
      const accessToken = server.jwt.sign({ userId: user.id, email: user.email }, {expiresIn: '15m'} );
      const refreshToken = server.jwt.sign({userId: user.id}, {expiresIn: '7d'});
      setAuthCookies(reply, accessToken, refreshToken);
      server.log.info("Step 5 DONE: JWT created");

      //NEW: redirect from google auth
      const clientRedirectUrl = process.env.CLIENT_REDIRECT_URL!;
      server.log.info(`Step 6: Redirecting to ${clientRedirectUrl}`);
      return reply.redirect(clientRedirectUrl);

    } catch (err: any) {
      server.log.error(`Google OAuth failed at ${err?.stack || err}`);
      reply.code(500).send({ error: "Google OAuth failed" });
    }
  });

  // Get current user info (protected route)
  server.get("/auth/me", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as { userId: string };

      const user = await server.prisma.user.findUnique({
        where: { id: userId },
        include: { playerStats: true }
      });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      reply.send(user);
    } catch (err: any) {
      server.log.error(`Get user failed: ${err?.message}`);
      reply.code(500).send({ error: "Failed to get user info" });
    }
  });

  // Logout endpoint (now it clears cookies)
  server.post("/auth/logout", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply
      .clearCookie('accessToken', { path: '/' })
      .clearCookie('refreshToken', { path: '/' })
      .send({ message: "Logged out successfully" });
  });

  // Register with email/password
  server.post("/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, username } = request.body as {
        email: string;
        password: string;
        username?: string;
      };

      // Check if user already exists
      const existingUser = await server.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.code(400).send({ error: "User already exists" });
      }

      // Hash password
      const salt_rounds = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS, 10) : 10;
      const hashedPassword = await bcrypt.hash(password, salt_rounds);

      // Create user
      const user = await server.prisma.user.create({
        data: {
          email,
          username: username || null,
          lastLogin: new Date(),
          playerStats: { create: {} },
          credential: { create: {
            password: hashedPassword,
          }}
        }
      });

      // Generate JWT (access and refresh tokens)
      const accessToken = server.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '15m' });
      const refreshToken = server.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      setAuthCookies(reply, accessToken, refreshToken);

      reply.send({
        message: "Registration successful",
        user,
      });

    } catch (err: any) {
      server.log.error(`Registration failed: ${err?.message}`);
      reply.code(500).send({ error: "Registration failed" });
    }
  });

  // Login with email/password
  server.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };

      // Find user
      const user = await server.prisma.user.findUnique({
        where: { email },
        include: { playerStats: true }
      });

      if (!user) {
        return reply.code(401).send({ error: "Invalid user" });
      }

      const existingCredential = await server.prisma.credential.findUnique({
        where: { userId: user.id },
        select: { password: true },
       });

      // Verify password
      if (!existingCredential?.password) {
        return reply.code(401).send({ error: "Invalid password" });
      }

      const isValidPassword = await bcrypt.compare(password, existingCredential.password);
      if (!isValidPassword) {
        return reply.code(401).send({ error: "Invalid password" });
      }

      // Update last login
      await server.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate JWT (access and refresh)
      const accessToken = server.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '15m' });
      const refreshToken = server.jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      setAuthCookies(reply, accessToken, refreshToken);

      reply.send({
        message: "Login successful",
        user,
      });
    } catch (err: any) {
      server.log.error(`Login failed: ${err?.message}`);
      reply.code(500).send({ error: "Login failed" });
    }
  });
  // TO DO: /auth/refresh route
  server.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signed = request.cookies.refreshToken;
      if (!signed) return reply.code(401).send({ error: 'No refresh token' });

      const unsign = request.unsignCookie(signed);
      if (!unsign.valid) return reply.code(401).send({ error: 'Invalid cookie signature' });

      const decoded = server.jwt.verify(unsign.value) as { userId: string };
      const user = await server.prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return reply.code(404).send({ error: 'User not found' });

      const newAccess = server.jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '15m' });
      const newRefresh = server.jwt.sign({ userId: user.id }, { expiresIn: '7d' });
      setAuthCookies(reply, newAccess, newRefresh);

      reply.send({ message: 'Token refreshed' });
    } catch (err: any){
      server.log.error(`Refresh failed: ${err.message}`);
      reply.code(401).send({ error: 'Invalid refresh token' })
    }
  })
};

export default authRoutes;
