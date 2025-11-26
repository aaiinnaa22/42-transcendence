import Player from "./player.ts";
import Ball from "./ball.ts";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH, RATE_LIMIT_MS, MOVE_SPEED, MIN_BALL_SPEED, MAX_BALL_SPEED } from "./constants.ts";

export enum Location {
	Left = 1,
	Right = 2
};

export enum GameMode {
	Singleplayer = "singleplayer",
	Tournament = "tournament"
}

class Game
{
	id: string;
	players: Player[];
	ball: Ball;
	sockets: WebSocket[] = [];
	loop!: NodeJS.Timeout;
	mode: GameMode;

	constructor( id: string , sockets: WebSocket[], mode: GameMode = GameMode.Singleplayer )
	{
		this.id = id;
		this.players = [];
		this.ball = new Ball;

		this.sockets = sockets.slice();
		this.mode = mode;
		this.loop = setInterval(() => this.update(), 1000 / 60);
	}

	/**
	 * @param location The side of the screen which the player occupies
	 * @param userid The unique identifier of the player (can be empty string if not tracking score)
	 */
	public addPlayer( location: Location, userid: string ) : void
	{
		const horizontal = location == 1 ? 20 : 1570;
		const player = new Player( location, userid, horizontal, HEIGHT / 2 );
		this.players.push( player );
	}

	// Used in finding the correct player based on gamemode and identifier
	private findPlayer( identifier: number | string ) : Player | undefined
	{
		let player: Player | undefined = undefined;

		if ( this.mode === GameMode.Singleplayer && typeof identifier === "number" )
		{
			player = this.players.find( p => p.location === identifier );
		}
		else if ( this.mode === GameMode.Tournament && typeof identifier === "string" )
		{
			player = this.players.find( p => p.userId === identifier )
		}

		/* Add conditionals for other modes here */

		return player;
	}

	/**
	 * @brief Enables rate limiting for avoiding spam
	 * @param player The player instance sending a move
	 * @returns true if they are allowed to move, otherwise false
	 */
	private rateLimit( player: Player ) : boolean
	{
		const now = Date.now();
		const timeSinceLastMove = now - player.lastMoveTimestamp;

		if ( timeSinceLastMove < RATE_LIMIT_MS ) return false;

		return true;
	}

	public movePlayer( identifier: number | string, dy: number ) : void
	{
		const player = this.findPlayer( identifier );

		if ( !player ) return;

		if ( !this.rateLimit( player ) ) return;

		// Calculate paddle direction
		let direction: number = 0;
		if ( dy < 0 )
			direction = -1;
		else if ( dy > 0 )
			direction = 1;
		direction *= MOVE_SPEED;

		if ((direction < 0 && player.y > 0)
		||  (direction > 0 && player.y < (HEIGHT-PADDLE_LEN) - MOVE_SPEED))
			player.move( direction );
	}

	public update() : void
	{
		this.moveBall();
		for (const socket of this.sockets)
		{
			socket.send(JSON.stringify(this.getState()));
		}
	}

	/**
	 * @brief Changes direction of the ball based on collided paddle and clamps the velocity
	 * @param player The player which the ball collided with
	 */
	private ballBounce( player: Player ) : void
	{
		const ballCenter	= this.ball.y + BALL_SIZE / 2;
		const playerCenter	= player.y + PADDLE_LEN / 2;

		const velocityY			= ( ballCenter - playerCenter ) * 0.1;
		const absoluteY			= Math.abs( velocityY );
		const clampedVelocityY	= Math.max( MIN_BALL_SPEED, Math.min( absoluteY, MAX_BALL_SPEED ) );

		this.ball.vy = clampedVelocityY * (velocityY >= 0 ? 1 : -1);
		this.ball.vx *= -1;

	}

	public moveBall() : void
	{
		this.ball.x += this.ball.vx;
		this.ball.y += this.ball.vy;

		if ( !this.players[0] || !this.players[1] ) return;

		// Check if ball is colliding Player 1 (Left)
		if ( this.ball.x <= this.players[0].x + PADDLE_WIDTH	// Ball left and paddle right
			&& this.ball.y <= this.players[0].y + PADDLE_LEN	// Ball top and paddle bottom
			&& this.ball.x + BALL_SIZE >= this.players[0].x		// Ball right and paddle left
			&& this.ball.y + BALL_SIZE >= this.players[0].y )	// Ball bottom and paddle top
		{
			this.ball.x = this.players[0].x + PADDLE_WIDTH;
			this.ballBounce( this.players[0] );
		}

		// Check if ball is colliding Player 2 (Right)
		if ( this.ball.x <= this.players[1].x + PADDLE_WIDTH	// Ball left and paddle right
			&& this.ball.y <= this.players[1].y + PADDLE_LEN	// Ball top and paddle bottom
			&& this.ball.x + BALL_SIZE >= this.players[1].x		// Ball right and paddle left
			&& this.ball.y + BALL_SIZE >= this.players[1].y )	// Ball bottom and paddle top
		{
			this.ball.x = this.players[1].x - BALL_SIZE;
			this.ballBounce( this.players[1] );
		}

		// Check if ball is inside of a goal and resets ball position if there is a goal
		if ( this.ball.x <= 0 || this.ball.x >= WIDTH )
		{
			if ( this.ball.x <= 0 )
			{
				this.players[1].points += 1;
			}
			else
			{
				this.players[0].points += 1;
			}
			this.ball.resetBall();
			return ;
		}

		// Check collision with walls
		if ( this.ball.y <= 0 || this.ball.y >= HEIGHT - BALL_SIZE )
		{
			this.ball.vy *= -1;

			if ( this.ball.y < 0 ) this.ball.y = 0;
			if ( this.ball.y >= HEIGHT - BALL_SIZE ) this.ball.y = HEIGHT - BALL_SIZE;
		}
	}

	public getState()
	{
		const playersState: Record<string, any> = {};

		this.players.forEach( player =>
		{
			playersState[player.location] = player.getState();
		} );

		return {
			type: "state",
			players: playersState,
			ball: this.ball.getState(),
		};
	}

	public destroy() : void
	{
		this.sockets.forEach(socket => {
			socket.close();
		});
        clearInterval(this.loop);
    }
}

export default Game;
