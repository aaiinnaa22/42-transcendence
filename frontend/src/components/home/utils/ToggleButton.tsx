
type ToggleButtonProps = {
	enabled: boolean;
	onToggle: () => void;
}

export const ToggleButton = ({enabled, onToggle}: ToggleButtonProps) =>
{
	return (
		<button
			onClick={onToggle}
			className={"relative h-6 w-10 rounded-xl border-2 border-transcendence-black " + (enabled ? "bg-transcendence-black" : "bg-gray-500")}>
			<span className={"absolute top-0 left-0 w-5 h-5 border-2 border-transcendence-black bg-transcendence-white rounded-full transform transition-transform duration-300 " + (enabled ? "translate-x-0" : "translate-x-4")}></span>
		</button>
	);
}