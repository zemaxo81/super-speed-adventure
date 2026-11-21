import { Game } from "./game.js";
import * as store from "./storage.js";

const loadingFill = document.getElementById("loading-fill");
const loadingTip = document.getElementById("loading-tip");

function setProgress(p, tip) {
  if (loadingFill) loadingFill.style.width = Math.round(p * 100) + "%";
  if (tip && loadingTip) loadingTip.textContent = tip;
}

function boot() {
  setProgress(0.25, "Initialisation du moteur graphique…");
  try {
    store.load();
    const canvas = document.getElementById("scene");
    setProgress(0.7, "Construction du monde…");
    const game = new Game(canvas);
    window.__game = game;
    setProgress(1, "Prêt !");
    setTimeout(() => {
      game.showMenu();
    }, 350);
  } catch (err) {
    console.error(err);
    loadingTip.textContent = "Erreur : WebGL semble indisponible sur ce navigateur.";
    loadingTip.style.color = "#ff6a6a";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
