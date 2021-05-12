import { canvas, setup, start } from "./game";
import { connect } from "./socket";

const LEFT_KEYS = ["ArrowLeft", "a"];
const RIGHT_KEYS = ["ArrowRight", "d"];

export const startScreen = document.querySelector(".start-screen");
export const scoreboard = document.querySelector(".scoreboard");
const connectEl = document.getElementById("connect");
const leaderboardEl = document.querySelector(".leaderboard");

setup();
document.getElementById("connectBtn").addEventListener("click", () => {
  if (document.getElementById("address").value.length != 0) {
    connectEl.style.display = "none";
    leaderboardEl.style.display = "flex";
    connect(document.getElementById("address").value);
  }
});
document.getElementById("startBtn").addEventListener("click", () => {
  if (document.getElementById("name").value.length != 0) {
    startScreen.style.display = "none";
    scoreboard.style.display = "block";
    canvas.style.display = "block";
    start();
  }
});
window.addEventListener("keydown", ({ key }) => (window.key = key));
window.addEventListener("keyup", (e) => {
  if (e.key == window.key) window.key = "";
  if (
    e.key == "Enter" &&
    document.getElementById("name") == document.activeElement &&
    document.getElementById("name").value.length != 0
  )
    document.getElementById("startBtn").click();
});
