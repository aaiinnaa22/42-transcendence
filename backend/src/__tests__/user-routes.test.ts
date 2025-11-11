import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import jwtPlugin from '../plugins/jwt.ts';
import userRoutes from '../routes/user.route.ts';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Integration-style tests for user routes using cookie-based auth

describe('User routes (integration via server.inject + signed cookie)', () => {
  const JWT_SECRET = 'test_jwt_secret';
  const COOKIE_SECRET = 'test_cookie_secret';

  let server: ReturnType<typeof Fastify>;

  // Mocked Prisma API used by the routes
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    credential: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    playerStats: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn: any) => {
      // Provide tx object with the same mocked sub-APIs
      return fn({
        user: mockPrisma.user,
        credential: mockPrisma.credential,
        playerStats: mockPrisma.playerStats,
      });
    }),
  } as any;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    server = Fastify({ logger: false });

    await server.register(fastifyCookie, {
      secret: COOKIE_SECRET,
      parseOptions: {
        sameSite: 'strict',
        httpOnly: true,
        secure: false,
      },
    });
    await server.register(jwtPlugin);

    // Decorate mocked prisma instead of registering the real prisma plugin
    server.decorate('prisma', mockPrisma);

    await server.register(userRoutes);

    // Test helper route to set a signed accessToken cookie for a fixed userId
    server.get('/__test/login', async (_req: any, reply: any) => {
      const token = server.jwt.sign({ userId: 'test-user-id' });
      reply
        .setCookie('accessToken', token, {
          path: '/',
          signed: true,
          httpOnly: true,
          sameSite: 'strict',
          secure: false,
        })
        .send({ ok: true });
    });

    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sanity: userRoutes is a function', () => {
    expect(typeof userRoutes).toBe('function');
  });

  it('sanity: /users/profile route is registered (expect 401 without auth)', async () => {
    const res = await server.inject({ method: 'GET', url: '/users/me' });
    // For a registered protected route we expect 401; if 404, the route might not be registered
    expect([401]).toContain(res.statusCode);
  });

  it('sanity: router includes GET/PUT/DELETE /users/me', () => {
    const tree = server.printRoutes();
    // Fastify prints a tree like: "users/me (GET, HEAD, PUT, DELETE)"
    expect(tree).toContain('users/me');
    expect(/users\/me \([^)]*GET[^)]*PUT[^)]*DELETE[^)]*\)/.test(tree)).toBe(true);
  });

  const getAuthCookie = async () => {
    const loginRes = await server.inject({ method: 'GET', url: '/__test/login' });
    const setCookieHeader = loginRes.headers['set-cookie'];
    const first = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    if (!first) throw new Error('No Set-Cookie header from /__test/login');
    // Convert Set-Cookie to Cookie header by taking the name=value portion
    const cookieHeader = first.split(';')[0];
    return cookieHeader; // e.g., "accessToken=s%3A..."
  };

  it('GET /users/profile returns current user with stats', async () => {
    const user = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'tester',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      playerStats: { userId: 'test-user-id', wins: 1, losses: 2, playedGames: 3, eloRating: 1200 },
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const cookie = await getAuthCookie();
    const res = await server.inject({ method: 'GET', url: '/users/me', headers: { cookie } });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.username).toBe('tester');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      include: { playerStats: true },
    });
  });

  it('PUT /users/profile updates username and password (upserts credential)', async () => {
    const updatedUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'new_name',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      playerStats: { userId: 'test-user-id', wins: 1, losses: 2, playedGames: 3, eloRating: 1200 },
    };
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const cookie = await getAuthCookie();
    const res = await server.inject({
      method: 'PUT',
      url: '/users/me',
      headers: { cookie },
      payload: { username: 'new_name', password: 'secret123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.username).toBe('new_name');

    // Ensure upsert and update were called appropriately
    expect(mockPrisma.credential.upsert).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'test-user-id' },
      data: { username: 'new_name' },
      include: { playerStats: true },
    });
  });

  it('DELETE /users/profile deletes user and related data', async () => {
    mockPrisma.credential.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.playerStats.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.user.delete.mockResolvedValue({ id: 'test-user-id' });

    const cookie = await getAuthCookie();
    const res = await server.inject({ method: 'DELETE', url: '/users/me', headers: { cookie } });

    expect(res.statusCode).toBe(200);
    expect(mockPrisma.credential.deleteMany).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(mockPrisma.playerStats.deleteMany).toHaveBeenCalledWith({ where: { userId: 'test-user-id' } });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'test-user-id' } });
  });
});
