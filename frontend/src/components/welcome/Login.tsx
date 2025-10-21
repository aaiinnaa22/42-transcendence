import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		const response = await fetch("http://localhost:4241/auth/login",
		{
			method: "POST",
			headers:{
				"Content-Type": "application/json",
			},
			body: JSON.stringify({email, password,}),
		});
		const data = await response.json();
		if (data.message === "Login successful")
			navigate("/home");
		else
			console.error(data.message || "Login failed");
	};

	return (
		<form onSubmit={handleLogin} className="flex flex-col justify-center items-center font-transcendence-two text-transcendence-white text-left gap-10 landscape:gap-5 lg:landscape:gap-10">
			<input
				type="text"
				placeholder="email"
				onChange={(e) => setEmail(e.target.value)}
				className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<input
				type="password"
				placeholder="password"
				onChange={(e) => setPassword(e.target.value)}
				className="border-1 rounded-lg placeholder:text-lg px-3 text-2xl w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center mt-5 tracking-wider landscape:text-xs landscape:w-20 landscape:h-14 lg:landscape:text-lg lg:landscape:w-35 lg:landscape:h-18">
				<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">LOGIN</button>
			</div>
		</form>
	);
};