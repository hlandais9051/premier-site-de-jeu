const COLS = 14,
  ROWS = 14;
const OBJ_X = 7,
  OBJ_Y = 6;

const DEPART = [
  { color: "red", x: 1, y: 5, dir: 0 },
  { color: "green", x: 5, y: 12, dir: 1 },
  { color: "blue", x: 12, y: 8, dir: 2 },
  { color: "orange", x: 8, y: 1, dir: 3 },
  { color: "purple", x: 1, y: 11, dir: 0 },
  { color: "pink", x: 11, y: 12, dir: 1 },
  { color: "yellow", x: 12, y: 2, dir: 2 },
  { color: "brown", x: 2, y: 1, dir: 3 },
  { color: "cyan", x: 1, y: 2, dir: 0 }, // Robot fantôme pour tests
  { color: "magenta", x: 12, y: 11, dir: 2 }, // Robot fantôme pour tests
  { color: "lime", x: 2, y: 12, dir: 1 }, // Robot fantôme pour tests
  { color: "teal", x: 11, y: 1, dir: 3 }, // Robot fantôme pour tests
  { color: "navy", x: 5, y: 1, dir: 3 }, // Robot fantôme pour tests
  { color: "maroon", x: 8, y: 12, dir: 1 }, // Robot fantôme pour tests
  { color: "olive", x: 1, y: 8, dir: 0 }, // Robot fantôme pour tests
  { color: "gray", x: 12, y: 5, dir: 2 }, // Robot fantôme pour tests
];

const CSS = {
  red: "#ff4444",
  green: "#44ff88",
  blue: "#4488ff",
  orange: "#ff9900",
  purple: "#cc44ff",
  pink: "#ff66bb",
  yellow: "#ffee00",
  brown: "#cc8844",
  cyan: "#44ffff",
  magenta: "#ff44ff",
  lime: "#88ff44",
  teal: "#44cccc",
  navy: "#4444cc",
  maroon: "#cc4444",
  olive: "#88aa44",
  gray: "#888888",
};

const DX = [1, 0, -1, 0];
const DY = [0, -1, 0, 1];

const DECK_BASE = [
  ...Array(6)
    .fill(0)
    .map((_, i) => ["F1", 200 + i * 5]),
  ...Array(6)
    .fill(0)
    .map((_, i) => ["F2", 250 + i * 5]),
  ...Array(6)
    .fill(0)
    .map((_, i) => ["F3", 300 + i * 5]),
  ...Array(4)
    .fill(0)
    .map((_, i) => ["B", 150 + i * 5]),
  ...Array(6)
    .fill(0)
    .map((_, i) => ["L", 50 + i * 5]),
  ...Array(6)
    .fill(0)
    .map((_, i) => ["R", 100 + i * 5]),
  ...Array(6)
    .fill(0)
    .map((_, i) => ["U", 0 + i * 5]),
];

const CARTE_INFO = {
  F1: { icone: "⬆", nom: "Avance 1" },
  F2: { icone: "⬆⬆", nom: "Avance 2" },
  F3: { icone: "⬆⬆⬆", nom: "Avance 3" },
  B: { icone: "⬇", nom: "Recule" },
  L: { icone: "↰", nom: "Gauche" },
  R: { icone: "↱", nom: "Droite" },
  U: { icone: "↩", nom: "Demi-tour" },
};

const NB_MANCHES = 15;
const PV_MAX = 100;

// ===================================================
//  ÉTAT GLOBAL
// ===================================================
let robots = [],
  deck = [],
  mainJoueur = [];
let programme = [null, null, null, null, null];
let tour = 1,
  manche = 1;
let robotsActifs = []; // indices encore en compétition
let elimineSaison = []; // indices définitivement éliminés
let classement = [];
let animEnCours = false;
let bombes = []; // [{x,y,timer}] bombes en cours
let lasersVisuels = []; // [{x,y,d}] lasers à afficher temporairement
let BOARD = [];

// ===================================================
//  GÉNÉRATEUR DE CARTE PROCÉDURALE
//  Carte simple avec trous épars — drapeau toujours accessible
// ===================================================
function genererCarte(numeroManche) {
  // Plus de trous à chaque manche, mais jamais autour du drapeau
  const nbTrous = 2 + numeroManche * 2; // 5 → 17

  // Grille vide avec bordures de trous
  const grille = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) =>
      x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1 ? "h" : "e",
    ),
  );
  grille[OBJ_Y][OBJ_X] = "o";

  // Zones protégées : départs (rayon 1) + objectif (rayon 2)
  const protegees = new Set();
  const proteger = (x, y, r) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) protegees.add(`${x + dx},${y + dy}`);
  };
  DEPART.forEach((d) => proteger(d.x, d.y, 1)); // Rayon réduit à 1 pour libérer de l'espace en haut/droite
  proteger(OBJ_X, OBJ_Y, 2);

  const libre = (x, y) =>
    x > 0 &&
    x < COLS - 1 &&
    y > 0 &&
    y < ROWS - 1 &&
    !protegees.has(`${x},${y}`) &&
    grille[y][x] === "e";

  // Fisher-Yates sur toutes les cases libres
  const shuffler = () => {
    const cases = [];
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++) if (libre(x, y)) cases.push([x, y]);
    for (let i = cases.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cases[i], cases[j]] = [cases[j], cases[i]];
    }
    return cases;
  };

  // 1. Poser les trous un par un (Ton code actuel)
  let posés = 0;
  for (const [x, y] of shuffler()) {
    if (posés >= nbTrous) break;

    grille[y][x] = "h";

    let ok = true;
    const voisins = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [vx, vy] of voisins) {
      if (
        vx > 0 &&
        vx < COLS - 1 &&
        vy > 0 &&
        vy < ROWS - 1 &&
        grille[vy][vx] === "e"
      ) {
        if (aStarSurGrille(vx, vy, OBJ_X, OBJ_Y, grille) === null) {
          ok = false;
          break;
        }
      }
    }

    if (ok) posés++;
    else grille[y][x] = "e";
  }

  // ===================================================
  // 2. LE NOUVEAU SYSTÈME DE MURS FIXES
  // ===================================================

  // On définit le nombre EXACT de murs selon la manche :
  const nbMursVoulus = numeroManche * 2;

  // On recalcule les cases encore libres (après le placement des trous)
  const casesRestantes = [];
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (libre(x, y)) {
        // libre() vérifie que la case est toujours 'e'
        casesRestantes.push([x, y]);
      }
    }
  }

  // On mélange ces cases restantes (Fisher-Yates)
  for (let i = casesRestantes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [casesRestantes[i], casesRestantes[j]] = [
      casesRestantes[j],
      casesRestantes[i],
    ];
  }

  // On pose le nombre EXACT de murs demandés
  let mursPosés = 0;
  for (const [x, y] of casesRestantes) {
    if (mursPosés >= nbMursVoulus) break;

    // Optionnel : on peut aussi vérifier ici avec le A* si le mur ne bloque personne,
    // mais comme il y a déjà peu de murs, le risque est faible.
    grille[y][x] = "w";
    mursPosés++;
  }

  return grille;
}

