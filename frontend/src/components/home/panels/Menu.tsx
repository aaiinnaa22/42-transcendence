
import { useNavigate } from "react-router-dom";
import {Settings} from './settings/Settings'

const navItems = ["play", "stats", "profile"] as const;

type Page = typeof navItems[number];

type MenuProps =
{
	currentPage: Page;
	onNavigate: (page: Page) => void;
};

export const Menu = ({currentPage, onNavigate}: MenuProps) =>
{
	return (
		<div className="
		grid grid-cols-1 grid-rows-2
		landscape:grid-cols-2 landscape:grid-rows-1 w-full h-full p-[1vw] pt-[2vw] lg:p-[4vw]">
			<div className="landscape:pl-[5vh] border-b-3  border-transcendence-black landscape:border-r-3 landscape:border-b-0
			portrait:flex portrait:justify-center portrait:items-center">
				<div
					className="flex flex-col gap-6 items-center justify-center
					portrait:text-center landscape:!items-start">
					<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold pb-[2vh]">Menu</h1>
					<div className="flex flex-col gap-6 portrait:gap-8">
						{navItems.map((item) => {
						const isActive = currentPage == item;
						return (
							<div
								key={item}
								onClick={() => onNavigate(item)}
								className={"cursor-pointer flex flex-row items-center gap-2 "
								+ (isActive ? "font-bold" : "")}>
								<span className={"bg-transcendence-black w-3 h-3 rounded-full " + (isActive ? "border-2 border-t-transcendence-black bg-transcendence-white" : "")}>
								</span>
								<h2 className="text-black font-transcendence-two text-md">
									{item}
								</h2>
							</div>
						);
					})}
					</div>
				</div>
			</div>
			<div className="landscape:pl-[7vh] portrait:flex portrait:justify-center portrait:items-center">
				<Settings centralize={true}/>
			</div>
		</div>
	);
}