import { z } from "zod";
import { usernameField } from "../shared/utility/validation.utility.js";


export const ChatUsersUsernameSchema = z.object( {
	username: usernameField
} );

export type ChatUsersUsernameQuery = z.infer<typeof ChatUsersUsernameSchema>;
