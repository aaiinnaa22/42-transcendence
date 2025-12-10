import { useRef, useEffect, useState } from "react";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH } from "./constants.ts";
import { VisualGame } from "./VisualGame.tsx";


export const Game = () =>
{
    // I am using useRef instead of useState so things persist when components load again and things wont't rerender
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const PointsRef = useRef<HTMLSpanElement | null>(null);
    const PointsRef2= useRef<HTMLSpanElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const keysPressed = useRef<Record<string, boolean>>({});
    const players = useRef<Record<string, any>>({});
    const ball = useRef<{ x: number; y: number; countdown?: number;}>({ x: 0, y: 0 , countdown: undefined });
	const [screenIsPortrait, setScreenIsPortrait] = useState<boolean>(
		window.matchMedia("(orientation: portrait)").matches
	);

    // sends move command to backend server when player wants to move
    const sendMove = (id: number, dy: number) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "move", id, dy }));
        }
    };

    //registers what key was pressed and call sendMove function
    const updateGame = () => {
        //Perform action based on the keypressed
        if (keysPressed.current["ArrowUp"]) sendMove(2, -1);
        if (keysPressed.current["ArrowDown"]) sendMove(2, 1);
        if (keysPressed.current["w"]) sendMove(1, -1);
        if (keysPressed.current["s"]) sendMove(1, 1);
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
        const ws = new WebSocket('ws://localhost:4241/game/singleplayer');

        wsRef.current = ws;

        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
		const handleBlur = () => { keysPressed.current = {}; };
        window.addEventListener("keydown",handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("blur", handleBlur);

        ws.onopen = () => {console.log("Connected!");}
        ws.onclose = () => {console.log("Disconnected!");};

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "state")
			{
                players.current = data.players;
                ball.current = data.ball;
				ball.current.countdown = data.countdown;
        	}
			else if (data.type === "waiting")
			{
				console.log("Waiting in queue.");
			}
			else if (data.type === "error")
			{
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
				if ( data.winner )
				{
					console.log( "The winner was the " + data.winner + " player with " + data.score.winner + " points!" );
				}
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

		// Handle resize
		// const handleResize = () => {
		// 	const canvas = canvasRef.current;
		// 	const isPortrait = window.innerHeight > window.innerWidth;
		// 	if (canvas)
		// 	{
		// 		if (isPortrait)
		// 		{
		// 			canvas.width = HEIGHT;
		// 			canvas.height = WIDTH;
		// 		}
		// 		else
		// 		{
		// 			canvas.width = WIDTH;
		// 			canvas.height = HEIGHT;
		// 		}
		// 	}
		// };

		const getScreenOrientation = () => {
			const isPortrait = window.matchMedia("(orientation: portrait)").matches;
			setScreenIsPortrait(isPortrait);
		}

		getScreenOrientation();
		window.addEventListener("orientationchange", getScreenOrientation);
		window.addEventListener("resize", getScreenOrientation);
		//window.addEventListener("resize", handleResize);

        // Clean up things
        return () => {
            ws.close();
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("blur", handleBlur);
			//window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", getScreenOrientation);
			window.removeEventListener("resize", getScreenOrientation);
        };
    },[]); // Not sure if I should have different parameters here. [] calls the useEffect only once when the component is loaded ??/

	return (<VisualGame pointsRef={PointsRef} pointsRef2={PointsRef2} canvasRef={canvasRef} screenIsPortrait={screenIsPortrait}/>)
};
