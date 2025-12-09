
import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import './index.css'
import { useAuth } from "./auth/AuthContext";
import {Home} from "./pages/Home";
import {Welcome} from "./pages/Welcome";
import {ProtectedRoute} from "./components/ProtectedRoute";
import { SignUp } from "./components/welcome/SignUp";
import { Login } from "./components/welcome/Login";

function AuthAwareIndex() {
  const { ready, authenticated } = useAuth();

  if (!ready) return <div>Loading...</div>;

  return authenticated
    ? <Navigate to="/home" replace />
    : <Navigate to="/welcome" replace />;
}

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<AuthAwareIndex />}/>

				<Route path="/welcome" element={<Welcome/>}>
					<Route path="login" element={<Login/>}/>
					<Route path="signup" element={<SignUp/>}/>
				</Route>
				<Route
					path="/home/*"
					element={
						<ProtectedRoute>
							<Home />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</Router>
	);
}

export default App