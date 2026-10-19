// =============================================
//  CONFIG PAR DIFFICULTÉ
// =============================================
const CONFIG = {
  facile: {
    maxLongueur: 5,
    essais: 4,
    couleur: "#2ecc71",
    label: "● FACILE",
    // Ordre : socle → poteau → barre → tête → corps+jambes
    // 4 erreurs = 4 étapes corps, la potence est dessinée d'un coup à l'init
    etapes: [
      (ctx, w, h) => {
        // 1 - Socle + poteau + barre horizontale
        ctx.moveTo(10, h - 10);
        ctx.lineTo(w - 10, h - 10); // socle
        ctx.moveTo(30, h - 10);
        ctx.lineTo(30, 15); // poteau vertical
        ctx.moveTo(30, 15);
        ctx.lineTo(w / 2 + 10, 15); // barre horizontale
        ctx.moveTo(w / 2 + 10, 15);
        ctx.lineTo(w / 2 + 10, 35); // corde
      },
      (ctx, w, h) => {
        // 2 - Tête
        ctx.arc(w / 2 + 10, 50, 15, 0, Math.PI * 2);
      },
      (ctx, w, h) => {
        // 3 - Corps + bras
        ctx.moveTo(w / 2 + 10, 65);
        ctx.lineTo(w / 2 + 10, 128);
        ctx.moveTo(w / 2 + 10, 82);
        ctx.lineTo(w / 2 - 25, 112);
        ctx.moveTo(w / 2 + 10, 82);
        ctx.lineTo(w / 2 + 45, 112);
      },
      (ctx, w, h) => {
        // 4 - Jambes
        ctx.moveTo(w / 2 + 10, 128);
        ctx.lineTo(w / 2 - 18, h - 12);
        ctx.moveTo(w / 2 + 10, 128);
        ctx.lineTo(w / 2 + 38, h - 12);
      },
    ],
  },

  normal: {
    minLongueur: 6,
    maxLongueur: 8,
    essais: 7,
    couleur: "#f39c12",
    label: "◆ NORMAL",
    // Ordre : socle → poteau → barre → corde → tête → corps → bras G → bras D
    // (7 étapes, potence en 4 temps avant le corps)
    etapes: [
      (ctx, w, h) => {
        // 1 - Socle
        ctx.moveTo(10, h - 10);
        ctx.lineTo(w - 10, h - 10);
      },
      (ctx, w, h) => {
        // 2 - Poteau vertical
        ctx.moveTo(30, h - 10);
        ctx.lineTo(30, 15);
      },
      (ctx, w, h) => {
        // 3 - Barre horizontale + corde
        ctx.moveTo(30, 15);
        ctx.lineTo(w / 2 + 10, 15);
        ctx.moveTo(w / 2 + 10, 15);
        ctx.lineTo(w / 2 + 10, 35);
      },
      (ctx, w, h) => {
        // 4 - Tête
        ctx.arc(w / 2 + 10, 50, 15, 0, Math.PI * 2);
      },
      (ctx, w, h) => {
        // 5 - Corps
        ctx.moveTo(w / 2 + 10, 65);
        ctx.lineTo(w / 2 + 10, 128);
      },
      (ctx, w, h) => {
        // 6 - Bras gauche + bras droit
        ctx.moveTo(w / 2 + 10, 85);
        ctx.lineTo(w / 2 - 22, 115);
        ctx.moveTo(w / 2 + 10, 85);
        ctx.lineTo(w / 2 + 42, 115);
      },
      (ctx, w, h) => {
        // 7 - Jambe gauche + jambe droite
        ctx.moveTo(w / 2 + 10, 128);
        ctx.lineTo(w / 2 - 18, h - 12);
        ctx.moveTo(w / 2 + 10, 128);
        ctx.lineTo(w / 2 + 38, h - 12);
      },
    ],
  },

  difficile: {
    minLongueur: 9,
    essais: 10,
    couleur: "#ff0000",
    label: "★ DIFFICILE",
    // Ordre : socle → poteau → barre → corde → tête → visage
    //         → corps → bras G → bras D → jambe G → jambe D
    // (10 étapes, la potence se construit en 4 temps)
    etapes: [
      (ctx, w, h) => {
        // 1 - Socle
        ctx.moveTo(10, h - 10);
        ctx.lineTo(w - 10, h - 10);
      },
      (ctx, w, h) => {
        // 2 - Poteau vertical
        ctx.moveTo(30, h - 10);
        ctx.lineTo(30, 12);
      },
      (ctx, w, h) => {
        // 3 - Barre horizontale
        ctx.moveTo(30, 12);
        ctx.lineTo(w / 2 + 10, 12);
      },
      (ctx, w, h) => {
        // 4 - Corde
        ctx.moveTo(w / 2 + 10, 12);
        ctx.lineTo(w / 2 + 10, 32);
      },
      (ctx, w, h) => {
        // 5 - Tête
        ctx.arc(w / 2 + 10, 47, 15, 0, Math.PI * 2);
      },
      (ctx, w, h) => {
        // 6 - Corps
        ctx.moveTo(w / 2 + 10, 62);
        ctx.lineTo(w / 2 + 10, 125);
      },
      (ctx, w, h) => {
        // 7 - Bras gauche
        ctx.moveTo(w / 2 + 10, 82);
        ctx.lineTo(w / 2 - 25, 112);
      },
      (ctx, w, h) => {
        // 8 - Bras droit
        ctx.moveTo(w / 2 + 10, 82);
        ctx.lineTo(w / 2 + 45, 112);
      },
      (ctx, w, h) => {
        // 9 - Jambe gauche
        ctx.moveTo(w / 2 + 10, 125);
        ctx.lineTo(w / 2 - 18, h - 18);
      },
      (ctx, w, h) => {
        // 10 - Jambe droite
        ctx.moveTo(w / 2 + 10, 125);
        ctx.lineTo(w / 2 + 38, h - 18);
      },
    ],
  },
};

