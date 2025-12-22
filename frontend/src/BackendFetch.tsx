import { apiUrl } from "./api/api";
import { fetchWithAuth } from "./api/fetchWithAuth";

export function useBlockUser() {

	async function blockUser(targetUserId: string): Promise<boolean>
	{
		try
		{
			const response = await fetchWithAuth( apiUrl( `/friends/block/${targetUserId}` ), {
				method: "POST",
				credentials: "include"
			});

			const data = await response.json();
			if ( !response.ok || data.error ) return false; // Logged elsewhere
			return true;
		}
		catch
		{
			return false;
		}
	}

	async function unblockUser(targetUserId: string): Promise<boolean>
	{
		try
		{
			const response = await fetchWithAuth( apiUrl(`/friends/block/${targetUserId}`), {
				method: "DELETE",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || data.error) return false;
			return true;
		}
		catch
		{
			return false;
		}
	}

	return {
		blockUser,
		unblockUser
	};
}

export function useBefriendUser() {
	async function befriendUser(toUserId: string): Promise<boolean>
	{
		try
		{
			const response = await fetchWithAuth ( apiUrl("/friends/requests"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({toUserId}),
			});

			const data = await response.json();
			if (!response.ok || data.error) return false;
			return true;
		}
		catch
		{
			return false;
		}
	}

	async function unfriendUser(friendId: string): Promise<boolean>
	{
		try
		{
			const response = await fetchWithAuth ( apiUrl(`/friends/${friendId}`), {
				method: "DELETE",
				credentials: "include"
			});

			const data = await response.json();
			if (!response.ok || data.error) return false;
			return true;
		}
		catch
		{
			return false;
		}
	}

	return {
		befriendUser,
		unfriendUser
	};
}

export async function fetchUserFromBackend(username: string)
{
	try
	{
		const response = await fetchWithAuth( apiUrl(`/chat/users/${username}`), {
			method: "GET",
			credentials: "include",
		});
		const data = await response.json();
		if (!response.ok || data.error) return null;
		return data;
	}
	catch
	{
		return null;
	}
}

export async function fetchPendingFriendRequests()
{
	try
	{
		const response = await fetchWithAuth( apiUrl("/friends/requests"), {
			method: "GET",
			credentials: "include",
		});
		const data = await response.json();
		if (!response.ok || data.error) return null;
		return data;
	}
	catch
	{
		return null;
	}
}

export function useAcceptFriendRequest() {
	async function acceptFriendRequest(fromUserId: string): Promise<boolean>
	{
		try {
			// Had inconsistent passing of data
			const response = await fetchWithAuth( apiUrl("/friends/requests/accept"), {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({fromUserId}),
			});
			const data = await response.json();
			if (!response.ok || data.error) return false;
			return true;
		}
		catch
		{
			return false;
		}
	}

	async function rejectFriendRequest(fromUserId: string): Promise<boolean>
	{
		try {
			const response = await fetchWithAuth( apiUrl(`/friends/requests/${fromUserId}`), {
				method: "DELETE",
				credentials: "include",
			});
			const data = await response.json();
			if (!response.ok || data.error) return false;
			return true;
		}
		catch
		{
			return false;
		}
	}

	return {
		acceptFriendRequest,
		rejectFriendRequest
	};
}
