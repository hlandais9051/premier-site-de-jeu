// =============================================
//  CONFIG
// =============================================
const ENSEIGNES = ["coeur", "carreau", "trèfle", "pique"];
const VALEURS = [
  "As",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Valet",
  "Dame",
  "Roi",
];
const ROUGE = ["coeur", "carreau"];
const NOIRE = ["trèfle", "pique"];
const IMG_PATH = "../images/cartes/"; // adapter si besoin

// =============================================
//  ÉTAT GLOBAL
// =============================================
let piocheMode = 1; // 1 ou 3
let paquet = []; // cartes restantes dans le talon
let defausse = []; // cartes visibles piochées
let fondations = [[], [], [], []]; // 4 piles fondation
let colonnes = Array.from({ length: 7 }, () => []);
let selection = null; // { cartes, source, sourceIndex }
let historique = []; // pile pour undo
let chronoSec = 0;
let chronoTimer = null;
let chronoStarted = false;
let partieGagnee = false;

// =============================================
//  PSEUDO & SCORES
// =============================================
const PSEUDO_KEY = "solitaire_pseudo";
const SCORES_KEY = "solitaire_scores";
let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

const modalPseudo = document.getElementById("modal-pseudo");
const inputPseudo = document.getElementById("input-pseudo");
const btnValPseudo = document.getElementById("btn-valider-pseudo");

function majAffichagePseudo() {
  document.getElementById("pseudo-affiche").textContent = pseudo || "?";
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

// Scores : { [piocheMode]: [{pseudo, secondes}] }
function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || {};
  } catch {
    return {};
  }
}

function sauvegarderScore(sec) {
  if (!pseudo) return false;
  const tous = chargerScores();
  const key = String(piocheMode);
  if (!tous[key]) tous[key] = [];

  const existant = tous[key].find((s) => s.pseudo === pseudo);
  let record = false;
  if (existant) {
    if (sec < existant.secondes) {
      existant.secondes = sec;
      record = true;
    }
  } else {
    tous[key].push({ pseudo, secondes: sec });
    record = true;
  }

  tous[key].sort((a, b) => a.secondes - b.secondes);
  tous[key] = tous[key].slice(0, 10);
  localStorage.setItem(SCORES_KEY, JSON.stringify(tous));
  afficherScores(String(piocheMode), sec);
  return record;
}

let ongletScoreActif = "1";

function afficherScores(mode = ongletScoreActif, secActuels = null) {
  ongletScoreActif = mode;
  const tous = chargerScores();
  const liste = tous[mode] || [];
  const tbody = document.getElementById("score-body");

  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.pioche === mode));

  if (liste.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="score-vide">Aucun score</td></tr>';
    return;
  }

  tbody.innerHTML = liste
    .map((s, i) => {
      const estMoi =
        pseudo &&
        s.pseudo === pseudo &&
        secActuels !== null &&
        s.secondes === secActuels;
      return `<tr class="${estMoi ? "moi" : ""}">
      <td>${i + 1}</td><td>${s.pseudo}</td><td>${formatTemps(s.secondes)}</td>
    </tr>`;
    })
    .join("");
}

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => afficherScores(t.dataset.pioche));
});

