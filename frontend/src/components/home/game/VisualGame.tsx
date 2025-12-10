import { WIDTH, HEIGHT} from "./constants.ts";

type VisualGameProps =
{
	pointsRef: React.RefObject<HTMLSpanElement | null>;
	pointsRef2: React.RefObject<HTMLSpanElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	screenIsPortrait: boolean;
};

export const VisualGame = ({pointsRef, pointsRef2, canvasRef, screenIsPortrait}: VisualGameProps) => {
	return (
		<div className="w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] p-[2.5rem] xl:p-[8rem] portrait:p-[2.5rem]">
		{screenIsPortrait && (
			<div className="h-full w-full flex items-center justify-center">
				<div className="bg-transcendence-red text-center p-8 rounded-xl">
					<h2 className="text-transcendence-white font-bold font-transcendence-two">switch your device to horizontal mode to play the game!</h2>
				</div>
			</div>)}
		{!screenIsPortrait && (<div className="w-full h-full relative grid grid-cols-[1fr_auto_1fr] grid-rows-[auto]
		gap-[2vw]">
			<span ref={pointsRef}
				className="text-transcendence-white font-transcendence-three text-4xl
					col-start-1 row-start-1 text-right self-center
					portrait:self-end portrait:text-right">0</span>
			<span ref={pointsRef2}
				className="text-transcendence-white font-transcendence-three text-4xl
					col-start-3 row-start-1 text-left self-center
					portrait:self-start portrait:text-left">0</span>
			<div className="
				flex-grow flex items-center justify-center
				border-4 border-transcendence-white rounded-xl overflow-hidden
				col-start-2 portrait:col-span-1">
				<canvas
					ref={canvasRef}
					width={WIDTH}
					height={HEIGHT}
					className="w-full h-full"
				/>
			</div>
		</div>)}
	</div>)
}