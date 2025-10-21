
import { BrowserRouter as Router, Routes, Route,} from "react-router-dom";
import './index.css'
import {Home} from "./pages/Home";
import {Welcome} from "./pages/Welcome";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/*" element={<Welcome/>} />
				<Route path="/home" element={<Home />} />
			</Routes>
		</Router>
	);
};

export default App