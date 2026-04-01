// On récupère le bouton de démarrage spécifique
const btnStartLabyrinthe = document.getElementById("btn-start");

btnStartLabyrinthe.addEventListener("click", () => {
  // 1. On récupère les réglages
  nombreNiveauxMax = parseInt(inputNiveaux.value) || 1;

  // 2. On cache l'accueil et on montre le jeu
  ecranAccueil.classList.add("hidden");
  labyrinthe.classList.remove("hidden");
  compteur.classList.remove("hidden");

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
    e.x = 1;
    e.y = 1;
  });

  dessinerLabyrinthe();
}

let niveauActuel = 1;
let nombreNiveauxMax = 1;
let tailleX = 11;
let tailleY = 11;
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

  // --- FONCTION DE VÉRIFICATION DE CHEMIN (BFS) ---
  function estPossibleGagner(tempGrille) {
    let depart = { x: 1, y: 1 };
    let cible = { x: largeur - 2, y: hauteur - 2 };
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

  // --- PLACEMENT DES PIÈGES SANS LES COINS (CUL-DE-SACS) ---
  for (let y = 1; y < hauteur - 1; y++) {
    for (let x = 1; x < largeur - 1; x++) {
      if (grille[y][x] === 0) {
        // Sécurité : pas sur le départ ni la sortie
        if ((x === 1 && y === 1) || (x === largeur - 2 && y === hauteur - 2))
          continue;

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
          if (!estPossibleGagner(grille)) {
            grille[y][x] = 0; // On annule si ça bloque tout
          }
        }
      }
    }
  }

  grille[1][1] = 2;
  grille[hauteur - 2][largeur - 2] = 3;
  // --- AJOUT DES ENNEMIS ---
  ennemis = [];
  let nombreEnnemis = Math.floor(niveauActuel / 2) + 1;

  for (let i = 0; i < nombreEnnemis; i++) {
    // Tous les ennemis commencent sur la case de départ (1, 1)
    // On les "cache" un peu au début en ne les affichant pas ou en les superposant
    ennemis.push({ x: 1, y: 1 });
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
      if (estEnnemi) caseDiv.classList.add("ennemi");

      labyrinthe.appendChild(caseDiv);
    }
  }

  compteur.innerText = `Niveau : ${niveauActuel} / ${nombreNiveauxMax}`;
}

btnStart.addEventListener("click", () => {
  nombreNiveauxMax = parseInt(inputNiveaux.value) || 1;
  ecranAccueil.classList.add("hidden");
  compteur.classList.remove("hidden");
  labyrinthe.classList.remove("hidden");
  document.body.style.backgroundColor = "#1a1a1a";

  if (intervalEnnemis) clearInterval(intervalEnnemis);

  // Affiche le labyrinthe immédiatement
  dessinerLabyrinthe();

  // Les méchants ne commencent à bouger qu'après 5 secondes
  setTimeout(() => {
    intervalEnnemis = setInterval(deplacerEnnemis, 800);
  }, 5000);
});

window.addEventListener("keydown", (event) => {
  if (labyrinthe.classList.contains("hidden")) return;
  if (
    !jeuDemarre &&
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    jeuDemarre = true;

    // Le méchant part 5 secondes après ce premier mouvement
    timeoutEnnemis = setTimeout(() => {
      if (intervalEnnemis) clearInterval(intervalEnnemis);
      intervalEnnemis = setInterval(deplacerEnnemis, 800);
    }, 5000);
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

      // 2. ARRÊTER LE MÉCHANT
      jeuDemarre = false;
      if (intervalEnnemis) clearInterval(intervalEnnemis);
      if (timeoutEnnemis) clearTimeout(timeoutEnnemis);

      // Retour au départ
      map[joueurPos.y][joueurPos.x] = 0;
      joueurPos = { x: 1, y: 1 };
      map[1][1] = 2;

      ennemis.forEach((e) => {
        e.x = 1;
        e.y = 1;
      });

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
  if (timeoutEnnemis) clearTimeout(timeoutEnnemis);
  if (niveauActuel >= nombreNiveauxMax) {
    alert("VICTOIRE TOTALE !");
    location.reload();
    return;
  }

  niveauActuel++;
  map = genererLabyrinthe(tailleX, tailleY);
  joueurPos = { x: 1, y: 1 };
  jeuDemarre = false; // Reset pour le nouveau niveau
  dessinerLabyrinthe();

  setTimeout(() => {
    clearInterval(intervalEnnemis); // Sécurité
    intervalEnnemis = setInterval(deplacerEnnemis, 800);
  }, 5000);
}

function deplacerEnnemis() {
  ennemis.forEach((ennemi) => {
    if (Math.random() < 0.2) {
      // mouvement aléatoire (20% du temps)
      const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      const [dx, dy] = directions[Math.floor(Math.random() * 4)];

      if (map[ennemi.y + dy] && map[ennemi.y + dy][ennemi.x + dx] !== 1) {
        ennemi.x += dx;
        ennemi.y += dy;
      }
    } else {
      // --- BFS ---
      let file = [{ x: ennemi.x, y: ennemi.y, chemin: [] }];
      let visite = new Set([`${ennemi.x},${ennemi.y}`]);
      let prochainPas = null;

      while (file.length > 0) {
        let { x, y, chemin } = file.shift();

        if (x === joueurPos.x && y === joueurPos.y) {
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
    }

    // collision
    if (ennemi.x === joueurPos.x && ennemi.y === joueurPos.y) {
      clearInterval(intervalEnnemis);
      alert("Capturé !");

      joueurPos = { x: 1, y: 1 };
      ennemis.forEach((e) => {
        e.x = 1;
        e.y = 1;
      });

      dessinerLabyrinthe();
    }
  });

  dessinerLabyrinthe();
}
