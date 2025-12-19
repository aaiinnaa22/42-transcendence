import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
const navItems = ["play", "stats", "profile"] as const;

type NavBarProps =
{
	onTogglePanel: (panel: "chat" | "menu") => void;
	currentPanel: "chat" | "menu" | null;
}

export const NavBar = ({onTogglePanel, currentPanel} :NavBarProps) =>
{
	const navigate = useNavigate();
	const location = useLocation();
	const {t} = useTranslation();

	const isActive = (path:string) => location.pathname.startsWith(`/home/${path}`);

	return (
		<div className="z-10 border-b-4 border-transcendence-black flex flex-row items-center justify-between h-18 lg:h-32 bg-transcendence-beige px-5 lg:px-10">
			<button className="font-transcendence-one font-extrabold text-5xl text-transcendence-black tracking-[0.8rem]"
				onClick={() => navigate("/home/play")}>{t("welcome.title")}</button>
			<div className="hidden h-full lg:flex flex-row sm:gap-5 md:gap-10 lg:gap-20 2xl:gap-30 font-transcendence-two text-2xl">
				{navItems.map((item) => {
					return (
						<button
							key={item}
							onClick={() => navigate(`/home/${item}`)}
							className={"mt-16 rounded-tl-xl rounded-tr-xl px-2 py-2 cursor-pointer border-2 "
							+ (isActive(item) ? "bg-white border-b-0 border-black" : "hover:pt-3 border-transcendence-beige")}>
							<h2 className="text-black font-normal text-center">
								{t(`navbar.${item}`)}
							</h2>
						</button>
					);
				})}
			</div>
			<div className="flex items-center justify-center gap-5">
				<div className="relative flex items-center justify-center group">
					<span className={"absolute top-1.25 w-[1.2em] h-[1.25em] bg-transparent " + (currentPanel === "chat" ? "!bg-transcendence-white" : "group-hover:bg-transcendence-white")}></span>
					<button
						className="relative material-symbols-outlined !text-3xl cursor-pointer"
						onClick={() => onTogglePanel("chat")}>
						chat_bubble
					</button>
				</div>
				<button
					className="lg:!hidden material-symbols-outlined !text-3xl cursor-pointer"
					onClick={() => onTogglePanel("menu")}>
						menu
				</button>
			</div>
		</div>
	);
};
