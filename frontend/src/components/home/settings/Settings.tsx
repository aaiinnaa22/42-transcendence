import {ToggleButton} from "./ToggleButton";
import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {LanguageSelector} from "./LanguageSelector"

type SettingsProps=
{
	centralize: boolean;
}

export const Settings = ({centralize}: SettingsProps) =>
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
		<div className={"flex flex-col gap-6 " + (centralize ? "items-center" : "")}>
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold">Settings</h1>
			<div className="flex flex-col gap-10">
				<div className="flex flex-col gap-3">
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
				</div>
				<LanguageSelector/>
			</div>
			<h2
				className="text-transcendence-black font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold"
				onClick={handleLogOut}>
				Log out
			</h2>
			<h2 className="text-transcendence-red font-transcendence-two text-sm landscape:text-xs lg:landscape:text-sm font-semibold cursor-pointer hover:font-bold">Delete account</h2>
		</div>
	);
}