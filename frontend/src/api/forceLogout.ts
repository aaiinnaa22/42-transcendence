import { apiUrl } from "./api";

export async function forceLogout()
{
	try
	{
		await fetch(apiUrl("/auth/logout"), {
			method: "POST",
			credentials: "include",
		});
	}
	catch
	{
		// Do nothing
	}
	finally
	{
		if (!window.location.pathname.startsWith("/welcome"))
			window.location.replace("/welcome");
	}
}
