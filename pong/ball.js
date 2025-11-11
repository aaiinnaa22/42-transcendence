'use strict'

const { WIDTH, HEIGHT } = require('./constants');

class Ball {
    constructor() {
        this.x = WIDTH/2;
        this.y = HEIGHT/2;
        this.vx = 8;
        this.vy = 2;
    }

    resetBall(){
        this.x = WIDTH/2;
        this.y = HEIGHT/2;
        this.vx = 8;
        this.vy = 2;
    }

    getState(){
        return { x: this.x, y: this.y };
    }
}

module.exports = Ball;