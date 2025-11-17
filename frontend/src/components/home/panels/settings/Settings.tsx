import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {LanguageSelector} from "./LanguageSelector"

export const Settings = () =>
{
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleLogOut = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		setError("");

		try {
			const response = await fetch("http://localhost:4241/auth/logout",
			{
				method: "POST",
				credentials: "include",
			});
			const data = await response.json();
			if (!response.ok || data.error)
			{
					throw new Error(data.error);
			}
			if (data.message === "Logged out successfully")
				navigate("/");
			else
				throw new Error("");
		}
		catch (err: any) {
			console.error("Login error:", err);
			setError(err.message || "Something went wrong. Please try again later.");
		};
	}

	return (
		<div className={"flex flex-col gap-6 lg:gap-15 items-center justify-center"}>
			<LanguageSelector/>
			<div className={"flex flex-col gap-2 text-center"}>
				<button
					className="text-transcendence-white font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold"
					onClick={handleLogOut}>
					Log out
				</button>
				<button className="text-transcendence-red font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold w-full">Delete account</button>
			</div>
		</div>
	);
}