class Player
{
	userName: string;
	userId: string;
	location: number;
	x: number;
	y: number;
	points: number;
	lastMoveTimestamp: number;


	/**
	 * @param location Which paddle is controlled by the player
	 * @param userId The UUID of the user
	 * @param x Horizontal player position
	 * @param y Vertical player position
	 * @param userName The name of the user
	 */
	constructor( location: number, userId: string, x = 0, y = 0, userName: string )
	{
		this.userId = userId ? userId : ""; // Avoid exposing this!!!
		this.location = location;
		this.x = x;
		this.y = y;
		this.points = 0;
		this.lastMoveTimestamp = 0;
		this.userName = userName;
	}

	move( direction: number )
	{
		this.y += direction;
		this.lastMoveTimestamp = Date.now();
	}

	getState()
	{
		return { id: this.location, x: this.x, y: this.y, points: this.points, name: this.userName };
	}
}

export default Player;