// A* sur une grille donnée (pour vérification pendant génération)
function aStarSurGrille(sx, sy, gx, gy, grille) {
  const h = (x, y) => Math.abs(x - gx) + Math.abs(y - gy);
  const k = (x, y) => `${x},${y}`;
  const open = [{ x: sx, y: sy, g: 0, f: h(sx, sy), par: null }];
  const closed = new Set();
  const best = { [k(sx, sy)]: 0 };
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === gx && cur.y === gy) return true;
    closed.add(k(cur.x, cur.y));
    for (let d = 0; d < 4; d++) {
      const nx = cur.x + DX[d],
        ny = cur.y + DY[d],
        nk = k(nx, ny);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || closed.has(nk))
        continue;
      if (!grille[ny] || grille[ny][nx] === "h" || grille[ny][nx] === "w")
        continue;
      const ng = cur.g + 1;
      if (best[nk] !== undefined && best[nk] <= ng) continue;
      best[nk] = ng;
      open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny), par: cur });
    }
  }
  return null;
}

// ===================================================
//  A* PATHFINDING (sur BOARD courant)
// ===================================================
// Pour le joueur/physique : murs bloquent, trous = mort
function celleSure(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  if (!BOARD[y]) return false;
  return BOARD[y][x] !== "w"; // les trous laissent passer (mais tuent)
}

// Pour l'IA : évite murs ET trous
function celleSureIA(x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  if (!BOARD[y]) return false;
  const c = BOARD[y][x];
  return c === "e" || c === "o";
}

function aStar(sx, sy, gx, gy) {
  const h = (x, y) => Math.abs(x - gx) + Math.abs(y - gy);
  const k = (x, y) => `${x},${y}`;
  const open = [{ x: sx, y: sy, g: 0, f: h(sx, sy), par: null }];
  const closed = new Set();
  const best = { [k(sx, sy)]: 0 };
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === gx && cur.y === gy) {
      const path = [];
      let n = cur;
      while (n) {
        path.unshift({ x: n.x, y: n.y });
        n = n.par;
      }
      return path;
    }
    closed.add(k(cur.x, cur.y));
    for (let d = 0; d < 4; d++) {
      const nx = cur.x + DX[d],
        ny = cur.y + DY[d],
        nk = k(nx, ny);
      if (!celleSureIA(nx, ny) || closed.has(nk)) continue; // IA évite les trous
      const ng = cur.g + 1;
      if (best[nk] !== undefined && best[nk] <= ng) continue;
      best[nk] = ng;
      open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny), par: cur });
    }
  }
  return null;
}

// ===================================================
//  IA HEURISTIQUE A*
// ===================================================
function simulerCarte(rx, ry, dir, type) {
  let x = rx,
    y = ry,
    d = dir;
  if (type === "L") d = (d + 1) % 4;
  else if (type === "R") d = (d + 3) % 4;
  else if (type === "U") d = (d + 2) % 4;
  else {
    const pas = type === "F1" ? 1 : type === "F2" ? 2 : type === "F3" ? 3 : -1;
    for (let i = 0; i < Math.abs(pas); i++) {
      const nx = x + DX[d] * Math.sign(pas),
        ny = y + DY[d] * Math.sign(pas);
      if (!celleSureIA(nx, ny)) break; // l'IA ne simule pas de passage sur trou
      x = nx;
      y = ny;
    }
  }
  return { x, y, d };
}

function scoreIA(x, y, d) {
  if (!celleSureIA(x, y)) return -9999;
  let s = -(Math.abs(x - OBJ_X) + Math.abs(y - OBJ_Y)) * 10;

  const fx = x + DX[d],
    fy = y + DY[d];
  if (fx === OBJ_X && fy === OBJ_Y) s += 15;

  // ON AUGMENTE MASSIVEMENT LA PÉNALITÉ DE PROXIMITÉ AVEC UN TROU
  // Pour éviter qu'un robot ne reste volontairement au bord et se fasse pousser à la manche 2
  for (let dd = 0; dd < 4; dd++) {
    const ax = x + DX[dd],
      ay = y + DY[dd];
    if (
      ax >= 0 &&
      ax < COLS &&
      ay >= 0 &&
      ay < ROWS &&
      BOARD[ay] &&
      BOARD[ay][ax] === "h"
    )
      s -= 500; // Passage de -20 à -500 : interdiction de flirter avec le vide !

    if (bombes.some((b) => b.x === ax && b.y === ay && b.timer <= 1)) s -= 30;
  }
  return s;
}

