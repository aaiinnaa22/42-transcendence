class Player
{
	userName: string;
	userId: string;
	location: number;
	x: number;
	y: number;
	points: number;

	/**
	 * @param location Which paddle is controlled by the player
	 * @param userId The UUID of the user
	 * @param x Horizontal player position
	 * @param y vertical player position
	 */
	constructor( location: number, userId: string, x = 0, y = 0, userName: string)
	{
		this.userId = userId ? userId : ""; // Avoid exposing this!!!
		this.location = location;
		this.x = x;
		this.y = y;
		this.points = 0;
		this.userName = userName;
	}

	move( dx: number, dy: number )
	{
		this.x += dx;
		this.y += dy;
	}

	getState()
	{
		return { id: this.location, x: this.x, y: this.y, points: this.points };
	}
}

export default Player;