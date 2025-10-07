import { useState } from 'react'
import './App.css'
import './index.css'
import {NavBar} from "./components/NavBar";
import {PlayButton} from "./components/PlayButton";

function App() {
  return (
   <div className="bg-transcendence-black h-screen w-screen flex flex-col gap-70">
		<NavBar></NavBar>
		<PlayButton></PlayButton>
	</div>
  )
}

export default App