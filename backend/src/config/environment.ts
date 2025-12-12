import * as dotenv from "dotenv";
dotenv.config();

import { cleanEnv, str, port, num, host } from "envalid";

// Environmental variables to validate
const backendValidators = {
	NODE_ENV: str({ choices: ["development", "production", "test"] }),

	// Prisma
	DATABASE_URL: str({
		desc: "URL to the database file used by Prisma",
		example: "file:./database.db",
		devDefault: "file:./dev.db"
	}),

	// Server config
	PUBLIC_DOMAIN: str({
		desc: "Public domain or IP where NGINX serves the application",
		example: "domain.com",
		devDefault: "localhost"
	}),
	HOSTNAME: host({
		desc: "Internal hostname for container communication",
		devDefault: process.env.HOST || "0.0.0.0"
	}),
	PORT: port({
		desc: "Port of the backend server",
		devDefault: 4241,
		default: 4241
	}),
	TZ: str({
		desc: "Timezone for server logs",
		devDefault: "Europe/Helsinki",
		default: "UTC"
	}),

	// Frontend config information
	FRONTEND_HOST: host({
		desc: "Frontend container hostname or service name",
		devDefault: "frontend"
	}),
	FRONTEND_PORT: port({
		desc: "Port of the frontend container",
		devDefault: 8080
	}),

	// Auth layer
	JWT_SECRET: str({ desc: "Secret for JWT" }),
	COOKIE_SECRET: str({ desc: "Secret for cookies" }),
	GOOGLE_CLIENT_SECRET: str({ desc: "Client secret required by the Google provider" }),

	GOOGLE_CLIENT_ID: str({ desc: "URL of the Client ID provided by Google" }),

	SALT_ROUNDS: num({
		devDefault: 10,
		default: 10
	})
};

// Environment validation
const _env = cleanEnv(process.env, backendValidators);

// Which protocols to apply
const isProduction = _env.NODE_ENV === "production";
const HTTP_PROTO = isProduction ? "https://" : "http://";
const WS_PROTO = isProduction ? "wss://" : "ws://";

// Constructed URLs
const PUBLIC_URL = isProduction
	? `${HTTP_PROTO}${_env.PUBLIC_DOMAIN}`
	: `${HTTP_PROTO}${_env.PUBLIC_DOMAIN}:${_env.PORT}`;

const FRONTEND_URL = isProduction
	? `${HTTP_PROTO}${_env.PUBLIC_DOMAIN}`
	: `${HTTP_PROTO}${_env.PUBLIC_DOMAIN}:${_env.FRONTEND_PORT}`;

const GOOGLE_CALLBACK_URL = `${PUBLIC_URL}/auth/google/callback`;
const CLIENT_REDIRECT_URL = `${FRONTEND_URL}/home`;
const CLIENT_LOGIN_REDIRECT_URL = `${PUBLIC_URL}/login`;

// Export the validated environment
export const env = {
	..._env,
	HTTP_PROTO,
	WS_PROTO,
	PUBLIC_URL,
	GOOGLE_CALLBACK_URL,
	CLIENT_REDIRECT_URL,
	CLIENT_LOGIN_REDIRECT_URL
} as const;
