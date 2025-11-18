import Player from "./player.ts";
import Ball from "./ball.ts";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH } from "./constants.ts";

class Game
{
	id: string;
	players: Player[];
	ball: Ball;
	sockets: WebSocket[] = [];
	loop: NodeJS.Timeout;

	constructor( id: string , sockets: WebSocket[])
	{
		this.id = id;
		this.players = [];
		this.ball = new Ball;

		this.sockets = sockets.slice();
		this.startLoop();
	}

	startLoop() 
	{
		this.loop = setInterval(() => {
			this.update();
		}, 1000 / 60); 
	}

	addPlayer()
	{
		const newPlayer = new Player( 1, 20, HEIGHT / 2 );
		this.players.push( newPlayer );
		const newPlayer2 = new Player( 2, 1570, HEIGHT / 2 );
		this.players.push( newPlayer2 );
		//check that both players were added
	}

	movePlayer( playerId: number, dx: number, dy: number )
	{
		const player = this.players.find( p => p.id === playerId );
		if ( player )
		{
			if ((dy === -10 && player.y != 0) || (dy === 10 && player.y != (HEIGHT-PADDLE_LEN))) 
				player.move( dx, dy );
		}
	}

	update()
	{
		this.moveBall();
		for (const socket of this.sockets) 
		{
			socket.send(JSON.stringify(this.getState()));
		}
	}

	moveBall()
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

	getState()
	{
		const playersState: Record<string, any> = {};

		this.players.forEach( player =>
		{
			playersState[player.id] = player.getState();
		} );

		return {
			type: "state",
			players: playersState,
			ball: this.ball.getState(),
		};
	}

	destroy() 
	{
        clearInterval(this.loop);
    }
}

export default Game;
