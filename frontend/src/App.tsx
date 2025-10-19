import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './index.css'
import {Home} from "./pages/Home";
import {Welcome} from "./pages/Welcome";

function App() {
	const [isLoggedIn, setLoggedIn] = useState(false);
	return (
		<Router>
			<Routes>
				<Route path="/*" element={<Welcome/>} />
				<Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/" replace/>} />
			</Routes>
		</Router>
	);
};

/*function App() {
	const [isGameOn, setGameOn] = useState(false);
	return (
	<div className="bg-transcendence-black min-h-screen w-full flex flex-col">
		<NavBar></NavBar>
		{!isGameOn ?
			(<PlayButton startGame={() => setGameOn(true)}></PlayButton>) :
			(<GameComponent exitGame={() => setGameOn(false)}></GameComponent>)
		}
	</div>
  )
}*/

export default App