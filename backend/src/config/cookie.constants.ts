import { env } from "./environment.js";
import { CookieSerializeOptions } from "@fastify/cookie";

export const COOKIE_OPTIONS: CookieSerializeOptions = {
	path: "/",
	httpOnly: true,
	sameSite: "strict",
	secure: env.NODE_ENV === "production",
	signed: true,
};

export const ACCESS_TOKEN_MAX_AGE = 60 * 15;			// 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;	// 7 days
