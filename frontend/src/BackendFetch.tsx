export function useBlockUser() {

	async function blockUser(targetUserId: string) {
		try {
			const response = await fetch (`http://localhost:4241/users/${targetUserId}/block`, {
				method: "POST",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || data.error)
					throw new Error(data.error || "Failed to block user");
			return true;
		}
		catch (err: any)
		{
			console.log("error:", err.message);
			return (false);
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
			if (!response.ok || data.error)
					throw new Error(data.error || "Failed to unblock user");
			return true;
		}
		catch (err: any)
		{
			console.log("error: ", err.message);
			return (false);
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
			if (!response.ok || data.error)
					throw new Error(data.error || "Failed send friend request");
			return true;
		}
		catch (err: any)
		{
			console.log("error: ", err.message);
			return (false);
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
			if (!response.ok || data.error)
					throw new Error(data.error || "Failed to remove friend");
			return true;
		}
		catch (err: any)
		{
			console.log("error: ", err.message);
			return (false);
		}
	}

	return {
		befriendUser,
		unfriendUser
	};
}

export async function fetchUserFromBackend(username: string)
{
	try {
		const response = await fetch (`http://localhost:4241/chat/users/${username}`, {
			method: "GET",
			credentials: "include",

		});
		const data = await response.json();
		if (!response.ok || data.error)
			throw new Error(data?.error || response.statusText || "Failed to fetch user");
		return data;
	}
	catch (err: any)
	{
		console.log("error: ", err.message);
		return null;
	}
}

export async function fetchPendingFriendRequests()
{
	try {
		const response = await fetch (`http://localhost:4241/friends/request-list`, {
			method: "GET",
			credentials: "include",

		});
		const data = await response.json();
		if (!response.ok || data.error)
			throw new Error(data?.error || response.statusText || "Failed to fetch user");
		return data;
	}
	catch (err: any)
	{
		console.log("error: ", err.message);
		return null;
	}
}

export function useAcceptFriendRequest() {
	async function acceptFriendRequest(fromUserId: string)
	{
		try {
			const response = await fetch (`http://localhost:4241/friends/accept`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({fromUserId}),
			});
			const data = await response.json();
			if (!response.ok || data.error)
				throw new Error(data?.error || response.statusText || "Failed to accept friend request");
			return true;
		}
		catch (err: any)
		{
			console.log("error: ", err.message);
			return false;
		}
	}
	async function rejectFriendRequest(fromUserId: string)
	{
		try {
			const response = await fetch (`http://localhost:4241/friends/request/${fromUserId}`, {
				method: "DELETE",
				credentials: "include",
			});
			const data = await response.json();
			if (!response.ok || data.error)
				throw new Error(data?.error || response.statusText || "Failed to reject friend request");
			return true;
		}
		catch (err: any)
		{
			console.log("error: ", err.message);
			return false;
		}
	}

	return {
		acceptFriendRequest,
		rejectFriendRequest
	};
}