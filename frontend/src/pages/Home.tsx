import { useState } from 'react'
import {NavBar} from "../components/home/NavBar";
import {PlayButton} from "../components/home/PlayButton";
import {Leaderboard} from "../components/home/stats/Leaderboard";
import {Profile} from "../components/home/Profile";
import {Game} from "../components/home/game/Game";
import {Settings} from "../components/home/panels/settings/Settings";
import {Menu} from "../components/home/panels/Menu"
import {SideTab} from "../components/home/utils/SideTab"
import {PopUp} from "../components/home/utils/PopUp"
import { PersonalStats } from '../components/home/stats/PersonalStats';

export const Home = () => {
	const [isGameOn, setGameOn] = useState(false);
	type Page = "play" | "stats" | "profile";
	const [currentPage, setCurrentPage] = useState<Page>("play");
	const [currentPanel, setCurrentPanel] = useState<"menu" | "settings" | null>(null);
	const [isPersonalStats, setIsPersonalStats] = useState(true);

	const togglePanel = (panel: "settings" | "menu") => {
		setCurrentPanel(currentPanel === panel ? null : panel);
	};

	const renderPage = () =>
	{
		switch (currentPage)
		{
			case "stats":
				return isPersonalStats
				? (<PersonalStats switchStats={() => setIsPersonalStats(false)}/>)
				: (<Leaderboard switchStats={() => setIsPersonalStats(true)}/>)
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
			<NavBar
				currentPage={currentPage}
				onNavigate={setCurrentPage}
				currentPanel={currentPanel}
				onTogglePanel={togglePanel}
			/>
			{renderPage()}
			{<SideTab isOpen={currentPanel === "settings"}><Settings centralize={false}/></SideTab>}
			{<PopUp isOpen={currentPanel === "menu"}><Menu currentPage={currentPage} onNavigate={setCurrentPage}/></PopUp>}
		</div>
	)
};