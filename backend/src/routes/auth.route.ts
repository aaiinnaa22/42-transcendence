import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2 from "@fastify/oauth2";
import { OAuth2Client } from "google-auth-library";

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

      const { email, name, picture, sub: googleId } = payload;
      server.log.info(`Step 3: Extracted user info: ${email} (${name})`);

      if (!server.prisma) {
        server.log.error("Prisma plugin not registered");
        throw new Error("Prisma not available on server");
      }

      server.log.info("Step 4: Upserting user in database...");
      const user = await server.prisma.user.upsert({
        where: { email },
        update: {
          googleId,
          username: name || null,
          avatarUrl: picture || null,
          lastLogin: new Date(),
        },
        create: {
          googleId,
          email,
          username: name || null,
          avatarUrl: picture || null,
          lastLogin: new Date(),
        },
      });
      server.log.info(`Step 4 DONE: User upserted (ID: ${user.id})`);

      // jwt creation with JWT plugin
      server.log.info("Step 5: Signing app JWT...");
      const appToken = server.jwt.sign({ userId: user.id, email: user.email });
      server.log.info("Step 5 DONE: JWT created");

      // Return session token
      reply.send({
        message: "Login successful",
        user,
        appToken,
      });

    } catch (err: any) {
      server.log.error(`Google OAuth failed at ${err?.stack || err}`);
      reply.code(500).send({ error: "Google OAuth failed", details: err?.message });
    }
  });
};

export default authRoutes;