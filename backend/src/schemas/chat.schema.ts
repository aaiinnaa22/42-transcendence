import { z } from "zod";
import { usernameField } from "../shared/utility/validation.utility.ts";


export const ChatUsersUsernameSchema = z.object({
	targetUsername: usernameField
});

export type ChatUsersUsernameQuery = z.infer<typeof ChatUsersUsernameSchema>;
