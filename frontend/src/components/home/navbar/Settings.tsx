import {ToggleButton} from "../../ToggleButton";
import {useState} from "react";

type SettingsProps = {
	isOpen: boolean;
}


export const Settings = ({isOpen}: SettingsProps) =>
{
	const [toggleOn, setToggleOn] = useState(false);
	return (
		<div
			className={"flex flex-col justify-between fixed top-60 right-0 h-100 w-60 bg-transcendence-beige rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-400 "
			+ (isOpen ? "translate-x-0" : "translate-x-[100%]")}>
			<div className="flex flex-col gap-6 pt-4 pl-6">
				<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold">Settings</h1>
				<div className="flex flex-col gap-3">
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
					<ToggleButton enabled={toggleOn} onToggle={() => setToggleOn(!toggleOn)}/>
				</div>
			</div>
			<div className="pl-6">
				<div className="border-3 px-3 border-transcendence-black w-40 rounded-lg flex flex-row justify-between">
					<h2 className="text-md">English</h2>
					<span className="material-symbols-outlined cursor-pointer">arrow_drop_down</span>
				</div>
			</div>
			<div className="mb-10 w-full text-center flex flex-col items-center">
				<div className="bg-transcendence-black w-25 h-9 rounded-xl flex justify-center items-center">
					<h2 className="text-transcendence-white font-transcendence-two text-md hover:pt-1">Log out</h2>
				</div>
			</div>
		</div>
	);
}