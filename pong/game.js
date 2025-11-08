'use strict';

let WIDTH = 1600;
let HEIGHT = 800;
let BALL_SIZE = 10;
let PADDLE_LEN = 140;

const Player = require('./player.js');
const Ball = require('./ball.js');

class Game {
    constructor(id) 
    {
        this.id = id;
        this.players = [];
        this.ball = new Ball;
    }

    addPlayer() 
    {
        const newPlayer = new Player(1, 10, HEIGHT/2);
        this.players.push(newPlayer);
        const newPlayer2 = new Player(2, 1580, HEIGHT/2);
        this.players.push(newPlayer2);
        console.log("Playesr added");
    }

    movePlayer(playerId, dx, dy) 
    {
        const player = this.players.find(p => p.id === playerId);
        if (player) 
        {
            player.move(dx, dy);  // Move the player by dx, dy
        }
    }

    moveBall()
    {
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        //check if ball is colliding players the 10 s player width remember to change it
        if (this.ball.x >= this.players[0].x && this.ball.x <= this.players[0].x + 10 && this.ball.y >= this.players[0].y && this.ball.y <= this.players[0].y + PADDLE_LEN)
        {
            const playerCenter = this.players[0].y + PADDLE_LEN/2;
            this.ball.vy = (playerCenter - this.ball.y) * 0.1;
            this.ball.vx *= -1;
        }
        //Player2 padel check could be wrong
        if (this.ball.x + BALL_SIZE >= this.players[1].x && this.ball.x <= this.players[1].x + 10 && this.ball.y + BALL_SIZE >= this.players[1].y && this.ball.y <= this.players[1].y + PADDLE_LEN)
        {
            const playerCenter2 = this.players[1].y + PADDLE_LEN/2;
            this.ball.vy = (playerCenter2 - this.ball.y) * 0.1;
            this.ball.vx *= -1;
        }
        //Check if ball is inside of a goal and resets the ball speed if so
        if (this.ball.x <= 0 || this.ball.x >= WIDTH)
        {
            // if (ballReference.x <= 0)
            // {
            //     playerReference.points += 1;
            // }
            // else
            // {
            //    playerReference2.points += 1;
            // }
            // //check if we have winner here
            // if (playerReference.points >= 5 || playerReference2.points >= 5)
            // {
            //     playerReference.points = 42; // End game and update database abot game stats?
            // }
            this.ball.x = WIDTH/2;
            this.ball.y = HEIGHT/2;
            return ;
        }
        // if (this.ball.x <= 0 || this.ball.x >= WIDTH)
        // {
        //     this.ball.vx *= -1;
        // }
        if (this.ball.y <= 0 || this.ball.y >= HEIGHT)
        {
            this.ball.vy *= -1;
        }
    }

    getState() {
    const playersState = {};

    this.players.forEach(player => {
        playersState[player.id] = player.getState(); 
    });

    return {
        type: 'state',
        players: playersState,
        ball: this.ball.getState(),
    };
}
}

module.exports = Game;