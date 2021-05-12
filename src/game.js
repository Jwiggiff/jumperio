/* TODO:
 *  - make it so players can bump each other
 */

import { v4 as uuidv4 } from "uuid";
import { Platform } from "./platform";
import { Player } from "./player";
import { socket } from "./socket";
import { generatePlatform, randomColor, seedRandom } from "./utils";
import { startScreen, scoreboard } from "./index";

let platforms = [];
export let players = {};

export let paused = true;

export let myID;

export const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const playerNameEl = document.getElementById("playerName");
const scoreEl = document.getElementById("score");
const sbList = document.querySelector(".scoreboard-list");

export let vph;
let vpv;

let gameLoop;

export function setup() {
  console.log("setup");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  updateScores();

  myID = uuidv4();
}

export function start() {
  console.log("start");

  vph = 0;
  vpv = 1;
  seedRandom();

  platforms.push(new Platform(0, 110));
  for (let i = 210; i < canvas.height + 100; i += 100) {
    platforms.push(generatePlatform(platforms[platforms.length - 1], i));
  }

  players[myID] = new Player(
    myID,
    document.getElementById("name").value.length > 16
      ? document.getElementById("name").value.slice(0, 16)
      : document.getElementById("name").value,
    randomColor(),
    500,
    160,
    true
  );
  socket.emit("playerJoin", {
    id: myID,
    name: players[myID].name,
    color: players[myID].color,
    x: players[myID].x,
    y: players[myID].y,
  });
  playerNameEl.innerText = players[myID].name;

  paused = false;
  gameLoop = setInterval(draw, 1000 / 60);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  vph += vpv;
  vpv *= 1.0005;

  Object.values(players).forEach((player) => player.update(platforms, paused));

  updateScoreboard();

  if (!paused) {
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].top < vph) {
        platforms.shift();
        platforms.push(generatePlatform(platforms[platforms.length - 1]));
      }
    }

    if (players[myID].isDead()) {
      socket.emit("playerDeath", myID);
      paused = true;
      reset();
    }
  }

  platforms.forEach((platform) => platform.draw(ctx));
  Object.values(players).forEach((player) => player.draw(ctx));
}

function reset() {
  clearInterval(gameLoop);

  updateCookie();
  updateScores();

  platforms = [];
  delete players[myID];

  startScreen.style.display = "";
  scoreboard.style.display = "none";
  canvas.style.display = "none";
}

function updateScoreboard() {
  sbList.innerHTML = "";
  Object.values(players)
    .sort((player1, player2) => player2.score - player1.score)
    .slice(0, 11)
    .forEach((player) => {
      let li = document.createElement("li");
      li.innerText = `${player.name}: ${player.score}`;
      sbList.appendChild(li);
    });
  scoreEl.innerText = players[myID].score;
}

function updateScores() {
  document.getElementById("lScore").innerText = readCookie("last_score");
  document.getElementById("hScore").innerText = readCookie("high_score");
}

function updateCookie() {
  let high_score = readCookie("high_score");
  document.cookie = `last_score=${players[myID].score};`;
  if (players[myID].score > high_score)
    document.cookie = `high_score=${players[myID].score};`;
}

function readCookie(property) {
  return document.cookie.match(new RegExp(`(?<=${property}=)\\d+`, "g"));
}