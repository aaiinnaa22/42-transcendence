import { useRef, useEffect, useState } from "react";
import { Waiting } from "./Waiting";
import { GameEnd } from "./GameEndTournament";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH } from './constants.js';
import { wsUrl } from "../../../api/api.js";
import { VisualGame } from "./VisualGame";
import { forceLogout } from "../../../api/forceLogout.js";

export const GameTournament = () =>
{
    // I am using useRef instead of useState so things persist when components load again and things wont't rerender
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const PointsRef = useRef<HTMLSpanElement | null>(null);
    const PointsRef2= useRef<HTMLSpanElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const keysPressed = useRef<Record<string, boolean>>({});
    const players = useRef<Record<string, any>>({});
    const ball = useRef<{ x: number; y: number; countdown?: number | undefined;}>({ x: 0, y: 0 , countdown: undefined });
	const [screenIsPortrait, setScreenIsPortrait] = useState<boolean>(
		window.matchMedia("(orientation: portrait)").matches
	);
	const holdIntervals = useRef<Record<string, number | null>>({});
	const didOpenRef = useRef(false);
	const [waitingData, setWaitingData] = useState<{ opponent: string } | null>(null);
	const [gameEndData, setGameEndData] = useState<{ winner: string; loser: string; eloWinner?: number; eloLoser?: number; eloWinnerOld?: number; message: string } | null>(null);
	const [isTouchScreen, setIsTouchScreen] = useState<boolean>(false);

	//Touch screen button managers
	const startHold = (key: string, o: number, dy: number) => {
		if (holdIntervals.current[key]) {
			clearInterval(holdIntervals.current[key]!);
		}
		void o;
		sendMove(dy);
		holdIntervals.current[key] = window.setInterval(() => {
			sendMove(dy);
		}, 20);
	};

	const stopHold = (key: string) => {
		if (holdIntervals.current[key]) {
			clearInterval(holdIntervals.current[key]!);
			holdIntervals.current[key] = null;
		}
	};

    // sends move command to backend server when player wants to move
    const sendMove = (dy: number) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "move", dy }));
        }
    };

    //registers what key was pressed and call sendMove function
    const updateGame = () => {
        //Perform action based on the keypressed
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) sendMove(-1);
        if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) sendMove(1);
    };

	const axisScale = () => {
		const canvas = canvasRef.current;
		if ( !canvas ) return { scaleX: 1, scaleY: 1 };

		const scaleX: number = canvas.width / WIDTH;
		const scaleY: number = canvas.height / HEIGHT;

		if ( scaleX === 0 || scaleY === 0 ) return { scaleX: 1, scaleY: 1 };
		return { scaleX, scaleY };
	};

    //draws the game based on the coordinates we got from the back end
    const  drawGame = () => {
		const canvas = canvasRef.current;
		if ( !canvas ) return;
        const ctx = canvas.getContext("2d");
		if ( !ctx ) return;

		const { scaleX, scaleY } = axisScale();

        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';

        // Draw players might fuck up the id is not a number
        for (const id in players.current)
        {
			const player = players.current[id];
			const scaledX = player.x * scaleX;
			const scaledY = player.y * scaleY;
			const scaledWidth = PADDLE_WIDTH * scaleX;
			const scaledHeight = PADDLE_LEN * scaleY;

			const pointsLeft = PointsRef.current;
			const pointsRight = PointsRef2.current;

            if (player.id === 1)
			{
				if (pointsLeft)
                	pointsLeft.textContent = player.points.toString();
			}
            else
			{
				if (pointsRight)
                	pointsRight.textContent = player.points.toString();
			}
            ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        }

		const displayCountdown = (ball.current.countdown !== undefined && ball.current.countdown > 0)

		// Draw countdown
		if (displayCountdown)
		{
			const scaledFontSize = canvas.height * 0.125;

			ctx.font = `${scaledFontSize}px Arial`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";

			const scaleCenterX = (WIDTH / 2) * scaleX;
			const scaleCenterY = (HEIGHT / 2) * scaleY;

			ctx.fillText(`${ball.current.countdown}`, scaleCenterX, scaleCenterY);

			// Reset alignment
			ctx.textAlign = "left";
			ctx.textBaseline = "alphabetic";
		}

        // Draw ball
		if (!displayCountdown)
		{
			const scaledBallX = ball.current.x * scaleX;
			const scaledBallY = ball.current.y * scaleY;
			const scaledBallSize = BALL_SIZE * scaleX;

			ctx.fillRect(scaledBallX, scaledBallY, scaledBallSize, scaledBallSize);
		}
    };

    useEffect(() => {
        let animationFrameId: number; // not needed ??
        const ws = new WebSocket( wsUrl('/game/multiplayer'));
        wsRef.current = ws;
		setWaitingData({ opponent: "opponent"});

        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
		const handleBlur = () => { keysPressed.current = {}; };
        window.addEventListener("keydown",handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("blur", handleBlur);

        ws.onopen = () => {
			console.log("Connected!");
			didOpenRef.current = true;
		}
		ws.onclose = (e) => {
		console.log("Game WS closed", e.code, e.reason);
		if (!didOpenRef.current) {
			console.warn("Game WS handshake failed, forcing logout");
			forceLogout();
			return;
		}
		if (e.code === 1008) {
			console.warn("Unauthorized game socket, forcing logout");
			forceLogout();
			return;
		}
		wsRef.current = null;
		console.log("Game socket disconnected normally");
		};

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "state")
			{
                players.current = data.players;
                ball.current = data.ball;
				ball.current.countdown = data.countdown;
				setWaitingData(null); // Clear waiting state when game starts
			}
			else if (data.type === "waiting")
			{
				console.log("Waiting in queue. Position: ", data.position);
				setWaitingData({ opponent: "opponent"});
			}
			else if (data.type === "error")
			{
				if (data.reason === "unauthorized") {
					console.warn("WebSocket unauthorized, forcing logout");
					forceLogout();
					return;
				}
				console.error("Error from server: ", data.message);
				if (data.error) console.error("Validation errors: ", data.error);
			}
			else if (data.type === "inactivity")
			{
				console.log("Game ended due to inactivity.");
				console.log("Winner is player " + data.winner);
			}
			else if (data.type === "end")
			{
				console.log( data.message );
				console.log( "The winner's new elo is " + data.elo.winner );
				setGameEndData({ winner: data.winner,
					loser: data.loser,
					eloWinner: data.elo.winner, 
					eloLoser: data.elo.loser, 
					eloWinnerOld: data.oldElo.winner, 
					message: data.message });
				//The game is still running in the background use cancelAnimationFrame(animationFrameId); probably needs to be stored in useRef
			}

			/* ADD ADDITIONAL STATES HERE */
		};

        // Main game loop that keeps calling different update functions
        const gameLoop = () => {
            updateGame(); //register key presses and move players
            drawGame(); // draws the game canvas TEST IF NEEDED BECAUSE THE GAME IS ALREADY DRAWN AFTER EACH MESSAGE
            animationFrameId = requestAnimationFrame(gameLoop); // syncs the game to the browser refress rate to make animation smooth
        };
        gameLoop();

		const getScreenOrientation = () => {
			const isPortrait = window.matchMedia("(orientation: portrait)").matches;
			setScreenIsPortrait(isPortrait);
		}

		const touchScreenMediaQuery = window.matchMedia("(pointer: coarse)");
		const checkTouch = () => {
			setIsTouchScreen(touchScreenMediaQuery.matches);
		};

 		checkTouch();
		getScreenOrientation();
		window.addEventListener("orientationchange", getScreenOrientation);
		window.addEventListener("resize", getScreenOrientation);
		touchScreenMediaQuery.addEventListener("change", checkTouch);

        // Clean up things
        return () => {
            ws.close();
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("orientationchange", getScreenOrientation);
			window.removeEventListener("resize", getScreenOrientation);
			touchScreenMediaQuery.removeEventListener("change", checkTouch);
        };
    },[]);

	return (
		<>
		{gameEndData && <GameEnd winner={gameEndData.winner} loser={gameEndData.loser} eloWinner={gameEndData.eloWinner} eloLoser={gameEndData.eloLoser} 
		eloWinnerOld={gameEndData.eloWinnerOld} message={gameEndData.message} />}
		{waitingData && <Waiting opponent={waitingData.opponent} />}
		{!gameEndData && !waitingData && (
			<VisualGame
				pointsRef={PointsRef}
				pointsRef2={PointsRef2}
				canvasRef={canvasRef}
				screenIsPortrait={screenIsPortrait}
				startHold={startHold}
				stopHold={stopHold}
				isTouchScreen={isTouchScreen}
			/>
		)}
		</>
	);
};
