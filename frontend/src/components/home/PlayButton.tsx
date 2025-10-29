
type PlayButtonProps =
{
	startGame: () => void;
};


export const PlayButton = ({startGame}: PlayButtonProps) =>
(
	<div className="flex flex-grow items-center justify-center">
		<button
			className="group relative bg-transcendence-beige rounded-[3rem] w-70 h-40 text-transcendence-black font-transcendence-three tracking-[0.1em] text-5xl cursor-pointer overflow-hidden"
			onClick={startGame}>
			PLAY
			<span className="absolute bottom-[35%] right-[26%] w-4 h-4 border-2 border-transcendence-black bg-white rounded-full transform -translate-y-1/2 group-hover:animate-[pingpongAnimation_1s_ease-in-out]" />
		</button>
	</div>
);