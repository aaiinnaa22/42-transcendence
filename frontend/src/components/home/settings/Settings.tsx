import {ToggleButton} from "./ToggleButton";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {LanguageSelector} from "./LanguageSelector"

type SettingsProps = {
	isOpen: boolean;
}


export const Settings = ({isOpen}: SettingsProps) =>
{
	const [toggleOn, setToggleOn] = useState(false);
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
		<div
			className={"pt-18 lg:pl-6 landscape:mt-0 lg:landscape:mt-5 mt-5 lg:mt-0 lg:pt-0 fixed w-full h-full lg:top-60 lg:right-0 lg:h-100 lg:w-60 bg-transcendence-beige lg:rounded-tl-2xl lg:rounded-bl-2xl transform transition-transform duration-400 flex flex-col items-center gap-5 lg:gap-0 lg:flex-none lg:items-start "
			+ (isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-[100%] lg:translate-y-0 lg:translate-x-[100%]")}>
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold mt-4 landscape:text-md lg:landscape:text-lg">Settings</h1>
			<div className="flex flex-col gap-10 landscape:gap-6 lg:landscape:gap-10 mt-4 landscape:mt-0 lg:landscape:mt-4">
				<div className="flex flex-col gap-3 landscape:gap-3 lg:landscape:gap-3">
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
				</div>
				<LanguageSelector/>
			</div>
			<div className="lg:fixed lg:bottom-15 lg:w-full flex flex-col items-center lg:items-start gap-1 mt-10 lg:mt-4 landscape:mt-0 lg:landscape:mt-4">
				<h2
					className="text-transcendence-black font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold"
					onClick={handleLogOut}>
					Log out
				</h2>
				<h2 className="text-transcendence-red font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold">Delete account</h2>
			</div>
		</div>
	);
}