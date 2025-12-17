import {CircleDiagram} from "../utils/CircleDiagram";
import {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../../api/fetchWithAuth";

export const PersonalStats = () =>
{
	const navigate = useNavigate();
	const [playerStats, setPlayerStats] =	useState({
		wins:  0,
		losses: 0,
		gamesPlayed: 0,
		rating: 0
	});
	const percentageWon = (playerStats.wins / playerStats.gamesPlayed) * 100;
	const percentageLost = 100 - percentageWon;
	useEffect(() => {
		const getStats = async () => {
			try
			{
				const response = await fetchWithAuth("http://localhost:4241/stats/me", {
					method: "GET",
					credentials: "include",
				});
				const data = await response.json();
				setPlayerStats({
					wins: data.wins ?? 0,
					losses: data.losses ?? 0,
					gamesPlayed: data.playedGames ?? 0,
					rating: data.eloRating ?? 0
				});

			}
			catch (err: any)
			{
				console.error(err.message);
			}
		};
		getStats();
	}, []);

	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto] px-[10vw]
			portrait:grid-cols-[auto]">
			<button className="absolute text-transcendence-white font-transcendence-two tracking-[0.02em] flex items-center justify-center
			top-5 left-5 xl:top-10 xl:left-10
			text-xs xl:text-sm cursor-pointer"
			onClick={() => navigate("/home/stats/leaderboard")}>
				<span className="material-symbols-outlined">arrow_forward</span>
				<h3 className="h-full">Leaderboard</h3>
			</button>
			<div className="w-full h-full flex flex-col items-center justify-center gap-1">
				<h2
					className="text-transcendence-white font-transcendence-three tracking-[0.2em]
					text-lg lg:text-2xl md:portrait:text-2xl">wins</h2>
				<div
					className="rounded-xl border-3 w-fit px-[1vw] border-transcendence-white bg-transcendence-beige flex flex-col items-center justify-center
					h-10 min-w-20 lg:h-20 lg:min-w-40 md:portrait:h-20 md:portrait:min-w-40">
					<h3 className="text-transcendence-black font-transcendence-two">{playerStats.wins}</h3>
				</div>
			</div>
			<div className="portrait:hidden text-transcendence-white w-full h-full flex flex-col items-center justify-center gap-1"><CircleDiagram percentage1={percentageWon} percentage2={percentageLost}/></div>
			<div className="w-full h-full flex flex-col items-center justify-center gap-1">
				<h2
					className="text-transcendence-white font-transcendence-three tracking-[0.2em]
					text-lg lg:text-2xl md:portrait:text-2xl">losses</h2>
				<div
					className="rounded-xl border-3 w-fit px-[1vw] border-transcendence-white flex flex-col items-center justify-center
					h-10 min-w-20 lg:h-20 lg:min-w-40 md:portrait:h-20 md:portrait:min-w-40">
					<h3 className="text-transcendence-white font-transcendence-two">{playerStats.losses}</h3>
				</div>
			</div>
			<div
				className="border-t-2 border-transcendence-white flex flex-col items-center justify-center text-center text-transcendence-white font-transcendence-three tracking-[0.2em] col-span-2
				text-xl lg:text-3xl md:portrait:text-3xl
				gap-1 lg:gap-4 md:portrait:gap-4">
				<h2>In total you have played</h2>
				<h2>{playerStats.gamesPlayed}</h2>
				<h2>games</h2>
			</div>
			<div
				className="w-full h-full flex flex-col items-center justify-center border-t-2 border-transcendence-white border-l-2
				portrait:border-l-0 portrait:col-span-2">
				<div className="min-w-[15%] portrait:min-w-[40%] portrait:h-[30%] w-fit h-[50%] px-[2vw] bg-transcendence-white rounded-2xl flex flex-col items-center justify-center">
				<h2
					className="font-transcendence-three tracking-[0.1em] font-bold
					text-xl lg:text-3xl md:portrait:text-3xl">RATING: {playerStats.rating}</h2>
				</div>
			</div>
		</div>
	)
}
