import { z } from "zod";
import { usernameField } from "../shared/utility/validation.utility.ts";

export const MoveMessageSchema = z.object({
	type: z.literal("move"),
	dy: z.number()
		.min(-1, {message: "Movement speed too high"})
		.max(1, {message: "Movement speed too high"}),
	id: z.int()
		.min(1, {message: "Invalid paddle position"})
		.max(2, {message: "Invalid paddle position"})
		.optional()
});

// Useful for scalability in case additional types are accepted. Lets use a switch case for checking.
export const GameClientMessageSchema = z.discriminatedUnion( "type", [
	MoveMessageSchema
]);

export const GameFriendNameSchema = z.object({
	friendName: usernameField
}).loose();

export type MoveMessage = z.infer<typeof MoveMessageSchema>;
export type GameClientMessage = z.infer<typeof GameClientMessageSchema>;
export type GameFriendNameQuery = z.infer<typeof GameFriendNameSchema>;
