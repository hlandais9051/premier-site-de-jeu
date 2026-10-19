// ===== CONFIG =====
const NB_SLOTS = 4;
const NB_ESSAIS = 10;
const COULEURS = [
  { id: 0, css: "var(--c0)", nom: "rouge" },
  { id: 1, css: "var(--c1)", nom: "bleu" },
  { id: 2, css: "var(--c2)", nom: "vert" },
  { id: 3, css: "var(--c3)", nom: "orange" },
  { id: 4, css: "var(--c4)", nom: "violet" },
  { id: 5, css: "var(--c5)", nom: "rose" },
  { id: 6, css: "var(--c6)", nom: "jaune" },
  { id: 7, css: "var(--c7)", nom: "gris" },
];

// ===== ÉTAT =====
let solution = [];
let essaiActuel = 0; // 0 à 9
let slotActuel = []; // tableau de 4 cases (null ou id couleur)
let couleurChoisie = null; // id couleur sélectionnée dans la palette
let partieTerminee = false;

// ===== PSEUDO & SCORES =====
const PSEUDO_KEY = "mastermind_pseudo";
const SCORES_KEY = "mastermind_scores";
let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

// ===== DOM =====
const grilleEl = document.getElementById("grille");
const paletteEl = document.getElementById("palette");
const slotsActifsEl = document.getElementById("slots-actifs");
const btnValider = document.getElementById("btn-valider");
const btnEffacer = document.getElementById("btn-effacer");
const modalPseudo = document.getElementById("modal-pseudo");
const inputPseudo = document.getElementById("input-pseudo");
const btnValPseudo = document.getElementById("btn-valider-pseudo");
const modalFin = document.getElementById("modal-fin");
const btnRejouer = document.getElementById("btn-rejouer");

// ===== INIT =====
function init() {
  partieTerminee = false;
  essaiActuel = 0;
  slotActuel = Array(NB_SLOTS).fill(null);
  couleurChoisie = null;

  solution = [];
  let couleursDisponibles = COULEURS.map((c) => c.id); // On crée une copie des IDs de couleurs [0, 1, 2, 3, 4, 5]

  for (let i = 0; i < NB_SLOTS; i++) {
    // On tire un index au hasard parmi les couleurs restantes
    const randomIndex = Math.floor(Math.random() * couleursDisponibles.length);
    // On récupère la couleur et on l'ajoute à la solution
    const couleurChoisie = couleursDisponibles.splice(randomIndex, 1)[0];
    solution.push(couleurChoisie);
  }

  construireGrille();
  construirePalette();
  construireSlotsActifs();
  majBtnValider();
  afficherScores();

  if (pseudo) {
    document.getElementById("pseudo-affiche").textContent = pseudo;
  }
}

// ===== GRILLE =====
function construireGrille() {
  grilleEl.innerHTML = "";
  // On crée les 10 lignes (column-reverse → ligne 1 en bas visuellement)
  for (let i = NB_ESSAIS; i >= 1; i--) {
    const ligne = document.createElement("div");
    ligne.classList.add("ligne");
    ligne.id = `ligne-${i}`;
    if (i === 1) ligne.classList.add("active");

    // Numéro
    const num = document.createElement("span");
    num.classList.add("ligne-num");
    num.textContent = i;
    ligne.appendChild(num);

    // 4 slots
    for (let s = 0; s < NB_SLOTS; s++) {
      const slot = document.createElement("div");
      slot.classList.add("slot-grille");
      ligne.appendChild(slot);
    }

    // 4 pions indices (2x2)
    const indices = document.createElement("div");
    indices.classList.add("indices");
    for (let p = 0; p < NB_SLOTS; p++) {
      const pion = document.createElement("div");
      pion.classList.add("pion");
      indices.appendChild(pion);
    }
    ligne.appendChild(indices);

    grilleEl.appendChild(ligne);
  }
}

// ===== PALETTE =====
function construirePalette() {
  paletteEl.innerHTML = "";
  COULEURS.forEach((c) => {
    const btn = document.createElement("div");
    btn.classList.add("couleur-btn");
    btn.style.background = c.css;
    btn.dataset.id = c.id;
    btn.title = c.nom;
    btn.addEventListener("click", () => selectionnerCouleur(c.id));
    paletteEl.appendChild(btn);
  });
}

