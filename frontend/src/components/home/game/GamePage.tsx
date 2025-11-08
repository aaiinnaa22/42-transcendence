
type GamePageProps =
{
	exitGame: () => void;
};

export const GamePage = ({exitGame}: GamePageProps) =>
{
	return (
		<div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[10%_auto_10%] grid-rows-[15%_auto] p-5 lg:p-10">
			<button className="text-transcendence-white material-symbols-outlined text-left cursor-pointer" onClick={exitGame}>close</button>
			<div className="flex justify-center col-start-2">
				<h2 className="text-transcendence-white font-transcendence-three text-3xl tracking-[0.12em] self-end">Choose mode</h2>
			</div>
			<div className="flex flex-row col-start-2 row-start-2 gap-10 lg:gap-40 pt-[8%] lg:pt-[18%] justify-center
			portrait:flex-col portrait:items-center portrait:gap-20 portrait:pt-0">
				<div className="flex flex-col font-transcendence-two gap-6 text-center">
					<div className="rounded-xl flex flex-row justify-center items-center gap-3 p-8 cursor-pointer border-3 border-transcendence-white group">
						<span className="material-symbols-outlined text-transcendence-white w-5 group-hover:pl-1">arrow_forward_ios</span>
						<h2 className="text-2xl text-transcendence-white">play together</h2>
					</div>
					<p className="italic text-transcendence-white">play together with your friend on the same screen</p>
				</div>
				<div className="flex flex-col font-transcendence-two gap-6 text-center">
					<div className="rounded-xl flex flex-row justify-center items-center gap-3 p-8 border-3 border-transcendence-white cursor-pointer group">
						<span className="material-symbols-outlined text-transcendence-white w-5 group-hover:pl-1">arrow_forward_ios</span>
						<h2 className="text-2xl text-transcendence-white">tournament</h2>
					</div>
					<p className="italic text-transcendence-white">play with others around the world</p>
				</div>
			</div>
		</div>
	);
};