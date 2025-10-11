import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyOauth2 from "@fastify/oauth2";

const authRoutes = async (server: FastifyInstance) => {
  // Register Google OAuth2 plugin
  server.register(fastifyOauth2, {
    name: "googleOAuth2", // This adds server.googleOAuth2
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
  });

  // Callback route
  server.get("/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      server.log.info("➡️ Google callback hit");

      // Use the plugin to exchange the code for tokens
      const tokenResponse = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

      // Log the full response for debugging
      server.log.info("🔑 Full token response:", tokenResponse);

      // For now, just return the tokens directly to the browser
      reply.send(tokenResponse);
    } catch (err) {
      server.log.error("❌ Google OAuth failed:", err);
      reply.code(500).send({ error: "Google OAuth failed" });
    }
  });
};

export default authRoutes;