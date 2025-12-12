
const navItems = ["play", "stats", "profile"] as const;
import { useNavigate, useLocation } from "react-router-dom";

type MenuProps = {
	onPageChoose: () => void;
}

export const Menu = ({onPageChoose}: MenuProps) =>
{
	const navigate = useNavigate();
	const location = useLocation();
	const isActive = (path:string) => location.pathname.startsWith(`/home/${path}`);

	const handleNavigation = (path : string) => {
		navigate(`/home/${path}`);
		onPageChoose();
	}
	return (
		<div className="grid
			portrait:grid-cols-1 portrait:grid-rows-[20%_80%]
			grid-cols-1 grid-rows-[20%_80% gap-10 mt-[10vh]">
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold pb-[2vh] text-center">Menu</h1>
			<div className="flex gap-20
			portrait:flex-col portrait:justify-center portrait:items-center
			flex-row justify-center">
					<div className="flex flex-col gap-6 portrait:gap-8">
						{navItems.map((item) => {
						return (
							<button
								key={item}
								onClick={() => handleNavigation(item)}
								className={"cursor-pointer flex flex-row items-center gap-2 "
								+ (isActive(item) ? "font-bold" : "")}>
								<span className={"bg-transcendence-black w-3 h-3 rounded-full " + (isActive(item) ? "border-2 border-t-transcendence-black bg-transcendence-white" : "")}>
								</span>
								<h2 className="text-black font-transcendence-two text-md">
									{item}
								</h2>
							</button>
						);
						})}
					</div>
			</div>
		</div>
	);
}