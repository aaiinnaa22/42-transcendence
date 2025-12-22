const isDev = import.meta.env.DEV;

export const API_BASE_URL = import.meta.env.VITE_API_URL || (
	isDev ? 'http://localhost:4241/api' : '/api'
);
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (
	isDev ? 'ws://localhost:4241/ws' : `wss://${window.location.host}/ws`
);

export const apiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;
export const wsUrl = (endpoint: string) => `${WS_BASE_URL}${endpoint}`;
