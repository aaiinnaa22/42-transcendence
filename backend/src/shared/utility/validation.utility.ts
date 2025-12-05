import { z } from "zod";
import { BadRequestError } from "./error.utility.ts";

/**
 * NOTE: The following requests MUST be validated by Zod
 * 		request.body
 * 		request.params
 * 		request.query
 *		request.headers
 */

export const emailField = z.email({message: "Invalid email format"})
	.trim()
	.min(6, {message: "Email too short"})
	.max(255, {message: "Emmail too long"})
	.toLowerCase();

export const usernameField = z.string()
	.min(2, {message: "Username too short"})
	.max(20, {message: "Username too long"})
	.regex(
		/^[a-zA-Z0-9_-]+( [a-zA-Z0-9_-]+)*$/,
		{message: "Username may only contain letters, numbers, hyphens, underscores and single spaces between words"}
	)
	.refine(
		(ch) => !ch.startsWith(" ") && !ch.endsWith(" "),
		{message: "Username may not have leading or trailing whitespaces"}
	)
	.refine(
		(ch) => !/\s{2,}/.test(ch),
		{message: "Username may not contain consecutive spaces"}
	);

export const passwordField = z.string()
	.min(5, "Password must be at least 5 characters long")
	.max(128, "Password too long")
	.regex(/[a-z]/, {message: "Password must include at least one lowercase character"})
	.regex(/[A-Z]/, {message: "Password must include at least one uppercase character"})
	.regex(/[0-9]/, {message: "Password must include at least one digit"});

export const twoFACodeField = z.string()
	.length(6, {message: "2FA code must be 6 digits long"})
	.regex(/^\d{6}$/, {message: "2FA code must be numeric"});

export const avatarFilenameField = z.string()
	.refine(
		(value) => value.toLowerCase().endsWith(".webp"),
		{message: "Filename must have .webp extension"}
	)
	.refine(
		(value) => {
			const filenameUuid = value.slice(0, -5);
			return z.uuid({version: "v4"}).safeParse(filenameUuid).success;
		},
		{message: "Filename must contain a valid UUID"}
	);

export const avatarUrlField = z.url({message: "Avatar must be a valid URL"})
	.max(512, {message: "Avatar URL too long"});

export const leaderboardPageField = z.string()
	.regex(/^\d+$/, {message: "Page is not a positive number"})
	.transform(Number)
	.refine((num) => num >= 1 && num <= 10, {message: "Page must be between 1 and 10"});


/**
 * @brief Validates request data against a Zod schema
 * @param schema Zod schema to validate
 * @param data Data to validate (e.g request.body, request.params, request.query)
 * @returns Parsed and validated data
 * @throws BadRequestError with detailed error message
 */
export const validateRequest = <Schema extends z.ZodTypeAny>(schema: Schema, data: unknown): z.infer<Schema> => {
	const result = schema.safeParse(data);

	// Unsuccessful parse, gather error messages
	if (!result.success)
	{
		const errors = result.error.issues
			.map(error => `${error.path.join(".")}: ${error.message}`)
			.join("; ");

		throw BadRequestError(errors);
	}

	return result.data;
};

// TODO: Remove the old functions below

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
