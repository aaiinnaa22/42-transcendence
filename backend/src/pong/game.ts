import Player from "./player.ts";
import Ball from "./ball.ts";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH } from "./constants.ts";

export enum Location {
	Left = 1,
	Right = 2
};

class Game
{
	id: string;
	players: Player[];
	ball: Ball;
	sockets: WebSocket[] = [];
	loop!: NodeJS.Timeout;

	constructor( id: string , sockets: WebSocket[])
	{
		this.id = id;
		this.players = [];
		this.ball = new Ball;

		this.sockets = sockets.slice();
		this.startLoop();
	}

	private startLoop() : void
	{
		this.loop = setInterval(() => {
			this.update();
		}, 1000 / 60);
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

	public movePlayer( identifier: number | string, dx: number, dy: number ) : void
	{
		let player: Player | undefined;

		if ( typeof identifier === "number" )
		{
			player = this.players.find( p => p.location === identifier );
		}
		else
		{
			player = this.players.find( p => p.userId === identifier )
		}

		if ( player )
		{
			if ((dy === -10 && player.y != 0) || (dy === 10 && player.y != (HEIGHT-PADDLE_LEN)))
				player.move( dx, dy );
		}
	}

	public update() : void
	{
		this.moveBall();
		for (const socket of this.sockets)
		{
			socket.send(JSON.stringify(this.getState()));
		}
	}

	public moveBall() : void
	{
		this.ball.x += this.ball.vx;
		this.ball.y += this.ball.vy;

		if ( !this.players[0] || !this.players[1] )
		{
			return;
		}
		//check if ball is colliding Player 1
		if ( this.ball.x >= this.players[0].x
			&& this.ball.x <= this.players[0].x + PADDLE_WIDTH
			&& this.ball.y >= this.players[0].y
			&& this.ball.y <= this.players[0].y + PADDLE_LEN )
		{
			this.ball.x = this.players[0].x + PADDLE_WIDTH;
			const playerCenter = this.players[0].y + PADDLE_LEN / 2;
			this.ball.vy = ( playerCenter - this.ball.y ) * 0.1;
			this.ball.vx *= -1;
		}
		//check if ball is colliding Player 2
		if ( this.ball.x + BALL_SIZE >= this.players[1].x
			&& this.ball.x <= this.players[1].x + PADDLE_WIDTH
			&& this.ball.y + BALL_SIZE >= this.players[1].y
			&& this.ball.y <= this.players[1].y + PADDLE_LEN )
		{
			this.ball.x = this.players[1].x - BALL_SIZE;
			const playerCenter2 = this.players[1].y + PADDLE_LEN / 2;
			this.ball.vy = ( playerCenter2 - this.ball.y ) * 0.1;
			this.ball.vx *= -1;
		}
		//Check if ball is inside of a goal and resets ball position if there is a goal
		if ( this.ball.x <= 0 || this.ball.x >= WIDTH )
		{
			if ( this.ball.x <= 0 )
			{
				this.players[0].points += 1;
			}
			else
			{
				this.players[1].points += 1;
			}
			//check if we have winner here
			//Need to figure out what to do when the game is ended
			if ( this.players[0].points >= 5 || this.players[1].points >= 5 )
			{
				this.players[0].points = 42; // Figure out correct way to end the game currently just a place holder
			}
			this.ball.resetBall();
			return ;
		}
		//Check collision with walls
		if ( this.ball.y <= 0 || this.ball.y >= HEIGHT )
		{
			this.ball.vy *= -1;
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
