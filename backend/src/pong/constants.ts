// Gameplay constants
export const WIDTH = 1600;
export const HEIGHT = 800;

// Player constants
export const PADDLE_LEN = 140;
export const PADDLE_WIDTH = 10;
export const MOVE_SPEED = 16;					// 16px per frame (minimizes tearing)

// Ball related constants
export const BALL_SIZE = 10;
export const MAX_BALL_SPEED = 10;				// 10px per frame
export const MIN_BALL_SPEED = 6;				// 6px per frame

// Matchmaking constants
export const INITIAL_ELO_RANGE = 150;			// Starting search range
export const ELO_RANGE_INCREASE = 50;			// How much to increase the search range
export const RANGE_INCREASE_INTERVAL = 5000;	// How often to increase the range
export const MAX_ELO_RANGE = 1000;				// Hard cap on the search range

// Elo adjustment
export const ELO_K_FACTOR = 32;

// Rate limiting
export const RATE_LIMIT_MS = 20;				// 20 ms

// Inactivity timout
export const INACTIVITY_TIMEOUT = 60000;		// 1 minute

// Win conditions
export const TOURNAMENT_WIN_CONDITION = 5;
