
type PlayButtonProps =
{
	startGame: () => void;
};

/*
	-translate-y = moves the whole div upwards
*/
export const PlayButton = ({startGame}: PlayButtonProps) =>
(
	<div className="flex flex-grow flex-row items-center justify-center -translate-y-1 sm:-translate-y-1 md:-translate-y-5 lg:-translate-y-12">
		<button
			className= "bg-transcendence-beige rounded-[3rem] w-70 h-40 text-transcendence-black font-transcendence-three tracking-[0.1em] text-5xl"
			onClick={startGame}
		>PLAY
		</button>
	</div>
);