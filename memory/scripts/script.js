const btnRetour = document.getElementById("btn-retour");
const compteur = document.getElementById("compteur");
const plateau = document.getElementById("plateau");

const images = [
  "../images/memory/bombe.png",
  "../images/memory/bouclier.png",
  "../images/memory/champignon.png",
  "../images/memory/cle.png",
  "../images/memory/coeur.png",
  "../images/memory/crane.png",
  "../images/memory/eclair.png",
  "../images/memory/etoile.png",
  "../images/memory/gemme.png",
  "../images/memory/pomme.png",
];

let carteSelectionnee1 = null;
let carteSelectionnee2 = null;
let verrouillage = false;
let paires = 0;
let coups = 0;

// ===== CONSTANTES & VARIABLES PSEUDO =====
const PSEUDO_KEY = "memory_pseudo";
const SCORES_KEY = "memory_scores";

let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

const modalPseudo = document.getElementById("modal-pseudo");
const inputPseudo = document.getElementById("input-pseudo");
const btnValiderPseudo = document.getElementById("btn-valider-pseudo");

// ===== LOGIQUE PSEUDO (Comme dans le Simon) =====
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

    // Mise à jour de l'affichage sur le bouton et le compteur
    if (document.getElementById("pseudo-affiche")) {
      document.getElementById("pseudo-affiche").textContent = pseudo;
    }
    compteur.textContent = `Paires : ${paires} / 10 — Coups : ${coups}`;

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

// Bouton de changement manuel de pseudo
document.getElementById("btn-changer-joueur").addEventListener("click", () => {
  demanderPseudo(() => {
    afficherScores();
  });
});

// ===== SCORES (LocalStorage) =====
function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

function sauvegarderScore(nbCoups) {
  let scores = chargerScores();

  const existant = scores.find((s) => s.pseudo === pseudo);
  if (existant) {
    // Au Memory, le meilleur score est le plus PETIT nombre de coups
    if (nbCoups < existant.coups) existant.coups = nbCoups;
  } else {
    scores.push({ pseudo, coups: nbCoups });
  }

  // Tri par nombre de coups croissant
  scores.sort((a, b) => a.coups - b.coups);
  scores = scores.slice(0, 10);

  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  afficherScores(nbCoups);
}

function afficherScores(coupActuel = null) {
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
        coupActuel !== null &&
        s.coups === coupActuel;
      return `<tr class="${estMoi ? "moi" : ""}">
      <td>${i + 1}</td>
      <td>${s.pseudo}</td>
      <td>${s.coups}</td>
    </tr>`;
    })
    .join("");
}

// ===== JEU DE MEMORY =====
function afficherCartes() {
  const cartesmelangees = [...images, ...images].sort(
    () => Math.random() - 0.5,
  );
  plateau.innerHTML = "";

  cartesmelangees.forEach((image) => {
    const carte = document.createElement("div");
    carte.classList.add("carte");
    carte.dataset.image = image;

    const dos = document.createElement("div");
    dos.classList.add("dos");
    dos.textContent = "?";

    const face = document.createElement("div");
    face.classList.add("face");
    const img = document.createElement("img");
    img.src = image;
    face.appendChild(img);

    carte.appendChild(dos);
    carte.appendChild(face);

    carte.addEventListener("click", function () {
      if (
        verrouillage ||
        this.classList.contains("trouvee") ||
        this === carteSelectionnee1
      )
        return;

      this.classList.add("retournee");

      if (!carteSelectionnee1) {
        carteSelectionnee1 = this;
      } else {
        carteSelectionnee2 = this;
        coups++;
        verrouillage = true;
        compteur.textContent = `Paires : ${paires} / 10 — Coups : ${coups}`;

        if (
          carteSelectionnee1.dataset.image === carteSelectionnee2.dataset.image
        ) {
          carteSelectionnee1.classList.add("trouvee");
          carteSelectionnee2.classList.add("trouvee");
          paires++;
          compteur.textContent = `Paires : ${paires} / 10 — Coups : ${coups}`;
          carteSelectionnee1 = null;
          carteSelectionnee2 = null;
          verrouillage = false;

          if (paires === 10) {
            setTimeout(() => {
              alert(`Bravo ${pseudo} ! Gagné en ${coups} coups !`);
              sauvegarderScore(coups);
              document.getElementById("btn-rejouer").style.display = "block";
            }, 300);
          }
        } else {
          setTimeout(() => {
            carteSelectionnee1.classList.remove("retournee");
            carteSelectionnee2.classList.remove("retournee");
            carteSelectionnee1 = null;
            carteSelectionnee2 = null;
            verrouillage = false;
          }, 1000);
        }
      }
    });
    plateau.appendChild(carte);
  });
}

// ===== INITIALISATION =====
btnRetour.addEventListener("click", () => {
  window.location.href = "../main.html";
});

// Au lancement :
if (!pseudo) {
  demanderPseudo(() => {
    compteur.classList.remove("hidden");
    afficherCartes();
    afficherScores();
  });
} else {
  modalPseudo.classList.add("hidden");
  if (document.getElementById("pseudo-affiche")) {
    document.getElementById("pseudo-affiche").textContent = pseudo;
  }
  compteur.classList.remove("hidden");
  compteur.textContent = `Paires : 0 / 10 — Coups : 0`;
  afficherCartes();
  afficherScores();
}

// Fonction pour relancer une partie
function reinitialiserPartie() {
  // 1. On cache à nouveau le bouton rejouer
  document.getElementById("btn-rejouer").style.display = "none";

  // 2. On remet les compteurs à zéro
  paires = 0;
  coups = 0;
  carteSelectionnee1 = null;
  carteSelectionnee2 = null;
  verrouillage = false;

  // 3. On actualise l'affichage
  compteur.textContent = `Paires : 0 / 10 — Coups : 0`;

  // 4. On régénère le plateau
  afficherCartes();
}

// On lie le bouton à la fonction
document
  .getElementById("btn-rejouer")
  .addEventListener("click", reinitialiserPartie);
