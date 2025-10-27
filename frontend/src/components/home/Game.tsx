import React, { useRef, useEffect } from "react";
import { WIDTH, HEIGHT, BALL_SIZE, PADDLE_LEN } from "./constants";

type GameProps = {
	exitGame: () => void;
};

export const Game = ({exitGame}: GameProps) =>
{
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const player = useRef({ x: 10, y: HEIGHT/2, width: 10, height: PADDLE_LEN, points: 0 });
    const player2 = useRef({ x: 1580, y: HEIGHT/2, width: 10, height: PADDLE_LEN, points: 0 });
    const ball = useRef({ x: WIDTH/2, y: HEIGHT/2, vx: 0, vy: 0 });

    const keysPressed = useRef({});

    const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current[e.key] = true;
     };

    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current[e.key] = false;
    };

    const updateGame = () => {
        const playerReference = player.current;
        const playerReference2 = player2.current;
        const ballReference = ball.current;

        //Perform action based on the keypressed
        if (keysPressed.current["ArrowUp"] && playerReference2.y != 0) playerReference2.y -= 10;
        if (keysPressed.current["ArrowDown"] && playerReference2.y != (HEIGHT-PADDLE_LEN)) playerReference2.y += 10;
        if (keysPressed.current["w"] && playerReference.y != 0) playerReference.y -= 10;
        if (keysPressed.current["s"] && playerReference.y != (HEIGHT-PADDLE_LEN)) playerReference.y += 10;
        //randomize the starting direction
        if (keysPressed.current[" "] && ballReference.vx === 0 && ballReference.vy === 0) 
        {
                ballReference.vx = Math.random() < 0.5 ? Math.random() * -6 - 9 : Math.random() * 6 + 9;
                ballReference.vy = Math.floor(Math.random() * 8) - 4;
        }

        //Update ball position 
        ballReference.x += ballReference.vx;
        ballReference.y += ballReference.vy;
    
        //check if ball is colliding players
        if (ballReference.x >= playerReference.x && ballReference.x <= playerReference.x + playerReference.width && ballReference.y >= playerReference.y && ballReference.y <= playerReference.y + playerReference.height)
        {
            const playerCenter = playerReference.y + PADDLE_LEN/2;
            ballReference.vy = (playerCenter - ballReference.y) * 0.1;
            ballReference.vx *= -1;
        }
        //Player2 padel check could be wrong
        if (ballReference.x + BALL_SIZE >= playerReference2.x && ballReference.x <= playerReference2.x + playerReference2.width && ballReference.y + BALL_SIZE >= playerReference2.y && ballReference.y <= playerReference2.y + playerReference2.height)
        {
            const playerCenter2 = playerReference2.y + PADDLE_LEN/2;
            ballReference.vy = (playerCenter2 - ballReference.y) * 0.1;
            ballReference.vx *= -1;
        }
        //Check if ball is inside of a goal and resets the ball speed if so
        if (ballReference.x <= 0 || ballReference.x >= WIDTH)
        {
            if (ballReference.x <= 0)
            {
                playerReference.points += 1;
            }
            else
            {
               playerReference2.points += 1;
            }
            //check if we have winner here
            if (playerReference.points >= 5 || playerReference2.points >= 5)
            {
                playerReference.points = 42; // End game and update database abot game stats?
            }
            Object.assign(ballReference,{ vx: 0, vy: 0, y: HEIGHT/2, x: WIDTH/2 });
        }
        //Check if ball is colloding walls.
        if (ballReference.y <= 0 || ballReference.y >= HEIGHT)
        {
            ballReference.vy *= -1;
        }
    };

    const  drawGame = () => {
        const playerReference = player.current;
        const playerReference2 = player2.current;
        const ballReference = ball.current;

        const gridSize = WIDTH;
        const tileSize = HEIGHT;

        const ctx = canvasRef.current.getContext("2d");

        
        ctx.clearRect(0,0, gridSize * tileSize, gridSize * tileSize);

        ctx.fillStyle = "white";
        ctx.fillRect(playerReference.x, playerReference.y, playerReference.width, playerReference.height);
        ctx.fillRect(playerReference2.x, playerReference2.y, playerReference2.width, playerReference2.height);
        ctx.fillRect(ballReference.x,ballReference.y, BALL_SIZE, BALL_SIZE);
        ctx.font = "20px Arial";
        ctx.fillText(`Points: ${playerReference2.points}`,10,80);
        ctx.fillText(`Points: ${playerReference.points}`,300,80);
        ctx.fillText(`Speed: vx: ${ballReference.vx} vy: ${ballReference.vy}`,10,110);
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
    return (
		<div>
		<button
			className="bg-transcendence-beige text-transcendence-black"
			onClick={exitGame}>
			Hello from Game! Press to exit.
		</button>

        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ border: "1px solid white" }}/>
        </div>
    );
};