import { canvas, setup, start } from "./game";
import { connect } from "./socket";

const LEFT_KEYS = ["ArrowLeft", "a"];
const RIGHT_KEYS = ["ArrowRight", "d"];

export const startScreen = document.querySelector(".start-screen");
export const scoreboard = document.querySelector(".scoreboard");
// const connectEl = document.getElementById("connect");
// const leaderboardEl = document.querySelector(".leaderboard");

setup();
connect();
// document.getElementById("connectBtn").addEventListener("click", () => {
//   if (document.getElementById("address").value.length != 0) {
//     connectEl.style.display = "none";
//     leaderboardEl.style.display = "flex";
//     connect(document.getElementById("address").value);
//   }
// });
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
window.addEventListener("touchstart", ({ changedTouches }) =>
  changedTouches[0].clientX > window.innerWidth / 2
    ? (window.key = "ArrowRight")
    : (window.key = "ArrowLeft")
);
window.addEventListener("touchend", ({ changedTouches }) => {
  let key =
    changedTouches[0].clientX > window.innerWidth / 2
      ? "ArrowRight"
      : "ArrowLeft";
  if (key == window.key) window.key = "";
});
document.querySelector(".info-btn").addEventListener("click", () => {
  document.querySelector(".info-screen").classList.toggle("visible");
});
document
  .querySelector(".info-screen > .close")
  .addEventListener("click", () => {
    document.querySelector(".info-screen").classList.remove("visible");
  });
window.addEventListener("load", () => {
  document.querySelector(".info-screen").classList.add("visible");
});
