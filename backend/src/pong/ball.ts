
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
		this.resetBall();
	}

	resetBall()
	{
		this.x = WIDTH / 2;
		this.y = HEIGHT / 2;
		this.vx = Math.random() < 0.5 ? Math.random() * -6 - 9 : Math.random() * 6 + 9;;
		this.vy = Math.floor(Math.random() * 8) - 4;
	}

	getState()
	{
		return { x: this.x, y: this.y };
	}
}

export default Ball;
