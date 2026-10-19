# Mini-Games Hub

A browser games collection with a home page that lets you pick between 11 classic and original games, plus an animated "site under construction" landing page.

Built with **plain HTML, CSS and JavaScript** (no framework, no build step).

## Games

| Game | Goal |
|---|---|
| Labyrinthe Infernal | Escape the monsters and avoid the traps |
| Morpion (Tic-tac-toe) | Align 3 symbols |
| Snake | Eat the apples without biting your own tail |
| Memory | Find the matching pairs of images |
| Pendu (Hangman) | Find the word before being hanged |
| Puissance 4 (Connect Four) | Align 4 symbols |
| Bataille (War) | Compare your cards with your opponent's |
| Solitaire | Sort the cards in the right order |
| Mastermind | Guess the secret combination |
| Simon | Repeat the sequence of colours |
| Robot Maze | Navigate the maze with your robot |

## Pages

**Home page (`main.html`)**
- One card per game with a title, a short description and a play button
- Responsive card layout (flexbox, wraps on small screens)
- Frosted-glass cards (`backdrop-filter`) over a full-screen background image
- Each button opens the game's own page (`<game>/index.html`)

**"Under construction" page (`index.html`)**
- Animated Matrix-style digital rain drawn on a `<canvas>`
- Excavator built only with CSS (spinning wheels, digging arm) driving across a hazard-striped screen
- Progress bar and percentage driven by one value in the script (`AVANCEMENT_REEL`)

## Tech stack

| Area | Technology |
|---|---|
| Markup and styling | HTML5, CSS3 (flexbox, keyframe animations, `backdrop-filter`) |
| Logic | Vanilla JavaScript (DOM events, `canvas`, `requestAnimationFrame`) |
| Fonts | Google Fonts |

## Project structure

```
├── index.html          # Animated "under construction" page
├── main.html           # Games home page
├── styles/
│   └── style.css       # Home page styling
├── scripts/
│   └── script.js       # Navigation from each card to its game
├── images/
│   └── affiche.png     # Home page background
├── labyrinthe/         # one folder per game, each with its own index.html
├── morpion/
├── snake/
├── memory/
├── pendu/
├── puissance4/
├── bataille/
├── solitaire/
├── mastermind/
├── simon/
└── robotmaze/
```

## Getting started

No installation is needed.

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd <repository-folder>
   ```
2. **Open `main.html`** in your browser, or serve the folder locally:
   ```bash
   python -m http.server 8000
   ```
   then open <http://localhost:8000/main.html>.

## Author

**Hugo Landais**, engineering student at ISEN Nantes, [LinkedIn](https://www.linkedin.com/in/hugolandais)

---

## 🇫🇷 Version française

# Hub de mini-jeux

Une collection de jeux dans le navigateur, avec une page d'accueil pour choisir parmi 11 jeux classiques et originaux, et une page d'accueil animée « site en construction ».

Développée en **HTML, CSS et JavaScript pur** (sans framework, sans étape de compilation).

### Jeux

Labyrinthe Infernal, Morpion, Snake, Memory, Pendu, Puissance 4, Bataille, Solitaire, Mastermind, Simon et Robot Maze.

### Pages

**Page d'accueil (`main.html`)**
- Une carte par jeu avec un titre, une courte description et un bouton pour jouer
- Cartes qui s'adaptent à la taille de l'écran (flexbox)
- Cartes en verre dépoli (`backdrop-filter`) sur une image de fond plein écran
- Chaque bouton ouvre la page du jeu (`<jeu>/index.html`)

**Page « chantier en cours » (`index.html`)**
- Pluie de chiffres façon Matrix dessinée sur un `<canvas>`
- Pelleteuse réalisée uniquement en CSS (roues qui tournent, bras qui creuse) qui traverse un écran bordé de bandes de chantier
- Barre de progression et pourcentage pilotés par une seule valeur dans le script (`AVANCEMENT_REEL`)

### Lancer le projet

Aucune installation n'est nécessaire : ouvre `main.html` dans ton navigateur, ou lance un serveur statique (`python -m http.server 8000`) et va sur <http://localhost:8000/main.html>.
