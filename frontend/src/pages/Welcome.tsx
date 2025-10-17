import GoogleSignIn from "../assets/googleSignIn.svg";
import { SignUp } from "./SignUp";
import { Login } from "./Login";
import {Route, Routes, useNavigate, useLocation} from "react-router-dom";

export const Welcome = () => {
	const navigate = useNavigate();
	const location = useLocation();

	let subtitle =
	(
		<div className="inline-flex justify-end w-60 mt-5">
			<div className="bg-transcendence-white rounded-full animate-bounce w-5 h-5 text-right"></div>
		</div>
	)
	if (location.pathname === "/login")
		subtitle = (<h1 className="text-transcendence-white font-transcendence-two mt-5 text-right tracking-wider w-60">LOGIN</h1>);
	else if (location.pathname === "/signup")
		subtitle = (<h1 className="text-transcendence-white font-transcendence-two mt-5 text-right tracking-wider w-60">SIGN UP</h1>);
	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col gap-30 items-center py-40">
			<div>
				<h1 className="text-transcendence-white font-transcendence-one font-extrabold text-7xl tracking-[0.8rem] text-center">PONG</h1>
				{subtitle}
			</div>
			<Routes>
				<Route path="/" element={
					<div className="flex flex-col gap-6 justify-center items-center text-xl font-transcendence-two text-center">
						<img src={GoogleSignIn} alt="google sign in" className="w-45 hover:brightness-150"/>
						<h2 className="text-transcendence-white text-lg">or</h2>
						<button onClick={() => navigate("/login")} className="bg-transcendence-beige text-transcendence-black w-30 h-15 cursor-pointer rounded-2xl hover:pt-2"> Login </button>
						<button onClick={() => navigate("/signup")} className="bg-transcendence-beige text-transcendence-black w-30 h-15 cursor-pointer rounded-2xl hover:pt-2"> Sign up</button>
					</div>}>
				</Route>
				<Route path="/login" element={<Login></Login>}></Route>
				<Route path="/signup" element={<SignUp></SignUp>}></Route>
			</Routes>
		</div>
	);
};