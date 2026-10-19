// question 2.1
"use strict";

// question 2.2
let MESSAGES = {
  message1: "vous avez gagné !",
};

// question 3.1
let MARKS = ["✔", "✗"];

// question 3.2
let cell0 = document.getElementById("cell0");
let cell1 = document.getElementById("cell1");
let cell2 = document.getElementById("cell2");
let cell3 = document.getElementById("cell3");
let cell4 = document.getElementById("cell4");
let cell5 = document.getElementById("cell5");
let cell6 = document.getElementById("cell6");
let cell7 = document.getElementById("cell7");
let cell8 = document.getElementById("cell8");

cell0.addEventListener("click", myCallback);
cell1.addEventListener("click", myCallback);
cell2.addEventListener("click", myCallback);
cell3.addEventListener("click", myCallback);
cell4.addEventListener("click", myCallback);
cell5.addEventListener("click", myCallback);
cell6.addEventListener("click", myCallback);
cell7.addEventListener("click", myCallback);
cell8.addEventListener("click", myCallback);

function myCallback(event) {
  let cell = event.target;
  console.log(event.target);
  fill(cell);
}

// question 3.3
/*function fill(cell) {
  if (cell.innerHTML === "" || cell.innerHTML === MARKS[1]) {
    cell.innerHTML = MARKS[0];
    cell.style.color = "green";
  } else {
    cell.innerHTML = MARKS[1];
    cell.style.color = "red";
  }
}*/

// pour jouer chacun son tour sans avoir à cliquer 2 fois
function fill(cell) {
  if (inputPlayer1.value === "" || inputPlayer2.value === "") {
    alert("Veuillez entrer les noms des deux joueurs avant de jouer.");
    return;
  } else {
    if (cell.innerHTML === "") {
      cell.innerHTML = MARKS[currentPlayer];
      if (currentPlayer === 0) {
        cell.style.color = "green";
        currentPlayer = 1;
      } else {
        cell.style.color = "red";
        currentPlayer = 0;
      }
    }
  }
}

// question 4.1
function verifyPlayer(playerMark) {
  if (
    (cell0.innerHTML === playerMark &&
      cell1.innerHTML === playerMark &&
      cell2.innerHTML === playerMark) ||
    (cell3.innerHTML === playerMark &&
      cell4.innerHTML === playerMark &&
      cell5.innerHTML === playerMark) ||
    (cell6.innerHTML === playerMark &&
      cell7.innerHTML === playerMark &&
      cell8.innerHTML === playerMark)
  ) {
    return true;
  } else if (
    (cell0.innerHTML === playerMark &&
      cell3.innerHTML === playerMark &&
      cell6.innerHTML === playerMark) ||
    (cell1.innerHTML === playerMark &&
      cell4.innerHTML === playerMark &&
      cell7.innerHTML === playerMark) ||
    (cell2.innerHTML === playerMark &&
      cell5.innerHTML === playerMark &&
      cell8.innerHTML === playerMark)
  ) {
    return true;
  } else if (
    (cell0.innerHTML === playerMark &&
      cell4.innerHTML === playerMark &&
      cell8.innerHTML === playerMark) ||
    (cell2.innerHTML === playerMark &&
      cell4.innerHTML === playerMark &&
      cell6.innerHTML === playerMark)
  ) {
    return true;
  }
  return false;
}

// question 4.2
let verifyButton = document.getElementById("play");
verifyButton.addEventListener("click", verify);
let inputPlayer1 = document.getElementsByName("player1")[0];
let inputPlayer2 = document.getElementsByName("player2")[0];

function verify() {
  let name1 = inputPlayer1.value;
  let name2 = inputPlayer2.value;
  if (verifyPlayer(MARKS[0])) {
    alert("Bravo " + name1 + ", " + MESSAGES.message1);
    addScore(name1);
    resetGrid();
  } else if (verifyPlayer(MARKS[1])) {
    alert("Bravo " + name2 + ", " + MESSAGES.message1);
    addScore(name2);
    resetGrid();
  } else {
    alert("Personne n'a gagné !");
  }
}

function resetGrid() {
  cell0.innerHTML = "";
  cell1.innerHTML = "";
  cell2.innerHTML = "";
  cell3.innerHTML = "";
  cell4.innerHTML = "";
  cell5.innerHTML = "";
  cell6.innerHTML = "";
  cell7.innerHTML = "";
  cell8.innerHTML = "";
  startTime = new Date();
  updateTimer();
}

// question 5
function addScore(name) {
  let scoreList = document.getElementById("scores");
  scoreList.innerHTML +=
    "<th>" + name + "</th><th>" + new Date().toLocaleString() + "</th>";
}

// question 6
let startTime = new Date();

function updateTimer() {
  let timerElement = document.getElementById("timer");
  let currentTime = new Date();
  let totalSeconds = Math.floor((currentTime - startTime) / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  timerElement.innerHTML =
    " - " +
    (minutes < 10 ? "0" : "") +
    minutes +
    ":" +
    (seconds < 10 ? "0" : "") +
    seconds;
}

setInterval(updateTimer, 1000);

// petit plus pour jouer chacun son tour sans avoir à cliquer 2 fois
let currentPlayer = 0;

// pour recommencer une partie sans devoir rafraîchir la page
let resetButton = document.getElementById("reset");
resetButton.addEventListener("click", function () {
  resetGrid();
  currentPlayer = 0;
});

const btnRetour = document.getElementById("btn-retour");

btnRetour.addEventListener("click", () => {
  // On redirige simplement vers ta page de sélection
  window.location.href = "../main.html";
});
