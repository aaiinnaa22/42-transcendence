import { useState } from 'react'
import { NavBar } from "../components/home/NavBar";
import { PlayButton } from "../components/home/PlayButton";
import { Leaderboard } from "../components/home/stats/Leaderboard";
import { Profile } from "../components/home/Profile";
import { Game } from "../components/home/game/Game";
import { GameTournament } from '../components/home/game/GameTournament';
//import {Settings} from "../components/home/panels/settings/Settings";
import { Menu } from "../components/home/panels/Menu"
import { SideTab } from "../components/home/utils/SideTab"
import { PopUp } from "../components/home/utils/PopUp"
import { PersonalStats } from '../components/home/stats/PersonalStats';
import { ChooseGameMode } from '../components/home/game/ChooseGameMode';
import { ExitTopLeft } from '../components/home/utils/ExitTopLeft';

export const Home = () => {
	type Page = "play" | "stats" | "profile";
	type GameMode = "singleplayer" | "tournament";

	const [currentPage, setCurrentPage] = useState<Page>("play");
	const [currentPanel, setCurrentPanel] = useState<"menu" | "chat" | null>(null);
	const [isPersonalStats, setIsPersonalStats] = useState(true);
	const [currentGamePage, setCurrentGamePage] = useState<"playButton" | "chooseGame" | "gamePlay">("playButton");
	const [gameMode, setGameMode] = useState<GameMode>("singleplayer");

	const togglePanel = (panel: "chat" | "menu") => {
		setCurrentPanel(currentPanel === panel ? null : panel);
	};

	const selectGameMode = (mode: GameMode) =>
	{
		setGameMode(mode);
		setCurrentGamePage("gamePlay");
	};

	const renderGame = () =>
	{
		switch (currentGamePage)
		{
			case "chooseGame":
				return (
					<ExitTopLeft onExitClick={() => setCurrentGamePage("playButton")}>
					<ChooseGameMode
						onSinglePlayerChoose = {() => selectGameMode("singleplayer")}
						onTournamentChoose = {() => selectGameMode("tournament")}
					/></ExitTopLeft>
				);
			case "gamePlay":
				return (
					<ExitTopLeft onExitClick={() => setCurrentGamePage("playButton")}>
						{ gameMode === "singleplayer" ? <Game/> : <GameTournament/> }
					</ExitTopLeft>
				);
			default:
				return <PlayButton onButtonClick={() => setCurrentGamePage("chooseGame")}/>;
		}
	}

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
				return renderGame();
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
			{<SideTab isOpen={currentPanel === "chat"}><div>chat</div></SideTab>}
			{<PopUp isOpen={currentPanel === "menu"}><Menu currentPage={currentPage} onNavigate={setCurrentPage}/></PopUp>}
		</div>
	)
};
