export function useBlockUser() {

	async function blockUser(targetUserId: string) {
		try {
			const response = await fetch (`http://localhost:4241/users/${targetUserId}/block`, {
				method: "POST",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || !data.ok)
					throw new Error(data.error || "Failed to block user");
			return true;
		}
		catch (err: any)
		{
			console.log(err.message);
		}
	}

	async function unblockUser(targetUserId: string)
	{
		try {
			const response = await fetch (`http://localhost:4241/users/${targetUserId}/block`, {
				method: "DELETE",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || !data.ok)
					throw new Error(data.error || "Failed to unblock user");
			return true;
		}
		catch (err: any)
		{
			console.log(err.message);
		}
	}

	return {
		blockUser,
		unblockUser
	};
}