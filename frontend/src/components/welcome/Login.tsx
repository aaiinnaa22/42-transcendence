import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleLogin = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError("");

		try {
			const response = await fetch("http://localhost:4241/auth/login",
			{
				method: "POST",
				headers:{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({email, password,}),
			});
			const data = await response.json();
			if (!response.ok || data.error)
			{
				if (data.error === "Invalid user")
					throw new Error("No account found with this email.");
				else if (data.error === "Invalid password")
					throw new Error("The password you entered is incorrect.");
				else
					throw new Error(data.error || "Login failed. Please try again.");
			}
			if (data.message === "Login successful")
				navigate("/home");
			else
				throw new Error(data.message || "Something went wrong. Please try again later.");
		}
		catch (err: any) {
			console.error("Login error:", err);
			setError(err.message || "Something went wrong. Please try again later.");
		};
	};

	return (
		<form onSubmit={handleLogin} className="flex flex-col pt-[5vh] items-center font-transcendence-two text-transcendence-white text-left gap-10 landscape:gap-5 lg:landscape:gap-10">
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
			{error && <div className="text-red-500 text-sm landscape:text-xs lg:landscape:text-sm">{error}</div>}
			<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center mt-5 tracking-wider landscape:text-xs landscape:w-20 landscape:h-14 lg:landscape:text-lg lg:landscape:w-35 lg:landscape:h-18">
				<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">LOGIN</button>
			</div>
		</form>
	);
};