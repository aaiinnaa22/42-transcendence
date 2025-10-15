
type PlayButtonProps =
{
	startGame: () => void;
};


export const PlayButton = ({startGame}: PlayButtonProps) =>
(
	<div className="flex flex-grow flex-row items-center justify-center">
		{/* group relative*/}
		<button 
			className="group relative bg-transcendence-beige rounded-[3rem] w-70 h-40 text-transcendence-black font-transcendence-three tracking-[0.1em] text-5xl cursor-pointer overflow-hidden"
			onClick={startGame}>
			PLAY
			{/*<span className="absolute top-[75%] left-[15%] w-4 h-4 border-2 border-transcendence-black bg-white rounded-full transform -translate-y-1/2 group-hover:animate-[pingpong_0.6s_ease-in-out_forwards]" />*/}
		</button>
	</div>
);