import { useState, useEffect } from 'react'
import { NavBar } from "../components/home/NavBar";
import { PlayButton } from "../components/home/PlayButton";
import { Leaderboard } from "../components/home/stats/Leaderboard";
import { Profile } from "../components/home/Profile";
import { Game } from "../components/home/game/Game";
import { GameTournament } from '../components/home/game/GameTournament';
import { GameInvite } from '../components/home/game/GameInvite';
import { Menu } from "../components/home/panels/Menu"
import { SideTab } from "../components/home/utils/SideTab"
import { PopUp } from "../components/home/utils/PopUp"
import { PersonalStats } from '../components/home/stats/PersonalStats';
import { ChooseGameMode } from '../components/home/game/ChooseGameMode';
import { ExitTopLeft } from '../components/home/utils/ExitTopLeft';
import { ChatContainer } from '../components/home/panels/chat/ChatContainer';
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

export const Home = () => {
	const navigate = useNavigate();
	const [screenIsLarge, setScreenIsLarge] = useState(() => window.innerWidth >= 1024);
	const [currentPanel, setCurrentPanel] = useState<"menu" | "chat" | null>(null);

	const togglePanel = (panel: "chat" | "menu") => {
		setCurrentPanel(currentPanel === panel ? null : panel);
	};

	useEffect(() => {
		const handleResize = () => { setScreenIsLarge(window.innerWidth >= 1024); };

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="bg-transcendence-black w-[100vw] h-screen flex flex-col">
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
				<Route path="play/invite" element={<GameInvite/> } />
			</Routes>
				{screenIsLarge &&
					<SideTab isOpen={currentPanel === "chat"}><ChatContainer/></SideTab>}
				{!screenIsLarge &&
					<PopUp isOpen={currentPanel === "chat"}><ChatContainer/></PopUp>}
				<PopUp isOpen={currentPanel === "menu"}>
					<Menu onPageChoose={() => setCurrentPanel(null)}/>
				</PopUp>
		</div>
	)
};
