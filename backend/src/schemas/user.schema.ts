const createUserSchema = {
	type: 'object',
	required: [ 'googleId', 'email' ],
	properties: {
		googleId: { type: 'string' },
		email: { type: 'string', format: 'email' },
		username: { type: ['string', 'null'] },
		avatarUrl: { type: ['string', 'null'] }
	},
	additionalProperties: false
};

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
	required: [ 'id', 'googleId', 'email' ],
	properties: {
		id: { type: 'string' },
		googleId: { type: 'string' },
		email: { type: 'string', format: 'email' },
		username: { type: ['string', 'null'] },
		avatarUrl: { type: ['string', 'null'] },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' },
		lastLogin: { type: ['string', 'null'], format: 'date-time' },
	},
	additionalProperties: false
};

export default { createUserSchema, userRequestSchema, userResponseSchema };
