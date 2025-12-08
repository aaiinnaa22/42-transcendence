import { z } from "zod";
import { usernameField } from "../shared/utility/validation.utility.ts";

export const GetStatsUsernameSchema = z.strictObject({
	username: usernameField
});

export type GetStatsUsernameInput = z.infer<typeof GetStatsUsernameSchema>;
