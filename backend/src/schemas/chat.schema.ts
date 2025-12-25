import { z } from "zod";
import { idField, usernameField } from "../shared/utility/validation.utility.js";


export const ChatUsersUsernameSchema = z.object( {
	username: usernameField
} );

export const ChatDirectMessageSchema = z.object( {
	type: z.literal( "dm" ),
	to: idField,
	message: z.string.min( 1 ).max( 600 )
} );

export const ChatInviteMessageSchema = z.object( {
	type: z.literal( "invite" ),
	to: idField
} );

export const ChatClientMessageSchema = z.discriminatedUnion( "type", [
	ChatDirectMessageSchema,
	ChatInviteMessageSchema
] );

export type ChatUsersUsernameQuery = z.infer<typeof ChatUsersUsernameSchema>;
export type ChatDirectMessageInput = z.infer<typeof ChatDirectMessageSchema>;
export type ChatInviteMessageInput = z.infer<typeof ChatInviteMessageSchema>;
export type ChatClientessageInput = z.infer<typeof ChatClientMessageSchema>;
