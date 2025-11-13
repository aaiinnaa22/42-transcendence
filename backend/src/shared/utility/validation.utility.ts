/**
 * @brief Checks the strength of the password.
 * Requires at least one digit, one lowercase and one uppercase letter.
 * Minimum length is set to five.
 * @param password
 * @returns boolean
 */
export const checkPasswordStrength = ( password: string ): boolean =>
{
	const passwordRegex: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{5,}$/;

	const valid: boolean = passwordRegex.test( password );

	return valid;
};

/**
 * @brief Confirms the validity of the email format.
 * Does not validate whether or not the email address exists.
 * @param email
 * @returns boolean
 */
export const checkEmailFormat = ( email: string ): boolean =>
{
	const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	const valid: boolean = emailRegex.test( email );

	return valid;
};