// ===== SLOTS ACTIFS =====
function construireSlotsActifs() {
  slotsActifsEl.innerHTML = "";
  for (let i = 0; i < NB_SLOTS; i++) {
    const slot = document.createElement("div");
    slot.classList.add("slot-actif");
    slot.dataset.index = i;
    slot.addEventListener("click", () => remplirSlot(i));
    slotsActifsEl.appendChild(slot);
  }
}

// ===== SÉLECTIONNER UNE COULEUR =====
function selectionnerCouleur(id) {
  if (partieTerminee) return;
  couleurChoisie = id;

  // Mettre en surbrillance
  document.querySelectorAll(".couleur-btn").forEach((btn) => {
    btn.classList.toggle("selectionnee", parseInt(btn.dataset.id) === id);
  });

  // Remplir automatiquement le prochain slot vide
  const prochain = slotActuel.indexOf(null);
  if (prochain !== -1) remplirSlot(prochain);
}

// ===== REMPLIR UN SLOT =====
function remplirSlot(index) {
  if (partieTerminee || couleurChoisie === null) return;

  slotActuel[index] = couleurChoisie;

  // Mise à jour visuelle du slot actif
  const slotEl = slotsActifsEl.children[index];
  slotEl.style.background = COULEURS[couleurChoisie].css;
  slotEl.classList.add("rempli");

  // Mise à jour visuelle dans la grille (ligne active)
  const ligneActive = document.getElementById(`ligne-${essaiActuel + 1}`);
  const slots = ligneActive.querySelectorAll(".slot-grille");
  slots[index].style.background = COULEURS[couleurChoisie].css;
  slots[index].classList.add("rempli");

  majBtnValider();
}

// ===== EFFACER =====
btnEffacer.addEventListener("click", () => {
  slotActuel = Array(NB_SLOTS).fill(null);
  couleurChoisie = null;

  // Vider visuellement les slots actifs
  Array.from(slotsActifsEl.children).forEach((s) => {
    s.style.background = "";
    s.classList.remove("rempli");
  });

  // Vider la ligne active dans la grille
  const ligneActive = document.getElementById(`ligne-${essaiActuel + 1}`);
  ligneActive.querySelectorAll(".slot-grille").forEach((s) => {
    s.style.background = "";
    s.classList.remove("rempli");
  });

  document
    .querySelectorAll(".couleur-btn")
    .forEach((b) => b.classList.remove("selectionnee"));
  majBtnValider();
});

// ===== VALIDER =====
btnValider.addEventListener("click", validerEssai);

function validerEssai() {
  if (partieTerminee) return;
  if (slotActuel.includes(null)) return;

  const { noirs, blancs } = calculerIndices(slotActuel, solution);

  // Mettre à jour les pions de la ligne
  const ligneActive = document.getElementById(`ligne-${essaiActuel + 1}`);
  const pions = ligneActive.querySelectorAll(".pion");

  let pI = 0;
  for (let n = 0; n < noirs; n++) {
    pions[pI++].classList.add("noir");
  }
  for (let b = 0; b < blancs; b++) {
    pions[pI++].classList.add("blanc");
  }

  ligneActive.classList.remove("active");
  ligneActive.classList.add("jouee");

  essaiActuel++;

  // Victoire ?
  if (noirs === NB_SLOTS) {
    partieTerminee = true;
    setTimeout(() => afficherFin(true), 400);
    return;
  }

  // Défaite ?
  if (essaiActuel >= NB_ESSAIS) {
    partieTerminee = true;
    setTimeout(() => afficherFin(false), 400);
    return;
  }

  // Prochaine ligne
  const prochaineLigne = document.getElementById(`ligne-${essaiActuel + 1}`);
  prochaineLigne.classList.add("active");
  // Reset slots
  slotActuel = Array(NB_SLOTS).fill(null);
  couleurChoisie = null;
  Array.from(slotsActifsEl.children).forEach((s) => {
    s.style.background = "";
    s.classList.remove("rempli");
  });
  document
    .querySelectorAll(".couleur-btn")
    .forEach((b) => b.classList.remove("selectionnee"));
  majBtnValider();
}

// ===== CALCUL INDICES =====
function calculerIndices(essai, secret) {
  let noirs = 0;
  let blancs = 0;

  const resteEssai = [];
  const resteSecret = [];

  // Pions noirs : bonne couleur, bonne position
  for (let i = 0; i < NB_SLOTS; i++) {
    if (essai[i] === secret[i]) {
      noirs++;
    } else {
      resteEssai.push(essai[i]);
      resteSecret.push(secret[i]);
    }
  }

  // Pions blancs : bonne couleur, mauvaise position
  resteEssai.forEach((c) => {
    const idx = resteSecret.indexOf(c);
    if (idx !== -1) {
      blancs++;
      resteSecret.splice(idx, 1);
    }
  });

  return { noirs, blancs };
}

