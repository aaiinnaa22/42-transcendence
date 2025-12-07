import type { PrismaClient } from "@prisma/client";

export type LeaderboardEntry = {
	rank: number;
	name: string;
	rating: number;
	wins: number;
	losses: number;
	ratio: number;
};

export default class LeaderboardService
{
	// Member variables
	private cache: LeaderboardEntry[] | null;
	private lastUpdate: number;
	private loop: NodeJS.Timeout;

	// Constants
	private readonly REFRESH_INTERVAL: number = 5 * 60 * 1000;				// Refresh every 5 minutes
	private readonly MAX_ENTRIES: number = 100;
	private readonly PAGE_ENTRIES: number = 10;
	private readonly MIN_PLAYED: number = 3;
	private readonly MIN_WINS: number = 3;
	private readonly PLAYER_ACTIVITY: number = 30 * 24 * 60 * 60 * 1000;	// Active in the last month


	constructor( private prisma: PrismaClient )
	{
		this.cache = null;
		this.lastUpdate = 0;
		this.loop = setInterval(() => this.update(), this.REFRESH_INTERVAL );
		this.update();
	}

	/**
	 * @brief Returns the cached player ranks. Enables lazy loading based on page.
	 *
	 * @param page Which set of 10 players to return. 0 returns all enntries.
	 * @returns Array of leaderboard entries or null if page is missing
	 */
	public getCache( page: number = 1 ) : LeaderboardEntry[] | null
	{
		if ( !this.cache ) return null;

		// Return all entries
		if ( page === 0 )
		{
			return this.cache;
		}
		// Return speccific page
		else if ( page > 0 )
		{
			const startIndex = (page - 1) * this.PAGE_ENTRIES;
			const endIndex = startIndex + this.PAGE_ENTRIES;

			if ( startIndex >= this.cache.length ) return null;

			return this.cache.slice(startIndex, endIndex);
		}
		return null;
	}

	/**
	 * @brief Attempts to retrieve user rank even if not in the top results
	 *
	 * @param userId ID of the user whose rank to fetch
	 * @returns Their entry or null if not found or unranked
	 */
	public async getUserRank( userId: string ) : Promise<LeaderboardEntry | null>
	{
		if ( !this.cache ) return null;

		try
		{
			const playerStats = await this.prisma.playerStats.findUnique({
				where: { userId },
				include:{ user: { select: { username: true, lastLogin: true } } },
				omit: { userId: true }
			});

			if ( !playerStats || playerStats.playedGames < this.MIN_PLAYED || playerStats.wins < this.MIN_WINS )
				return null;

			const activityConstraint = new Date(Date.now() - this.PLAYER_ACTIVITY);

			const higherRankedCount = await this.prisma.playerStats.count({
				where: {
					eloRating: { gt: playerStats.eloRating },
					playedGames: { gte: this.MIN_PLAYED },
					wins: { gte: this.MIN_WINS },
					user: { lastLogin: { gte: activityConstraint }}
				}
			});

			const rank = higherRankedCount + 1;
			const ratio = playerStats.playedGames > 0
				? Math.round((playerStats.wins / playerStats.playedGames) * 100)
				: 0;

			const userRank: LeaderboardEntry = {
				rank,
				name: playerStats.user.username ?? "Unknown",
				rating: playerStats.eloRating,
				wins: playerStats.wins,
				losses: playerStats.losses,
				ratio
			};

			return userRank;
		}
		catch (error)
		{
			console.error("Leaderboard error: ", error);
		}
		return null;
	}

	/**
	 * @brief Updates the leaderboard entries
	 */
	private async update() : Promise<void>
	{
		const now = Date.now();

		if ( this.cache && now - this.lastUpdate < this.REFRESH_INTERVAL ) return;

		try
		{
			const activityConstraint = new Date(Date.now() - this.PLAYER_ACTIVITY);

			const players = await this.prisma.playerStats.findMany({
				where: {
					playedGames: { gte: this.MIN_PLAYED },
					wins: { gte: this.MIN_WINS },
					user: { lastLogin: { gte: activityConstraint } }
				},
				include:{ user: { select: { username: true } } },
				omit: { userId: true },
				orderBy: { eloRating: "desc" },
				take: this.MAX_ENTRIES
			});

			this.cache = players.map((player, index) => ({
				rank: index + 1,
				name: player.user.username ?? "Unknown",
				rating: player.eloRating,
				wins: player.wins,
				losses: player.losses,
				ratio: player.playedGames > 0
					? Math.round((player.wins / player.playedGames) * 100)
					: 0
			}));

			this.lastUpdate = now;
			console.log("Leaderboard cached successfully");
		}
		catch (error)
		{
			console.error("Leaderboard error: ", error);
		}
	}

	/**
	 * @brief Cleans up the service
	 */
	public destroy() : void
	{
		if ( this.loop ) clearInterval(this.loop);
		this.cache = null;
	}

};
