// ===== SONS =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const frequences = {
  vert: 329.6,
  rouge: 261.6,
  bleu: 220.0,
  jaune: 164.8,
};

function jouerSon(couleur, duree = 0.3) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.value = frequences[couleur];
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duree);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duree);
}

function jouerSonErreur() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sawtooth";
  osc.frequency.value = 80;
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.6);
}

// ===== PSEUDO =====
const PSEUDO_KEY = "simon_pseudo";
const SCORES_KEY = "simon_scores";

let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

const modalPseudo = document.getElementById("modal-pseudo");
const inputPseudo = document.getElementById("input-pseudo");
const btnValiderPseudo = document.getElementById("btn-valider-pseudo");

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
    document.getElementById("pseudo-affiche").textContent = pseudo;
    modalPseudo.classList.add("hidden");
    btnValiderPseudo.removeEventListener("click", valider);
    inputPseudo.removeEventListener("keydown", onEnter);
    if (callback) callback();
  }

  function onEnter(e) {
    if (e.key === "Enter") valider();
  }

  btnValiderPseudo.addEventListener("click", valider);
  inputPseudo.addEventListener("keydown", onEnter);
}

// ===== SCORES (localStorage) =====
function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

function sauvegarderScore(niveau) {
  let scores = chargerScores();

  const existant = scores.find((s) => s.pseudo === pseudo);
  if (existant) {
    if (niveau > existant.niveau) existant.niveau = niveau;
  } else {
    scores.push({ pseudo, niveau });
  }

  scores.sort((a, b) => b.niveau - a.niveau);
  scores = scores.slice(0, 10);

  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  afficherScores(niveau);
}

function afficherScores(niveauActuel = null) {
  const scores = chargerScores();
  const tbody = document.getElementById("score-body");

  if (scores.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="vide">Aucun score pour l\'instant</td></tr>';
    return;
  }

  tbody.innerHTML = scores
    .map((s, i) => {
      const estMoi =
        pseudo &&
        s.pseudo === pseudo &&
        niveauActuel !== null &&
        s.niveau === niveauActuel;
      return `<tr class="${estMoi ? "moi" : ""}">
      <td>${i + 1}</td>
      <td>${s.pseudo}</td>
      <td>${s.niveau}</td>
    </tr>`;
    })
    .join("");
}

// ===== ÉTAT DU JEU =====
const couleurs = ["vert", "rouge", "bleu", "jaune"];

let sequence = [];
let indexJoueur = 0;
let partieEnCours = false;
let joueurPeutCliquer = false;

// ===== ÉLÉMENTS DOM =====
const btnStart = document.getElementById("btn-start");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const boutons = document.querySelectorAll(".bouton-simon");

// ===== DÉMARRER =====
btnStart.addEventListener("click", () => {
  if (audioCtx.state === "suspended") audioCtx.resume();

  function lancerPartie() {
    sequence = [];
    indexJoueur = 0;
    partieEnCours = true;
    scoreEl.textContent = "0";
    messageEl.textContent = "";
    document.body.classList.remove("perdu");
    btnStart.textContent = "EN COURS";
    btnStart.disabled = true;
    ajouterEtJouerSequence();
  }

  if (!pseudo) {
    demanderPseudo(lancerPartie);
  } else {
    lancerPartie();
  }
});

// ===== LOGIQUE =====
function ajouterEtJouerSequence() {
  joueurPeutCliquer = false;
  indexJoueur = 0;

  const aleatoire = couleurs[Math.floor(Math.random() * 4)];
  sequence.push(aleatoire);

  scoreEl.textContent = sequence.length - 1 || 0;
  messageEl.textContent = "Regarde bien...";

  const delai = 600;
  sequence.forEach((couleur, i) => {
    setTimeout(() => allumerBouton(couleur), delai * i);
  });

  setTimeout(() => {
    joueurPeutCliquer = true;
    messageEl.textContent = "À toi !";
  }, delai * sequence.length);
}

function allumerBouton(couleur) {
  const el = document.getElementById(couleur);
  el.classList.add("actif");
  jouerSon(couleur, 0.35);
  setTimeout(() => el.classList.remove("actif"), 350);
}

// ===== CLICS DU JOUEUR =====
boutons.forEach((bouton) => {
  bouton.addEventListener("click", () => {
    if (!joueurPeutCliquer) return;

    const couleur = bouton.id;
    bouton.classList.add("clique");
    jouerSon(couleur, 0.2);
    setTimeout(() => bouton.classList.remove("clique"), 150);

    if (couleur !== sequence[indexJoueur]) {
      perdu();
      return;
    }

    indexJoueur++;

    if (indexJoueur === sequence.length) {
      joueurPeutCliquer = false;
      scoreEl.textContent = sequence.length;
      messageEl.textContent = "✓ Bien joué !";
      setTimeout(() => ajouterEtJouerSequence(), 1000);
    }
  });
});

// ===== DÉFAITE =====
function perdu() {
  joueurPeutCliquer = false;
  partieEnCours = false;

  jouerSonErreur();
  document.body.classList.add("perdu");

  const niveauFinal = sequence.length - 1;
  scoreEl.textContent = niveauFinal;
  messageEl.textContent = "Perdu !";

  sauvegarderScore(niveauFinal);

  setTimeout(() => {
    btnStart.textContent = "REJOUER";
    btnStart.disabled = false;
  }, 800);
}

// ===== RETOUR ACCUEIL =====
document.getElementById("btn-retour").addEventListener("click", () => {
  window.location.href = "../main.html";
});

// ===== CHANGER DE JOUEUR =====
document.getElementById("btn-changer-joueur").addEventListener("click", () => {
  // Si une partie est en cours, on bloque
  if (partieEnCours) return;
  demanderPseudo(null);
});

// ===== INIT =====
afficherScores();
modalPseudo.classList.add("hidden");

// Afficher le pseudo dans le bouton dès le chargement
if (pseudo) {
  document.getElementById("pseudo-affiche").textContent = pseudo;
} else {
  document.getElementById("pseudo-affiche").textContent = "?";
}
