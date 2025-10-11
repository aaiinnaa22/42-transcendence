import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { PrismaClient } from '@prisma/client';
import fastifyOauth2 from '@fastify/oauth2';
import * as jwtDecode from 'jwt-decode';

const authRoutes = async (server: FastifyInstance) => {
	// Register Google OAuth2 plugin
	server.register(fastifyOauth2, {
    name: 'googleOAuth2',
	scope: ['openid', 'email', 'profile'],
    credentials: {
		client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
    	},
      	auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/auth/google',
    callbackUri: 'http://localhost:4241/auth/google/callback',
	generateStateFunction: (_request) => 'dummy_state',
	checkStateFunction: (_request, _state) => true 
  });

  // Callback route
  server.get('/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
		server.log.info('➡️  Google callback hit');
		const tokenResponse = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		const idToken = tokenResponse.token.id_token;
		server.log.info('🧾 ID token:', idToken);

		const decoded = jwtDecode(idToken) as any; // contains email, sub (Google ID), name, picture
		server.log.info('👤 Decoded profile:', decoded);

		// Now you can upsert to Prisma
		const user = await server.prisma.user.upsert({
			where: { email: decoded.email },
			update: { lastLogin: new Date() },
			create: {
    			email: decoded.email,
    			userName: decoded.name,
    			googleId: decoded.sub,
    			avatarUrl: decoded.picture || null,
    			lastLogin: new Date(),
    			playerStats: { create: {} },
  			},
		});

      	// Sign JWT
    	const jwt = server.jwt.sign({ userId: user.id });

      	// Send response
      	reply.send({ token: jwt, user });
    } 
	catch (err) {
    	server.log.error(err);
    	reply.code(500).send({ error: 'Google OAuth failed' });
    }
  });
};

export default authRoutes;