import { z } from "zod";
import { leaderboardPageField } from '../shared/utility/validation.utility.js';

export const GetLeaderboardPageSchema = z.strictObject({
	page: leaderboardPageField
});

export type GetLeaderboardPageInput = z.infer<typeof GetLeaderboardPageSchema>;
