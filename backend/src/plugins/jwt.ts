import { env } from '../config/environment.js';

import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fastifyPlugin(async (fastify) => {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error('JWT SECRET env is required');

  fastify.register(fastifyJwt, {
    secret,
    sign: { expiresIn: '1h' },
  });
});
