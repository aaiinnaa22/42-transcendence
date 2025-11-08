'use strict'

let WIDTH = 1600;
let HEIGHT = 800;
let BALL_SIZE = 10;
let PADDLE_LEN = 140;

class Ball {
    constructor() {
            this.x = WIDTH/2;
            this.y = HEIGHT/2;
            this.vx = 5;
            this.vy = 2;
    }

    // moveBall(){
    //     this.x += this.vx;
    //     this.y += this.vy;

    //     if (this.x <= 0 || this.x >= WIDTH)
    //     {
    //         this.vx *= -1;
    //     }
    //     if (this.y <= 0 || this.y >= HEIGHT)
    //     {
    //         this.vy *= -1;
    //     }
    // }

    getState(){
        return { x: this.x, y: this.y };
    }
}

module.exports = Ball;