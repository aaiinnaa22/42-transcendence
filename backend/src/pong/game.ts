import Player from "./player.ts";
import Ball from "./ball.ts";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH, RATE_LIMIT_MS, MOVE_SPEED, MIN_BALL_SPEED, MAX_BALL_SPEED, TOURNAMENT_WIN_CONDITION } from "./constants.ts";
import { gameStateMessage, type BallState, type GameState, type PlayerState } from "../schemas/game.states.schema.ts";
import type { WebSocket as WsWebSocket } from "ws";

export enum Location {
	Left = 1,
	Right = 2
};

export enum GameMode {
	Singleplayer = "singleplayer",
	Tournament = "tournament"
};

export type GameEndReason = "win" | "disconnect" | "inactivity";

export type GameEndData = {
	reason: GameEndReason;
	winner: Player | null;
	loser: Player | null;
};

export type GameEndCallback = ( data: GameEndData ) => void;

class Game
{
	id: string;
	players: Player[];
	ball: Ball;
	sockets: WsWebSocket[];
	mode: GameMode;
	hasEnded: boolean;
	loop!: NodeJS.Timeout;
	starttimer: number;
	countdown: number;

	private onGameEndCallback: GameEndCallback | undefined;

	constructor(
		id: string,
		sockets: WsWebSocket[],
		mode: GameMode = GameMode.Singleplayer,
		onGameEnd: GameEndCallback | undefined )
	{
		this.id = id;
		this.players = [];
		this.ball = new Ball;

		this.sockets = sockets.slice();
		this.mode = mode;
		this.onGameEndCallback = onGameEnd;
		this.hasEnded = false;
		this.loop = setInterval(() => this.update(), 1000 / 60);
		this.starttimer = Date.now();
		this.countdown = 3;
	}

	/**
	 * @param location The side of the screen which the player occupies
	 * @param userid The unique identifier of the player (can be empty string if not tracking score)
	 */
	public addPlayer( location: Location, userid: string, userName: string ) : void
	{
		const horizontal = location == 1 ? 20 : 1570;
		const player = new Player( location, userid, horizontal, HEIGHT / 2, userName );
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

	// Handler for stopping games and calling the callback function for multiplayer games
	private endGame( reason: GameEndReason ) : void
	{
		if ( this.hasEnded ) return;

		this.hasEnded = true;
		clearInterval(this.loop);

		const [ leftPlayer, rightPlayer ] = this.players;
		if ( !leftPlayer || !rightPlayer ) return;

		let winnerPlayer: Player | null = null;
		let loserPlayer: Player | null = null;

		if ( leftPlayer.points > rightPlayer.points )
		{
			winnerPlayer = leftPlayer;
			loserPlayer = rightPlayer;
		}
		else if ( leftPlayer.points < rightPlayer.points )
		{
			winnerPlayer = rightPlayer;
			loserPlayer = leftPlayer;
		}

		if ( !winnerPlayer || !loserPlayer ) return;

		const endData: GameEndData = {
			reason,
			winner: winnerPlayer,
			loser: loserPlayer
		};

		if ( this.onGameEndCallback ) this.onGameEndCallback(endData);
	}

	public update() : void
	{
		// Check if win condition was met
		if ( this.hasEnded ) return;

		const [ leftPlayer, rightPlayer ] = this.players;
		if ( leftPlayer && rightPlayer )
		{
			// Alternatively check gamemmode for custom limits
			if ( ( leftPlayer.points >= TOURNAMENT_WIN_CONDITION
				|| rightPlayer.points >= TOURNAMENT_WIN_CONDITION )
				&& leftPlayer.points !== rightPlayer.points )
			{
				this.endGame( "win" );
				return;
			}
		}

		// Send updates
		const now = Date.now();
		if ( (now - this.starttimer) > 3100)
			this.moveBall();
		else
			this.countdown = 3 - Math.floor((now - this.starttimer) / 1000);
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

	public getState() : GameState
	{
		const playersState: Record<string, PlayerState> = {};

		this.players.forEach( player =>
		{
			playersState[player.location] = player.getState();
		} );

		const ballState : BallState = this.ball.getState();

		const countdown : number = this.countdown;

		return gameStateMessage( playersState, ballState, countdown );
	}

	public destroy() : void
	{
		this.sockets.forEach(socket => {
			socket.close();
		});
		if ( this.loop ) clearInterval(this.loop);
    }
}

export default Game;
