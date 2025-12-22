import { WIDTH, HEIGHT} from "./constants.js";

type VisualGameProps =
{
	pointsRef: React.RefObject<HTMLSpanElement | null>;
	pointsRef2: React.RefObject<HTMLSpanElement | null>;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
	screenIsPortrait: boolean;
	startHold: (key: string, id: number, dy: number) => void;
	stopHold: (key: string) => void;
	isTouchScreen: boolean;
};

const BUTTON_KEYS = {
    P1_UP: "p1_up",
    P1_DOWN: "p1_down",
    P2_UP: "p2_up",
    P2_DOWN: "p2_down",
} as const;

export const VisualGame = ({pointsRef, pointsRef2, canvasRef, screenIsPortrait, startHold, stopHold, isTouchScreen}: VisualGameProps) => {
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
			{isTouchScreen && (
				<span
					className="col-start-1 row-start-1 flex flex-col gap-10 text-right self-center portrait:self-end">
					<button
						onPointerDown={() => startHold(BUTTON_KEYS.P1_UP, 1, -1)}
						onPointerUp={() => stopHold(BUTTON_KEYS.P1_UP)}
						onPointerLeave={() => stopHold(BUTTON_KEYS.P1_UP)}
						className="text-transcendence-white text-5xl flex items-center justify-center rounded-full active:scale-90 transition select-none"
						aria-label="Player 1 Up">
						<span className="material-symbols-outlined rotate-270">play_circle</span>
					</button>
					<button
						onPointerDown={() => startHold(BUTTON_KEYS.P1_DOWN, 1, 1)}
						onPointerUp={() => stopHold(BUTTON_KEYS.P1_DOWN)}
						onPointerLeave={() => stopHold(BUTTON_KEYS.P1_DOWN)}
						className="text-transcendence-white text-5xl flex items-center justify-center rounded-full active:scale-90 transition select-none"
						aria-label="Player 1 Up">
						<span className="material-symbols-outlined rotate-90">play_circle</span>
					</button>
				</span>
			)}
			<span ref={pointsRef}
				className="text-transcendence-white font-transcendence-three text-4xl
					col-start-1 row-start-1 text-right self-start
					portrait:self-start portrait:text-right w-full">0</span>
			<span ref={pointsRef2}
				className="text-transcendence-white font-transcendence-three text-4xl
					col-start-3 row-start-1 text-left self-start
					portrait:self-end portrait:text-left w-full">0</span>
			{isTouchScreen && (
				<span
				className="col-start-3 row-start-1 flex flex-col gap-10 text-left self-center portrait:self-start">
					<button
						onPointerDown={() => startHold(BUTTON_KEYS.P2_UP, 2, -1)}
						onPointerUp={() => stopHold(BUTTON_KEYS.P2_UP)}
						onPointerLeave={() => stopHold(BUTTON_KEYS.P2_UP)}
						className="text-transcendence-white text-5xl flex items-center justify-center rounded-full active:scale-90 transition select-none"
						aria-label="Player 2 Up">
						<span className="material-symbols-outlined rotate-270">play_circle</span>
					</button>
					<button
						onPointerDown={() => startHold(BUTTON_KEYS.P2_DOWN, 2, 1)}
						onPointerUp={() => stopHold(BUTTON_KEYS.P2_DOWN)}
						onPointerLeave={() => stopHold(BUTTON_KEYS.P2_DOWN)}
						className=" text-transcendence-white text-5xl flex items-center justify-center rounded-full active:scale-90 transition select-none"
						aria-label="Player 2 Up">
						<span className="material-symbols-outlined rotate-90">play_circle</span>
					</button>
				</span>
			)}
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
