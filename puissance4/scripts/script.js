const COLS = 7,
  ROWS = 6;
const CELL = 60;
let grille,
  joueur,
  fini,
  locked,
  scores = { p1: 0, p2: 0 };
let contreIA = false;

function startGame(mode) {
  contreIA = mode === "ia";
  document.getElementById("setup-overlay").style.display = "none";
  reset();
}

function reset() {
  grille = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  joueur = "p1";
  fini = false;
  locked = false;
  buildUI();
  updateStatus();
}

function buildUI() {
  const gh = document.getElementById("ghost-row");
  const cover = document.getElementById("grid-cover");
  const cols = document.getElementById("cols-layer");
  const tok = document.getElementById("tokens-layer");

  gh.innerHTML = "";
  cover.innerHTML = "";
  cols.innerHTML = "";
  tok.innerHTML = "";

  for (let c = 0; c < COLS; c++) {
    const g = document.createElement("div");
    g.className = "gcell";
    const gd = document.createElement("div");
    gd.className = "ghost p1";
    gd.id = "ghost-" + c;
    g.appendChild(gd);
    gh.appendChild(g);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const h = document.createElement("div");
      h.className = "hole";
      cover.appendChild(h);
    }
  }

  for (let c = 0; c < COLS; c++) {
    const btn = document.createElement("button");
    btn.className = "col";
    btn.addEventListener("mouseenter", () => showGhost(c));
    btn.addEventListener("mouseleave", hideGhosts);
    btn.addEventListener("click", () => play(c));
    cols.appendChild(btn);
  }
}

function showGhost(col) {
  if (fini || locked) return;
  for (let c = 0; c < COLS; c++) {
    const g = document.getElementById("ghost-" + c);
    g.className = "ghost " + (c === col ? joueur + " show" : joueur);
  }
}

function hideGhosts() {
  for (let c = 0; c < COLS; c++) {
    const g = document.getElementById("ghost-" + c);
    g.className = "ghost " + joueur;
  }
}

function play(col) {
  if (fini || locked) return;

  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!grille[r][col]) {
      row = r;
      break;
    }
  }

  if (row < 0) return;

  locked = true;
  grille[row][col] = joueur;

  const tok = document.getElementById("tokens-layer");
  const t = document.createElement("div");
  t.className = "token " + joueur;
  t.style.left = col * CELL + "px";
  t.dataset.r = row;
  t.dataset.c = col;

  const targetY = row * CELL;
  const dur = Math.min(0.18 + row * 0.07, 0.6);

  t.style.setProperty("--target", targetY + "px");
  t.style.setProperty("--dur", dur + "s");
  tok.appendChild(t);

  setTimeout(
    () => {
      const winCells = verifier();
      if (winCells) {
        fini = true;
        locked = false;
        scores[joueur]++;
        document.getElementById("s1").textContent = scores.p1;
        document.getElementById("s2").textContent = scores.p2;
        markWinners(winCells);
        updateStatus(joueur === "p1" ? "Rouge gagne !" : "Jaune gagne !");
        disableAll();
        return;
      }

      if (grille.every((r) => r.every((c) => c))) {
        fini = true;
        locked = false;
        updateStatus("Match nul !");
        return;
      }

      // Changement de joueur
      joueur = joueur === "p1" ? "p2" : "p1";
      locked = false;
      updateStatus();
      hideGhosts();

      // --- ICI ON APPELLE L'IA ---
      if (contreIA && joueur === "p2" && !fini) {
        locked = true;
        setTimeout(() => {
          jouerIA();
        }, 600);
      }
    },
    dur * 1000 + 200,
  );
}

function jouerIA() {
  if (fini) return;

  // 1. Gagner si possible
  for (let c = 0; c < COLS; c++) {
    let r = simulationLigne(c);
    if (r !== -1) {
      grille[r][c] = "p2";
      if (verifier("p2")) {
        grille[r][c] = null;
        locked = false; // Important pour autoriser play()
        play(c);
        return;
      }
      grille[r][c] = null;
    }
  }

  // 2. Bloquer l'humain
  for (let c = 0; c < COLS; c++) {
    let r = simulationLigne(c);
    if (r !== -1) {
      grille[r][c] = "p1";
      if (verifier("p1")) {
        grille[r][c] = null;
        locked = false;
        play(c);
        return;
      }
      grille[r][c] = null;
    }
  }

  // 3. Hasard
  let colonnesLibres = [];
  for (let c = 0; c < COLS; c++) {
    if (!grille[0][c]) colonnesLibres.push(c);
  }
  const choixHasard =
    colonnesLibres[Math.floor(Math.random() * colonnesLibres.length)];
  locked = false;
  play(choixHasard);
}

function simulationLigne(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!grille[r][col]) return r;
  }
  return -1;
}

function markWinners(cells) {
  const tok = document.getElementById("tokens-layer");
  cells.forEach(([r, c]) => {
    const el = tok.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (el) el.classList.add("win");
  });
}

function disableAll() {
  document.querySelectorAll(".col").forEach((c) => (c.disabled = true));
}

function updateStatus(msg) {
  const statusEl = document.getElementById("status");
  if (msg) {
    statusEl.innerHTML = `<b>${msg}</b>`;
    return;
  }
  const nom = joueur === "p1" ? "Rouge" : "Jaune";
  statusEl.innerHTML = `<span class="dot ${joueur === "p1" ? "d1" : "d2"}"></span><b id="cur">${nom}</b>`;
}

function verifier(joueurAControler) {
  const cible = joueurAControler || joueur;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grille[r][c] !== cible) continue;
      for (const [dr, dc] of dirs) {
        let cells = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + i * dr,
            nc = c + i * dc;
          if (
            nr >= 0 &&
            nr < ROWS &&
            nc >= 0 &&
            nc < COLS &&
            grille[nr][nc] === cible
          ) {
            cells.push([nr, nc]);
          } else break;
        }
        if (cells.length === 4) return cells;
      }
    }
  }
  return null;
}

const btnMenu = document.getElementById("btn-menu");
const btnRetour = document.getElementById("btn-retour");

btnMenu.addEventListener("click", () => {
  // On redirige simplement vers ta page de sélection
  window.location.href = "../main.html";
});

btnRetour.addEventListener("click", () => {
  // On redirige simplement vers ta page de sélection
  window.location.href = "index.html";
});
