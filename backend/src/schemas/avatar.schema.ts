import { z } from "zod";
import { avatarFilenameField, usernameField } from "../shared/utility/validation.utility.js";

export const GetAvatarSchema = z.strictObject( {
	filename: avatarFilenameField
} );

export const GetAvatarByUsernameSchema = z.strictObject( {
	username: usernameField
} );

export type GetAvatarByUsernameInput = z.infer<typeof GetAvatarByUsernameSchema>;
export type GetAvatarInput = z.infer<typeof GetAvatarSchema>;
