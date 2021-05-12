const express = require("express");
const fs = require("fs");
const http = require("http");
const socket = require("socket.io");

// const { getLeaderboard, addScore } = require("./utils.js");

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socket(server);

let leaderboard;

let game1 = {
  id: "",
  state: "",
  seed: "testSeed", //TODO: new seed every day
  players: {
    /* socket.id: {
      id: <playerID>,
      x: <playerX>,
      y: <playerY>,
      score: <playerScore>
    } */
  },
};

app.use(express.static(__dirname + "/public"));

app.get("/server-status", (req, res) => {
  let html = `
  <b>Game #1:</b><br>
  ID: ${game1.id}<br>
  State: ${game1.state}<br>
  Seed: ${game1.seed}<br>
  <table>
  <tr>
  <th>Socket ID</th>
  <th>Player ID</th>
  <th>Name</th>
  <th>Score</th>
  </tr>
  `;
  Object.entries(game1.players).forEach(([id, player]) => {
    html += `
    <tr>
    <td>${id}</td>
    <td>${player.id}</td>
    <td>${player.name}</td>
    <td>${player.score}</td>
    </tr>`;
  });
  html += "</table>";
  res.send(html);
});

io.on("connection", (socket) => {
  // console.log(`A user just connected with id ${socket.id}.`);

  socket.emit("seed", game1.seed);
  socket.emit("leaderboard", leaderboard.slice(0, 10));

  socket.on("disconnect", () => {
    // console.log(`A user has disconnected with id ${socket.id}.`);
    delete game1.players[socket.id];
  });

  socket.on("score", ({ id, score }) => {
    // console.log(game1.players[socket.id].name + ": " + score);
    if (typeof game1.players[socket.id] !== "undefined") {
      game1.players[socket.id].score = score;
      socket.broadcast.emit("score", { id: id, score: score });
    }
  });

  socket.on("playerJoin", ({ id, name, color, x, y }) => {
    // console.log(`${id} joined with name ${name} and color ${color}.`);
    game1.players[socket.id] = { id: id, name: name, color: color, x: x, y: y };
    socket.emit("playerList", game1.players);
    socket.broadcast.emit("playerJoin", {
      id: id,
      name: name,
      color: color,
      x: x,
      y: y,
    });
  });

  socket.on("playerUpdate", ({ id, x, y }) => {
    if (typeof game1.players[socket.id] !== "undefined") {
      game1.players[socket.id].x = x;
      game1.players[socket.id].y = y;
      socket.broadcast.emit("playerUpdate", { id: id, x: x, y: y });
    }
  });

  socket.on("playerDeath", (id) => {
    if (
      typeof game1.players[socket.id] !== "undefined" &&
      typeof game1.players[socket.id].score !== "undefined"
    )
      addScore(game1.players[socket.id].name, game1.players[socket.id].score);
    // .then(() => {
    //   getLeaderboard();
    // });
    delete game1.players[socket.id];
    socket.broadcast.emit("playerDeath", id);

    io.emit("leaderboard", leaderboard.slice(0, 10));
    // getLeaderboard.then(() => {
    //   io.emit("leaderboard", leaderboard);
    // });
  });
});

// app.get("/", (req, res) => {
//   res.send("Server is working!");
// });

server.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
  getLeaderboard();
});

function addScore(name, score) {
  console.log("\x1b[32m%s\x1b[0m", `[LEADERBOARD]: ${name} - ${score}`);

  leaderboard.push({ name: name, score: score });
  leaderboard = leaderboard.sort(
    (player1, player2) => player2.score - player1.score
  );

  fs.writeFileSync("leaderboard.json", JSON.stringify(leaderboard));
}

async function getLeaderboard() {
  if (!fs.existsSync("leaderboard.json")) {
    try {
      fs.writeFileSync("leaderboard.json", "[]");
    } catch (err) {
      console.error(err);
    }
  }
  leaderboard = JSON.parse(fs.readFileSync("leaderboard.json"));
  leaderboard = leaderboard.sort(
    (player1, player2) => player2.score - player1.score
  );
}
