import { useState } from 'react'
import {NavBar} from "../components/home/navbar/NavBar";
import {PlayButton} from "../components/home/PlayButton";
import {Leaderboard} from "../components/home/Leaderboard";
import {Tournament} from "../components/home/Tournament";
import {Game} from "../components/home/Game";

export const Home = () => {
	const [isGameOn, setGameOn] = useState(false);
	type Page = "play" | "leaderboard" | "tournament";
	const [currentPage, setPage] = useState<Page>("play");

	const renderPage = () =>
	{
		switch (currentPage)
		{
			case "leaderboard":
				return <Leaderboard></Leaderboard>;
			case "tournament":
				return <Tournament></Tournament>;
			default:
				return !isGameOn
					? (<PlayButton startGame={() => setGameOn(true)} ></PlayButton>)
					: (<Game exitGame={() => setGameOn(false)}></Game>);
		}
	}
	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col">
			<NavBar currentPage={currentPage} onNavigate={setPage}></NavBar>
			{renderPage()};
		</div>
	)
};