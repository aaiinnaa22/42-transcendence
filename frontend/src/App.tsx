import { useState } from 'react'
import './App.css'
import './index.css'
import {NavBar} from "./components/NavBar";
import {PlayButton} from "./components/PlayButton";

function App() {
  return (
   <div className="bg-transcendence-black min-h-screen w-full flex flex-col">
		<NavBar></NavBar>
		<PlayButton></PlayButton>
	</div>
  )
}

export default App