function formatTemps(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// =============================================
//  CHRONO
// =============================================
function startChrono() {
  if (chronoStarted) return;
  chronoStarted = true;
  chronoTimer = setInterval(() => {
    chronoSec++;
    document.getElementById("chrono").textContent =
      `⏱ ${formatTemps(chronoSec)}`;
  }, 1000);
}

function stopChrono() {
  clearInterval(chronoTimer);
  chronoTimer = null;
}

function resetChrono() {
  stopChrono();
  chronoSec = 0;
  chronoStarted = false;
  document.getElementById("chrono").textContent = "⏱ 00:00";
}

// =============================================
//  CRÉATION DU PAQUET
// =============================================
function creerPaquet() {
  const p = [];
  for (const e of ENSEIGNES)
    for (const v of VALEURS)
      p.push({ valeur: v, enseigne: e, valeurIndex: VALEURS.indexOf(v) });
  return p.sort(() => Math.random() - 0.5);
}

// =============================================
//  INIT PARTIE
// =============================================
function initPartie() {
  resetChrono();
  partieGagnee = false;
  selection = null;
  historique = [];
  fondations = [[], [], [], []];
  colonnes = Array.from({ length: 7 }, () => []);

  const p = creerPaquet();
  let idx = 0;

  // Distribution dans les colonnes
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r <= c; r++) {
      const carte = { ...p[idx++], visible: r === c };
      colonnes[c].push(carte);
    }
  }

  // Reste dans le talon
  paquet = p.slice(idx).map((c) => ({ ...c, visible: false }));
  defausse = [];

  document.getElementById("btn-undo").disabled = true;
  document.getElementById("info-mode").textContent =
    piocheMode === 1 ? "● FACILE — pioche ×1" : "◆ CLASSIQUE — pioche ×3";

  afficherScores(String(piocheMode));
  rendreJeu();
}

// =============================================
//  RENDU PRINCIPAL
// =============================================
function rendreJeu() {
  rendreTalon();
  rendreDefausse();
  rendreFondations();
  rendreColonnes();

  if (peutAutoCompleter() && !partieGagnee) {
    autoCompleter();
  }
}

// --- TALON ---
function rendreTalon() {
  const el = document.getElementById("talon");
  el.innerHTML = "";
  el.className = "emplacement-carte";

  if (paquet.length === 0) {
    el.classList.add("vide");
    el.textContent = "↺";
  } else {
    const dos = document.createElement("div");
    dos.className = "carte face-cachee";
    el.appendChild(dos);
    el.textContent = "";
  }
}

// --- DÉFAUSSE ---
function rendreDefausse() {
  const el = document.getElementById("defausse");
  el.innerHTML = "";

  if (defausse.length === 0) return;

  // Afficher jusqu'à 3 cartes empilées visuellement (mais seule la dernière est cliquable)
  const debut = Math.max(0, defausse.length - 3);
  defausse.slice(debut).forEach((carte, i) => {
    const carteEl = creerCarteEl(carte);
    carteEl.style.left = `${i * 18}px`;
    carteEl.style.zIndex = i + 1;
    // Seule la dernière carte est interactive
    if (i < defausse.slice(debut).length - 1) {
      carteEl.style.pointerEvents = "none";
    }
    el.appendChild(carteEl);
  });
}

// --- FONDATIONS ---
function rendreFondations() {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`fond-${i}`);
    const enseigne = el.dataset.enseigne;
    el.innerHTML = "";

    const symboles = { coeur: "♥", carreau: "♦", trèfle: "♣", pique: "♠" };
    el.textContent = fondations[i].length === 0 ? symboles[enseigne] : "";

    if (fondations[i].length > 0) {
      const derniere = fondations[i][fondations[i].length - 1];
      const carteEl = creerCarteEl(derniere);
      carteEl.style.position = "absolute";
      carteEl.style.top = "0";
      carteEl.style.left = "0";
      el.appendChild(carteEl);
    }
  }
}

// --- COLONNES ---
function rendreColonnes() {
  for (let c = 0; c < 7; c++) {
    const colEl = document.getElementById(`col-${c}`);
    colEl.innerHTML = "";
    const col = colonnes[c];

    col.forEach((carte, i) => {
      const carteEl = creerCarteEl(carte);
      const decalage = calculerDecalage(col, i);
      carteEl.style.top = `${decalage}px`;
      carteEl.style.zIndex = i + 1;
      colEl.appendChild(carteEl);
    });

    // Hauteur dynamique de la colonne
    if (col.length > 0) {
      const dernierDecalage = calculerDecalage(col, col.length - 1);
      colEl.style.minHeight = `${dernierDecalage + parseInt(getComputedStyle(document.documentElement).getPropertyValue("--card-h"))}px`;
    } else {
      colEl.style.minHeight = getComputedStyle(document.documentElement)
        .getPropertyValue("--card-h")
        .trim();
    }
  }
}

