// On récupère le bouton de démarrage spécifique
const btnStartLabyrinthe = document.getElementById("btn-start");

btnStartLabyrinthe.addEventListener("click", () => {
  // 1. On récupère les réglages
  nombreNiveauxMax = parseInt(inputNiveaux.value) || 1;

  // 2. On cache l'accueil et on montre le jeu
  ecranAccueil.classList.add("hidden");
  labyrinthe.classList.remove("hidden");
  compteur.classList.remove("hidden");
  classement.classList.add("hidden");
  affichageChrono.classList.remove("hidden");
  demarrerChrono();

  // 3. On initialise le jeu
  demarrerJeuLabyrinthe();
});

function demarrerJeuLabyrinthe() {
  jeuDemarre = false; // Le joueur n'a pas encore bougé
  if (intervalEnnemis) clearInterval(intervalEnnemis);
  if (timeoutEnnemis) clearTimeout(timeoutEnnemis);

  map = genererLabyrinthe(tailleX, tailleY);
  joueurPos = { x: 1, y: 1 };

  // On place les ennemis au départ (ils sont sur le joueur au début)
  ennemis.forEach((e) => {
    e.x = -1;
    e.y = -1;
  });

  dessinerLabyrinthe();
}

let niveauActuel = 1;
let nombreNiveauxMax = 1;
let tailleX = 21;
let tailleY = 21;
let joueurPos = { x: 1, y: 1 };

let jeuDemarre = false;
let timeoutEnnemis; // Pour pouvoir annuler le compte à rebours si nécessaire
let ennemis = []; // Liste pour stocker {x, y} de chaque méchant
let intervalEnnemis; // Pour arrêter/lancer le mouvement

const btnStart = document.getElementById("btn-start");
const labyrinthe = document.getElementById("labyrinthe");
const inputNiveaux = document.getElementById("input-niveaux");
const ecranAccueil = document.getElementById("ecran-accueil");
const compteur = document.getElementById("compteur");

