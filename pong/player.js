'use strict';

class Player {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.points = 0;
    //console.log("Player created" + this.id);
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    //console.log("Moving player" + this.id);
  }

  getState() {
    return { id: this.id, x: this.x, y: this.y, points: this.points };
  }
}

module.exports = Player;