// =============================================
//  SUPPRESSION DES ACCENTS
// =============================================
function supprimerAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// =============================================
//  ÉTAT
// =============================================
let difficulteChoisie = null;
let motSecret = "";
let lettresDevinees = [];
let essaisRestants = 0;
let totalEssais = 0;
let etapeActuelle = 0; // Index de l'étape de dessin actuelle

// =============================================
//  DOM
// =============================================
const ecranDiff = document.getElementById("ecran-difficulte");
const ecranJeu = document.getElementById("ecran-jeu");
const btnRejouer = document.getElementById("btn-rejouer");
const btnChDiff = document.getElementById("btn-changer-diff");

// =============================================
//  DESSIN DES MINI-CANVAS DE LA PAGE D'ACCUEIL
// =============================================
function dessinerMiniPendu(canvasId, diff) {
  const cfg = CONFIG[diff];
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width; // 120
  const h = canvas.height; // 140

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = cfg.couleur;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Coordonnées fixes adaptées au mini-canvas 120×140
  const cx = 75; // centre horizontal du bonhomme
  const socleY = h - 10;
  const potY = 15;
  const barreX = 25;
  const cordeY = 35;
  const teteR = 12;
  const teteY = cordeY + teteR + 2; // 49
  const corpsH = teteY + teteR; // bas de tête
  const corpsB = corpsH + 32; // bas du corps
  const brasY = corpsH + 10; // hauteur des bras

  // 1 - Potence complète (toujours visible)
  ctx.beginPath();
  ctx.moveTo(10, socleY);
  ctx.lineTo(w - 10, socleY); // socle
  ctx.moveTo(barreX, socleY);
  ctx.lineTo(barreX, potY); // poteau
  ctx.moveTo(barreX, potY);
  ctx.lineTo(cx, potY); // barre horiz
  ctx.moveTo(cx, potY);
  ctx.lineTo(cx, cordeY); // corde
  ctx.stroke();

  // 2 - Tête
  ctx.beginPath();
  ctx.arc(cx, teteY, teteR, 0, Math.PI * 2);
  ctx.stroke();

  // 3 - Corps
  ctx.beginPath();
  ctx.moveTo(cx, corpsH);
  ctx.lineTo(cx, corpsB);
  ctx.stroke();

  // 4 - Bras
  ctx.beginPath();
  ctx.moveTo(cx, brasY);
  ctx.lineTo(cx - 18, brasY + 20);
  ctx.moveTo(cx, brasY);
  ctx.lineTo(cx + 18, brasY + 20);
  ctx.stroke();

  // 5 - Jambes
  ctx.beginPath();
  ctx.moveTo(cx, corpsB);
  ctx.lineTo(cx - 16, socleY - 5);
  ctx.moveTo(cx, corpsB);
  ctx.lineTo(cx + 16, socleY - 5);
  ctx.stroke();
}

// Dessiner les 3 mini-pendus au chargement
dessinerMiniPendu("canvas-facile", "facile");
dessinerMiniPendu("canvas-normal", "normal");
dessinerMiniPendu("canvas-difficile", "difficile");

// =============================================
//  SÉLECTION DE DIFFICULTÉ
// =============================================
document.querySelectorAll(".carte-diff").forEach((carte) => {
  carte.addEventListener("click", () => {
    difficulteChoisie = carte.dataset.diff;
    lancerJeu();
  });
});

function lancerJeu() {
  ecranDiff.classList.add("hidden");
  ecranJeu.classList.remove("hidden");

  // Classe de difficulté sur l'écran jeu (pour les couleurs CSS)
  ecranJeu.className = `diff-${difficulteChoisie}`;

  // Label de difficulté
  document.getElementById("label-difficulte").textContent =
    CONFIG[difficulteChoisie].label;

  initPendu();
}

