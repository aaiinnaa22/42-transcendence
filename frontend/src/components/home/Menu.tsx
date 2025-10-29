
import { useNavigate } from "react-router-dom";
import {Settings} from './settings/Settings'

export const Menu = () =>
{
	const navigate = useNavigate();

	return (
		<div className="
		grid grid-cols-1 grid-rows-2
		landscape:grid-cols-2 landscape:grid-rows-1 w-full h-full p-[4vw] gap-[2vw]">
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold portrait:text-center landscape:border-r-3 landscape:border-b-0 border-b-3  border-transcendence-black">Menu</h1>
			<Settings centralize={true}/>
		</div>
	);
}