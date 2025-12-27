
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, type JSX } from 'react'
import { apiUrl } from '../../../api/api';
import { fetchWithAuth } from '../../../api/fetchWithAuth';
import { useTranslation } from 'react-i18next';


type LeaderboardEntry =
{
	rank: number;
	name: string;
	rating: number;
	wins: number;
	losses: number;
	ratio: number;
};


export const Leaderboard = () => {
	const navigate = useNavigate();
	const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
	const [users, setUsers] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const observerTarget = useRef<HTMLDivElement>(null);

	const {t} = useTranslation();

	// Fetch the current user's rank
	useEffect(() => {
		const fetchMyRank = async () => {
			try
			{
				const response = await fetchWithAuth( apiUrl('/leaderboard/me'), {
					credentials: "include"
				});

				if (response.ok && response.status !== 204)
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

				const response = await fetchWithAuth( apiUrl('/leaderboard/1'), {
					credentials: "include"
				});

				// No eligible users on leaderboard
				if (response.status === 204)
				{
					setUsers([]);
					setHasMore(false);
					setLoading(false);
					return;
				}

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
			const response = await fetchWithAuth( apiUrl(`/leaderboard/${nextPage}`), {
				credentials: "include"
			});

			if (response.status === 204)
			{
				setHasMore(false);
				return;
			}

			if (!response.ok) throw new Error("Failed to load more entries");

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
				if (entries[0]?.isIntersecting && hasMore && !loadingMore) fetchNextPage();
			},
			{threshold: 1.0}
		);

		const currentTarget = observerTarget.current;
		if (currentTarget) observer.observe(currentTarget);

		return () => {
			if (currentTarget) observer.unobserve(currentTarget);
		};
	}, [fetchNextPage, hasMore, loadingMore]);

	const getRankIcon = (rank: number) : JSX.Element | null => {
		switch (rank)
		{
			case 1: return <span className='material-symbols-outlined text-yellow-500 text-xl'>star</span>;
			case 2: return <span className='material-symbols-outlined text-blue-200 text-xl'>star</span>;
			case 3: return <span className='material-symbols-outlined text-amber-600 text-xl'>star</span>;
			default: return null;
		}
	};

	if (loading)
	{
		return (
			<div className="flex items-center justify-center h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)]">
				<div className="text-transcendence-white font-transcendence-three text-2xl animate-pulse">
					{t("leaderboard.loading")}
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
					<div className="text-transcendence-red font-transcendence-three text-2xl mb-4">
					{error}
					</div>
					<button
						onClick={() => window.location.reload()}
						className="bg-transcendence-beige text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200">
						{t("leaderboard.retry")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)]
			grid grid-cols-1 md:grid-cols-[1fr_7fr_1fr] grid-rows-[15%_auto]
			px-[8vw] py-[8vh] gap-3 transition-all duration-150 ease-in-out">
			<button className="absolute text-transcendence-white font-transcendence-two tracking-[0.02em] flex items-center justify-center
			top-5 left-5 xl:top-10 xl:left-10
			text-xs xl:text-sm cursor-pointer"
			onClick={() => navigate("/home/stats")}>
				<span className="material-symbols-outlined">arrow_forward</span>
				<h3 className="h-full">
					{t("leaderboard.myStats")}
				</h3>
			</button>

			{/* Player rank */}
			<div className="w-full h-full flex flex-col items-center col-span-1 md:col-span-3 tracking-[0.2em]">
				<h1 className="text-transcendence-white font-transcendence-three text-2xl lg:text-3xl md:portrait:text-3xl">
					{
						myRank ? (
							<>
								{t("leaderboard.yourRank")} <span className='text-transcendence-beige'>#{myRank.rank}</span>
							</>
						) : (
							<span>{t("leaderboard.yourUnranked")}</span>
						)
					}
				</h1>
			</div>

			{/* Leaderboard with lazy loading */}
			<div className="w-full h-full md:col-start-2 rounded-xl bg-transcendence-beige p-[0.7vh] col-span-1 md:col-span-1 overflow-y-auto">

				{/* Legend */}
				<div className='sticky top-0 bg-transcendence-beige z-10 pb-2'>
					<div className='leaderboard-grid px-4 py-2
					bg-transcendence-black text-transcendence-beige
					text-xs font-bold uppercase tracking-wider'>
						<span className='text-center'>{t("leaderboard.rank")}</span>
						<span className='text-left ml-2 truncate min-w-0'>{t("leaderboard.name")}</span>
						<span className='text-center'>{t("leaderboard.rating")}</span>
						<span className='text-center hidden sm:block'>{t("leaderboard.ratio")}</span>
						<span className='text-center hidden md:block'>{t("leaderboard.wins")}</span>
						<span className='text-center hidden lg:block'>{t("leaderboard.losses")}</span>
					</div>
				</div>

				{/* Player rankings */}
				<ul className="flex flex-col gap-2 font-transcendence-two">
					{users.map((user) => {
						const isCurrentUser = (myRank && user.name === myRank.name);
						return (
							<li key={`${user.rank}-${user.name}`}
								className={`leaderboard-grid px-4 py-3
									transition-colors text-transcendence-white
									${isCurrentUser
										? 'bg-transcendence-blue border-2 border-transcendence-blue/80'
										: 'bg-transcendence-black'
									}`}>

									{/* Display user rank */}
									<span className='font-bold'># {user.rank}</span>

									{/* Display username, top three get a star, current user indicator */}
									<div className='flex items-center gap-1 min-w-0'>
										{getRankIcon(user.rank)}
										<span className=' font-bold text-left gap-1 truncate min-w-0'>
											{user.name}
										</span>
										{isCurrentUser && (
											<span className='flex items-center text-xs uppercase text-transcendence-white/60'>
												<span className="material-symbols-outlined text-base">
													arrow_left
												</span>
												{t("leaderboard.you")}
											</span>
										)}
									</div>

									{/* Display user rating */}
									<span className='text-transcendence-beige font-bold text-center'>
										{user.rating}
									</span>

									{/* Display ratio */}
									<span className={`font-bold text-center hidden sm:block
										${user.ratio >= 50 ? "text-green-400" : "text-red-400"}`}>
										{user.ratio}%
									</span>

									{/* Display wins */}
									<span className='text-transcendence-beige font-bold text-center hidden md:block'>
										{user.wins}
									</span>

									{/* Display losses */}
									<span className='text-transcendence-beige font-bold text-center hidden lg:block'>
										{user.losses}
									</span>
							</li>
						);
					})}

					{/* Observer target for lazy loading */}
					{hasMore && (
						<div ref={observerTarget} className='text-transcendence-black/40 py-4 text-center text-sm'>
							{loadingMore ? (
								<span className='animate-pulse'>
									{t("leaderboard.loadingMore")}
								</span>
							) : (
								<span>{t("leaderboard.scrollMore")}</span>
							)}
						</div>
					)}

					{/* Leaderboard end */}
					{!hasMore && (
						<div className='text-transcendence-black/40 py-4 text-center text-sm'>
							{users.length === 0 ? (
								<p>{t("leaderboard.noPlayers")}</p>
							) : (
								<p>{t("leaderboard.end")}</p>
							)}
						</div>
					)}
				</ul>
			</div>
		</div>
	);
}
