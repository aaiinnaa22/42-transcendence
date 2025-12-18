import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../api/api";

export const SignUp = () => {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSignUp = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError("");

		try {
			const response = await fetch( apiUrl('/auth/register'),
			{
				method: "POST",
				credentials: "include",
				headers:{
					"Content-Type": "application/json",
				},
				body: JSON.stringify({email, password, username,}),
			});
			const data = await response.json();
			if (!response.ok || data.error)
			{
				if ( response.status === 409 && data.message === "Already logged in" )
				{
					navigate("/home");
					return;
				}

				throw new Error(data.error || "Signup failed. Please try again.");
			}
			if (data.message === "Registration successful")
				navigate("/home");
			else if ( data.message === "Password too weak")
				throw new Error("Password must include at least one capital and lowercase letter, digit and must be at least 5 characters long.");
			else
				throw new Error(data.message || "Something went wrong. Please try again later.");
		}
		catch (err: any) {
			console.error("Signup error:", err);
			setError(err.message || "Something went wrong. Please try again later.");
		}
	};

	return (
		<form onSubmit={handleSignUp} className="flex flex-col pt-[5vh] items-center font-transcendence-two text-transcendence-white text-left gap-10 landscape:gap-4 lg:landscape:gap-10">
			<input
				type="text"
				placeholder="email"
				onChange={(e) => setEmail(e.target.value)}
				className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<input
				type="text"
				placeholder="username"
				onChange={(e) => setUsername(e.target.value)}
				className="border-1 rounded-lg placeholder:text-lg px-3 text-lg w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			<input
				type="password"
				placeholder="password"
				onChange={(e) => setPassword(e.target.value)}
				className="border-1 rounded-lg placeholder:text-lg px-3 text-2xl w-75 h-10 landscape:placeholder:text-sm landscape:text-sm landscape:w-60 landscape:h-8 lg:landscape:w-75 lg:landscape:h-10 lg:landscape:text-lg lg:landscape:placeholder:text-lg"/>
			{error && <div className="text-red-500 text-sm landscape:text-xs lg:landscape:text-sm">{error}</div>}
			<div className="bg-transcendence-beige flex rounded-2xl w-35 h-18 align-center text-md font-bold justify-center text-center tracking-wider landscape:text-xs landscape:w-20 landscape:h-14 lg:landscape:text-lg lg:landscape:w-35 lg:landscape:h-18">
				<button className="text-transcendence-black cursor-pointer hover:pt-2" type="submit">SUBMIT</button>
			</div>
		</form>
	);
};