function calculerDecalage(col, index) {
  let d = 0;
  for (let i = 0; i < index; i++) {
    d += col[i].visible ? 28 : 22;
  }
  return d;
}

// =============================================
//  CRÉER ÉLÉMENT CARTE
// =============================================
function creerCarteEl(carte) {
  const el = document.createElement("div");
  el.classList.add("carte");
  el.dataset.valeur = carte.valeur;
  el.dataset.enseigne = carte.enseigne;

  if (!carte.visible) {
    el.classList.add("face-cachee");
  } else {
    const img = document.createElement("img");
    img.src = `${IMG_PATH}${carte.valeur}_${carte.enseigne}.png`;
    img.alt = `${carte.valeur} de ${carte.enseigne}`;
    el.appendChild(img);
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      gererClicCarte(carte, el);
    });
  }

  return el;
}

// =============================================
//  GESTION CLICS
// =============================================

// Clic talon
document.getElementById("talon").addEventListener("click", () => {
  startChrono();
  sauvegarderHistorique();

  if (paquet.length === 0) {
    // Retourner la défausse
    paquet = defausse.reverse().map((c) => ({ ...c, visible: false }));
    defausse = [];
  } else {
    const nb = Math.min(piocheMode, paquet.length);
    for (let i = 0; i < nb; i++) {
      const c = paquet.pop();
      c.visible = true;
      defausse.push(c);
    }
  }

  selection = null;
  rendreJeu();
  majBtnUndo();
});

// Clic fondation
for (let i = 0; i < 4; i++) {
  document.getElementById(`fond-${i}`).addEventListener("click", () => {
    startChrono();
    if (selection) {
      tenterPoserFondation(i);
    }
  });
}

// Clic colonne (zone vide)
for (let c = 0; c < 7; c++) {
  document.getElementById(`col-${c}`).addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      startChrono();
      if (selection) tenterPoserColonne(c);
    }
  });
}

// Clic sur une carte
function gererClicCarte(carte, el) {
  startChrono();

  // Déselectionner si on reclique la même
  if (selection && selection.cartes[0] === carte) {
    deselectionner();
    return;
  }

  // Carte dans la défausse
  if (defausse.length > 0 && defausse[defausse.length - 1] === carte) {
    selectionner([carte], "defausse", defausse.length - 1);
    return;
  }

  // Carte dans une fondation
  for (let i = 0; i < 4; i++) {
    const f = fondations[i];
    if (f.length > 0 && f[f.length - 1] === carte) {
      if (selection) {
        tenterPoserFondation(i);
      } else {
        selectionner([carte], "fondation", i);
      }
      return;
    }
  }

  // Carte dans une colonne
  for (let c = 0; c < 7; c++) {
    const col = colonnes[c];
    const idx = col.indexOf(carte);
    if (idx !== -1) {
      if (selection) {
        tenterPoserColonne(c);
      } else if (carte.visible) {
        // Sélectionner la carte + toutes celles en dessous
        selectionner(col.slice(idx), "colonne", c);
      }
      return;
    }
  }
}

function selectionner(cartes, source, sourceIndex) {
  deselectionner();
  selection = { cartes, source, sourceIndex };
  // Marquer visuellement
  marquerSelection();
}

function deselectionner() {
  selection = null;
  document
    .querySelectorAll(".carte.selectionnee")
    .forEach((el) => el.classList.remove("selectionnee"));
}

