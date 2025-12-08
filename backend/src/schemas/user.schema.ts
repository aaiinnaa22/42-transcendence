import { z } from "zod";
import {
	emailField,
	usernameField,
	passwordField,
	avatarUrlField
} from "../shared/utility/validation.utility.ts";

// Export user route schemas

export const UpdateUserSchema = z.object({
	username: usernameField.optional(),
	email: emailField.optional(),
	password: passwordField.optional(),
	avatar: avatarUrlField.optional()
})
.refine(
	(data) => Object.values(data).some( value => value !== undefined ),
	{ message: "At least one field must be provided" }
);

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
