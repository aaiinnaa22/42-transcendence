
export function forceLogout() {
	fetch("http://localhost:4241/auth/logout", {
		method: "POST",
		credentials: "include",
	}).catch(() => {
	});

	window.location.replace("/welcome");
}