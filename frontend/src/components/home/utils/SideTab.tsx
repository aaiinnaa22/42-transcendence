type SideTabProps = {
	isOpen: boolean;
	children?: React.ReactNode;
}


export const SideTab = ({isOpen, children}: SideTabProps) =>
{
	return (
		<div
			className={"fixed top-33 right-0 h-[75%] w-70 bg-transcendence-beige rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-400 "
			+ (isOpen ? "translate-x-0" : "translate-x-[100%]")}>
			{children}
		</div>
	);
}