function choisirProgrammeIA(robot, cartesMain) {
  const chemin = aStar(robot.x, robot.y, OBJ_X, OBJ_Y);
  const dispo = [...cartesMain];
  const prog = [];

  let sx = robot.x,
    sy = robot.y,
    sd = robot.dir;

  for (let slot = 0; slot < 5; slot++) {
    if (!dispo.length) break;

    const types = [...new Set(dispo.map((c) => c[0]))];

    let bestScore = -Infinity,
      bestType = types[0];

    for (const t of types) {
      const sim = simulerCarte(sx, sy, sd, t);
      let s = scoreIA(sim.x, sim.y, sim.d);

      // --- FILTRE ANTI-SUICIDE CORRIGÉ ET ADAPTÉ AUX CARTES F1, F2, F3 ---
      let marcheDansLeVide = false;

      if (t.startsWith("F")) {
        // t vaut "F1", "F2" ou "F3"
        const nbPas = parseInt(t.replace("F", ""), 10) || 1;
        const dx = DX[sd];
        const dy = DY[sd];

        let checkX = sx;
        let checkY = sy;

        for (let step = 1; step <= nbPas; step++) {
          const nextX = checkX + dx;
          const nextY = checkY + dy;

          // IDÉE DU MUR : Si la case suivante est un mur, le robot s'arrête net sans danger !
          if (
            nextX >= 0 &&
            nextX < COLS &&
            nextY >= 0 &&
            nextY < ROWS &&
            BOARD[nextY][nextX] === "w"
          ) {
            break;
          }

          checkX = nextX;
          checkY = nextY;

          // 1. SÉCURITÉ DRAPEAU EN DIRECT
          if (checkX === OBJ_X && checkY === OBJ_Y) {
            break;
          }

          // 2. DETECTION D'UN ROBOT DEVANT
          const robotBloquant = robots.some(
            (other) =>
              other &&
              other.alive &&
              !other.qualified &&
              other.x === checkX &&
              other.y === checkY,
          );

          if (robotBloquant) {
            const pousseX = checkX + dx;
            const pousseY = checkY + dy;

            if (pousseX === OBJ_X && pousseY === OBJ_Y) {
              continue;
            }

            if (
              pousseX < 0 ||
              pousseX >= COLS ||
              pousseY < 0 ||
              pousseY >= ROWS ||
              BOARD[pousseY][pousseX] === "h" ||
              BOARD[pousseY][pousseX] === "w" // Bloqué aussi si on pousse contre un mur
            ) {
              marcheDansLeVide = true;
              break;
            }
            continue;
          }

          // 3. VÉRIFICATION STANDARD (Trou ou vide)
          if (
            checkX < 0 ||
            checkX >= COLS ||
            checkY < 0 ||
            checkY >= ROWS ||
            BOARD[checkY][checkX] === "h"
          ) {
            marcheDansLeVide = true;
            break;
          }
        }
      } else if (t === "backup") {
        const checkX = sx - DX[sd];
        const checkY = sy - DY[sd];

        // Gestion du mur en marche arrière
        if (
          checkX >= 0 &&
          checkX < COLS &&
          checkY >= 0 &&
          checkY < ROWS &&
          BOARD[checkY][checkX] === "w"
        ) {
          // Bloqué par le mur, donc pas de mouvement et pas de suicide
        } else {
          const estObjectif = checkX === OBJ_X && checkY === OBJ_Y;
          const robotBloquant = robots.some(
            (other) =>
              other &&
              other.alive &&
              !other.qualified &&
              other.x === checkX &&
              other.y === checkY,
          );

          if (!estObjectif && !robotBloquant) {
            if (
              checkX < 0 ||
              checkX >= COLS ||
              checkY < 0 ||
              checkY >= ROWS ||
              BOARD[checkY][checkX] === "h"
            ) {
              marcheDansLeVide = true;
            }
          }
        }
      } else {
        // Cartes de rotation L, R, U : on vérifie simplement que la case actuelle est safe
        if (
          sx < 0 ||
          sx >= COLS ||
          sy < 0 ||
          sy >= ROWS ||
          BOARD[sy][sx] === "h"
        ) {
          marcheDansLeVide = true;
        }
      }

      // --- APPLICATION DES SCORES ---
      if (marcheDansLeVide) {
        s = -1000000;
      } else {
        s += 50000;
      }

      // Bonus de suivi du chemin A*
      if (
        chemin &&
        chemin.length > 1 &&
        sim.x === chemin[1].x &&
        sim.y === chemin[1].y
      ) {
        s += 30;
      }

      if (s > bestScore) {
        bestScore = s;
        bestType = t;
      }
    }

    const cands = dispo.filter((c) => c[0] === bestType);
    const carte = cands.reduce((a, b) => (b[1] > a[1] ? b : a));
    prog.push(carte);
    dispo.splice(dispo.indexOf(carte), 1);

    // --- REPRODUCTION EXACTE DU MOUVEMENT RETENU POUR LE SLOT SUIVANT ---
    let nextSx = sx;
    let nextSy = sy;

    if (bestType.startsWith("F")) {
      const nbPas = parseInt(bestType.replace("F", ""), 10) || 1;
      for (let step = 1; step <= nbPas; step++) {
        const nX = nextSx + DX[sd];
        const nY = nextSy + DY[sd];
        if (
          nX >= 0 &&
          nX < COLS &&
          nY >= 0 &&
          nY < ROWS &&
          BOARD[nY][nX] === "w"
        ) {
          break; // Stop contre le mur
        }
        nextSx = nX;
        nextSy = nY;
      }
    } else if (bestType === "backup") {
      const nX = nextSx - DX[sd];
      const nY = nextSy - DY[sd];
      if (
        !(nX >= 0 && nX < COLS && nY >= 0 && nY < ROWS && BOARD[nY][nX] === "w")
      ) {
        nextSx = nX;
        nextSy = nY;
      }
    }

    // On applique la position si elle est dans les clous
    if (
      nextSx >= 0 &&
      nextSx < COLS &&
      nextSy >= 0 &&
      nextSy < ROWS &&
      BOARD[nextSy][nextSx] !== "h"
    ) {
      sx = nextSx;
      sy = nextSy;
    }

    const sim2 = simulerCarte(sx, sy, sd, bestType);
    sd = sim2.d;
  }

  while (prog.length < 5 && dispo.length) prog.push(dispo.shift());

  return prog;
}

// ===================================================
//  BOMBES
//  Tombent aléatoirement, explosent après N tours
//  Tuent les robots sur la case d'impact
// ===================================================
function genererBombes(numeroManche) {
  // Plus de bombes à chaque manche
  const nb = numeroManche - 1; // 1 → 7 bombes par tour
  const nouvelles = [];
  const cases = [];
  for (let y = 1; y < ROWS - 1; y++)
    for (let x = 1; x < COLS - 1; x++) {
      if (BOARD[y][x] === "h") continue;
      if (Math.abs(x - OBJ_X) <= 1 && Math.abs(y - OBJ_Y) <= 1) continue;
      cases.push([x, y]);
    }
  // Fisher-Yates
  for (let i = cases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cases[i], cases[j]] = [cases[j], cases[i]];
  }
  for (let i = 0; i < Math.min(nb, cases.length); i++) {
    const [x, y] = cases[i];
    nouvelles.push({ x, y, timer: 2 }); // explose dans 2 tours
  }
  return nouvelles;
}

