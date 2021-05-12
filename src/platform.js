import { convertCoords, convertWidth } from "./utils";

export class Platform {
  constructor(x, y, w = 1000) {
    this.x = x;
    this.y = y;
    this.vy = 1;
    this.width = w;
    this.height = 10;
  }

  update() {
    this.y += this.vy;
  }

  draw(ctx) {
    let coords = convertCoords(this.x, this.y);
    ctx.shadowOffsetY = 4;
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(coords.x, coords.y, convertWidth(this.width), this.height);

    // ctx.fillText(Math.floor(this.y / 100) - 1, coords.x, coords.y);
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