function genererLabyrinthe(largeur, hauteur) {
  let grille = Array.from({ length: hauteur }, () => Array(largeur).fill(1));

  function distanceBFS(tempGrille, cibleX, cibleY) {
    let file = [{ x: 1, y: 1, dist: 0 }];
    let visite = new Set(["1,1"]);

    while (file.length > 0) {
      let { x, y, dist } = file.shift();
      if (x === cibleX && y === cibleY) return dist;

      for (let [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        let nx = x + dx,
          ny = y + dy;
        if (
          ny >= 0 &&
          ny < hauteur &&
          nx >= 0 &&
          nx < largeur &&
          (tempGrille[ny][nx] === 0 || tempGrille[ny][nx] === 3) &&
          !visite.has(`${nx},${ny}`)
        ) {
          visite.add(`${nx},${ny}`);
          file.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }
    return 0;
  }

  // --- FONCTION DE VÉRIFICATION DE CHEMIN (BFS) ---
  function estPossibleGagner(tempGrille, cibleX, cibleY) {
    let depart = { x: 1, y: 1 };
    let cible = { x: cibleX, y: cibleY };
    let file = [depart];
    let visite = new Set(["1,1"]);

    while (file.length > 0) {
      let { x, y } = file.shift();
      if (x === cible.x && y === cible.y) return true;

      const voisins = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (let [dx, dy] of voisins) {
        let nx = x + dx,
          ny = y + dy;
        // On ne passe que si c'est un chemin (0) ou la sortie (3)
        // Les pièges (4) et murs (1) bloquent le test
        if (
          ny >= 0 &&
          ny < hauteur &&
          nx >= 0 &&
          nx < largeur &&
          (tempGrille[ny][nx] === 0 || tempGrille[ny][nx] === 3) &&
          !visite.has(`${nx},${ny}`)
        ) {
          visite.add(`${nx},${ny}`);
          file.push({ x: nx, y: ny });
        }
      }
    }
    return false;
  }

  function creuser(x, y) {
    const directions = [
      [0, 2],
      [0, -2],
      [2, 0],
      [-2, 0],
    ].sort(() => Math.random() - 0.5);
    grille[y][x] = 0;
    for (let [dx, dy] of directions) {
      let nx = x + dx,
        ny = y + dy;
      if (
        ny > 0 &&
        ny < hauteur - 1 &&
        nx > 0 &&
        nx < largeur - 1 &&
        grille[ny][nx] === 1
      ) {
        grille[y + dy / 2][x + dx / 2] = 0;
        creuser(nx, ny);
      }
    }
  }

  creuser(1, 1);

  // AJOUT DE BOUCLES (rend le labyrinthe moins prévisible)
  for (let y = 1; y < hauteur - 1; y++) {
    for (let x = 1; x < largeur - 1; x++) {
      if (grille[y][x] === 1 && Math.random() < 0.1) {
        let voisins = 0;
        if (grille[y - 1][x] === 0) voisins++;
        if (grille[y + 1][x] === 0) voisins++;
        if (grille[y][x - 1] === 0) voisins++;
        if (grille[y][x + 1] === 0) voisins++;

        if (voisins >= 2) {
          grille[y][x] = 0;
        }
      }
    }
  }

  grille[1][1] = 2;
  let sortieX, sortieY;
  do {
    sortieX = Math.floor(Math.random() * (largeur - 2)) + 1;
    sortieY = Math.floor(Math.random() * (hauteur - 2)) + 1;
  } while (
    grille[sortieY][sortieX] !== 0 ||
    (sortieX === 1 && sortieY === 1) ||
    distanceBFS(grille, sortieX, sortieY) < 30 // ← distance réelle dans le labyrinthe
  );
  grille[sortieY][sortieX] = 3;

  // --- PLACEMENT DES PIÈGES SANS LES COINS (CUL-DE-SACS) ---
  for (let y = 1; y < hauteur - 1; y++) {
    for (let x = 1; x < largeur - 1; x++) {
      if (grille[y][x] === 0) {
        // Sécurité : pas sur le départ ni la sortie
        if ((x === 1 && y === 1) || (x === sortieX && y === sortieY)) continue;

        // On compte les passages libres (voisins qui ne sont pas des murs)
        let passagesLibres = 0;
        if (grille[y - 1][x] !== 1) passagesLibres++;
        if (grille[y + 1][x] !== 1) passagesLibres++;
        if (grille[y][x - 1] !== 1) passagesLibres++;
        if (grille[y][x + 1] !== 1) passagesLibres++;

        // CONDITION : On ne pose PAS de piège dans un coin (passagesLibres === 1)
        // On ne pose que si la case est un couloir ou une intersection (passagesLibres >= 2)
        if (
          passagesLibres >= 2 &&
          Math.random() < Math.min(0.6, 0.3 + niveauActuel * 0.03)
        ) {
          grille[y][x] = 4;

          // On vérifie toujours que la sortie reste accessible
          if (!estPossibleGagner(grille, sortieX, sortieY)) {
            grille[y][x] = 0; // On annule si ça bloque tout
          }
        }
      }
    }
  }

  // --- AJOUT DES ENNEMIS ---
  ennemis = [];
  let nombreEnnemis = Math.min(Math.floor(niveauActuel / 2) + 1, 15);

  for (let i = 0; i < nombreEnnemis; i++) {
    // On alterne ou on choisit au hasard : 'chasseur' ou 'errant'
    let type = Math.random() > 0.5 ? "chasseur" : "errant";
    ennemis.push({ x: -1, y: -1, type: type });
  }
  return grille;
}

let map = genererLabyrinthe(tailleX, tailleY);

function dessinerLabyrinthe() {
  labyrinthe.innerHTML = "";

  const vision = 5; // rayon autour du joueur (donc 11x11 affiché)
  const tailleGrille = vision * 2 + 1;

  const tailleCase = Math.floor(
    Math.min(window.innerWidth, window.innerHeight) / tailleGrille,
  );

  labyrinthe.style.gridTemplateColumns = `repeat(${tailleGrille}, ${tailleCase}px)`;

  for (let y = joueurPos.y - vision; y <= joueurPos.y + vision; y++) {
    for (let x = joueurPos.x - vision; x <= joueurPos.x + vision; x++) {
      const caseDiv = document.createElement("div");
      caseDiv.style.width = `${tailleCase}px`;
      caseDiv.style.height = `${tailleCase}px`;

      // Hors du labyrinthe → noir
      if (!map[y] || map[y][x] === undefined) {
        caseDiv.classList.add("vide");
        labyrinthe.appendChild(caseDiv);
        continue;
      }

      const valeur = map[y][x];

      if (valeur === 1) caseDiv.classList.add("mur");
      else if (valeur === 0) caseDiv.classList.add("chemin");
      else if (valeur === 2) {
        caseDiv.classList.add("chemin");

        const joueurDiv = document.createElement("div");
        joueurDiv.classList.add("joueur");

        caseDiv.appendChild(joueurDiv);
      } else if (valeur === 3) caseDiv.classList.add("sortie");
      else if (valeur === 4) {
        const distance = Math.abs(x - joueurPos.x) + Math.abs(y - joueurPos.y);

        if (distance <= 1) {
          caseDiv.classList.add("piege-visible");
        } else {
          caseDiv.classList.add("piege-cache");
        }
      }

      // ennemis
      const estEnnemi = ennemis.find((e) => e.x === x && e.y === y);
      if (estEnnemi) {
        caseDiv.classList.add("chemin"); // la case reste un chemin normal
        const ennemiDiv = document.createElement("div");
        ennemiDiv.classList.add("ennemi");
        caseDiv.appendChild(ennemiDiv);
      }
      labyrinthe.appendChild(caseDiv);
    }
  }

  compteur.innerText = `Niveau : ${niveauActuel} / ${nombreNiveauxMax}`;
}

btnStart.addEventListener("click", () => {
  nombreNiveauxMax = parseInt(inputNiveaux.value) || 1;
  ecranAccueil.classList.add("hidden");
  btnRetour.classList.add("hidden");
  compteur.classList.remove("hidden");
  labyrinthe.classList.remove("hidden");
  classement.classList.add("hidden");
  document.body.style.backgroundColor = "#1a1a1a";

  if (intervalEnnemis) clearInterval(intervalEnnemis);

  // Affiche le labyrinthe immédiatement
  dessinerLabyrinthe();

  // Les méchants ne commencent à bouger qu'après 5 secondes
  timeoutEnnemis = setTimeout(lancerEnnemis, 5000);
});

window.addEventListener("keydown", (event) => {
  if (labyrinthe.classList.contains("hidden")) return;
  if (
    !jeuDemarre &&
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    jeuDemarre = true;

    // Le méchant part 5 secondes après ce premier mouvement
    timeoutEnnemis = setTimeout(lancerEnnemis, 5000);
  }
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key))
    event.preventDefault();

  let nx = joueurPos.x;
  let ny = joueurPos.y;

  if (event.key === "ArrowUp") ny--;
  if (event.key === "ArrowDown") ny++;
  if (event.key === "ArrowLeft") nx--;
  if (event.key === "ArrowRight") nx++;

  if (map[ny] && map[ny][nx] !== 1) {
    if (map[ny][nx] === 4) {
      labyrinthe.classList.add("shake");
      setTimeout(() => labyrinthe.classList.remove("shake"), 500);

      jeuDemarre = false;
      if (intervalEnnemis) clearInterval(intervalEnnemis);
      intervalEnnemis = null; // ← ajoute cette ligne
      if (timeoutEnnemis) clearTimeout(timeoutEnnemis);

      map[joueurPos.y][joueurPos.x] = 0; // efface aussi le doublon joueur
      joueurPos = { x: 1, y: 1 };
      map[1][1] = 2;

      ennemis.forEach((e) => {
        e.x = -1;
        e.y = -1;
      });

      dessinerLabyrinthe();
      timeoutEnnemis = setTimeout(lancerEnnemis, 5000); // ← relance après 5s

      console.log("Piège activé ! Retour au départ.");
    } else {
      map[joueurPos.y][joueurPos.x] = 0;
      joueurPos.x = nx;
      joueurPos.y = ny;
      if (map[ny][nx] === 3) {
        dessinerLabyrinthe();
        setTimeout(passerAuNiveauSuivant, 200);
        return;
      }
      map[ny][nx] = 2;
    }
    dessinerLabyrinthe();
  }
});

function passerAuNiveauSuivant() {
  if (intervalEnnemis) clearInterval(intervalEnnemis); // STOP immédiat
  intervalEnnemis = null;
  if (timeoutEnnemis) clearTimeout(timeoutEnnemis);
  if (niveauActuel >= nombreNiveauxMax) {
    arreterChrono();
    sauvegarderScore();
    temps = tempsEcoule.toFixed(1);
    alert("VICTOIRE avec un temps de : " + temps + "s !");
    location.reload();
    return;
  }

  niveauActuel++;
  map = genererLabyrinthe(tailleX, tailleY);
  joueurPos = { x: 1, y: 1 };
  jeuDemarre = false; // Reset pour le nouveau niveau
  dessinerLabyrinthe();

  timeoutEnnemis = setTimeout(lancerEnnemis, 5000);
}

function deplacerEnnemis() {
  for (let i = 0; i < ennemis.length; i++) {
    let ennemi = ennemis[i];
    let distVersJoueur =
      Math.abs(ennemi.x - joueurPos.x) + Math.abs(ennemi.y - joueurPos.y);
    let cible;
    if (ennemi.type === "chasseur" || distVersJoueur < 20) {
      cible = { x: joueurPos.x, y: joueurPos.y };
    } else {
      // Pour l'errant : on cherche une case qui n'est PAS un mur
      let cibleValide = false;
      while (!cibleValide) {
        cible = {
          x: Math.floor(Math.random() * tailleX),
          y: Math.floor(Math.random() * tailleY),
        };
        // On vérifie que ce n'est pas un mur (1)
        if (map[cible.y] && map[cible.y][cible.x] !== 1) {
          cibleValide = true;
        }
      }
    }
    // --- BFS ---
    let file = [{ x: ennemi.x, y: ennemi.y, chemin: [] }];
    let visite = new Set([`${ennemi.x},${ennemi.y}`]);
    let prochainPas = null;

    while (file.length > 0) {
      let { x, y, chemin } = file.shift();

      if (x === cible.x && y === cible.y) {
        prochainPas = chemin[0];
        break;
      }

      const voisins = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];

      for (let [dx, dy] of voisins) {
        let nx = x + dx;
        let ny = y + dy;

        if (map[ny] && map[ny][nx] !== 1 && !visite.has(`${nx},${ny}`)) {
          visite.add(`${nx},${ny}`);
          file.push({
            x: nx,
            y: ny,
            chemin: [...chemin, { x: nx, y: ny }],
          });
        }
      }
    }

    if (prochainPas) {
      ennemi.x = prochainPas.x;
      ennemi.y = prochainPas.y;
    }

    // collision
    if (ennemi.x === joueurPos.x && ennemi.y === joueurPos.y) {
      clearInterval(intervalEnnemis);
      intervalEnnemis = null;
      console.log("Ennemi attrapé ! Retour au départ.");
      map[joueurPos.y][joueurPos.x] = 0; // ← efface l'ancienne position du joueur
      joueurPos = { x: 1, y: 1 };
      map[1][1] = 2;
      jeuDemarre = false;

      ennemis.forEach((e) => {
        e.x = -1;
        e.y = -1;
      });

      dessinerLabyrinthe();
      timeoutEnnemis = setTimeout(lancerEnnemis, 5000);
      return;
    }
  }

  dessinerLabyrinthe();
}

