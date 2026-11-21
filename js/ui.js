import { WORLDS } from "./world.js";
import * as store from "./storage.js";

export function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(3, "0")}`;
}

export class Ui {
  constructor(game) {
    this.game = game;
    this.el = {};
    for (const id of document.querySelectorAll("[id]")) this.el[id.id] = id;

    this.isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    this.el["btn-jump"].addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.el["btn-jump"].classList.add("pressed");
      this._touchDown = true;
      game.input.pressJump("touch");
    });
    const release = (e) => {
      e.preventDefault();
      this.el["btn-jump"].classList.remove("pressed");
      this._touchDown = false;
      game.input.releaseJump("touch");
    };
    this.el["btn-jump"].addEventListener("pointerup", release);
    this.el["btn-jump"].addEventListener("pointerleave", release);
    this.el["btn-jump"].addEventListener("pointercancel", release);

    this.el["btn-play"].addEventListener("click", () => {
      game.audio.resume();
      game.audio.uiClick();
      game.startWorld(0);
    });
    this.el["btn-worlds"].addEventListener("click", () => { game.audio.uiClick(); this.showWorlds(); });
    this.el["btn-records"].addEventListener("click", () => { game.audio.uiClick(); this.showRecords(); });
    this.el["btn-settings"].addEventListener("click", () => { game.audio.uiClick(); this.showSettings(); });
    this.el["btn-fullscreen"].addEventListener("click", () => this.toggleFullscreen());
    this.el["btn-fullscreen2"].addEventListener("click", () => this.toggleFullscreen());
    for (const b of document.querySelectorAll(".btn-back")) {
      b.addEventListener("click", () => { game.audio.uiClick(); this.showHome(store.load()); });
    }

    this.el["btn-pause"].addEventListener("click", () => game.pause());
    this.el["btn-restart"].addEventListener("click", () => game.restart());
    this.el["btn-resume"].addEventListener("click", () => game.resume());
    this.el["btn-restart2"].addEventListener("click", () => game.restart());
    this.el["btn-home"].addEventListener("click", () => { game.showMenu(); });
    this.el["btn-home2"].addEventListener("click", () => { game.showMenu(); });
    this.el["btn-retry"].addEventListener("click", () => game.restart());
    this.el["btn-next"].addEventListener("click", () => game.nextWorld());

    const selQ = this.el["sel-quality"];
    const rgM = this.el["rg-music"];
    const rgS = this.el["rg-sfx"];
    const chkS = this.el["chk-shake"];
    const s = store.load().settings;
    selQ.value = s.quality;
    rgM.value = s.music;
    rgS.value = s.sfx;
    chkS.checked = !!s.shake;
    game.audio.setVolumes(parseFloat(rgM.value), parseFloat(rgS.value));

    selQ.addEventListener("change", () => {
      game.setQuality(selQ.value);
      game.audio.uiClick();
    });
    rgM.addEventListener("input", () => {
      game.audio.setVolumes(parseFloat(rgM.value), parseFloat(rgS.value));
      store.updateSettings({ music: parseFloat(rgM.value) });
    });
    rgS.addEventListener("input", () => {
      game.audio.setVolumes(parseFloat(rgM.value), parseFloat(rgS.value));
      store.updateSettings({ sfx: parseFloat(rgS.value) });
    });
    chkS.addEventListener("change", () => {
      store.updateSettings({ shake: chkS.checked });
      game.save = store.load();
    });

    this._toastTimer = null;
    this._touchDown = false;
    game.input.setTouchJumpSource(this);
  }

  get down() { return this._touchDown; }

  fade(on) {
    this.el["fade"].classList.toggle("on", !!on);
  }

  show(screenId) {
    for (const id of ["screen-home", "screen-worlds", "screen-records", "screen-settings", "screen-pause", "screen-result", "loading"]) {
      this.el[id].classList.toggle("active", id === screenId);
      this.el[id].classList.toggle("hidden", id !== screenId);
    }
  }

  showHome(save) {
    this.hideHud();
    this.el["btn-jump"].classList.add("hidden");
    this.el["controls-hint"].classList.add("hidden");
    this.show("screen-home");
  }

  showWorlds() {
    const save = store.load();
    const grid = this.el["worlds-grid"];
    grid.innerHTML = "";
    WORLDS.forEach((w, i) => {
      const card = document.createElement("div");
      card.className = "world-card" + (i >= save.unlocked ? " locked" : (save.records[w.id] ? " done" : ""));
      card.style.background = w.card[0];
      const best = save.records[w.id] && save.records[w.id][0];
      card.innerHTML = `
        ${i >= save.unlocked ? '<div class="w-lock">🔒</div>' : ""}
        <span class="w-icon">${w.icon}</span>
        <div class="w-name">${w.name}</div>
        <div class="w-info">${best ? "Record : " + formatTime(best.t) : (i >= save.unlocked ? "Verrouillé" : "Jamais terminé")}</div>`;
      card.addEventListener("click", () => {
        if (i >= save.unlocked) {
          this.toast("Termine le monde précédent pour débloquer !");
          return;
        }
        this.game.audio.uiClick();
        this.game.startWorld(i);
      });
      grid.appendChild(card);
    });
    this.show("screen-worlds");
  }

  showRecords() {
    const save = store.load();
    const list = this.el["records-list"];
    list.innerHTML = "";
    WORLDS.forEach((w) => {
      const recs = save.records[w.id] || [];
      const row = document.createElement("div");
      row.className = "record-row";
      const best = recs[0];
      row.innerHTML = `
        <div class="r-icon">${w.icon}</div>
        <div class="r-name">${w.name}</div>
        <div class="r-times">${
          best
            ? `<b>${formatTime(best.t)}</b><small>${recs.length} course${recs.length > 1 ? "s" : ""} chronométrée${recs.length > 1 ? "s" : ""}</small>`
            : '<span class="none">Aucun record — à toi de jouer !</span>'
        }</div>`;
      list.appendChild(row);
    });
    this.show("screen-records");
  }

  showSettings() {
    this.show("screen-settings");
  }

  showPause() {
    this.show("screen-pause");
  }

  hidePause() {
    this.el["screen-pause"].classList.remove("active");
    this.el["screen-pause"].classList.add("hidden");
  }

  hideResult() {
    this.el["screen-result"].classList.remove("active");
    this.el["screen-result"].classList.add("hidden");
  }

  showResult(game, rec, totalWorlds) {
    const w = WORLDS[game.currentWorld];
    const best = (store.getRecords(w.id)[0] || {});
    const box = this.el["result-stats"];
    box.innerHTML = "";
    if (rec.isNewBest) {
      const nr = document.createElement("div");
      nr.id = "result-newrecord";
      nr.textContent = "★ NOUVEAU RECORD ★";
      box.appendChild(nr);
      this.game.audio.record();
    }
    const addLine = (a, b, cls) => {
      const row = document.createElement("div");
      row.className = "stat-line" + (cls ? " " + cls : "");
      row.innerHTML = `<span>${a}</span><b>${b}</b>`;
      box.appendChild(row);
    };
    addLine("Temps", formatTime(game.runTime * 1000), rec.isNewBest ? "record" : "");
    addLine("Pièces", "🪙 " + game.coinsRun);
    if (best && !rec.isNewBest) addLine("Meilleur", formatTime(best.t));
    const isLast = game.currentWorld >= totalWorlds - 1;
    this.el["btn-next"].style.display = isLast ? "none" : "";
    this.el["result-title"].textContent = w.name + " terminé !";
    this.show("screen-result");
    this.el["btn-jump"].classList.add("hidden");
  }

  showHud(world, save) {
    this.el["hud"].classList.remove("hidden");
    const recs = save.records[world.id];
    this.el["hud-best"].textContent = recs && recs[0] ? "Record : " + formatTime(recs[0].t) : "Première course !";
    if (this.isTouch) {
      this.el["btn-jump"].classList.remove("hidden");
      this.el["controls-hint"].classList.add("hidden");
    } else {
      this.el["controls-hint"].classList.remove("hidden");
    }
  }

  hideHud() {
    this.el["hud"].classList.add("hidden");
  }

  updateHud(timeSec, coins, progress) {
    const ms = timeSec * 1000;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor(ms % 1000);
    this.el["hud-timer"].firstChild.textContent = `${m}:${String(s).padStart(2, "0")}`;
    const msEl = this.el["hud-timer"].querySelector(".ms");
    if (msEl) msEl.textContent = "." + String(cs).padStart(3, "0");
    this.el["coins-count"].textContent = coins;
    const pct = Math.min(100, Math.max(0, progress * 100));
    this.el["hud-progress-fill"].style.width = pct + "%";
    this.el["hud-progress-dot"].style.left = pct + "%";
  }

  toast(msg) {
    const t = this.el["toast"];
    t.textContent = msg;
    t.classList.remove("hidden");
    t.style.animation = "none";
    void t.offsetWidth;
    t.style.animation = "";
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), 1800);
  }

  getCompletionCount(worldId) {
    return (store.getRecords(worldId) || []).length;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  }
}