// =============================================
//  INIT JEU
// =============================================
function initPendu() {
  const cfg = CONFIG[difficulteChoisie];
  totalEssais = cfg.essais;
  essaisRestants = totalEssais;
  etapeActuelle = 0;
  lettresDevinees = [];

  // Filtrer les mots selon la longueur
  const motsFiltres = listeMots.filter((m) => {
    const l = m.replace(/\s/g, "").length;
    if (difficulteChoisie === "facile") return l <= cfg.maxLongueur;
    if (difficulteChoisie === "normal")
      return l >= cfg.minLongueur && l <= cfg.maxLongueur;
    if (difficulteChoisie === "difficile") return l >= cfg.minLongueur;
  });

  const liste = motsFiltres.length > 0 ? motsFiltres : listeMots;
  motSecret = supprimerAccents(liste[Math.floor(Math.random() * liste.length)]).toUpperCase();

  document.getElementById("essais").textContent = essaisRestants;
  reinitialiserCanvas();
  afficherMot();
  genererClavier();
}

// =============================================
//  CANVAS
// =============================================
function reinitialiserCanvas() {
  const canvas = document.getElementById("monCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function dessinerEtapeSuivante() {
  const cfg = CONFIG[difficulteChoisie];
  const canvas = document.getElementById("monCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width,
    h = canvas.height;

  if (etapeActuelle >= cfg.etapes.length) return;

  ctx.strokeStyle = cfg.couleur;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  cfg.etapes[etapeActuelle](ctx, w, h);
  ctx.stroke();

  etapeActuelle++;
}

// =============================================
//  MOT
// =============================================
function afficherMot() {
  const conteneur = document.getElementById("mot-a-deviner");
  conteneur.innerHTML = "";

  for (const lettre of motSecret) {
    const span = document.createElement("span");
    span.classList.add("case-lettre");

    if (lettre === " ") {
      span.style.width = "20px";
      span.style.borderBottom = "none";
      span.textContent = "\u00A0";
    } else if (lettresDevinees.includes(lettre)) {
      span.classList.add("trouvee");
      span.textContent = lettre;
    } else {
      span.textContent = "\u00A0";
    }

    conteneur.appendChild(span);
  }
}

// =============================================
//  CLAVIER
// =============================================
function genererClavier() {
  const clavier = document.getElementById("clavier-virtuel");
  clavier.innerHTML = "";

  "AZERTYUIOPQSDFGHJKLMWXCVBN".split("").forEach((lettre) => {
    const btn = document.createElement("button");
    btn.textContent = lettre;
    btn.id = "btn-" + lettre;
    btn.addEventListener("click", () => gererLettre(lettre));
    clavier.appendChild(btn);
  });
}

// =============================================
//  LOGIQUE
// =============================================
function gererLettre(lettre) {
  if (lettresDevinees.includes(lettre)) return;
  lettresDevinees.push(lettre);

  const btn = document.getElementById("btn-" + lettre);
  if (btn) btn.disabled = true;

  if (motSecret.replace(/\s/g, "").includes(lettre)) {
    afficherMot();
    verifierVictoire();
  } else {
    essaisRestants--;
    document.getElementById("essais").textContent = essaisRestants;
    dessinerEtapeSuivante();

    if (essaisRestants === 0) {
      // Dessiner toutes les étapes restantes rapidement
      while (etapeActuelle < CONFIG[difficulteChoisie].etapes.length) {
        dessinerEtapeSuivante();
      }
      setTimeout(() => {
        alert("Perdu ! Le mot était : " + motSecret);
        desactiverClavier();
      }, 150);
    } else {
      // Animation de secousse
      const container = document.querySelector(".game-container");
      container.classList.add("shake-error");
      setTimeout(() => container.classList.remove("shake-error"), 400);
    }
  }
}

function verifierVictoire() {
  const lettresMot = [...new Set(motSecret.replace(/\s/g, "").split(""))];
  const aGagne = lettresMot.every((l) => lettresDevinees.includes(l));

  if (aGagne) {
    setTimeout(() => {
      alert(
        `Bravo ! Tu as trouvé : ${motSecret} (en ${totalEssais - essaisRestants} erreur${totalEssais - essaisRestants > 1 ? "s" : ""} )`,
      );
      desactiverClavier();
    }, 100);
  }
}

function desactiverClavier() {
  document
    .querySelectorAll("#clavier-virtuel button")
    .forEach((b) => (b.disabled = true));
}

// =============================================
//  BOUTONS
// =============================================
btnRejouer.addEventListener("click", initPendu);

btnChDiff.addEventListener("click", () => {
  ecranJeu.classList.add("hidden");
  ecranDiff.classList.remove("hidden");
});

document.getElementById("btn-retour-pendu").addEventListener("click", () => {
  window.location.href = "../main.html";
});

// Clavier physique
document.addEventListener("keydown", (e) => {
  if (ecranJeu.classList.contains("hidden")) return;
  const t = e.key.toUpperCase();
  if (t.length === 1 && t >= "A" && t <= "Z") gererLettre(t);
});
