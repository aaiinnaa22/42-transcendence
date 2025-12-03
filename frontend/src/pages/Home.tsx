import { useState, useEffect } from 'react'
import { Chat } from '../components/home/panels/chat/Chat';
import { NavBar } from "../components/home/NavBar";
import { PlayButton } from "../components/home/PlayButton";
import { Leaderboard } from "../components/home/stats/Leaderboard";
import { Profile } from "../components/home/Profile";
import { Game } from "../components/home/game/Game";
import { GameTournament } from '../components/home/game/GameTournament';
import { Menu } from "../components/home/panels/Menu"
import { SideTab } from "../components/home/utils/SideTab"
import { PopUp } from "../components/home/utils/PopUp"
import { PersonalStats } from '../components/home/stats/PersonalStats';
import { ChooseGameMode } from '../components/home/game/ChooseGameMode';
import { ExitTopLeft } from '../components/home/utils/ExitTopLeft';
import { Discussion } from '../components/home/panels/chat/Discussion';

export const Home = () => {
	type Page = "play" | "stats" | "profile";
	type GameMode = "singleplayer" | "tournament";

	const [currentPage, setCurrentPage] = useState<Page>("play");
	const [currentPanel, setCurrentPanel] = useState<"menu" | "chat" | null>(null);
	const [isPersonalStats, setIsPersonalStats] = useState(true);
	const [currentGamePage, setCurrentGamePage] = useState<"playButton" | "chooseGame" | "gamePlay">("playButton");
	const [currentChat, setCurrentChat] = useState<"chat" | "discussion">("chat");
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

	const renderChat = () =>
	{
		switch (currentChat)
		{
			case "chat":
				return <Chat onChatClick={() => setCurrentChat("discussion")}/>
			case "discussion":
				return <Discussion onExitClick={() => setCurrentChat("chat")}/>
		}
	}
	const [screenIsLarge, setScreenIsLarge] = useState(() => window.innerWidth >= 1024);

	useEffect(() => {
		const handleResize = () => {
		setScreenIsLarge(window.innerWidth >= 1024);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		function setVhVw() {
		const vh = window.innerHeight * 0.01;
		const vw = window.innerWidth * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
		document.documentElement.style.setProperty('--vw', `${vw}px`);
		}

		setVhVw();
		window.addEventListener('resize', setVhVw);

		return () => window.removeEventListener('resize', setVhVw);
}, []);


	console.log("Home currentPanel:", currentPanel, "SideTab isOpen:", currentPanel === "chat", "PopUp isOpen:", currentPanel === "menu");
	return (
		<div className="bg-transcendence-black w-[100vw] flex flex-col md:shadow-transcendence-beige"
		        style={{
    height: 'calc(var(--vh, 1vh) * 100)',
  }}>
			<NavBar
				currentPage={currentPage}
				onNavigate={setCurrentPage}
				currentPanel={currentPanel}
				onTogglePanel={togglePanel}
			/>
			{renderPage()}
			{screenIsLarge &&
				<SideTab isOpen={currentPanel === "chat"}>{renderChat()}</SideTab>}
			{!screenIsLarge &&
				<PopUp isOpen={currentPanel === "chat"}>{renderChat()}</PopUp>}
			<PopUp isOpen={currentPanel === "menu"}>
				<Menu
					currentPage={currentPage}
					onNavigate={(page) => {setCurrentPage(page); setCurrentPanel(null);}}/>
			</PopUp>
		</div>
	)
};
