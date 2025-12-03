import { useState, useEffect, useRef, useCallback } from 'react'

type LeaderboardProps =
{
	switchStats: () => void;
};

type LeaderboardEntry =
{
	rank: number;
	name: string;
	rating: number;
	wins: number;
	losses: number;
	ratio: number;
};

//TODO: import global stats

export const Leaderboard = ({switchStats}: LeaderboardProps) => {
	const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
	const [users, setUsers] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const observerTarget = useRef<HTMLCanvasElement>(null);

	// Fetch the current user's rank
	useEffect(() => {
		const fetchMyRank = async () => {
			try
			{
				const response = await fetch("http://localhost:4241/leaderboard/me",{
					credentials: "include"
				});

				if (response.ok)
				{
					const data = await response.json();
					setMyRank(data);
				}
				else
				{
					setMyRank(null);
				}
			}
			catch (error)
			{
				console.error("Error fetching rank:", error)
			}
		};

		fetchMyRank();
	}, []);

	// Fetch first ten players
	useEffect(() => {
		const fetchFirstPage = async () => {
			try
			{
				setLoading(true);

				const response = await fetch("http://localhost:4241/leaderboard/1",{
					credentials: "include"
				});

				if (!response.ok) throw new Error("Failed to fetch leaderboard");

				const data = await response.json();

				setUsers(data);
				setHasMore(data.length === 10);
			}
			catch (error)
			{
				setError(error instanceof Error ? error.message : "Failed to load leaderboard");
			}
			finally
			{
				setLoading(false);
			}
		};

		fetchFirstPage();
	}, []);

	const fetchNextPage = useCallback( async () => {
		if (loadingMore || !hasMore) return;

		try
		{
			setLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await fetch(`http://localhost:4241/leaderboard/${nextPage}`,{
				credentials: "include"
			});

			if (response.status === 404)
			{
				setHasMore(false);
				return;
			}

			if (!response.ok) throw new Error("Failed to more entries");

			const data = await response.json();

			if (data.length === 0)
			{
				setHasMore(false);
				return;
			}

			setUsers(previous => [...previous, ...data]);
			setCurrentPage(nextPage);
			setHasMore(data.length === 10);
		}
		catch (error)
		{
			console.error("Failed to fetch next page", error);
		}
		finally
		{
			setLoadingMore(false);
		}

	}, [currentPage, loadingMore, hasMore]);

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore && !loadingMore) fetchNextPage();
			},
			{threshold: 1.0}
		);

		const currentTarget = observerTarget.current;
		if (currentTarget) observer.observe(currentTarget);

		return () => {
			if (currentTarget) observer.unobserve(currentTarget);
		};
	}, [fetchNextPage, hasMore, loadingMore]);

	if (loading)
	{
		return (
			<div className="flex items-center justify-center h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)]">
				<div className="text-transcendence-white font-transcendence-three text-2xl animate-pulse">
					Loading leaderboard...
				</div>
			</div>
		);
	}

	// Show error message and retry button
	if (error)
	{
		return (
			<div className="flex items-center justify-center h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)]">
				<div className="text-center">
					<div className="text-red-400 font-transcendence-three text-2xl mb-4">
					{error}
					</div>
					<button
						onClick={() => window.location.reload()}
						className="bg-transcendence-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200">
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[20%_60%_20%] grid-rows-[15%_auto] px-[10vw] py-[10vh]
			portrait:grid-cols-[auto] gap-3">
			<button className="absolute text-transcendence-white font-transcendence-two tracking-[0.02em] flex items-center justify-center
			top-5 left-5 xl:top-10 xl:left-10
			text-xs xl:text-sm cursor-pointer"
			onClick={switchStats}>
				<span className="material-symbols-outlined">arrow_forward</span>
				<h3 className="h-full">My stats</h3>
			</button>

			{/* Player rank */}
			<div className="w-full h-full flex flex-col items-center col-span-3 tracking-[0.2em]">
				<h1 className="text-transcendence-white font-transcendence-three text-xl lg:text-3xl md:portrait:text-3xl">
					{
						myRank ? (
							<>
								You are rank <span className='text-transcendence-beige'>#{myRank?.rank}</span>
							</>
						) : (
							<span>You are unranked. Play more to get a rank.</span>
						)
					}
				</h1>
			</div>

			{/* Leaderboard with lazy loading */}
			<div className="w-full h-full md:col-start-2 rounded-xl bg-transcendence-beige p-[0.7vh] col-span-3 md:col-span-1">
				<ul className="flex flex-col gap-2 font-transcendence-two">
					{users.map((user) => (
					<li className="bg-transcendence-black text-transcendence-white rounded-lg px-4 py-2">{user.name}: {user.rating}</li>
					))}
				</ul>

				{/* Observer target for lazy loading */}
			</div>
		</div>
	);
}
