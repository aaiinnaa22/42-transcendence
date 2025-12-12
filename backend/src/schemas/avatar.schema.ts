import { z } from "zod";
import { avatarFilenameField } from '../shared/utility/validation.utility.js';

export const GetAvatarSchema = z.strictObject({
	filename: avatarFilenameField
});

export type GetAvatarInput = z.infer<typeof GetAvatarSchema>;