function lancerEnnemis() {
  // Évite les doublons si déjà lancé
  if (intervalEnnemis) return;

  const alerte = document.createElement("div");
  alerte.id = "alerte-ennemis";
  alerte.textContent = "⚠️ L'ennemi arrive !";
  document.body.appendChild(alerte);

  ennemis.forEach((e) => {
    e.x = 1;
    e.y = 1;
  });

  dessinerLabyrinthe();
  setTimeout(() => alerte.remove(), 2000);
  let vitesse = Math.max(300, 800 - niveauActuel * 50);

  intervalEnnemis = setInterval(deplacerEnnemis, vitesse);
}

const btnRetour = document.getElementById("btn-retour");

btnRetour.addEventListener("click", () => {
  // On redirige simplement vers ta page de sélection
  window.location.href = "../main.html";
});

let tempsDebut;
let intervalChrono;
let tempsEcoule = 0;
const affichageChrono = document.getElementById("chrono");
const inputJoueur = document.getElementById("input-joueur");
const listeScores = document.getElementById("liste-scores");
const classement = document.getElementById("classement");

function demarrerChrono() {
  tempsDebut = Date.now();
  intervalChrono = setInterval(() => {
    tempsEcoule = (Date.now() - tempsDebut) / 1000;
    affichageChrono.innerText = `Temps : ${tempsEcoule.toFixed(1)}s`;
  }, 100);
}

