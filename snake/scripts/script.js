const canvas = document.getElementById("canvas-snake");
const ctx = canvas.getContext("2d");
const compteur = document.getElementById("compteur");
const ecranAccueil = document.getElementById("ecran-accueil");
const btnStart = document.getElementById("btn-start");
const btnRetour = document.getElementById("btn-retour");
const inputVitesse = document.getElementById("input-vitesse");
const modalPseudo = document.getElementById("modal-pseudo");
const inputPseudo = document.getElementById("input-pseudo");
const btnValPseudo = document.getElementById("btn-valider-pseudo");

const TAILLE_CASE = 20;
const COLONNES = 20;
const LIGNES = 20;

canvas.width = TAILLE_CASE * COLONNES;
canvas.height = TAILLE_CASE * LIGNES;

let snake, direction, prochDir, pomme, score, intervalJeu, vitesse;

// ===== PSEUDO =====
const PSEUDO_KEY = "snake_pseudo";
const SCORES_KEY = "snake_scores";
let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

function majAffichagePseudo() {
  document.getElementById("pseudo-affiche-accueil").textContent = pseudo
    ? pseudo
    : "?";
}

function demanderPseudo(callback) {
  modalPseudo.classList.remove("hidden");
  inputPseudo.value = pseudo || "";
  setTimeout(() => {
    inputPseudo.focus();
    inputPseudo.select();
  }, 50);

  function valider() {
    const val = inputPseudo.value.trim();
    if (!val) return;
    pseudo = val;
    localStorage.setItem(PSEUDO_KEY, pseudo);
    majAffichagePseudo();
    modalPseudo.classList.add("hidden");
    btnValPseudo.removeEventListener("click", valider);
    inputPseudo.removeEventListener("keydown", onEnter);
    if (callback) callback();
  }

  function onEnter(e) {
    if (e.key === "Enter") valider();
  }
  btnValPseudo.addEventListener("click", valider);
  inputPseudo.addEventListener("keydown", onEnter);
}

document.getElementById("btn-changer-joueur").addEventListener("click", () => {
  demanderPseudo(null);
});

// ===== SCORES =====
// Structure : { [vitesse]: [ {pseudo, score}, ... ] }
function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
  } catch {
    return {};
  }
}

function sauvegarderScore(scoreVal, vitesseVal) {
  if (!pseudo) return;
  const tous = chargerScores();
  const key = String(vitesseVal);

  if (!tous[key]) tous[key] = [];

  const existant = tous[key].find((s) => s.pseudo === pseudo);
  if (existant) {
    if (scoreVal > existant.score) existant.score = scoreVal;
  } else {
    tous[key].push({ pseudo, score: scoreVal });
  }

  tous[key].sort((a, b) => b.score - a.score);
  tous[key] = tous[key].slice(0, 10);

  localStorage.setItem(SCORES_KEY, JSON.stringify(tous));
  afficherScores(vitesseVal, scoreVal);
}

// Onglets actifs
let ongletActif = inputVitesse.value;

function afficherScores(vitesseVal = ongletActif, scoreActuel = null) {
  ongletActif = String(vitesseVal);
  const tous = chargerScores();
  const liste = tous[ongletActif] || [];
  const tbody = document.getElementById("score-body");

  // Mettre à jour l'onglet actif
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.diff === ongletActif);
  });

  if (liste.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="vide">Aucun score</td></tr>';
    return;
  }

  tbody.innerHTML = liste
    .map((s, i) => {
      const estMoi =
        pseudo &&
        s.pseudo === pseudo &&
        scoreActuel !== null &&
        s.score === scoreActuel;
      return `<tr class="${estMoi ? "moi" : ""}">
      <td>${i + 1}</td><td>${s.pseudo}</td><td>${s.score}</td>
    </tr>`;
    })
    .join("");
}

// Clic sur les onglets
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => afficherScores(tab.dataset.diff));
});

// Quand on change la vitesse, changer aussi l'onglet affiché
inputVitesse.addEventListener("change", () => {
  afficherScores(inputVitesse.value);
});

// ===== JEU =====
function init() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  prochDir = { x: 1, y: 0 };
  score = 0;
  vitesse = parseInt(inputVitesse.value);
  placerPomme();
  compteur.innerText = "Score : 0";
}

function placerPomme() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLONNES),
      y: Math.floor(Math.random() * LIGNES),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  pomme = pos;
}

function boucleJeu() {
  direction = { ...prochDir };
  const tete = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (tete.x < 0 || tete.x >= COLONNES || tete.y < 0 || tete.y >= LIGNES) {
    terminerJeu();
    return;
  }
  if (snake.some((s) => s.x === tete.x && s.y === tete.y)) {
    terminerJeu();
    return;
  }

  snake.unshift(tete);

  if (tete.x === pomme.x && tete.y === pomme.y) {
    score++;
    compteur.innerText = `Score : ${score}`;
    placerPomme();
  } else {
    snake.pop();
  }

  dessiner();
}

function dessiner() {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x < COLONNES; x++)
    for (let y = 0; y < LIGNES; y++)
      ctx.strokeRect(
        x * TAILLE_CASE,
        y * TAILLE_CASE,
        TAILLE_CASE,
        TAILLE_CASE,
      );

  // Pomme
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(
    pomme.x * TAILLE_CASE + TAILLE_CASE / 2,
    pomme.y * TAILLE_CASE + TAILLE_CASE / 2,
    TAILLE_CASE / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#2ecc71" : "#27ae60";
    const marge = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(
      seg.x * TAILLE_CASE + marge,
      seg.y * TAILLE_CASE + marge,
      TAILLE_CASE - marge * 2,
      TAILLE_CASE - marge * 2,
      4,
    );
    ctx.fill();
  });
}

function terminerJeu() {
  clearInterval(intervalJeu);

  // Sauvegarder avant l'alert
  sauvegarderScore(score, vitesse);

  setTimeout(() => {
    alert(`Game Over ! Score : ${score}`);
    ecranAccueil.classList.remove("hidden");
    canvas.classList.add("hidden");
    compteur.classList.add("hidden");
    // Afficher les scores de la vitesse jouée
    afficherScores(vitesse);
  }, 100);
}

btnStart.addEventListener("click", () => {
  function lancer() {
    ecranAccueil.classList.add("hidden");
    canvas.classList.remove("hidden");
    compteur.classList.remove("hidden");
    init();
    dessiner();
    if (intervalJeu) clearInterval(intervalJeu);
    intervalJeu = setInterval(boucleJeu, vitesse);
  }

  if (!pseudo) {
    demanderPseudo(lancer);
  } else {
    lancer();
  }
});

window.addEventListener("keydown", (e) => {
  if (canvas.classList.contains("hidden")) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
    e.preventDefault();
  if (e.key === "ArrowUp" && direction.y === 0) prochDir = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && direction.y === 0) prochDir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && direction.x === 0) prochDir = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && direction.x === 0) prochDir = { x: 1, y: 0 };
});

btnRetour.addEventListener("click", () => {
  clearInterval(intervalJeu);
  window.location.href = "../main.html";
});

// ===== INIT =====
majAffichagePseudo();
afficherScores(inputVitesse.value);
