import type { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async ( request: FastifyRequest, reply: FastifyReply ) =>
{
	// DEBUG: testing if the cookie was contained
	// console.log( "Cookies: ", request.cookies );
	// console.log( "Headers: ", request.headers );
	const access = request.cookies?.accessToken;
  	const refresh = request.cookies?.refreshToken;

	if (access) 
	{
		const unsign = request.unsignCookie(access);
		if (unsign.valid)
		{
			try 
			{
				const payload = request.server.jwt.verify(unsign.value);
				( request as any ).user = payload;
				return;
			} 
			catch (err) 
			{
				request.log.debug("Access token invalid or expired");
			}
		}
	}

	// ADD: check for refresh tokens
	// ADD2: issuing new tokens
	if (!refresh) 
	{
    	reply.code(401).send({ error: "Unauthorized" });
    	return;
  	}
	const unsignRefresh = request.unsignCookie(refresh);
	if (!unsignRefresh.valid) 
	{
		reply.code(401).send({ error: "Invalid refresh token" });
		return;
	}

	
	try 
	{
		const decoded = request.server.jwt.verify(unsignRefresh.value) as { userId: string };

		const user = await request.server.prisma.user.findUnique({
		where: { id: decoded.userId },
		});

		if (!user) {
			reply.clearCookie("accessToken", { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", signed: true });
			reply.clearCookie("refreshToken", { path: "/", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", signed: true });
			reply.code(401).send({ error: "User not found" });
			return;
		}

		const newAccess = request.server.jwt.sign
		(
			{ userId: user.id, email: user.email },
			{ expiresIn: "15m" }
		);

		const newRefresh = request.server.jwt.sign
		(
			{ userId: user.id },
			{ expiresIn: "7d" }
		);

		reply
			.setCookie("accessToken", newAccess, {
				path: "/",
				httpOnly: true,
				sameSite: "strict",
				secure: process.env.NODE_ENV === "production",
				signed: true,
				maxAge: 60 * 15,
			})
			.setCookie("refreshToken", newRefresh, {
				path: "/",
				httpOnly: true,
				sameSite: "strict",
				secure: process.env.NODE_ENV === "production",
				signed: true,
				maxAge: 60 * 60 * 24 * 7,
			});

		request.user = { userId: user.id, email: user.email };
		return;
	} 
	catch (err) 
	{
		request.log.error( "JWT verify failed" );
		reply.code(401).send({ error: "Unauthorized" });
	}
};
