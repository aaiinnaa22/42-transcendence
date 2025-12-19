import { z } from "zod";
import { idField } from "../shared/utility/validation.utility.ts";


export const FriendRequestDeleteSchema = z.object({
	id: idField
});

export type FriendRequestDeleteQuery = z.infer<typeof FriendRequestDeleteSchema>;