async function exploserBombes() {
  const explosions = [];
  bombes = bombes.filter((b) => {
    b.timer--;
    if (b.timer <= 0) {
      explosions.push({ x: b.x, y: b.y });
      return false;
    }
    return true;
  });

  if (explosions.length === 0) return;

  // Tuer les robots sur les cases d'explosion
  explosions.forEach(({ x, y }) => {
    robots.forEach((r, i) => {
      if (r.alive && !r.qualified && r.x === x && r.y === y) {
        // Bombe = -100 PV
        r.pv = Math.max(0, (r.pv || 0) - 100);
        const nom = i === 0 ? "🤖 Toi" : r.color;
        if (r.pv <= 0) {
          r.alive = false;
          log(`💥 ${nom} détruit par une bombe ! (0 PV)`, "mort");
        } else {
          log(`💥 ${nom} touché ! (${r.pv} PV restants)`, "mort");
        }
      }
    });
  });

  majPanneauPV();
  rendreTout();
  await pause(300);
}

async function tirerMissiles() {
  log("🚀 Phase de tir des missiles !", "info");
  lasersVisuels = []; // On vide les anciens tirs

  const tireurs = robots
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.alive && !r.qualified);

  for (const { r, i } of tireurs) {
    const dx = DX[r.dir];
    const dy = DY[r.dir];

    let cx = r.x + dx;
    let cy = r.y + dy;

    // On mémorise le point de départ du laser (le centre de la case du robot)
    const laserSegment = {
      startX: r.x,
      startY: r.y,
      endX: r.x,
      endY: r.y,
      color: CSS[r.color], // Le laser aura la couleur du robot qui tire !
    };

    while (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
      // Mettre à jour la fin du laser au fur et à mesure qu'il avance
      laserSegment.endX = cx;
      laserSegment.endY = cy;

      if (BOARD[cy][cx] === "w") {
        break; // Stop sur un mur
      }

      const cibleIdx = robots.findIndex(
        (target) =>
          target.alive &&
          !target.qualified &&
          target.x === cx &&
          target.y === cy,
      );

      if (cibleIdx !== -1) {
        const nomTireur = i === 0 ? "🤖 Toi" : r.color.toUpperCase();
        const nomCible =
          cibleIdx === 0 ? "🤖 Toi" : robots[cibleIdx].color.toUpperCase();
        log(`💥 Le missile de ${nomTireur} touche ${nomCible} ! (-10 PV)`);

        infligerDegats(cibleIdx, 10);
        break; // Stop sur un robot
      }

      cx += dx;
      cy += dy;
    }

    // On ajoute ce tir aux lasers à dessiner
    lasersVisuels.push(laserSegment);
  }

  majPanneauPV();
  rendreTout(); // Redessine la grille ET les lasers

  await pause(400); // Laisse le laser visible pendant 400ms

  lasersVisuels = []; // Efface les lasers
  rendreTout(); // Redessine la grille propre
}

function infligerDegats(idx, montant) {
  const r = robots[idx];
  if (!r.alive || r.qualified) return;

  r.pv -= montant;
  if (r.pv <= 0) {
    r.pv = 0;
    r.alive = false;
    const nom = idx === 0 ? "🤖 Toi" : r.color;
    log(`💀 ${nom} a été détruit !`, "mort");
  }

  majPanneauPV();
  rendreTout();
}

// ===================================================
//  PSEUDO & SCORES
// ===================================================
const PSEUDO_KEY = "robotmaze_pseudo",
  SCORES_KEY = "robotmaze_scores";
let pseudo = localStorage.getItem(PSEUDO_KEY) || null;

function majPseudo() {
  document.getElementById("pseudo-affiche").textContent = pseudo || "?";
}

function demanderPseudo(cb) {
  const modal = document.getElementById("modal-pseudo");
  const input = document.getElementById("input-pseudo");
  const btn = document.getElementById("btn-valider-pseudo");
  modal.classList.remove("hidden");
  input.value = pseudo || "";
  setTimeout(() => {
    input.focus();
    input.select();
  }, 50);
  function valider() {
    const v = input.value.trim();
    if (!v) return;
    pseudo = v;
    localStorage.setItem(PSEUDO_KEY, pseudo);
    majPseudo();
    modal.classList.add("hidden");
    btn.removeEventListener("click", valider);
    input.removeEventListener("keydown", onEnter);
    if (cb) cb();
  }
  function onEnter(e) {
    if (e.key === "Enter") valider();
  }
  btn.addEventListener("click", valider);
  input.addEventListener("keydown", onEnter);
}
document
  .getElementById("btn-changer-joueur")
  .addEventListener("click", () => demanderPseudo(null));

function chargerScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

function sauvegarderScore(nb, estVainqueur) {
  if (!pseudo) return;
  let sc = chargerScores();
  const ex = sc.find((s) => s.pseudo === pseudo);
  if (ex) {
    if (nb > ex.manches) ex.manches = nb;
    if (estVainqueur) ex.victoires = (ex.victoires || 0) + 1;
  } else sc.push({ pseudo, manches: nb, victoires: estVainqueur ? 1 : 0 });
  sc.sort(
    (a, b) => (b.victoires || 0) - (a.victoires || 0) || b.manches - a.manches,
  );
  sc = sc.slice(0, 10);
  localStorage.setItem(SCORES_KEY, JSON.stringify(sc));
  afficherScores(nb);
}

function afficherScores(nbAct = null) {
  const sc = chargerScores(),
    tbody = document.getElementById("score-body");
  if (!sc.length) {
    tbody.innerHTML =
      '<tr><td colspan="2" class="score-vide">Aucun score</td></tr>';
    return;
  }
  tbody.innerHTML = sc
    .map((s, i) => {
      const moi =
        pseudo && s.pseudo === pseudo && nbAct !== null && s.manches === nbAct;
      const vic = s.victoires || 0;
      const vicStr = vic > 0 ? ` 👑×${vic}` : "";
      return `<tr class="${moi ? "moi" : ""}"><td>${i + 1}</td><td>${s.pseudo}${vicStr}</td></tr>`;
    })
    .join("");
}

// ===================================================
//  CANVAS
// ===================================================
const canvas = document.getElementById("canvas-jeu");
const ctx = canvas.getContext("2d");
const TILE = 36;
canvas.width = TILE * COLS;
canvas.height = TILE * ROWS;

