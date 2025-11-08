import React, { useRef, useEffect, useState } from "react";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN } from "./constants.ts";

type GameProps = {
	exitGame: () => void;
};

export const Game = ({exitGame}: GameProps) =>
{
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const status = document.getElementById('status');
    //const canvas = document.getElementById('game');
    let players = {};
    let ball = { x: 0, y: 0 }; // initialize ball position

	const [player1PointsHtml, setPlayer1PointsHtml] = useState(0);
	const [player2PointsHtml, setPlayer2PointsHtml] = useState(0);

    const keysPressed = useRef({});

    const ws = new WebSocket('ws://localhost:4545/ws');

    ws.onopen = () => {
      console.log("Connected!");
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current[e.key] = true;
     };

    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current[e.key] = false;
    };

    ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'state') {
      players = data.players;
      ball = data.ball;
      drawGame();
    }
    };

    ws.onclose = () => {
        status.textContent = "Disconnected.";
    };

    function sendMove(id, dx, dy) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'move', id, dx, dy }));
    }
    }

    const updateGame = () => {
        //Perform action based on the keypressed
        if (keysPressed.current["ArrowUp"]) sendMove(1, 0, -5);
        if (keysPressed.current["ArrowDown"]) sendMove(1, 0, 5);
        if (keysPressed.current["w"]) sendMove(2, 0, -5);
        if (keysPressed.current["s"]) sendMove(2, 0, 5);
    };

      // Regularly request updates from the server (every 100 ms)
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'get_state' }));
        }
    }, 10); // 100 ms interval

    const  drawGame = () => {

        const gridSize = WIDTH;
        const tileSize = HEIGHT;

        const ctx = canvasRef.current.getContext("2d");

        ctx.clearRect(0,0, gridSize * tileSize, gridSize * tileSize);
    
        // Draw players
        for (const id in players) {
        const { x, y } = players[id];
        ctx.fillStyle = 'lime';
        ctx.fillRect(x, y, 10, PADDLE_LEN);
        }

        // Draw ball
        const { x, y } = ball;
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, BALL_SIZE, BALL_SIZE);

		setPlayer2PointsHtml(0);
		setPlayer1PointsHtml(0);
    };

    useEffect(() => {
        let animationFrameId: number;

        const gameLoop = () => {
        updateGame();
        drawGame();
        animationFrameId = requestAnimationFrame(gameLoop);
        };
        window.addEventListener("keydown",handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        gameLoop();
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    },[]);

	const screenIsPortrait = window.innerHeight > window.innerWidth;

    return (
		<div className="grid grid-cols-6 grid-rows-[auto_auto]
		portrait:grid-cols-[auto_auto_auto]
		gap-[5vw] w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] p-[8vw]
		sm:landscape:p-[2vw]">
			<span
				className="text-transcendence-white font-transcendence-three text-4xl
					 row-start-1 col-start-1
					 portrait:self-end
					text-right">{player1PointsHtml}</span>
			<span className="text-transcendence-white font-transcendence-three text-4xl hidden">|</span>
			<span className="text-transcendence-white font-transcendence-three text-4xl
				row-start-1 col-start-6
				portrait:col-start-3">{player2PointsHtml}</span>
			<div className="
				flex-grow flex items-center justify-center
				border-4 border-transcendence-white rounded-xl overflow-hidden
				row-start-1 col-start-2 col-span-4
				portrait:col-span-1">
				<canvas ref={canvasRef} width={screenIsPortrait ? HEIGHT : WIDTH} height={screenIsPortrait ? WIDTH : HEIGHT} className="w-full h-full"/>
			</div>
			<div className="flex justify-center
				row-start-2 col-start-3 col-span-2
				portrait:col-start-2 portrait:col-span-1">
				<button
					className="bg-transcendence-beige text-transcendence-black w-30 h-10 text-lg rounded-md font-transcendence-two"
					onClick={exitGame}>
					EXIT GAME
				</button>
			</div>
        </div>
    );
};