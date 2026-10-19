const enseignes = ["trèfle", "coeur", "carreau", "pique"];
const valeurs = [
  { nom: "2", p: 2 },
  { nom: "3", p: 3 },
  { nom: "4", p: 4 },
  { nom: "5", p: 5 },
  { nom: "6", p: 6 },
  { nom: "7", p: 7 },
  { nom: "8", p: 8 },
  { nom: "9", p: 9 },
  { nom: "10", p: 10 },
  { nom: "Valet", p: 11 },
  { nom: "Dame", p: 12 },
  { nom: "Roi", p: 13 },
  { nom: "As", p: 14 },
];

let mainJoueur = [];
let mainOrdi = [];
let pileBataille = []; // Pour gérer les cartes en cas de bataille
let partieTerminee = false;

// 1. Créer et mélanger le paquet
function initialiserBataille() {
  partieTerminee = false;
  let paquet = [];
  enseignes.forEach((e) => {
    valeurs.forEach((v) => {
      paquet.push({
        nom: v.nom,
        puissance: v.p,
        enseigne: e,
        img: `${v.nom}_${e}.png`,
      });
    });
  });

  paquet.sort(() => Math.random() - 0.5); // Mélange simple

  // 2. Distribuer 26 cartes chacun
  mainJoueur = paquet.slice(0, 26);
  mainOrdi = paquet.slice(26, 52);

  majCompteur();
}

function majCompteur() {
  const comp = document.getElementById("compteur");
  comp.classList.remove("hidden");
  comp.innerText = `Tes cartes : ${mainJoueur.length} | Ordi : ${mainOrdi.length}`;
}

function determinerGagnant() {
  if (partieTerminee) return; // ← Bloque les appels suivants
  partieTerminee = true;

  const message =
    mainJoueur.length > 0
      ? "Félicitations, tu as gagné la partie ! 🏆"
      : "L'ordi a gagné la partie... 🤖";

  alert(message);
  location.reload();
}

// 2. Jouer un tour
function jouerTour() {
  if (mainJoueur.length === 0 || mainOrdi.length === 0) {
    determinerGagnant();
    return;
  }

  // --- 1. LOGIQUE DE REBATAILLE (Si on reclique après une égalité) ---
  // Si la pile contient déjà plus de 2 cartes, on est dans une bataille qui continue
  if (pileBataille.length > 2) {
    continuerBataille();
    return; // On s'arrête là pour ce clic
  }

  // --- 2. TOUR NORMAL (Duel simple) ---
  const cJoueur = mainJoueur.shift();
  const cOrdi = mainOrdi.shift();
  pileBataille.push(cJoueur, cOrdi);

  document.getElementById("plateau").innerHTML = `
        <div class="combat">
            <div class="carte-cont">
                <img src="../images/cartes/${cJoueur.img}" class="carte-img">
            </div>
            <div class="vs">VS</div>
            <div class="carte-cont">
                <img src="../images/cartes/${cOrdi.img}" class="carte-img">
            </div>
        </div>
        <h2 id="resultat"></h2>
    `;

  const res = document.getElementById("resultat");

  if (cJoueur.puissance > cOrdi.puissance) {
    res.innerText = "Tu gagnes la manche !";
    mainJoueur.push(...pileBataille);
    pileBataille = [];
  } else if (cJoueur.puissance < cOrdi.puissance) {
    res.innerText = "L'ordi gagne la manche !";
    mainOrdi.push(...pileBataille);
    pileBataille = [];
  } else {
    // PREMIÈRE ÉGALITÉ : On appelle la fonction de bataille
    res.innerText = "ÉGALITÉ !";
    continuerBataille();
  }

  majCompteur();
  verifierFinPartie();
}

// --- NOUVELLE FONCTION DÉDIÉE À LA BATAILLE ---
function continuerBataille() {
  // Sécurité : assez de cartes pour la bataille ?
  if (mainJoueur.length < 2 || mainOrdi.length < 2) {
    if (mainJoueur.length > mainOrdi.length) {
      mainJoueur.push(...pileBataille, ...mainOrdi);
      mainOrdi = [];
    } else {
      mainOrdi.push(...pileBataille, ...mainJoueur);
      mainJoueur = [];
    }
    pileBataille = [];
    majCompteur();
    determinerGagnant();
    return;
  }

  const cacheeJoueur = mainJoueur.shift();
  const cacheeOrdi = mainOrdi.shift();
  const visibleJoueur = mainJoueur.shift();
  const visibleOrdi = mainOrdi.shift();

  pileBataille.push(cacheeJoueur, cacheeOrdi, visibleJoueur, visibleOrdi);

  let htmlPiles = { joueur: "", ordi: "" };

  for (let i = 2; i < pileBataille.length - 2; i += 2) {
    const decalage = (i / 2) * 10; // 10px de décalage par couche
    htmlPiles.joueur += `<div class="carte-dos milieu" style="transform: translate(${decalage}px, ${decalage}px); z-index: ${i};"></div>`;
    htmlPiles.ordi += `<div class="carte-dos milieu" style="transform: translate(${decalage}px, ${decalage}px); z-index: ${i};"></div>`;
  }

  const deplacementFinal = (pileBataille.length / 4) * 15;

  document.getElementById("plateau").innerHTML = `
    <div class="combat bataille">
        <div class="carte-cont">
            <div class="stack">
                <img src="../images/cartes/${pileBataille[0].img}" class="carte-img dessous">
                ${htmlPiles.joueur}
                <img src="../images/cartes/${visibleJoueur.img}" class="carte-img dessus" style="transform: translate(${deplacementFinal}px, ${deplacementFinal}px); z-index: 100;">
            </div>
            <p>${pileBataille.length / 2} cartes</p>
        </div>

        <div class="vs">BATAILLE</div>

        <div class="carte-cont">
            <div class="stack">
                <img src="../images/cartes/${pileBataille[1].img}" class="carte-img dessous">
                ${htmlPiles.ordi}
                <img src="../images/cartes/${visibleOrdi.img}" class="carte-img dessus" style="transform: translate(${deplacementFinal}px, ${deplacementFinal}px); z-index: 100;">
            </div>
            <p>${pileBataille.length / 2} cartes</p>
        </div>
    </div>
    <h2 id="resultat"></h2>`;
  const nouveauRes = document.getElementById("resultat");

  if (visibleJoueur.puissance > visibleOrdi.puissance) {
    nouveauRes.innerText = "Tu gagnes la bataille !";
    mainJoueur.push(...pileBataille);
    pileBataille = [];
  } else if (visibleJoueur.puissance < visibleOrdi.puissance) {
    nouveauRes.innerText = "L'ordi gagne la bataille !";
    mainOrdi.push(...pileBataille);
    pileBataille = [];
  } else {
    nouveauRes.innerText = "BATAILLE ENCORE ! (Re-clique)";
  }

  majCompteur();
}

function verifierFinPartie() {
  if (pileBataille.length === 0) {
    setTimeout(() => {
      if (mainJoueur.length === 0 || mainOrdi.length === 0) {
        determinerGagnant();
      }
    }, 1000);
  }
}

initialiserBataille();
// Ajoute un écouteur sur le plateau pour cliquer et jouer
document.getElementById("plateau").addEventListener("click", jouerTour);

const btnRetour = document.getElementById("btn-retour");
btnRetour.addEventListener("click", function () {
  window.location.href = "../main.html";
});