function marquerSelection() {
  if (!selection) return;
  // Ré-rendre pour appliquer la classe
  rendreJeu();
  // Chercher les éléments correspondants et les marquer
  selection.cartes.forEach((carte) => {
    document.querySelectorAll(".carte").forEach((el) => {
      if (
        el.dataset.valeur === carte.valeur &&
        el.dataset.enseigne === carte.enseigne
      ) {
        el.classList.add("selectionnee");
      }
    });
  });
}

// =============================================
//  RÈGLES DE JEU
// =============================================
function estRouge(enseigne) {
  return ROUGE.includes(enseigne);
}
function estNoire(enseigne) {
  return NOIRE.includes(enseigne);
}

function peutPoserSurColonne(carteSource, carteCible) {
  if (!carteCible) return carteSource.valeurIndex === 12; // Roi sur colonne vide
  if (!carteCible.visible) return false;
  const couleursDiff =
    (estRouge(carteSource.enseigne) && estNoire(carteCible.enseigne)) ||
    (estNoire(carteSource.enseigne) && estRouge(carteCible.enseigne));
  return couleursDiff && carteSource.valeurIndex === carteCible.valeurIndex - 1;
}

function peutPoserSurFondation(carte, indexFond) {
  const f = fondations[indexFond];
  const enseigne = document.getElementById(`fond-${indexFond}`).dataset
    .enseigne;
  if (carte.enseigne !== enseigne) return false;
  if (f.length === 0) return carte.valeur === "As";
  return carte.valeurIndex === f[f.length - 1].valeurIndex + 1;
}

// =============================================
//  DÉPLACEMENTS
// =============================================
function tenterPoserColonne(colCible) {
  if (!selection) return;
  const col = colonnes[colCible];
  const carteCible = col.length > 0 ? col[col.length - 1] : null;
  const carteSrc = selection.cartes[0];

  if (!peutPoserSurColonne(carteSrc, carteCible)) {
    deselectionner();
    return;
  }

  sauvegarderHistorique();
  retirerSelection();
  colonnes[colCible].push(...selection.cartes);
  retournerDerniereCarte();
  selection = null;
  rendreJeu();
  majBtnUndo();
  verifierVictoire();
}

function tenterPoserFondation(indexFond) {
  if (!selection || selection.cartes.length !== 1) {
    deselectionner();
    return;
  }

  const carte = selection.cartes[0];
  if (!peutPoserSurFondation(carte, indexFond)) {
    deselectionner();
    return;
  }

  sauvegarderHistorique();
  retirerSelection();
  fondations[indexFond].push(carte);
  retournerDerniereCarte();
  selection = null;
  rendreJeu();
  majBtnUndo();
  verifierVictoire();
}

function retirerSelection() {
  const { source, sourceIndex, cartes } = selection;

  if (source === "defausse") {
    defausse.splice(sourceIndex, cartes.length);
  } else if (source === "colonne") {
    colonnes[sourceIndex].splice(
      colonnes[sourceIndex].length - cartes.length,
      cartes.length,
    );
  } else if (source === "fondation") {
    fondations[sourceIndex].pop();
  }
}

function retournerDerniereCarte() {
  // Retourner la dernière carte de chaque colonne si nécessaire
  for (let c = 0; c < 7; c++) {
    const col = colonnes[c];
    if (col.length > 0 && !col[col.length - 1].visible) {
      col[col.length - 1].visible = true;
    }
  }
}

// =============================================
//  VICTOIRE
// =============================================
function verifierVictoire() {
  const gagne = fondations.every((f) => f.length === 13);
  if (!gagne || partieGagnee) return;
  partieGagnee = true;
  stopChrono();

  const record = sauvegarderScore(chronoSec);

  setTimeout(() => {
    document.getElementById("temps-final").textContent = formatTemps(chronoSec);
    document.getElementById("msg-record").style.display = record
      ? "block"
      : "none";
    document.getElementById("modal-victoire").classList.remove("hidden");
  }, 400);
}

