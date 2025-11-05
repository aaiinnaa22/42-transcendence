type LeaderboardProps =
{
	switchStats: () => void;
};

export const Leaderboard = ({switchStats}: LeaderboardProps) => {


	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto] px-[10vw]
			portrait:grid-cols-[auto]">
			<div className="absolute text-transcendence-white font-transcendence-two tracking-[0.02em] flex items-center justify-center
			top-5 left-5 xl:top-10 xl:left-10
			text-xs xl:text-sm cursor-pointer"
			onClick={switchStats}>
				<span className="material-symbols-outlined">arrow_forward</span>
				<h3 className="h-full">My stats</h3>
			</div>
			<h1 className="text-transcendence-white">LEADERBOARD</h1>
		</div>
	);
}