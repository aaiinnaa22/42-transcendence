
export const NavBar = () =>
{
	return (
		<div className="flex flex-row items-center justify-between h-32 bg-transcendence-beige px-10">
			<h1 className="font-transcendence-one font-extrabold text-5xl text-transcendence-black tracking-[0.8rem]">PONG</h1>
			<div className="flex flex-row gap-20 font-transcendence-two text-2xl">
				<h2>play</h2>
				<h2>leaderboard</h2>
				<h2>tournament</h2>
			</div>
			<div className="flex flex-row gap-5">
				<span className="material-symbols-outlined !text-3xl">account_circle</span>
				<span className="material-symbols-outlined !text-3xl">settings</span>
			</div>
		</div>
	);
};
