import { useState } from 'react'
import './App.css'
import './index.css'
import {NavBar} from "./components/navbar/NavBar";
import {PlayButton} from "./components/PlayButton";
import {Leaderboard} from "./components/Leaderboard";
import {Tournament} from "./components/Tournament";
import {Game} from "./components//Game";

function App() {
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

export default App