// ===== MAJ BOUTON VALIDER =====
function majBtnValider() {
  btnValider.disabled = slotActuel.includes(null) || partieTerminee;
}

// ===== FIN DE PARTIE =====
function afficherFin(gagne) {
  document.getElementById("fin-emoji").textContent = gagne ? "🏆" : "💀";
  document.getElementById("fin-titre").textContent = gagne
    ? "GAGNÉ !"
    : "PERDU !";

  const essaisEl = document.getElementById("fin-essais");
  if (gagne) {
    essaisEl.textContent = essaiActuel;
    document.getElementById("fin-message").innerHTML =
      `Tu as trouvé en <strong id="fin-essais">${essaiActuel}</strong> essai${essaiActuel > 1 ? "s" : ""} !`;
  } else {
    document.getElementById("fin-message").textContent = "La solution était :";
  }

  // Révéler la solution
  const revealEl = document.getElementById("solution-reveal");
  revealEl.innerHTML = "";
  solution.forEach((id) => {
    const bille = document.createElement("div");
    bille.classList.add("solution-bille");
    bille.style.background = COULEURS[id].css;
    revealEl.appendChild(bille);
  });

  // Sauvegarder le score si gagné
  if (gagne && pseudo) {
    sauvegarderScore(essaiActuel);
  }

  const btnVoirPlateau = document.createElement("button");
  btnVoirPlateau.textContent = "Voir mes essais";
  btnVoirPlateau.style.marginTop = "10px";
  btnVoirPlateau.style.background = "transparent";
  btnVoirPlateau.style.color = "white";
  btnVoirPlateau.style.border = "1px solid white";

  btnVoirPlateau.onclick = () => {
    modalFin.classList.add("hidden"); // On cache la modal
    creerBoutonRetourModal();
  };

  modalFin.querySelector(".modal-box").appendChild(btnVoirPlateau);

  modalFin.classList.remove("hidden");
}

function creerBoutonRetourModal() {
  if (document.getElementById("btn-retour-resultat")) return;

  const btn = document.createElement("button");
  btn.id = "btn-retour-resultat";
  btn.textContent = "📊 Revoir résultat";
  btn.className = "btn-menu"; // Utilise tes styles de bouton existants
  btn.style.top = "60px"; // Juste en dessous du bouton "Accueil"
  btn.onclick = () => {
    modalFin.classList.remove("hidden");
    btn.remove();
  };
  document.body.appendChild(btn);
}

// ===== REJOUER =====
btnRejouer.addEventListener("click", () => {
  modalFin.classList.add("hidden");
  init();
});

// ===== PSEUDO =====
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
  if (!partieTerminee && essaiActuel > 0) return; // Bloquer en cours de partie
  demanderPseudo(null);
});

// ===== SCORES =====
// Tri par nombre d'essais croissant (moins = mieux)
function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

function sauvegarderScore(essais) {
  let scores = chargerScores();
  const existant = scores.find((s) => s.pseudo === pseudo);

  if (existant) {
    if (essais < existant.essais) existant.essais = essais; // Garder le meilleur (moins d'essais)
  } else {
    scores.push({ pseudo, essais });
  }

  scores.sort((a, b) => a.essais - b.essais); // Moins d'essais = meilleur
  scores = scores.slice(0, 10);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  afficherScores(essais);
}

function afficherScores(essaisActuels = null) {
  const scores = chargerScores();
  const tbody = document.getElementById("score-body");

  if (scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="vide">Aucun score</td></tr>';
    return;
  }

  tbody.innerHTML = scores
    .map((s, i) => {
      const estMoi =
        pseudo &&
        s.pseudo === pseudo &&
        essaisActuels !== null &&
        s.essais === essaisActuels;
      return `<tr class="${estMoi ? "moi" : ""}">
      <td>${i + 1}</td>
      <td>${s.pseudo}</td>
      <td>${s.essais}</td>
    </tr>`;
    })
    .join("");
}

// ===== RETOUR ACCUEIL =====
document.getElementById("btn-retour").addEventListener("click", () => {
  window.location.href = "../main.html";
});

// ===== DÉMARRAGE =====
if (!pseudo) {
  demanderPseudo(() => init());
} else {
  document.getElementById("pseudo-affiche").textContent = pseudo;
  init();
}
