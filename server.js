const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { Datastore } = require("@google-cloud/datastore");

require("dotenv").config();

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socket(server);

const creds = JSON.parse(
  Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString()
);

const datastore = new Datastore({
  projectId: creds.project_id,
  credentials: {
    client_email: creds.client_email,
    private_key: creds.private_key,
  },
});

let game1 = {
  id: "",
  state: "",
  seed: "testSeed",
  expiry: new Date(2022, 0, 21),
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
  Expiry: ${game1.expiry}<br>
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

  getSeed()
    .then((seed) => {
      let now = new Date();
      seed.expiry = new Date(seed.expiry); // Convert to date object

      // Check if new day
      if (seed == undefined || now > seed.expiry) {
        // Seed expired
        console.log("resetting seed and leaderboard...");
        seed = seed ?? {};
        seed.seed = now.setUTCHours(0, 0, 0);
        seed.expiry = new Date(now.setUTCHours(24));
        console.log(seed);
        setSeed(seed.seed, seed.expiry);
        clearLeaderboard();
      }
      socket.emit("seed", seed.seed);
    })
    .catch((e) => {
      console.error("Seed Error: ", e);
    });

  getLeaderboard().then((leaderboard) =>
    socket.emit("leaderboard", leaderboard)
  );
  // socket.emit("leaderboard", leaderboard.slice(0, 10));

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
      addScore(
        game1.players[socket.id].name,
        game1.players[socket.id].score
      ).then(() => {
        getLeaderboard().then((leaderboard) => {
          // console.log("Sending leaderboard", leaderboard);
          socket.emit("leaderboard", leaderboard);
        });
      });
    delete game1.players[socket.id];
    socket.broadcast.emit("playerDeath", id);
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});

function addScore(name, score) {
  console.log("\x1b[32m%s\x1b[0m", `[LEADERBOARD]: ${name} - ${score}`);

  return datastore.save({
    key: datastore.key("leaderboard"),
    data: { name: name, score: score },
  });
}

async function getLeaderboard() {
  const query = datastore
    .createQuery("leaderboard")
    .order("score", { descending: true })
    .limit(10);
  let [leaderboard] = await datastore.runQuery(query);
  leaderboard = leaderboard.map((entity) => {
    return { name: entity.name, score: entity.score };
  });
  return leaderboard;
}

function clearLeaderboard() {
  const query = datastore.createQuery("leaderboard");
  datastore
    .runQuery(query)
    .then(([leaderboard]) => {
      leaderboard.forEach((entity) => {
        datastore.delete(entity[datastore.KEY]);
      });
    })
    .catch((e) => {
      console.error(e);
    });
}

async function getSeed() {
  const query = datastore
    .createQuery("seed")
    .order("seed", { descending: true })
    .limit(1);
  let [seed] = await datastore.runQuery(query);
  return seed[0];
}

function setSeed(seed, expiry) {
  return datastore.save({
    key: datastore.key("seed"),
    data: { seed: seed, expiry: expiry.toUTCString() },
  });
}
