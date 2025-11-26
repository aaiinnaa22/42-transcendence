type ChooseGameModeProps =
{
	onSinglePlayerChoose: () => void;
	onTournamentChoose: () => void;
};

export const ChooseGameMode = ({onSinglePlayerChoose, onTournamentChoose}: ChooseGameModeProps) =>
{
	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[10%_auto_10%] grid-rows-[15%_auto] p-5 lg:p-10">
			<div className="flex justify-center col-start-2">
				<h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] self-end">Choose mode</h2>
			</div>
			<div className="flex flex-row col-start-2 row-start-2 gap-10 lg:gap-40 landscape:pt-[15vh] lg:landscape:pt-[20vh] justify-center
			portrait:flex-col portrait:items-center portrait:gap-20 portrait:pt-0">
				<div className="flex flex-col font-transcendence-two gap-6 text-center max-w-70">
					<button className="rounded-2xl flex flex-row justify-center items-center gap-3 p-6 xl:p-8 cursor-pointer border-3 border-transcendence-white group landscape:h-10 lg:landscape:h-25 xl:h-25" onClick={onSinglePlayerChoose}>
						<span className="material-symbols-outlined text-transcendence-white w-5">arrow_forward_ios</span>
						<h2 className="text-2xl text-transcendence-white group-hover:pt-1">play together</h2>
					</button>
					<p className="italic text-transcendence-white">play together with your friend on the same screen</p>
				</div>
				<div className="flex flex-col font-transcendence-two gap-6 text-center">
					<button className="rounded-2xl flex flex-row justify-center items-center gap-3 p-6 xl:p-8 border-3 border-transcendence-white cursor-pointer group landscape:h-10 lg:landscape:h-25 xl:h-25"
						onClick={onTournamentChoose}>
						<span className="material-symbols-outlined text-transcendence-white w-5">social_leaderboard</span>
						<h2 className="text-2xl text-transcendence-white group-hover:pt-1">tournament</h2>
					</button>
					<p className="italic text-transcendence-white">play with others around the world</p>
				</div>
			</div>
		</div>
	);
};
