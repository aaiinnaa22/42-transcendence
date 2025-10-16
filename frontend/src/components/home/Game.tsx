
type GameProps = {
	exitGame: () => void;
};

export const Game = ({exitGame}: GameProps) =>
(
	<div>
		<button
			className="bg-transcendence-beige text-transcendence-black"
			onClick={exitGame}>
			Hello from Game! Press to exit.
		</button>
	</div>
);