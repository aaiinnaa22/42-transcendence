'use strict';

let WIDTH = 1600;
let HEIGHT = 800;
let BALL_SIZE = 10;
let PADDLE_LEN = 140;

const Player = require('./player.js');

class Game {
    constructor(id) 
    {
        this.id = id;
        this.players = [];
    }

    addPlayer() 
    {
        const newPlayer = new Player(1, 20, 20);
        this.players.push(newPlayer);
        const newPlayer2 = new Player(2, 0, 0);
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

    getState() {
    // Create an object where each player's ID is the key, and the value is the player's state
    const playersState = {};

    // Iterate over the players array and add each player's state to the playersState object
    this.players.forEach(player => {
        playersState[player.id] = player.getState(); // Use player ID as the key
    });

    return {
        type: 'state',
        players: playersState,  // Object with player IDs as keys and player states as values
    };
}
}

module.exports = Game;