function dessinerGrille() {
  if (!BOARD.length) return;
  for (let x = 0; x < COLS; x++)
    for (let y = 0; y < ROWS; y++) {
      const c = BOARD[y] ? BOARD[y][x] : "h";
      ctx.fillStyle =
        c === "h"
          ? "#0a0e18"
          : c === "w"
            ? "#1a2a4a"
            : c === "o"
              ? "#141f00"
              : "#0d1822";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeStyle = c === "h" ? "#050810" : "rgba(0,200,255,.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
      if (c === "o") {
        ctx.fillStyle = "#aadd00";
        ctx.font = `bold ${TILE * 0.52}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚑", x * TILE + TILE / 2, y * TILE + TILE / 2);
      }
      if (c === "w") {
        ctx.fillStyle = "rgba(40,80,180,.4)";
        ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = "rgba(80,140,255,.25)";
        ctx.font = `${TILE * 0.42}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▩", x * TILE + TILE / 2, y * TILE + TILE / 2);
      }
    }
  // Dessiner les bombes
  bombes.forEach((b) => {
    const px = b.x * TILE,
      py = b.y * TILE;
    // Fond rouge pulsant selon le timer
    ctx.fillStyle = b.timer === 1 ? "rgba(255,0,0,.6)" : "rgba(255,100,0,.35)";
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.font = `${TILE * 0.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.timer === 1 ? "💣" : "💥", px + TILE / 2, py + TILE / 2);
  });
}

function dessinerRobots() {
  const fl = ["→", "↑", "←", "↓"];
  robots.forEach((r, i) => {
    if (!r.alive) return;
    const px = r.x * TILE,
      py = r.y * TILE,
      c = CSS[r.color];
    ctx.shadowBlur = 0;
    if (r.qualified) {
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 14;
    } else if (i === 0) {
      ctx.shadowColor = "#00c8ff";
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = i === 0 ? c : c + "aa";
    ctx.beginPath();
    ctx.roundRect(px + 5, py + 5, TILE - 10, TILE - 10, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (i === 0) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px + 5, py + 5, TILE - 10, TILE - 10, 4);
      ctx.stroke();
    }
    ctx.fillStyle = i === 0 ? "#000" : "rgba(0,0,0,.75)";
    ctx.font = `bold ${TILE * 0.36}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(r.qualified ? "✓" : fl[r.dir], px + TILE / 2, py + TILE / 2);
  });
}

function rendreTout() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dessinerGrille();
  dessinerRobots(); // --- À AJOUTER À LA TOUTE FIN DE rendreTout() ---

  // Dessiner le visuel des tirs de missiles s'il y en a
  if (lasersVisuels && lasersVisuels.length > 0) {
    lasersVisuels.forEach((laser) => {
      ctx.beginPath();
      // On calcule le centre de la case de départ (Pixel X, Pixel Y)
      const x1 = laser.startX * TILE + TILE / 2;
      const y1 = laser.startY * TILE + TILE / 2;
      // On calcule le centre de la case d'arrivée
      const x2 = laser.endX * TILE + TILE / 2;
      const y2 = laser.endY * TILE + TILE / 2;

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      // Style de l'effet laser fluo
      ctx.strokeStyle = laser.color || "#ff3a3a";
      ctx.lineWidth = 4; // Épaisseur du trait
      ctx.lineCap = "round";
      ctx.shadowBlur = 10; // Effet de lueur lumineuse
      ctx.shadowColor = laser.color || "#ff3a3a";

      ctx.stroke();
    });

    // Très important : on réinitialise l'effet d'ombre pour ne pas l'appliquer au reste du jeu après
    ctx.shadowBlur = 0;
  }
}

// ===================================================
//  INIT
// ===================================================
function initSaison() {
  manche = 1;
  robotsActifs = Array.from({ length: 16 }, (_, i) => i);
  elimineSaison = [];
  afficherScores();
  initManche();
}

function initManche() {
  classement = [];
  animEnCours = false;
  programme = [null, null, null, null, null];
  tour = 1;
  deck = [...DECK_BASE].sort(() => Math.random() - 0.5);
  bombes = [];

  BOARD = genererCarte(manche);

  // Seuls les robots actifs (non éliminés de la saison) participent
  robots = DEPART.map((d, i) => {
    const pvPrecedents = manche > 1 && robots && robots[i] ? robots[i].pv : 200;
    const enVie =
      manche === 1 ? true : pvPrecedents > 0 && !elimineSaison.includes(i);

    return {
      x: d.x,
      y: d.y,
      dir: d.dir,
      color: d.color,
      pv: enVie ? pvPrecedents : 0,
      alive: enVie,
      qualified: false,
      cartes: [],
    };
  });

  majInfoTour();
  majPanneauPV();
  piocher();
  rendreTout();
  viderLog();

  const niveaux = [
    "",
    "⭐ Facile",
    "⭐⭐ Normal",
    "⭐⭐⭐ Difficile",
    "⭐⭐⭐ Difficile",
    "💀 Intense",
    "💀💀 Brutal",
    "💀💀💀 Enfer",
  ];
  const info = [
    "",
    "Pas de bombes",
    "1 bombe/tour",
    "2 bombes/tour",
    "3 bombes/tour",
    "4 bombes/tour",
    "5 bombes/tour",
    "6 bombes/tour",
  ];
  log(
    `▶ MANCHE ${manche}/${NB_MANCHES} — ${niveaux[Math.min(manche, 7)]}`,
    "info",
  );
  log(
    `💣 ${info[Math.min(manche, 7)]} · ${robotsActifs.length} robots`,
    "info",
  );
  log(`Choisis 5 cartes !`, "joueur");
}

// ===================================================
//  PIOCHER
// ===================================================
function piocher() {
  if (deck.length < 9) deck = [...DECK_BASE].sort(() => Math.random() - 0.5);
  mainJoueur = deck.splice(0, 9);
  programme = [null, null, null, null, null];
  afficherMain();
  afficherProgramme();
  majBtnValider();
}

// ===================================================
//  AFFICHAGE
// ===================================================
function afficherMain() {
  const el = document.getElementById("cartes-main");
  el.innerHTML = "";
  mainJoueur.forEach((carte, i) => {
    const [t, p] = carte;
    const div = document.createElement("div");
    div.classList.add("carte-jeu");
    const used = programme.some((c) => c && c._i === i);
    if (used) div.classList.add("utilisee");
    div.innerHTML = `<div class="carte-icone">${CARTE_INFO[t].icone}</div><div class="carte-nom">${CARTE_INFO[t].nom}</div><div class="carte-prio">${p}</div>`;
    if (!used) div.addEventListener("click", () => ajouterProg(i));
    el.appendChild(div);
  });
  document.getElementById("nb-selectionnes").textContent =
    programme.filter(Boolean).length;
}

