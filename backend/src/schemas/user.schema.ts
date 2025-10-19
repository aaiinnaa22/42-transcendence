const userRequestSchema = {
	type: 'object',
	required: [ 'id' ],
	properties: {
		id: { type: 'string' }
	},
	additionalProperties: false
};

const userResponseSchema = {
	type: 'object',
	required: [ 'id' ],
	properties: {
		id: { type: 'string' },
		email: { type: ['string', 'null'], format: 'email' },
		username: { type: ['string', 'null'] },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' },
		lastLogin: { type: ['string', 'null'], format: 'date-time' },
	},
	additionalProperties: false
};

export default { userRequestSchema, userResponseSchema };
