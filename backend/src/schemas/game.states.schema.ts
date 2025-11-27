// ========= SCHEMAS ========

const ballStateSchema = {
	type: 'object',
	required: [ 'x', 'y' ],
	properties: {
		x: { type: 'number' },
		y: { type: 'number' },
	},
	additionalProperties: false
};

const playerStateSchema = {
	type: 'object',
	required: [ 'id', 'x', 'y', 'points', 'name' ],
	properties: {
		id: { type: 'integer', minimum: 1, maximum: 2 },
		x: { type: 'number' },
		y: { type: 'number' },
		points: { type: 'integer', minimum: 0 },
		name: { type: 'string' }
	},
	additionalProperties: false
};

const gameStateSchema = {
	type: 'object',
	required: [],
	properties: {
		type: { type: 'string', const: 'state' },
		players: {
			type: 'object',
			required: [ '1', '2' ],
			properties: {
				'1': playerStateSchema,
				'2': playerStateSchema
			},
			additionalProperties: false
		},
		ball: ballStateSchema
	},
	additionalProperties: false
};

// ========= TYPES ========

export type BallState = {
	x: number;
	y: number;
};

export type PlayerState = {
	id: number;
	x: number;
	y: number;
	points: number;
	name: string;
};

export type GameState = {
	type: 'state';
	players: {
		1: PlayerState;
		2: PlayerState;
	};
	ball: BallState;
};

// ========= FUNCTIONS ========

export const gameStateMessage = ( players: Record<string, PlayerState>, ball: BallState ) : GameState => {
	return {
		type: 'state',
		players: players as { 1: PlayerState; 2: PlayerState },
		ball
	};
};

export const validateGameState = ( data: unknown ) : GameState | null => {
	if ( typeof data !== 'object' || data === null ) return null;

	const msg = data as any;

	if ( msg.type !== 'state'
		|| ( !msg.players || typeof msg.players !== 'object' )
		|| ( !msg.players[1] || !msg.players[2] )
		|| ( !msg.ball || typeof msg.ball !== 'object' )
	 ) return null;

	 return msg as GameState;
};

export default { ballStateSchema, playerStateSchema, gameStateSchema };
