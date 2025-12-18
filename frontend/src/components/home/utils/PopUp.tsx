type PopUpProps =
{
	isOpen: boolean;
	children?: React.ReactNode;
}

export const PopUp = ({isOpen, children}: PopUpProps) =>
{
	return (
		<div
			className={"z-40 lg:hidden fixed w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] mt-[4.5rem] lg:mt-[8rem] bg-transcendence-beige transform transition-transform duration-400 "
			+ (isOpen ? "translate-y-0" : "translate-y-[100%]")}>
			{children}
		</div>
	);
}