// On récupère le bouton
const btnStart = document.getElementById("btn-start");

// On écoute le clic
btnStart.addEventListener("click", function () {
  window.location.href = "labyrinthe/index.html";
});

const btnMorpion = document.getElementById("btn-morpion");
btnMorpion.addEventListener("click", function () {
  window.location.href = "morpion/index.html";
});

const btnSnake = document.getElementById("btn-snake");
btnSnake.addEventListener("click", function () {
  window.location.href = "snake/index.html";
});

const btnMemory = document.getElementById("btn-memory");
btnMemory.addEventListener("click", function () {
  window.location.href = "memory/index.html";
});

const btnPendu = document.getElementById("btn-pendu");
btnPendu.addEventListener("click", function () {
  window.location.href = "pendu/index.html";
});

const puissance4 = document.getElementById("btn-puissance4");
puissance4.addEventListener("click", function () {
  window.location.href = "puissance4/index.html";
});

const btnBataille = document.getElementById("btn-bataille");
btnBataille.addEventListener("click", function () {
  window.location.href = "bataille/index.html";
});

const btnSolitaire = document.getElementById("btn-solitaire");
btnSolitaire.addEventListener("click", function () {
  window.location.href = "solitaire/index.html";
});

const btnMastermind = document.getElementById("btn-mastermind");
btnMastermind.addEventListener("click", function () {
  window.location.href = "mastermind/index.html";
});

const btnSimon = document.getElementById("btn-simon");
btnSimon.addEventListener("click", function () {
  window.location.href = "simon/index.html";
});

const btnRobotMaze = document.getElementById("btn-robot-maze");
btnRobotMaze.addEventListener("click", function () {
  window.location.href = "robotmaze/index.html";
});
