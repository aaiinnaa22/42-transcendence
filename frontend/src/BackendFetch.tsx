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

export function useBefriendUser() {
	async function befriendUser(toUserId: string) {
		try {
			const response = await fetch (`http://localhost:4241/friends/request`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({toUserId}),
			});

			const data = await response.json();
			if (!response.ok || !data.ok)
					throw new Error(data.error || "Failed send friend request");
			return true;
		}
		catch (err: any)
		{
			console.log(err.message);
		}
	}

	async function unfriendUser(friendId: string)
	{
		try {
			const response = await fetch (`http://localhost:4241/friends/${friendId}`, {
				method: "DELETE",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || !data.ok)
					throw new Error(data.error || "Failed to remove friend");
			return true;
		}
		catch (err: any)
		{
			console.log(err.message);
		}
	}

	return {
		befriendUser,
		unfriendUser
	};
}