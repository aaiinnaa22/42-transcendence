import { apiUrl } from "./api";

export function forceLogout() {
	fetch(apiUrl("/auth/logout"), {
		method: "POST",
		credentials: "include",
	}).catch(() => {
	});

	window.location.replace("/welcome");
}
