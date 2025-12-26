import { WIDTH, HEIGHT, MAX_BALL_SPEED, MIN_BALL_SPEED } from "./constants.js";

class Ball
{
	x: number;
	y: number;
	vx: number;
	vy: number;

	constructor()
	{
		this.x = WIDTH / 2;
		this.y = HEIGHT / 2;
		this.vx = 8;
		this.vy = 2;
		this.resetBall();
	}

	public resetBall() : void
	{
		this.x = WIDTH / 2;
		this.y = HEIGHT / 2;

		const speedX = MIN_BALL_SPEED + Math.random() * ( MAX_BALL_SPEED - MIN_BALL_SPEED );
		const speedY = ( MIN_BALL_SPEED / 2 ) + Math.random() * ( MAX_BALL_SPEED - ( MIN_BALL_SPEED - 2 ) );

		this.vx = Math.random() < 0.5 ? -speedX : speedX;
		this.vy = Math.random() < 0.5 ? -speedY : speedY;
	}

	public getState()
	{
		return { x: this.x, y: this.y };
	}
}

export default Ball;
