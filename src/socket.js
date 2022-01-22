import { io } from "socket.io-client";
import { players, paused } from "./game";
import { Player } from "./player";
import { seedRandom } from "./utils";

// export const socket = io("wss://friedman.ddns.net:3000");
export let socket;

export function connect(address) {
  socket = io(address);

  socket.on("seed", (seed) => {
    seedRandom(seed);

    document.getElementById("day").innerText = Math.floor(
      (seed - 1642723200000) / (24 * 60 * 60 * 1000)
    );
  });

  socket.on("leaderboard", (leaderboard) => {
    // console.log("leaderboard recieved", leaderboard);
    document.querySelector(".leaderboard-list").innerHTML = "";
    leaderboard.forEach((player) => {
      let li = document.createElement("li");
      li.innerText = `${player.name}: ${player.score}`;
      document.querySelector(".leaderboard-list").appendChild(li);
    });
  });

  socket.on("playerList", (players) => {
    // console.log("playerList");
    Object.values(players).forEach((player) => {
      players[player.id] = new Player(
        player.id,
        player.name,
        player.color,
        player.x,
        player.y
      );
    });
  });

  socket.on("score", ({ id, score }) => {
    if (!paused) {
      // console.log("playerScore");
      players[id].score = score;
    }
  });

  socket.on("playerJoin", ({ id, name, color, x, y }) => {
    players[id] = new Player(id, name, color, x, y);
  });

  socket.on("playerUpdate", ({ id, x, y }) => {
    if (!paused) {
      // console.log("playerUpdate");
      players[id].x = x;
      players[id].y = y;
    }
  });

  socket.on("playerDeath", (id) => {
    delete players[id];
  });
}
