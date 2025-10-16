import { useNavigate } from "react-router-dom";
import GoogleSignIn from "../assets/web_dark_sq_na.svg";

export const Welcome = () => {
	const navigate = useNavigate();
	return (
		<div className="bg-transcendence-black min-h-screen w-full flex flex-col gap-30 items-center">
				<h1 className="text-transcendence-white font-transcendence-one font-extrabold text-6xl tracking-[0.8rem] text-center mt-80">PONG</h1>
				<div className="flex flex-col gap-5 justify-center text-2xl font-transcendence-two text-center">
					{/*<button className="text-white">
						<img src={GoogleSignIn} alt="google sign in" className="w-10 inline-block"/>Sign up with google
					</button>*/}
					<button onClick={() => navigate("/login")} className="bg-transcendence-beige text-transcendence-black w-35 h-15 cursor-pointer rounded-2xl hover:pt-2"> Login </button>
					<button onClick={() => navigate("signup")} className="bg-transcendence-beige text-transcendence-black w-35 h-15 cursor-pointer rounded-2xl hover:pt-2"> Sign up</button>
				</div>
		</div>
	);
};