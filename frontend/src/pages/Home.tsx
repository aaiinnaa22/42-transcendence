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
import {Routes, Route, useNavigate, Navigate} from "react-router-dom";

export const Home = () => {
	const navigate = useNavigate();
	const [screenIsLarge, setScreenIsLarge] = useState(() => window.innerWidth >= 1024);
	const [currentPanel, setCurrentPanel] = useState<"menu" | "chat" | null>(null);


	const togglePanel = (panel: "chat" | "menu") => {
		setCurrentPanel(currentPanel === panel ? null : panel);
	};

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

	const [currentChat, setCurrentChat] = useState<"chat" | "discussion">("chat");

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


	return (
		<div className="bg-transcendence-black w-[100vw] flex flex-col md:shadow-transcendence-beige"
		        style={{
    height: 'calc(var(--vh, 1vh) * 100)',
  }}>
			<NavBar currentPanel={currentPanel} onTogglePanel={togglePanel}/>
			<Routes>
				<Route index element={<Navigate to="play" replace/>}/>
				<Route path="play" element={<PlayButton/>}/>
				<Route path="play/choose" element={<ExitTopLeft onExitClick={() => navigate("/home/play")}>
					<ChooseGameMode/></ExitTopLeft>}/>
				<Route path="play/single" element={<ExitTopLeft onExitClick={() => navigate("/home/play")}>
						<Game/></ExitTopLeft>}/>
				<Route path="play/tournament" element={<ExitTopLeft onExitClick={() => navigate("/home/play")}>
						<GameTournament/></ExitTopLeft>}/>
				<Route path="stats" element={<PersonalStats/>}/>
				<Route path="stats/leaderboard" element={<Leaderboard/>}/>
				<Route path="profile" element={<Profile/>}/>
			</Routes>
				{screenIsLarge &&
					<SideTab isOpen={currentPanel === "chat"}>{renderChat()}</SideTab>}
				{!screenIsLarge &&
					<PopUp isOpen={currentPanel === "chat"}>{renderChat()}</PopUp>}
				<PopUp isOpen={currentPanel === "menu"}>
					<Menu onPageChoose={() => setCurrentPanel(null)}/>
				</PopUp>
		</div>
	)
};
