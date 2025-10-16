
const navItems = ["play", "leaderboard", "tournament"] as const;

type Page = typeof navItems[number];

type NavBarProps =
{
	currentPage: Page;
	onNavigate: (page: Page) => void;
};

export const NavBar = ({currentPage, onNavigate}: NavBarProps) =>
{
	return (
		<div className="flex flex-row items-center justify-between h-18 lg:h-32 bg-transcendence-beige px-10">
			<h1 className="font-transcendence-one font-extrabold text-5xl text-transcendence-black tracking-[0.8rem]">PONG</h1>
			<div className="hidden h-full lg:flex flex-row sm:gap-5 md:gap-10 lg:gap-20 2xl:gap-30 font-transcendence-two text-2xl">
				{navItems.map((item) => {
					const isActive = currentPage == item;
					return (
						<div
							key={item} 
							onClick={() => onNavigate(item)}
							className={"mt-16 rounded-tl-xl rounded-tr-xl px-2 py-2 cursor-pointer border-2 "
							+ (isActive ? "bg-white border-b-0 border-black" : "hover:pt-3 border-transcendence-beige")}>
							<h2 className="text-black font-normal text-center">
								{item}
							</h2>
						</div>
					);
				})}
			</div>
			<div className="flex flex-row gap-5">
				<span className="material-symbols-outlined !text-3xl">account_circle</span>
				<span className="material-symbols-outlined !text-3xl">settings</span>
			</div>
		</div>
	);
};