function arreterChrono() {
  clearInterval(intervalChrono);
}

function sauvegarderScore() {
  const nom = inputJoueur.value || "Anonyme";
  let scoresExistant = JSON.parse(
    localStorage.getItem("scoresLabyrinthe") || "[]",
  );

  const nouveauTemps = parseFloat(tempsEcoule.toFixed(1));
  const nbNiveaux = nombreNiveauxMax;

  // On cherche si un score existe déjà pour CE nombre de niveaux (peu importe le nom)
  const indexNiveau = scoresExistant.findIndex((s) => s.niveaux === nbNiveaux);

  if (indexNiveau !== -1) {
    // Si un record existe déjà, on ne le remplace que si on a été plus rapide
    if (nouveauTemps < scoresExistant[indexNiveau].temps) {
      scoresExistant[indexNiveau].temps = nouveauTemps;
      scoresExistant[indexNiveau].nom = nom; // Le nouveau champion remplace l'ancien
    }
  } else {
    // Si c'est le premier score enregistré pour ce niveau
    scoresExistant.push({
      nom: nom,
      temps: nouveauTemps,
      niveaux: nbNiveaux,
    });
  }

  // On trie toujours par nombre de niveaux (le plus grand en haut)[cite: 6]
  scoresExistant.sort((a, b) => b.niveaux - a.niveaux);

  localStorage.setItem("scoresLabyrinthe", JSON.stringify(scoresExistant));
  afficherLeaderboard();
}

function afficherLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("scoresLabyrinthe") || "[]");
  listeScores.innerHTML = scores
    .map((s) => `<li>${s.nom} : ${s.temps}s (${s.niveaux} niveaux)</li>`)
    .join("");
}

// Appeler au chargement de la page
afficherLeaderboard();

const btnResetScores = document.getElementById("btn-reset-scores");
btnResetScores.addEventListener("click", () => {
  if (confirm("Êtes-vous sûr de vouloir effacer tous les scores ?")) {
    localStorage.removeItem("scoresLabyrinthe");
    afficherLeaderboard();
    console.log("Scores réinitialisés.");
  }
});
