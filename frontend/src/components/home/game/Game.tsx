import React, { useRef, useEffect, useState } from "react";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN, PADDLE_WIDTH } from "./constants.ts";

type GameProps = {
	exitGame: () => void;
};

export const Game = ({exitGame}: GameProps) =>
{
    // I am using useRef instead of useState so things persist when components load again and things wont't rerender
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const PointsRef = useRef<HTMLSpanElement | null>(null);
    const PointsRef2= useRef<HTMLSpanElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const keysPressed = useRef({});
    const players = useRef<Record<string, any>>({});
    const ball = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // sends move command to backend server when player wants to move
    const sendMove = (id: number, dx: number, dy: number) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "move", id, dx, dy }));
        }
    };

    //registers what key was pressed and call sendMove function
    const updateGame = () => {
        //Perform action based on the keypressed
        if (keysPressed.current["ArrowUp"]) sendMove(2, 0, -10);
        if (keysPressed.current["ArrowDown"]) sendMove(2, 0, 10);
        if (keysPressed.current["w"]) sendMove(1, 0, -10);
        if (keysPressed.current["s"]) sendMove(1, 0, 10);
    };

    // Poll server regurally so ball position gets updated constantly. I had 10ms interval here but this is now tied to the gameloop (not sure if it spams the server too much like this)
    const setInterval = () => {
        const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "get_state" }));
        }
    }

    //draws the game based on the coordinates we got from the back end
    const  drawGame = () => {
        const ctx = canvasRef.current.getContext("2d");

        ctx.clearRect(0,0, WIDTH, HEIGHT);
        ctx.fillStyle = 'white';
    
        // Draw players might fuck up the id is not a number 
        for (const id in players.current) 
        {
            const { x, y } = players.current[id];
            if (id % 2)
                PointsRef.current.innerHTML = players.current[id].points;
            else
                PointsRef2.current.innerHTML = players.current[id].points;
            ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_LEN);
        }

        // Draw ball
        //const { x, y } = ball.current;
        ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);
    };

    useEffect(() => {
        let animationFrameId: number; // not needed ??
        const ws = new WebSocket('ws://localhost:4545/ws');
        wsRef.current = ws;
        
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
        window.addEventListener("keydown",handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        ws.onopen = () => {console.log("Connected!");}
        ws.onclose = () => {console.log("Disconnected!");};

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'state') {
                players.current = data.players;
                ball.current = data.ball;
                drawGame();
        }};

        // Main game loop that keeps calling different update functions
        const gameLoop = () => {
            setInterval(); // move ball
            updateGame(); //register key presses and move players
            drawGame(); // draws the game canvas TEST IF NEEDED BECAUSE THE GAME IS ALREADY DRAWN AFTER EACH MESSAGE
            animationFrameId = requestAnimationFrame(gameLoop); // syncs the game to the browser refress rate to make animation smooth
        };
        gameLoop();

        // Clean up things 
        return () => {
            ws.close();
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    },[]); // Not sure if I should have different parameters here. [] calls the useEffect only once when the component is loaded ??/

    // Aina's stuff after this line
	const screenIsPortrait = window.innerHeight > window.innerWidth;

    return (
		<div className="grid grid-cols-6 grid-rows-[auto_auto]
		portrait:grid-cols-[auto_auto_auto]
		gap-[5vw] w-full h-[calc(100svh-4.5rem)] lg:h-[calc(100svh-8rem)] p-[8vw]
		sm:landscape:p-[2vw]">
			<span ref={PointsRef}
				className="text-transcendence-white font-transcendence-three text-4xl
					 row-start-1 col-start-1
					 portrait:self-end
					text-right"></span>
			<span className="text-transcendence-white font-transcendence-three text-4xl hidden">|</span>
			<span ref={PointsRef2} className="text-transcendence-white font-transcendence-three text-4xl
				row-start-1 col-start-6
				portrait:col-start-3"></span>
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