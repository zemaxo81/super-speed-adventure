# ⚡ SUPER SPEED ADVENTURE

Jeu de plateforme 3D *runner* inspiré de l'esprit des jeux de plateforme classiques
(personnages et décors 100 % originaux), jouable directement dans le navigateur.
Rendu WebGL via Three.js, audio procédural via Web Audio API — **aucun asset externe,
aucune dépendance à télécharger** : tout est généré par le code.

![Style](https://img.shields.io/badge/moteur-Three.js%20WebGL-blue) ![License libre usage](https://img.shields.io/badge/usage-libre-green)

## 🚀 Lancer le jeu

Option 1 — double-clic : ouvrir simplement `index.html` dans votre navigateur.

Option 2 — recommandée (plus rapide au chargement) :

```bash
# n'importe quel serveur statique fonctionne, par exemple :
npx serve .
# ou
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Compatibilité : **PC Windows / Chrome** (clavier, manette Gamepad API) et
**Android / Chrome mobile** (bouton tactile SAUTER). Plein écran : touche `F` ou bouton ⛶.

## 🎮 Commandes

| Action | PC | Manette | Android |
|---|---|---|---|
| Sauter | `Espace`, `Z`, `W` ou `↑` | A / Croix | Bouton « SAUTER » |
| Recommencer | `R` | — | Bouton ⟳ |
| Pause | `Échap`, `P` | Start | Bouton ⏸ |
| Plein écran | `F` | — | Bouton ⛶ |

L'avancée est **automatique** : une seule action, sauter au bon moment !
(*Coyote time* + *jump buffering* + hauteur de saut variable pour un contrôle précis.)

## 🌍 Les 6 mondes

1. 🌴 **Prairie Tropicale** — océan réfléchissant, végétation animée
2. ⛰️ **Monts Rocheux** — falaises, sapins, brume d'altitude
3. 🌋 **Royaume Volcanique** — lave incandescente, braises
4. ❄️ **Royaume Glacé** — glace, neige, plateaux gelés
5. 🏜️ **Dunes Ardentes** — désert, cactus, pyramides au loin
6. 🌃 **Cité Néon** — skyline futuriste, néons & bloom

Chaque monde : palette, musique procédurale, obstacles et effets qui lui sont propres.

## 🏁 Gameplay speedrun

- Chronomètre centième de seconde, **record personnel sauvegardé localement** (top 5 / monde)
- Pièces à collecter (arcades au-dessus des trous), checkpoints, barre de progression
- Difficulté progressive : vitesse et densité d'obstacles augmentent monde après monde
- Obstacles : trous, précipices, plateformes mobiles, Pics, broyeurs, barres rotatives
- Redémarrage instantané d'un touche

## 🛠️ Technique

- Three.js **r160** (fichiers vendus dans `vendor/` — le jeu fonctionne hors ligne)
- Ombres PCF douces, tone mapping ACES, bloom post-process (qualité Haute)
- Éclairage dynamique suivant le joueur, ciel procédural, particules (neige, braises, poussière, confettis)
- Textures procédurales canvas, végétation animée par shader (InstancedMesh)
- Ajustement automatique de la résolution + 3 niveaux de qualité (Basse = mobiles)
- Sauvegarde `localStorage` : progression, records, réglages

## 📁 Structure

```
index.html          — page principale + interface (menus, HUD)
css/style.css       — thème, HUD, bouton tactile
js/main.js          — démarrage
js/game.js          — boucle, états, physique, collisions, caméra
js/world.js         — définitions & génération des 6 mondes
js/character.js     — héros 3D animé (course, saut, chute, victoire)
js/fx.js            — système de particules GPU
js/input.js         — clavier / manette / tactile
js/audio.js         — musiques & bruitages procéduraux (Web Audio)
js/ui.js            — menus, HUD, records, réglages
js/storage.js       — sauvegarde locale
vendor/three/       — Three.js r160 (build + addons utilisés)
```

Amusez-vous bien, et courez vite ! 🏃‍♂️💨
