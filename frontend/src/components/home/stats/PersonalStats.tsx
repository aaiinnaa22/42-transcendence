import {CircleDiagram} from "../utils/CircleDiagram";
import {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../../api/api";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { useTranslation } from "react-i18next";
import { fetchMatchHistory } from "../../../BackendFetch";

export const PersonalStats = () =>
{
	const navigate = useNavigate();
	const [playerStats, setPlayerStats] =	useState({
		wins:  0,
		losses: 0,
		gamesPlayed: 0,
		rating: 0,
	});
	const [matchHistory, setMatchHistory] = useState<any[]>([]);

	const percentageWon =
	playerStats.gamesPlayed > 0
		? (playerStats.wins / playerStats.gamesPlayed) * 100
		: 0;
	const percentageLost = 100 - percentageWon;
	const { t, i18n } = useTranslation();

	useEffect(() => {
		const getStats = async () => {
			try
			{
				const response = await fetchWithAuth( apiUrl('/users/me'), {
					method: "GET",
					credentials: "include",
				});
				const data = await response.json();
				if (!response.ok || data?.error || !data.playerStats)
					return ;
				setPlayerStats({
					wins: data.playerStats.wins ?? 0,
					losses: data.playerStats.losses ?? 0,
					gamesPlayed: data.playerStats.playedGames ?? 0,
					rating: data.playerStats.eloRating ?? 0,
				});
				if (data.username)
				{
					const history = await fetchMatchHistory(data.username);
					if (history)
						setMatchHistory(history);
				}
			}
			catch
			{
				//silently fail
			}
		};
		getStats();
	}, []);

	const formatNumber = (n : number) =>
		new Intl.NumberFormat(i18n.language, {
			notation: "compact",
			maximumFractionDigits: 1,
	}).format(n);

	return (
		<div className="relative w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] grid grid-cols-[auto_auto] grid-rows-[auto_auto] p-3
			portrait:grid-cols-[auto] portrait:grid-rows-[auto_auto_auto]">
			<button className="absolute text-transcendence-white font-transcendence-two tracking-[0.02em] flex items-center justify-center
			top-5 left-5 xl:top-10 xl:left-10
			text-xs xl:text-sm cursor-pointer"
			onClick={() => navigate("/home/leaderboard")}>
				<span className="material-symbols-outlined">arrow_forward</span>
				<h3 className="h-full">{t("stats.leaderboard")}</h3>
			</button>
			<div className="flex flex-row col-span-2">
				<div className="w-full h-full flex flex-col items-center justify-center gap-1">
					<h2
						className="text-transcendence-white font-transcendence-three tracking-[0.2em]
						text-lg lg:text-2xl md:portrait:text-2xl">{t("stats.wins")}</h2>
					<div
						className="rounded-xl border-3 w-fit px-[1vw] border-transcendence-white bg-transcendence-beige flex flex-col items-center justify-center
						h-10 min-w-20 lg:h-20 lg:min-w-40 md:portrait:h-20 md:portrait:min-w-40">
						<h3 className="text-transcendence-black font-transcendence-two">{formatNumber(playerStats.wins)}</h3>
					</div>
				</div>
				<div className="portrait:hidden text-transcendence-white w-full h-full flex flex-col items-center justify-center gap-1"><CircleDiagram percentage1={percentageWon} percentage2={percentageLost}/></div>
				<div className="w-full h-full flex flex-col items-center justify-center gap-1">
					<h2
						className="text-transcendence-white font-transcendence-three tracking-[0.2em]
						text-lg lg:text-2xl md:portrait:text-2xl">{t("stats.losses")}</h2>
					<div
						className="rounded-xl border-3 w-fit px-[1vw] border-transcendence-white flex flex-col items-center justify-center
						h-10 min-w-20 lg:h-20 lg:min-w-40 md:portrait:h-20 md:portrait:min-w-40">
						<h3 className="text-transcendence-white font-transcendence-two">{formatNumber(playerStats.losses)}</h3>
					</div>
				</div>
			</div>
			<div
				className="border-t-2 border-transcendence-white flex flex-col items-center justify-center text-center text-transcendence-white font-transcendence-three tracking-[0.2em]
				text-xl lg:text-3xl md:portrait:text-3xl
				gap-1 lg:gap-4 md:portrait:gap-4
				portrait:col-span-2">
				<h2>{t("stats.total", {amount: playerStats.gamesPlayed} )}</h2>
			</div>
			<div
				className="w-full h-full flex flex-row items-center justify-center gap-10 border-t-2 border-transcendence-white border-l-2
				portrait:border-l-0 portrait:col-span-2 px-10">
				<div className="bg-transcendence-beige rounded-2xl grid grid-cols-1 grid-rows-[1fr_7fr] p-2 h-22 w-28 lg:h-40 lg:w-50">
					<h3 className="text-xs lg:text-lg font-bold border-b pb-1 w-full text-center">
						{t("profile.history.recent")}
					</h3>
					{matchHistory.length > 0
						&& <ul className="flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
							{matchHistory.map((match, idx) => {
								const date = new Date(match.playedAt);
								const locale = i18n.language ?? "en";
								const timestamp = date.toLocaleDateString( locale, {
									month: "short",
									day: "numeric"
								});

								return (
								<li key={idx} className="flex flex-col gap-1 text-xs p-1 bg-transcendence-beige rounded">
									<div className="flex justify-between items-start gap-2">
										<span className="font-semibold break-words max-w-[65%]">
											{match.result === "win"
												? t("profile.history.win", { opponent: match.opponent })
												: t("profile.history.loss", { opponent: match.opponent })}
										</span>
										<span className={match.result === "win" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
											{match.result === "win" ? "+" : ""}{match.eloChange}
										</span>
									</div>
									<span className="text-xs text-gray-500">
										{timestamp}
									</span>
								</li>
								);
							})}
						</ul>
					}
				</div>
				<div className="flex items-center justify-center bg-transcendence-white rounded-2xl w-25 h-22 lg:w-50 lg:h-20 text-center">
					<h2
						className="font-transcendence-three tracking-[0.1em] font-bold
						text-xl lg:text-3xl lg:portrait:text-3xl">{t("stats.rating")}: {playerStats.rating}
					</h2>
				</div>
			</div>
		</div>
	)
}
