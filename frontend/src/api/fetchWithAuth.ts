import { apiUrl } from "./api";
import { forceLogout } from "./forceLogout";

let refreshPromise: Promise<Response> | null = null;

const retriedRequest = new Set<string>();

/**
 * @brief Used for creating a key and checking if the request was already called
 */
function requestKey(input: RequestInfo, init?: RequestInit) {
	let url = "";
	let method = "GET";

	if (typeof input === "string")
	{
		url = input;
	}
	else if (input instanceof Request)
	{
		url = input.url;
		method = input.method || method;
	}
	else
	{
		url = String(input);
	}

	if (init?.method)
	{
		method = init.method;
	}

	return `${method.toUpperCase()} ${url}`;

}

export async function fetchWithAuth(
  input: RequestInfo,
  init?: RequestInit
) {
	const key = requestKey(input, init);

  	const response = await fetch(input, {
    	...init,
    	credentials: "include",
  	});

  	if (response.status !== 401) {
    	return response;
  	}

 	if (retriedRequest.has(key)) {
		retriedRequest.clear();
		forceLogout();
		throw new Error("Session expired");
	}

  	if (!refreshPromise) {
    	refreshPromise = fetch( apiUrl('/auth/refresh'), {
      	method: "POST",
      	credentials: "include",
    	}).finally(() => {
      		refreshPromise = null;
    	});
  	}

 	const refresh = await refreshPromise;

  	if (!refresh.ok) {
		retriedRequest.clear();
    	forceLogout();
    	throw new Error("Session expired");
  	}

 	// Retry original request once
	retriedRequest.add(key);
	try {
		const retriedResponse = await fetch(input, {
			...init,
			credentials: "include",
		} as RequestInit);
		return retriedResponse;
	}
	finally {
		retriedRequest.delete(key);
	}
}
