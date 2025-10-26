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
			className={"fixed top-60 right-0 h-100 w-60 bg-transcendence-beige rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-400 "
			+ (isOpen ? "translate-x-0" : "translate-x-[100%]")}>
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold pt-4 pl-6">Settings</h1>
			<div className="flex flex-col gap-10 pt-4 pl-6 mt-2">
				<div className="flex flex-col gap-3">
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
				</div>
				<LanguageSelector/>
			</div>
			<div className="fixed bottom-15 w-full flex flex-col gap-1 pl-6">
				<div className="flex">
					<h2
						className="text-transcendence-black font-transcendence-two text-sm font-semibold cursor-pointer hover:font-bold"
						onClick={handleLogOut}>
						Log out
					</h2>
				</div>
				<div className="flex">
					<h2 className="text-transcendence-red font-transcendence-two text-sm font-semibold cursor-pointer hover:font-bold">Delete account</h2>
				</div>
			</div>
		</div>
	);
}