function afficherProgramme() {
  document.querySelectorAll(".slot-prog").forEach((slot, i) => {
    const c = programme[i];
    if (c) {
      slot.classList.add("rempli");
      slot.innerHTML = `<div class="slot-icone">${CARTE_INFO[c[0]].icone}</div><div class="slot-label">${c[0]}</div><div class="carte-prio">${c[1]}</div>`;
    } else {
      slot.classList.remove("rempli");
      slot.textContent = i + 1;
    }
  });
}

function ajouterProg(idx) {
  if (animEnCours) return;
  const slot = programme.indexOf(null);
  if (slot === -1) return;
  programme[slot] = Object.assign([...mainJoueur[idx]], { _i: idx });
  afficherMain();
  afficherProgramme();
  majBtnValider();
}

document.querySelectorAll(".slot-prog").forEach((slot, i) => {
  slot.addEventListener("click", () => {
    if (animEnCours || !programme[i]) return;
    programme[i] = null;
    programme = programme.filter(Boolean);
    while (programme.length < 5) programme.push(null);
    afficherMain();
    afficherProgramme();
    majBtnValider();
  });
});

function majBtnValider() {
  document.getElementById("btn-valider-prog").disabled =
    programme.some((p) => !p) || animEnCours;
}
document.getElementById("btn-reset-prog").addEventListener("click", () => {
  if (animEnCours) return;
  programme = [null, null, null, null, null];
  afficherMain();
  afficherProgramme();
  majBtnValider();
});

function majInfoTour() {
  document.getElementById("numero-manche").textContent =
    `${manche}/${NB_MANCHES}`;
  document.getElementById("numero-tour").textContent = tour;
  const el = document.getElementById("robots-vivants");
  el.innerHTML = DEPART.map((d, i) => {
    const actif = robotsActifs.includes(i);
    const r = robots[i];
    let cls = "dot-robot";
    if (!actif || !r || !r.alive) cls += " mort";
    if (r && r.qualified) cls += " qualif";
    if (i === 0) cls += " joueur";
    return `<div class="${cls}" style="background:${CSS[d.color]}" title="${d.color}"></div>`;
  }).join("");
}

// ===================================================
//  JOUER LE TOUR
// ===================================================
document.getElementById("btn-valider-prog").addEventListener("click", () => {
  if (animEnCours || programme.some((p) => !p)) return;
  jouerTour();
});

async function jouerTour() {
  animEnCours = true;
  majBtnValider();
  const placesDispos = robotsActifs.length - 1;

  // Nouvelles bombes au début du tour (sauf manche 1)
  if (manche > 1) {
    const newBombes = genererBombes(manche);
    bombes.push(...newBombes);
    if (newBombes.length > 0) {
      log(
        `💣 ${newBombes.length} bombe${newBombes.length > 1 ? "s" : ""} lancée${newBombes.length > 1 ? "s" : ""}!`,
      );
      rendreTout();
      await pause(400);
    }
  }

  const progIA = robots.map((r, i) => {
    if (i === 0) return programme.slice();
    if (!r.alive || r.qualified) return [];
    const cartesIA = [...DECK_BASE].sort(() => Math.random() - 0.5).slice(0, 9);
    return choisirProgrammeIA(r, cartesIA);
  });

  for (let action = 0; action < 5; action++) {
    const ordre = robots
      .map((r, i) => ({
        i,
        prio:
          r.alive && !r.qualified && progIA[i][action]
            ? progIA[i][action][1]
            : -1,
      }))
      .filter((o) => o.prio >= 0)
      .sort((a, b) => b.prio - a.prio);

    for (const { i } of ordre) {
      if (!robots[i].alive || robots[i].qualified) continue;
      const carte = progIA[i][action];
      if (!carte) continue;
      await executerCarte(i, carte[0]);
      await pause(220);
      const nbQ = robotsActifs.filter((idx) => robots[idx].qualified).length;
      if (nbQ >= placesDispos) {
        await pause(300);
        await terminerManche();
        return;
      }
    }
  }

  await tirerMissiles();

  // Explosions des bombes en fin de tour
  await exploserBombes();

  tour++;
  majInfoTour();
  const nbQ = robotsActifs.filter((i) => robots[i].qualified).length;
  const nonQV = robotsActifs.filter(
    (i) => robots[i].alive && !robots[i].qualified,
  );

  if (nbQ >= placesDispos || nonQV.length === 0 || tour > 25) {
    await pause(400);
    await terminerManche();
    return;
  }

  // SI LE JOUEUR EST QUALIFIÉ OU S'IL EST MORT, LES IA CONTINUENT TOUTES SEULES
  if (robots[0].qualified || !robots[0].alive) {
    await continuerSansJoueur();
  } else {
    piocher();
    animEnCours = false;
    majBtnValider();
    log(`Tour ${tour}`, "joueur");
  }
}

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function continuerSansJoueur() {
  const placesDispos = robotsActifs.length - 1;
  if (robots[0].qualified) {
    log("✅ Tu es qualifié ! Les autres continuent...", "qualif");
  } else {
    log("💀 Tu es mort ! Les autres continuent sans toi...", "mort");
  }
  while (true) {
    // Bombes
    if (manche > 1) {
      const newBombes = genererBombes(manche);
      bombes.push(...newBombes);
      if (newBombes.length > 0) {
        rendreTout();
        await pause(300);
      }
    }

    const nbQ = robotsActifs.filter((i) => robots[i].qualified).length;
    const nonQV = robotsActifs.filter(
      (i) => robots[i].alive && !robots[i].qualified,
    );
    if (nbQ >= placesDispos || nonQV.length === 0 || tour > 25) {
      await pause(300);
      await terminerManche();
      return;
    }

    const progIA = robots.map((r, i) => {
      if (i === 0 || !r.alive || r.qualified) return [];
      const cartesIA = [...DECK_BASE]
        .sort(() => Math.random() - 0.5)
        .slice(0, 9);
      return choisirProgrammeIA(r, cartesIA);
    });

    for (let action = 0; action < 5; action++) {
      const ordre = robots
        .map((r, i) => ({
          i,
          prio:
            i !== 0 && r.alive && !r.qualified && progIA[i][action]
              ? progIA[i][action][1]
              : -1,
        }))
        .filter((o) => o.prio >= 0)
        .sort((a, b) => b.prio - a.prio);
      for (const { i } of ordre) {
        if (!robots[i].alive || robots[i].qualified) continue;
        await executerCarte(i, progIA[i][action][0]);
        await pause(180);
        const nbQ = robotsActifs.filter((idx) => robots[idx].qualified).length;
        if (nbQ >= placesDispos) {
          await pause(300);
          await terminerManche();
          return;
        }
      }
    }
    await tirerMissiles();
    await exploserBombes();
    tour++;
    majInfoTour();
    await pause(250);
  }
}

