import { z } from "zod";
import { idField } from "../shared/utility/validation.utility.js";

/// Parameter schemas

export const UserIdParamSchema = z.object( {
	userId: idField
} );

export const FriendRequestDeleteSchema = z.object( {
	userId: idField
} );

/// Body schemas

export const FriendRequestCreateSchema = z.object( {
	toUserId: idField
} );
export const FriendRequestAcceptSchema = z.object( {
	fromUserId: idField
} );

export type UserIdParamInput = z.infer<typeof UserIdParamSchema>;
export type FriendRequestDeleteInput = z.infer<typeof FriendRequestDeleteSchema>;
export type FriendRequestCreateInput = z.infer<typeof FriendRequestCreateSchema>;
export type FriendRequestAcceptInput = z.infer<typeof FriendRequestAcceptSchema>;
