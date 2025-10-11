import { useState } from 'react'
import './App.css'
import './index.css'
import {NavBar} from "./components/NavBar";
import {PlayButton} from "./components/PlayButton";

function App() {
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
}

export default App