// ===================================================
//  TERMINER UNE MANCHE
// ===================================================
async function terminerManche() {
  const actifsManche = robotsActifs.slice();
  const qualifIdsOrdre = classement.filter((i) => actifsManche.includes(i));
  const nonQualifs = actifsManche.filter((i) => !robots[i].qualified);
  const morts = actifsManche.filter((i) => !robots[i].alive);
  const joueurMort = morts.includes(0);

  let elimIdx = null;
  if (morts.length > 0)
    elimIdx = morts.includes(0) ? 0 : morts[morts.length - 1];
  else if (nonQualifs.length > 0) elimIdx = nonQualifs[nonQualifs.length - 1];

  if (elimIdx !== null) {
    elimineSaison.push(elimIdx);
    robotsActifs = robotsActifs.filter((i) => i !== elimIdx);
    // Les robots morts dans une manche sont éliminés de la saison
    morts.forEach((i) => {
      if (!elimineSaison.includes(i) && i !== elimIdx) {
        elimineSaison.push(i);
        robotsActifs = robotsActifs.filter((idx) => idx !== i);
      }
    });
  }

  document.getElementById("manche-titre").textContent =
    `MANCHE ${manche} TERMINÉE`;
  document.getElementById("manche-emoji").textContent =
    joueurMort && elimIdx === 0 ? "💀" : manche === NB_MANCHES ? "👑" : "✅";

  const clDiv = document.getElementById("manche-classement");
  clDiv.innerHTML = "";

  qualifIdsOrdre.forEach((idx, pos) => {
    const nom = idx === 0 ? "🤖 Toi" : DEPART[idx].color;
    clDiv.innerHTML += `<div class="manche-ligne">
      <span class="manche-pos">${pos + 1}</span>
      <div class="manche-dot" style="background:${CSS[DEPART[idx].color]}"></div>
      <span class="manche-nom">${nom}</span>
      <span class="manche-tag tag-qualif">Qualifié</span>
    </div>`;
  });

  // --- REMPLACE CETTE SECTION DANS terminerManche() ---

  const nonClasses = actifsManche.filter((i) => !qualifIdsOrdre.includes(i));
  nonClasses.forEach((idx) => {
    const nom = idx === 0 ? "🤖 Toi" : DEPART[idx].color;
    const estElim = elimIdx === idx || elimineSaison.includes(idx);
    clDiv.innerHTML += `<div class="manche-ligne">
      <span class="manche-pos">—</span>
      <div class="manche-dot" style="background:${CSS[DEPART[idx].color]}"></div>
      <span class="manche-nom">${nom}</span>
      <span class="manche-tag ${estElim ? "tag-elimine" : "tag-mort"}">${estElim ? "Éliminé" : "N/A"}</span>
    </div>`;
  });

  // --- NOUVELLE LOGIQUE D'AFFICHAGE DYNAMIQUE ---
  // On récupère la liste de tous les robots de cette manche qui se retrouvent éliminés de la saison
  const eliminesCetteManche = actifsManche.filter(
    (i) => elimineSaison.includes(i) || i === elimIdx,
  );

  if (eliminesCetteManche.length > 0) {
    // On transforme les indices en noms lisibles (ex: ["🤖 Toi", "red", "green"])
    const nomsElimines = eliminesCetteManche.map((idx) => {
      const nom = idx === 0 ? "🤖 Toi" : DEPART[idx].color;
      return `<strong style="color:#ff4444">${nom}</strong>`;
    });

    // Gestion de la phrase au singulier ou au pluriel
    if (nomsElimines.length === 1) {
      document.getElementById("manche-elimine").innerHTML =
        `❌ ${nomsElimines[0]} est éliminé de la saison !`;
    } else {
      // Version pluriel (ex: "A, B et C sont éliminés")
      const dernier = nomsElimines.pop();
      const listeTexte = nomsElimines.join(", ") + " et " + dernier;
      document.getElementById("manche-elimine").innerHTML =
        `❌ ${listeTexte} sont éliminés de la saison !`;
    }
  } else {
    document.getElementById("manche-elimine").textContent = "";
  }
  // ----------------------------------------------

  document.getElementById("manche-restants").textContent =
    robotsActifs.length > 0
      ? `${robotsActifs.length} robot${robotsActifs.length > 1 ? "s" : ""} pour la suite`
      : "Fin de la saison !";

  const btnSuiv = document.getElementById("btn-manche-suivante");
  const joueurElimine = !robotsActifs.includes(0);
  btnSuiv.textContent =
    manche >= NB_MANCHES || robotsActifs.length <= 1 || joueurElimine
      ? "Voir les résultats"
      : `Manche ${manche + 1} ▶`;
  document.getElementById("modal-manche").classList.remove("hidden");
}

document.getElementById("btn-manche-suivante").addEventListener("click", () => {
  document.getElementById("modal-manche").classList.add("hidden");
  const joueurElimine = !robotsActifs.includes(0);
  if (manche >= NB_MANCHES || robotsActifs.length <= 1 || joueurElimine) {
    finSaison();
    return;
  }
  manche++;
  initManche();
});

