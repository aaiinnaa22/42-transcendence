import GoogleSignIn from "../assets/googleSignIn.svg";
import { SignUp } from "../components/welcome/SignUp";
import { Login } from "../components/welcome/Login";
import {Route, Routes, useNavigate, useLocation} from "react-router-dom";

export const Welcome = () => {
	const navigate = useNavigate();
	const {pathname} = useLocation();

	const subtitle = pathname === "/"
		? (
			<div className="inline-flex justify-end w-60 mt-5 landscape:w-44 landscape:mt-3 lg:landscape:w-60 lg:landscape:mt-5">
				<div className="bg-transcendence-white rounded-full animate-bounce w-5 h-5 text-right landscape:w-4 landscape:h-4 lg:landscape:w-5 lg:landscape:h-5"></div>
			</div>
		)
		: pathname === "/login"
		? (<h1 className="text-transcendence-white font-transcendence-two mt-5 text-right tracking-wider w-60 landscape:w-44 lg:landscape:w-60 landscape:mt-3 lg:landscape:mt-5 landscape:text-sm lg:landscape:text-lg">LOGIN</h1>)
		: pathname === "/signup"
		? (<h1 className="text-transcendence-white font-transcendence-two mt-5 text-right tracking-wider w-60 landscape:w-44 lg:landscape:w-60 landscape:mt-3 lg:landscape:mt-5 landscape:text-sm lg:landscape:text-lg">SIGN UP</h1>)
		: null;

	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col gap-15 md:gap-30 items-center py-20 md:py-60 landscape:py-5 landscape:gap-8 lg:landscape:py-30 lg:landscape:gap-25 xl:landscape:pt-40">
			<div>
				<h1 className="text-transcendence-white font-transcendence-one font-extrabold text-7xl tracking-[0.8rem] text-center landscape:text-5xl lg:landscape:text-7xl">PONG</h1>
				{subtitle}
			</div>
			<Routes>
				<Route path="/" element={
					<div className="flex flex-col gap-4 md:gap-6 justify-center items-center text-xl font-transcendence-two text-center landscape:text-sm lg:landscape:text-xl">
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