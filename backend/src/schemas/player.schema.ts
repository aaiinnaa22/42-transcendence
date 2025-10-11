const playerRequestSchema = {
	type: 'object',
	required: 'id',
	properties: {
		id: { type: 'string' }
	},
	additionalProperties: false
};

const playerResponseSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		userId: { type: 'string' },
		wins: { type: 'integer' },
		losses: { type: 'integer' },
		playedGames: { type: 'integer' },
		eloRating: { type: 'integer' }
	},
	additionalProperties: false
};

export default { playerRequestSchema, playerResponseSchema };