// ===================================================
//  FIN DE SAISON
// ===================================================
function finSaison() {
  const manchesTenues = manche - (robotsActifs.includes(0) ? 0 : 1);
  const estVainqueur = robotsActifs.length === 1 && robotsActifs[0] === 0;
  sauvegarderScore(manchesTenues, estVainqueur);
  let emoji, titre, msg;
  if (estVainqueur) {
    emoji = "👑";
    titre = "CHAMPION !";
    msg = "Tu as survécu toutes les manches !";
  } else if (robotsActifs.includes(0)) {
    emoji = "🏆";
    titre = "BONNE SAISON !";
    msg = `Tu as survécu ${manchesTenues} manche${manchesTenues > 1 ? "s" : ""}. Pas mal !`;
  } else {
    emoji = "💀";
    titre = "ÉLIMINÉ !";
    msg = `Tu as tenu ${manchesTenues} manche${manchesTenues > 1 ? "s" : ""}. Retente ta chance !`;
  }
  document.getElementById("victoire-emoji").textContent = emoji;
  document.getElementById("victoire-titre").textContent = titre;
  document.getElementById("victoire-message").textContent = msg;
  document.getElementById("modal-victoire").classList.remove("hidden");
  animEnCours = false;
}

document.getElementById("btn-rejouer").addEventListener("click", () => {
  document.getElementById("modal-victoire").classList.add("hidden");
  initSaison();
});

// ===================================================
//  PHYSIQUE
// ===================================================
async function executerCarte(idx, type) {
  const r = robots[idx];
  if (type === "L") {
    r.dir = (r.dir + 1) % 4;
    rendreTout();
    await pause(130);
  } else if (type === "R") {
    r.dir = (r.dir + 3) % 4;
    rendreTout();
    await pause(130);
  } else if (type === "U") {
    r.dir = (r.dir + 2) % 4;
    rendreTout();
    await pause(130);
  } else if (type === "B") {
    await deplacer(idx, -1);
  } else if (type === "F1") {
    await deplacer(idx, 1);
  } else if (type === "F2") {
    await deplacer(idx, 1);
    if (r.alive && !r.qualified) await deplacer(idx, 1);
  } else if (type === "F3") {
    for (let s = 0; s < 3; s++)
      if (r.alive && !r.qualified) await deplacer(idx, 1);
  }
}

async function deplacer(idx, sens) {
  const r = robots[idx];
  const dx = DX[r.dir] * sens,
    dy = DY[r.dir] * sens;
  const nx = r.x + dx,
    ny = r.y + dy;
  if (!peutBouger(idx, nx, ny, dx, dy)) return;
  r.x = nx;
  r.y = ny;
  rendreTout();
  await pause(190);
  checkTrou(idx);
  checkObj(idx);
}

function peutBouger(idx, nx, ny, dx, dy) {
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
  if (!BOARD[ny]) return false;
  if (BOARD[ny][nx] === "w") return false; // seul le mur bloque
  const occ = robots.findIndex(
    (r, i) => i !== idx && r.alive && !r.qualified && r.x === nx && r.y === ny, // <-- AJOUTE && !r.qualified ICI
  );
  if (occ !== -1) return pousser(occ, nx + dx, ny + dy, dx, dy);
  return true;
}

function pousser(idx, nx, ny, dx, dy) {
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
  if (!BOARD[ny] || BOARD[ny][nx] === "w") return false;
  if (robots[idx].qualified) return false;
  const occ = robots.findIndex(
    (r, i) => i !== idx && r.alive && r.x === nx && r.y === ny,
  );
  if (occ !== -1 && !pousser(occ, nx + dx, ny + dy, dx, dy)) return false;
  robots[idx].x = nx;
  robots[idx].y = ny;
  checkTrou(idx);
  checkObj(idx);
  return true;
}

function checkTrou(idx) {
  const r = robots[idx];
  if (!r.alive || r.qualified) return;
  if (BOARD[r.y][r.x] === "h") {
    r.pv = 0; // On s'assure de mettre les PV à 0
    r.alive = false;
    const nom = idx === 0 ? "🤖 Toi" : r.color;
    log(`${nom} tombe dans un trou ! (0 PV)`, "mort");
    if (idx === 0) majPanneauPV(); // <-- AJOUTE CETTE LIGNE
    majPanneauPV();
    rendreTout();
  }
}

function checkObj(idx) {
  const r = robots[idx];
  if (!r.alive || r.qualified) return;
  if (r.x === OBJ_X && r.y === OBJ_Y) {
    r.qualified = true;
    classement.push(idx);
    const pos = classement.length;
    const nom = idx === 0 ? "🤖 Toi" : r.color;
    log(
      `${nom} atteint le drapeau ! (${pos}${pos === 1 ? "er" : "ème"})`,
      "qualif",
    );
    majInfoTour();
    rendreTout();
  }
}

// ===================================================
//  HELPERS
// ===================================================
function log(msg, cls = "") {
  const el = document.getElementById("log-actions");
  const d = document.createElement("div");
  d.className = "log-ligne" + (cls ? " " + cls : "");
  d.textContent = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}
function viderLog() {
  document.getElementById("log-actions").innerHTML = "";
}

document.getElementById("btn-retour").addEventListener("click", () => {
  window.location.href = "../main.html";
});

function majPanneauPV() {
  const el = document.getElementById("liste-robots-pv");
  if (!el) return;

  let html = "";

  robots.forEach((r, idx) => {
    const nom = idx === 0 ? "🤖 Toi" : r.color.toUpperCase();
    let statutVisuel = "";

    if (!r.alive || r.pv <= 0) {
      statutVisuel = `<span style="color: #ff3a3a; font-weight: bold;">💀 0 PV</span>`;
    } else {
      // On affiche directement la valeur réelle de r.pv sans limite artificielle
      statutVisuel = `<span style="color: #ff4444; font-weight: bold;">${r.pv} PV</span>`;
    }

    const couleurHex = CSS[DEPART[idx].color] || "#ffffff";

    html += `
      <div class="robot-pv-ligne" style="${idx === 0 ? "background: rgba(0, 200, 255, 0.08); padding: 2px 4px; border-radius: 4px;" : ""}">
        <div class="robot-pv-nom-zone">
          <div class="robot-pv-pastille" style="background: ${couleurHex}"></div>
          <span style="font-weight: ${idx === 0 ? "bold" : "normal"}">${nom}</span>
        </div>
        <div>${statutVisuel}</div>
      </div>
    `;
  });

  el.innerHTML = html;
}

// ===================================================
//  DÉMARRAGE
// ===================================================
BOARD = genererCarte(1); // carte initiale vide (sera remplacée à chaque manche)
majPseudo();
afficherScores();
if (!pseudo) demanderPseudo(() => initSaison());
else initSaison();
