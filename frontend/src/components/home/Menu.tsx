
import { useNavigate } from "react-router-dom";
import {Settings} from './settings/Settings'

export const Menu = () =>
{
	const navigate = useNavigate();

	return (
		<div className="
		grid grid-cols-1 grid-rows-2
		landscape:grid-cols-2 landscape:grid-rows-1">
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold text-center">Menu</h1>
			<Settings centralize={true}/>
		</div>
	);
}