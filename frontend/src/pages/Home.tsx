import { useState } from 'react'
import {NavBar} from "../components/home/navbar/NavBar";
import {PlayButton} from "../components/home/PlayButton";
import {Stats} from "../components/home/Stats";
import {Profile} from "../components/home/Profile";
import {Game} from "../components/home/game/Game";
import {Settings} from "../components/home/settings/Settings";
import {Menu} from "../components/home/menu"
import {SideTab} from "../components/home/SideTab"
import {PopUp} from "../components/home/PopUp"

export const Home = () => {
	const [isGameOn, setGameOn] = useState(false);
	type Page = "play" | "stats" | "profile";
	const [currentPage, setCurrentPage] = useState<Page>("play");
	const [currentPanel, setCurrentPanel] = useState<"menu" | "settings" | null>(null);

	const togglePanel = (panel: "settings" | "menu") => {
		setCurrentPanel(currentPanel === panel ? null : panel);
	};

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
			<NavBar
				currentPage={currentPage}
				onNavigate={setCurrentPage}
				currentPanel={currentPanel}
				onTogglePanel={togglePanel}
			/>
			{renderPage()}
			{<SideTab isOpen={currentPanel === "settings"}><Settings centralize={false}/></SideTab>}
			{<PopUp isOpen={currentPanel === "menu"}><Menu/></PopUp>}
		</div>
	)
};