import { useEffect, useState } from "react";

export function getCurrentUser()
{
	const [username, setUsername] = useState<string>("");
	const [profilePic, setProfilePic] = useState<string>("");
	const [error, setError] = useState<string>("");
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const response = await fetch("http://localhost:4241/users/me", {
					method: "GET",
					credentials: "include"
				});
				if (!response.ok)
					throw new Error("failed to fetch user");
				const data = await response.json();
				setUsername(data.username || "User");

				if (data.avatarType === "provider")
					setProfilePic(profilePic || ""); //?
				else if (data.avatarType === "local")
				{
					const avatarResponse = await fetch("http://localhost:4241/users/avatar",
						{
							method: "GET",
							credentials: "include"
						}
					);

					if (avatarResponse.ok)
					{
						const avatarBlob = await avatarResponse.blob();
						const avatarUrl = URL.createObjectURL(avatarBlob);
						setProfilePic(avatarUrl);
					}
				}
				if (profilePic && profilePic.startsWith("blob:"))
					URL.revokeObjectURL(profilePic);

			}
			catch (err: any)
			{
				setError(err.message || "Unable to load user info");
			}
		};
		fetchCurrentUser();
	}, []);
	return {username, profilePic, error};
}