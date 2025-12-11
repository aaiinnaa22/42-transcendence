import type { WebSocket } from "@fastify/websocket";

export const onlineUsers = new Map<string, Set<WebSocket>>();
