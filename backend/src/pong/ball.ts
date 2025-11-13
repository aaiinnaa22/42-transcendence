import { WIDTH, HEIGHT } from "./constants.ts";

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
	}

	resetBall()
	{
		this.x = WIDTH / 2;
		this.y = HEIGHT / 2;
		this.vx = 8;
		this.vy = 2;
	}

	getState()
	{
		return { x: this.x, y: this.y };
	}
}

export default Ball;
