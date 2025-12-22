
/**
 * @brief Parses avatar entries for a user and constructs the avatar address
 * @param avatar The avatar filename stored in the user database
 * @param avatarType The type of the avatar - local, provider or null
 * @returns URL to the avatar
 */
export function getAvatarUrl( avatar: string | null, avatarType: string | null ): string
{
	if ( avatar )
	{
		if ( avatarType === "local" ) return `/avatars/${avatar}`;
		if ( avatarType === "provider" ) return avatar;
	}
	return "/avatars/00000000-0000-0000-0000-000000000000.webp";
};
