import { myID, vph } from "./game";
import { socket } from "./socket";
import { constrain, convertCoords, convertWidth, keyIsDown } from "./utils";

export class Player {
  constructor(id, name, color, x, y, mainPlayer = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.mainPlayer = mainPlayer;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.width = 20;
    this.height = 40;
    this.score = 0;
  }

  update(platforms, paused = false) {
    if (!paused && this.id == myID) {
      if (keyIsDown("ArrowLeft")) {
        this.ax -= 5;
        socket.emit("playerUpdate", {
          id: this.id,
          x: this.x,
          y: this.y,
        });
      }
      if (keyIsDown("ArrowRight")) {
        this.ax += 5;
        socket.emit("playerUpdate", {
          id: this.id,
          x: this.x,
          y: this.y,
        });
      }
    }

    this.ay -= 0.5; // GRAVITY

    this.vx += this.ax;
    this.vy += this.ay;
    this.vx = constrain(this.vx, -10, 10);
    this.vy = constrain(this.vy, -10, 10);
    this.x += this.vx;
    this.y += this.vy;
    this.ax = 0;
    this.ay = 0;

    platforms.forEach((platform) => {
      if (this.isOn(platform)) {
        if (this.mainPlayer) {
          if (!this.lastJumpedOn) {
            // console.log("no last jumped");
            this.lastJumpedOn = platform;
          } else if (platform.y > this.lastJumpedOn.y) {
            // console.log("higher");
            this.score++;
            this.lastJumpedOn = platform;
            socket.emit("score", { id: this.id, score: this.score });
          }
        }
        this.vy = 0;
        this.y = platform.y + this.height;
        this.ay += 15;
      }
    });

    this.x = constrain(this.x, 0, 1000 - this.width);
    this.vx = 0;
  }

  draw(ctx) {
    let coords = convertCoords(this.x, this.y);
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color;
    ctx.fillRect(coords.x, coords.y, convertWidth(this.width), this.height);

    ctx.textAlign = "center";
    ctx.font = "bold 16px/16px Poppins";
    ctx.fillStyle = "#000000";
    ctx.fillText(
      this.name,
      coords.x + convertWidth(this.width) / 2,
      coords.y - 10
    );
  }

  isOn(platform) {
    return (
      platform.left < this.right &&
      platform.right > this.left &&
      platform.top >= this.bottom &&
      platform.bottom <= this.top &&
      platform.bottom < this.bottom &&
      this.vy < 0
    );
  }

  isDead() {
    return this.top < vph;
  }

  get top() {
    return this.y;
  }
  get bottom() {
    return this.y - this.height;
  }
  get left() {
    return this.x;
  }
  get right() {
    return this.x + this.width;
  }
}
