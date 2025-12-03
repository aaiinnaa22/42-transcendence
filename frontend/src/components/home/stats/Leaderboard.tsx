import {useState, useEffect} from 'react'

type LeaderboardProps =
{
	switchStats: () => void;
};

type User =
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

	const [leaderboardPos, setLeaderboardPos] = useState(0);
	const [users, setUsers] = useState<User[]>([]);
	useEffect(() => {
		setUsers([
		{ rank: 1, name: "Aina", rating: 1300, wins: 10, losses: 0, ratio: 1 },
		{ rank: 2, name: "RL", rating: 900, wins: 3, losses: 6, ratio: 0.5 },
		]);
	}, []);
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
			<div className="w-full h-full flex flex-col items-center col-span-3 tracking-[0.2em]">
				<h1 className="text-transcendence-white font-transcendence-three
					text-xl lg:text-3xl md:portrait:text-3xl">
					you are top {leaderboardPos} in the world!</h1>
			</div>
			<div className="w-full h-full md:col-start-2 rounded-xl bg-transcendence-beige p-[0.7vh] col-span-3 md:col-span-1">
				<ul className="flex flex-col gap-2 font-transcendence-two">
					{users.map((user) => (
					<li className="bg-transcendence-black text-transcendence-white rounded-lg px-4 py-2">{user.name}: {user.rating}</li>
					))}
				</ul>
			</div>
		</div>
	);
}
