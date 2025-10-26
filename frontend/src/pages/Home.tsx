import { useState } from 'react'
import {NavBar} from "../components/home/navbar/NavBar";
import {PlayButton} from "../components/home/PlayButton";
import {Stats} from "../components/home/Stats";
import {Profile} from "../components/home/Profile";
import {Game} from "../components/home/Game";
import {Settings} from "../components/home/settings/Settings";

export const Home = () => {
	const [isGameOn, setGameOn] = useState(false);
	type Page = "play" | "stats" | "profile";
	const [currentPage, setCurrentPage] = useState<Page>("play");
	const [showSettings, setShowSettings] = useState(false);

	const renderPage = () =>
	{
		switch (currentPage)
		{
			case "stats":
				return <Stats/>
			case "profile":
				return <Profile/>;
			default:
				return !isGameOn
					? (<PlayButton startGame={() => setGameOn(true)}/>)
					: (<Game exitGame={() => setGameOn(false)}/>);
		}
	}
	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col">
			<NavBar currentPage={currentPage} onNavigate={setCurrentPage} onSettingsClick={() => setShowSettings(!showSettings)} activeSettings={showSettings}/>
			{renderPage()};
			{<Settings isOpen={showSettings}/>}
		</div>
	)
};