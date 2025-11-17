import GoogleSignIn from "../assets/googleSignIn.svg";
import { SignUp } from "../components/welcome/SignUp";
import { Login } from "../components/welcome/Login";
import {Route, Routes, useNavigate, useLocation} from "react-router-dom";

export const Welcome = () => {
	const navigate = useNavigate();
	const {pathname} = useLocation();

	return (
		<div className="bg-transcendence-black h-screen w-screen
		grid grid-cols-1 grid-rows-[35%_auto]">
			<div className="flex flex-col items-center justify-end pb-[3vh]">
				<h1 className="text-transcendence-white font-transcendence-one font-extrabold text-7xl tracking-[0.8rem] text-center landscape:text-5xl lg:landscape:text-7xl">PONG</h1>
				<div className="w-60 h-10 inline-flex justify-end mt-5 landscape:w-44 landscape:mt-3 lg:landscape:w-60 lg:landscape:mt-5">
					  {pathname === '/' ? (
							<div className="bg-transcendence-white rounded-full animate-bounce w-4 h-4 lg:w-5 lg:h-5" />
						) : (
							<h1 className="text-transcendence-white font-transcendence-two text-right tracking-wider w-full">
							{pathname === '/login' ? 'LOGIN' : pathname === '/signup' ? 'SIGN UP' : ''}
							</h1>
						)}
				</div>
			</div>
			<Routes>
				<Route path="/" element={
					<div className="pt-[5vh] flex flex-col gap-4 items-center text-xl font-transcendence-two text-center
					md:gap-6 landscape:gap-3 lg:landscape:gap-6 landscape:text-sm lg:landscape:text-xl">
						<img src={GoogleSignIn} onClick={() => window.location.href = "http://localhost:4241/auth/google"} alt="google sign in" className="w-45 hover:brightness-150 landscape:w-35 lg:landscape:w-45"/>
						<h2 className="text-transcendence-white text-lg landscape:text-sm lg:landscape:text-lg">or</h2>
						<button onClick={() => navigate("/login")} className="bg-transcendence-beige text-transcendence-black w-30 h-15 cursor-pointer rounded-2xl hover:pt-2 landscape:w-20 landscape:h-10 lg:landscape:w-30 lg:landscape:h-15"> Login </button>
						<button onClick={() => navigate("/signup")} className="bg-transcendence-beige text-transcendence-black w-30 h-15 cursor-pointer rounded-2xl hover:pt-2 landscape:w-20 landscape:h-10 lg:landscape:w-30 lg:landscape:h-15"> Sign up</button>
					</div>}>
				</Route>
				<Route path="/login" element={<Login/>}/>
				<Route path="/signup" element={<SignUp/>}/>
			</Routes>
		</div>
	);
};