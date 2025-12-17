import { forceLogout } from "./forceLogout";

let refreshPromise: Promise<Response> | null = null;

export async function fetchWithAuth(
  input: RequestInfo,
  init?: RequestInit
) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.status !== 401) {
    return response;
  }

  if ((init as any)._retry) {
		forceLogout();
		throw new Error("Session expired");
	}

  if (!refreshPromise) {
    refreshPromise = fetch("http://localhost:4241/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refreshPromise = null;
    });
  }

  const refresh = await refreshPromise;

  if (!refresh.ok) {
    forceLogout();
    throw new Error("Session expired");
  }

  // Retry original request once
  return fetch(input, {
		...init,
		credentials: "include",
		_retry: true,
	} as RequestInit);
}
