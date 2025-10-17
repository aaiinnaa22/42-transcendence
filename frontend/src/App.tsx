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

export default App