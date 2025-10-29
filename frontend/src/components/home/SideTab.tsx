type SideTabProps = {
	isOpen: boolean;
	children?: React.ReactNode;
}


export const SideTab = ({isOpen, children}: SideTabProps) =>
{
	return (
		<div
			className={"pl-6 mt-0 pt-0 fixed top-60 right-0 h-100 w-60 bg-transcendence-beige rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-400 gap-0 "
			+ (isOpen ? "translate-x-0" : "translate-x-[100%]")}>
			{children}
		</div>
	);
}