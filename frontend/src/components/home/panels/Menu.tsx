
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = ["play", "stats", "leaderboard", "profile"] as const;

type MenuProps = {
	onPageChoose: () => void;
}

export const Menu = ({onPageChoose}: MenuProps) =>
{
	const navigate = useNavigate();
	const location = useLocation();
	const isActive = (path:string) => location.pathname.startsWith(`/home/${path}`);

	const {t} = useTranslation();

	const handleNavigation = (path : string) => {
		navigate(`/home/${path}`);
		onPageChoose();
	}
	return (
		<div className="grid
			portrait:grid-cols-1 portrait:grid-rows-[20%_80%]
			grid-cols-1 grid-rows-[20%_80%] gap-4 mt-4">
			<h1 className="text-transcendence-black font-transcendence-two text-lg font-semibold pb-[2vh] text-center uppercase">
				{t("home.menu")}
			</h1>
			<div className="flex gap-8
			portrait:flex-col portrait:justify-center portrait:items-center
			flex-row justify-center">
					<div className="flex flex-col gap-4 portrait:gap-6">
						{navItems.map((item) => {
						return (
							<button
								key={item}
								onClick={() => handleNavigation(item)}
								className={"cursor-pointer flex flex-row items-center gap-4 relative"}>
								<span 	className={"bg-transcendence-black w-3 h-3 rounded-full " + (isActive(item) ? "border-2 border-t-transcendence-black bg-transcendence-white" : "")}
										aria-hidden="true"
								/>
								<span className={"text-black font-transcendence-two text-md relative " +
									(isActive(item) ? "font-bold" : "hover:font-bold") +
									" after:content-[attr(data-text)] after:font-bold after:opacity-0 after:block after:h-0 after:overflow-hidden after:pointer-events-none after:select-none"}
									data-text={t(`navbar.${item}`)}>
									{t(`navbar.${item}`)}
								</span>
							</button>
						);
						})}
					</div>
			</div>
		</div>
	);
}