// =============================================
//  HISTORIQUE / UNDO
// =============================================
function sauvegarderHistorique() {
  historique.push({
    paquet: JSON.parse(JSON.stringify(paquet)),
    defausse: JSON.parse(JSON.stringify(defausse)),
    fondations: JSON.parse(JSON.stringify(fondations)),
    colonnes: JSON.parse(JSON.stringify(colonnes)),
    chronoSec,
  });
  if (historique.length > 50) historique.shift();
}

function annulerCoup() {
  if (historique.length === 0) return;
  const etat = historique.pop();
  paquet = etat.paquet;
  defausse = etat.defausse;
  fondations = etat.fondations;
  colonnes = etat.colonnes;
  chronoSec = etat.chronoSec;
  document.getElementById("chrono").textContent = `⏱ ${formatTemps(chronoSec)}`;
  selection = null;
  rendreJeu();
  majBtnUndo();
}

function majBtnUndo() {
  document.getElementById("btn-undo").disabled = historique.length === 0;
}

// 2. La logique de vérification
function peutAutoCompleter() {
  // Pas d'auto-run s'il reste des cartes cachées ou à piocher
  if (paquet.length > 0 || defausse.length > 0) return false;

  for (let col of colonnes) {
    if (col.some((carte) => !carte.visible)) return false;
  }
  return true;
}

// 3. La fonction d'animation (Corrigée avec rendreJeu)
async function autoCompleter() {
  let changement = true;

  while (changement) {
    changement = false;

    for (let i = 0; i < 7; i++) {
      let col = colonnes[i];
      if (col.length === 0) continue;

      let carte = col[col.length - 1];

      for (let f = 0; f < 4; f++) {
        if (peutPoserSurFondation(carte, f)) {
          // On ne sauvegarde pas chaque petit pas dans l'historique pour l'auto-run
          fondations[f].push(col.pop());
          changement = true;

          rendreJeu(); // APPEL DE LA BONNE FONCTION DE RENDU

          // Pause de 100ms pour voir les cartes "voler" vers les piles
          await new Promise((r) => setTimeout(r, 100));

          verifierVictoire();
          break;
        }
      }
      if (changement) break;
    }
  }
}

// =============================================
//  NAVIGATION
// =============================================
document.querySelectorAll(".carte-mode").forEach((el) => {
  el.addEventListener("click", () => {
    piocheMode = parseInt(el.dataset.pioche);

    function lancer() {
      document.getElementById("ecran-accueil").classList.add("hidden");
      document.getElementById("ecran-jeu").classList.remove("hidden");
      document.getElementById("scoreboard").classList.add("hidden");
      document.getElementById("btn-retour").classList.add("hidden");
      document.getElementById("btn-changer-joueur").classList.add("hidden");
      initPartie();
    }

    if (!pseudo) demanderPseudo(lancer);
    else lancer();
  });
});

document.getElementById("btn-changer-mode").addEventListener("click", () => {
  stopChrono();
  selection = null;
  document.getElementById("ecran-jeu").classList.add("hidden");
  document.getElementById("ecran-accueil").classList.remove("hidden");
  document.getElementById("scoreboard").classList.remove("hidden");
  document.getElementById("btn-retour").classList.remove("hidden");
  document.getElementById("btn-changer-joueur").classList.remove("hidden");

  afficherScores(String(piocheMode));
});

document.getElementById("btn-nouvelle-partie").addEventListener("click", () => {
  document.getElementById("modal-victoire").classList.add("hidden");
  initPartie();
});

document.getElementById("btn-rejouer-modal").addEventListener("click", () => {
  document.getElementById("modal-victoire").classList.add("hidden");
  initPartie();
});

document.getElementById("btn-undo").addEventListener("click", annulerCoup);

document.getElementById("btn-retour").addEventListener("click", () => {
  stopChrono();
  window.location.href = "../main.html";
});

// =============================================
//  DÉMARRAGE
// =============================================
majAffichagePseudo();
afficherScores("1");
