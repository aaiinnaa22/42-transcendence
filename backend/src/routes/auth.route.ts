import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2 from "@fastify/oauth2";
import { OAuth2Client } from "google-auth-library";
import { authenticate } from "../shared/middleware/auth.middleware.ts";
import bcrypt from "bcrypt";

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
    generateStateFunction: () => undefined,
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
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      server.log.info("Step 2 DONE: ID token verified");
      const payload = ticket.getPayload();

      if (!payload) {
        server.log.error("No payload in verified ID token");
        return reply.code(400).send({ error: "Invalid ID token" });
      }

      const providerSource = "google";
      const { email, name, sub: providerId } = payload;
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
        if (await server.prisma.user.findUnique({ where:{ email }})) {
            // TODO: redirect to login page
            server.log.info("Step 4.b: Email from the provider already in use...");
            return reply.code(400).send({ error: "User with that email already exists" });
        } else {
            server.log.info("Step 4.c: No existing records on user, creating new account...")
            user = await server.prisma.user.create({
                data: {
                    email,
                    username: name,
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
      const appToken = server.jwt.sign({ userId: user.id, email: user.email });
      server.log.info("Step 5 DONE: JWT created");

      // Return session token
      // TODO: Setup JWT renew token
      reply.send({
        message: "Login successful",
        user,
        appToken,
      });

    } catch (err: any) {
      server.log.error(`Google OAuth failed at ${err?.stack || err}`);
      // TODO: adjust contents of err
      reply.code(500).send({ error: "Google OAuth failed", details: err?.message });
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

  // Logout endpoint (client discards token)
  server.post("/auth/logout", { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ message: "Logged out successfully" });
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
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await server.prisma.user.create({
        data: {
          email,
          username: username || null,
          googleId: `local-${Date.now()}`, // Temporary unique ID for local users
          password: hashedPassword,
        },
        include: { playerStats: true }
      });

      // Generate JWT
      const appToken = server.jwt.sign({ userId: user.id, email: user.email });

      reply.send({
        message: "Registration successful",
        user,
        appToken,
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

      // Verify password
      if (!user.password) {
        return reply.code(401).send({ error: "Invalid password" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({ error: "Invalid password" });
      }

      // Update last login
      await server.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate JWT
      const appToken = server.jwt.sign({ userId: user.id, email: user.email });

      reply.send({
        message: "Login successful",
        user,
        appToken,
      });

    } catch (err: any) {
      server.log.error(`Login failed: ${err?.message}`);
      reply.code(500).send({ error: "Login failed" });
    }
  });
};

export default authRoutes;
