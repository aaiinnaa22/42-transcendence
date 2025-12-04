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
    throw new Error("Session expired");
  }

  // Retry original request once
  return fetch(input, {
    ...init,
    credentials: "include",
  });
}
