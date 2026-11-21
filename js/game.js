import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { WORLDS, Level } from "./world.js";
import { Character } from "./character.js";
import { Particles } from "./fx.js";
import { Input } from "./input.js";
import { AudioEngine } from "./audio.js";
import { Ui } from "./ui.js";
import * as store from "./storage.js";

const GRAVITY = 32;
const JUMP_V = 12.4;
const COYOTE = 0.12;
const JUMP_BUFFER = 0.14;
const PLAYER_RADIUS = 0.45;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = "boot";
    this.time = 0;
    this.runTime = 0;
    this.coinsRun = 0;
    this.deathFadeT = 0;
    this.shake = 0;
    this.save = store.load();

    this.input = new Input();
    this.audio = new AudioEngine();
    this.ui = new Ui(this);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 2600);
    this.camera.position.set(0, 4, -9);

    this.player = new Character();
    this.scene.add(this.player.group);
    this.fx = new Particles(this.scene);

    this.level = null;
    this._makeComposer();

    this._resize();
    window.addEventListener("resize", () => this._resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.state === "playing") this.pause();
    });

    this._clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._animate();
  }

  _makeComposer() {
    const size = this.renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(size, 0.45, 0.7, 0.88);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }

  setQuality(q) {
    store.updateSettings({ quality: q });
    this.save = store.load();
    this.renderer.shadowMap.enabled = q !== "low";
    this.renderer.setPixelRatio(this._pixelRatioFor(q));
    this.bloomPass.enabled = q !== "low";
    this.scene.traverse((o) => {
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) m.needsUpdate = true;
      }
    });
    this._resize(true);
  }

  _pixelRatioFor(q) {
    const dpr = window.devicePixelRatio || 1;
    if (q === "low") return Math.min(dpr, 1);
    if (q === "medium") return Math.min(dpr, 1.5);
    return Math.min(dpr, 2);
  }

  _resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this._pixelRatioFor(this.save.settings.quality));
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    if (w / h < 1.4) {
      this.camera.fov = 62 + (1.4 - w / h) * 6;
    } else {
      this.camera.fov = 62;
    }
    this.camera.updateProjectionMatrix();
  }

  loadWorld(worldIndex, difficultyKeep) {
    if (this.level) {
      this.scene.remove(this.level.group);
      this.level.dispose();
      this.level = null;
    }
    this.fx.clear();
    this.currentWorld = worldIndex;
    const quality = this.save.settings.quality;
    this.level = new Level(worldIndex, quality, this.fx);
    this.scene.add(this.level.group);
    this.scene.fog = this.level.fog;
    this.worldLength = this.level.length;

    this.spawnZ = 2;
    this.spawnY = 0;
    this.player.reset(0, this.spawnY, this.spawnZ);
    this.vy = 0;
    this.grounded = true;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.usedDouble = false;
    this.checkpointZ = this.spawnZ;
    this.checkpointY = this.spawnY;
    this.playerMode = "run";
    this.speed = WORLDS[worldIndex].baseSpeed;
    this.deathTimer = 0;
    this.winTimer = 0;
    this._firstUpdate = true;

    this._updateShadowCam();
    this._cameraSnap();
  }

  startWorld(worldIndex) {
    this.ui.fade(true);
    setTimeout(() => this.ui.fade(false), 420);
    this.audio.resume();
    this.runTime = 0;
    this.coinsRun = 0;
    this.loadWorld(worldIndex);
    this.state = "playing";
    this.input.reset();
    this.audio.startMusic(WORLDS[worldIndex].id);
    this.ui.showHud(WORLDS[worldIndex], this.save);
    this.ui.toast(this.ui.getCompletionCount(WORLDS[worldIndex].id) === 0 ? "Nouveau monde ! Fonce !" : WORLDS[worldIndex].name);
  }

  showMenu() {
    this.state = "menu";
    this.audio.stopMusic();
    this.loadWorld(0);
    this.playerMode = "menu";
    this.ui.showHome(this.save);
    this.ui.hideHud();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.audio.stopMusic();
    this.ui.showPause();
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.audio.resume();
    this.audio.startMusic(WORLDS[this.currentWorld].id);
    this.ui.hidePause();
    this.lastT = performance.now();
  }

  restart() {
    if (this.currentWorld === undefined) return;
    this.ui.hidePause();
    this.ui.hideResult();
    this.startWorld(this.currentWorld);
  }

  die(reason) {
    if (this.state !== "playing") return;
    this.state = "dying";
    this.playerMode = "dead";
    this.deathTimer = 0;
    this.shake = 1;
    this.audio.hit();
    this.fx.spawn(this.player.group.position.x, this.player.group.position.y + 1, this.player.group.position.z, {
      count: 26, color: 0xff5533, speed: 5, life: 0.9, size: 0.2,
    });
  }

  splashDie() {
    if (this.state !== "playing") return;
    this.state = "dying";
    this.playerMode = "dead";
    this.deathTimer = 0;
    this.audio.fall();
    const p = this.player.group.position;
    this.fx.spawn(p.x, -5.2, p.z, { count: 30, color: this.currentWorld === 2 ? 0xff7a2a : 0x7ec8ff, speed: 4.5, life: 1, gravity: -3 });
    this.player.group.visible = false;
  }

  respawn() {
    this.state = "playing";
    this.playerMode = "run";
    this.player.group.visible = true;
    this.player.reset(0, this.checkpointY + 0.4, this.checkpointZ);
    this.vy = 0;
    this.grounded = true;
    this.usedDouble = false;
    this._cameraSnap();
  }

  win() {
    if (this.state !== "playing") return;
    this.state = "win";
    this.playerMode = "win";
    this.winTimer = 0;
    this.audio.stopMusic();
    this.audio.win();
    const p = this.player.group.position;
    this.fx.spawn(p.x, p.y + 1.5, p.z, { count: 90, color: 0xffd24a, speed: 7, life: 1.6, gravity: 4, damping: 1.2, size: 0.22, colorVariance: 0.15 });
    const rec = store.addRecord(WORLDS[this.currentWorld].id, this.runTime * 1000, this.coinsRun);
    store.addCoins(this.coinsRun);
    store.unlockWorld(this.currentWorld + 1);
    this.save = store.load();
    this.lastRecordInfo = rec;
    this.ui.showResult(this, rec, WORLDS.length);
    this.ui.hideHud();
  }

  nextWorld() {
    const next = this.currentWorld + 1;
    if (next < WORLDS.length) this.startWorld(next);
    else { this.showMenu(); }
  }

  tryJump() {
    if (this.grounded || this.coyote > 0) {
      this.vy = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.audio.jump();
      const p = this.player.group.position;
      this.fx.spawn(p.x, p.y + 0.1, p.z, { count: 8, color: 0xd8d0c0, speed: 2, life: 0.5, gravity: 1, size: 0.13 });
      this.player.body.scale.set(0.92, 1.14, 0.92);
    } else {
      this.jumpBuffer = JUMP_BUFFER;
    }
  }

  updatePlayer(dt) {
    const p = this.player.group.position;
    const prog = Math.min(1, p.z / this.worldLength);
    this.speed = WORLDS[this.currentWorld].baseSpeed + 2.6 * prog;

    if (this.input.consumeJump()) this.tryJump();
    if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0)) {
      this.jumpBuffer = 0;
      this.vy = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.audio.jump();
    }
    if (this.input.consumeJumpRelease() && this.vy > 3) {
      this.vy *= 0.55;
    }

    p.z += this.speed * dt;
    this.vy -= GRAVITY * dt;
    p.y += this.vy * dt;

    this.grounded = false;
    let groundY = -Infinity;
    let standPlat = null;
    for (const plat of this.level.platforms) {
      if (p.z < plat.z0 - 0.3 || p.z > plat.z1 + 0.3) continue;
      let px = 0;
      if (plat.mover) px = plat.x;
      if (Math.abs(0 - (px)) > plat.w / 2 + 0.42) continue;
      if (plat.top <= p.y + 0.42 && plat.top > groundY) {
        groundY = plat.top;
        standPlat = plat;
      }
      if (p.z > plat.z0 - 0.3 && p.z < plat.z0 + 1.0 && plat.top > p.y + 0.42 && p.y < plat.top - 0.3) {
        this.die("wall");
        return;
      }
    }
    if (groundY > -Infinity && p.y <= groundY && this.vy <= 0.01) {
      if (!this.wasGrounded) {
        this.audio.land();
        this.player.onLand();
        this.fx.spawn(p.x, groundY + 0.08, p.z, { count: 10, color: 0xcfc8b8, speed: 2.4, life: 0.5, gravity: 1.5, size: 0.15 });
        if (this.save.settings.shake) this.shake = Math.max(this.shake, 0.18);
      }
      p.y = groundY;
      this.vy = 0;
      this.grounded = true;
      this.coyote = COYOTE;
      this.usedDouble = false;
    } else if (this.coyote > 0) {
      this.coyote -= dt;
    }
    this.wasGrounded = this.grounded;

    if (p.y < -4.6) { this.splashDie(); return; }

    for (const c of this.level.coins) {
      if (c.taken) continue;
      if (Math.abs(c.z - p.z) < 1.1 && Math.abs(c.y - (p.y + 0.8)) < 1.25) {
        c.taken = true;
        c.mesh.visible = false;
        this.coinsRun++;
        this.audio.coin();
        this.fx.spawn(c.x, c.y, c.z, { count: 10, color: 0xffd24a, speed: 2.6, life: 0.6, gravity: 2, size: 0.15 });
      }
    }

    for (const sp of this.level.spikes) {
      const halfZ = 0.5 + ((sp.count - 1) * 1.35) / 2;
      if (Math.abs(p.z - sp.z) < halfZ + 0.3 && p.y < sp.top + 0.85 && p.y > sp.top - 1.2) {
        this.die("spike");
        return;
      }
    }

    for (const s of this.level.sliders) {
      if (Math.abs(p.z - s.z) < 1.25 && s.x !== undefined) {
        if (Math.abs(s.mesh.position.x) < 1.05 && p.y < s.top + 1.5 && p.y > s.top - 1) {
          this.die("slider");
          return;
        }
      }
    }

    for (const s of this.level.spinners) {
      if (Math.abs(p.z - s.z) < 1.4) {
        const ax = Math.cos(s.angle) * s.half;
        const az = -Math.sin(s.angle) * s.half;
        const relZ = p.z - s.z;
        const vx = -2 * ax, vz = 2 * az;
        const wx = 0 - ax, wz = relZ - az;
        const vv = vx * vx + vz * vz;
        let f = vv > 0 ? (wx * vx + wz * vz) / vv : 0;
        f = Math.max(0, Math.min(1, f));
        const dx = ax + vx * f;
        const dz = az + vz * f;
        const ddx = dx, ddz = relZ - dz;
        if (ddx * ddx + ddz * ddz < 0.55 * 0.55 && p.y < s.y + 0.8 && p.y > s.y - 1.2) {
          this.die("spinner");
          return;
        }
      }
    }

    for (const cp of this.level.checkpoints) {
      if (!cp.taken && p.z >= cp.z) {
        cp.taken = true;
        this.checkpointZ = cp.z;
        this.checkpointY = cp.top;
        this.audio.checkpoint();
        this.ui.toast("Checkpoint ✓");
        this.fx.spawn(2.4, cp.top + 2.4, cp.z, { count: 18, color: 0x37e6ff, speed: 3, life: 0.9, gravity: -0.5, size: 0.16 });
      }
    }

    if (p.z >= this.worldLength) {
      this.win();
    }
  }

  updateCamera(dt, snap) {
    const p = this.player.group.position;
    if (snap) {
      this.camera.position.set(-8.0, p.y + 2.15, p.z + 1.0);
    } else {
      const k = 1 - Math.pow(0.004, dt);
      this.camera.position.x += (-8.0 - this.camera.position.x) * Math.min(1, dt * 6);
      this.camera.position.y += (p.y + 2.15 - this.camera.position.y) * k;
      this.camera.position.z = p.z + 1.0;
    }
    let eyeY = p.y + 1.15;
    let lookZ = p.z + 5.5;
    let lookX = 0;
    if (this.playerMode === "win") {
      const t = this.winTimer;
      eyeY = p.y + 2.4 + Math.sin(t * 1.4) * 0.8;
      this.camera.position.set(Math.sin(t * 0.7) * 10, eyeY, p.z - Math.cos(t * 0.7) * 10);
      lookX = 0;
      lookZ = p.z;
    }
    const look = new THREE.Vector3(lookX, eyeY, lookZ);
    this.camera.lookAt(look);
    if (this.shake > 0 && this.save.settings.shake) {
      this.shake = Math.max(0, this.shake - dt * 2.4);
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.7;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.7;
    }
    const speedN = this.speed ? Math.min(1, (this.speed - 12) / 8) : 0;
    const targetFov = 62 + (this.state === "playing" ? speedN * 7 : 0) + (this.state === "dying" ? 0 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 3);
      this.camera.updateProjectionMatrix();
    }
  }

  _updateShadowCam() {
    this.level.updateShadow(this.player.group.position);
  }

  _cameraSnap() {
    this.updateCamera(0.016, true);
  }

  update(dt) {
    this.time += dt;

    this.input.poll();
    if (this.input.consumeFullscreen()) this.ui.toggleFullscreen();
    if (this.input.consumeRestart() && ["playing", "paused", "win", "dying"].includes(this.state)) {
      this.restart();
      return;
    }
    if (this.input.consumePause()) {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
      return;
    }

    if (this.state === "menu") {
      const t = this.time;
      const r = 13;
      this.camera.position.set(Math.sin(t * 0.13) * r, 5.4 + Math.sin(t * 0.21) * 1.4, 8 + Math.cos(t * 0.13) * r);
      this.camera.lookAt(0, 1.4, 10);
      this.player.update(dt, { grounded: true, vy: 0, speed: 8, mode: "menu" });
      this.player.group.position.set(0, 0.05, 10);
      const angle = Math.atan2(this.camera.position.x - 0, this.camera.position.z - 10);
      this.player.group.rotation.y = angle;
      if (this.level) this.level.update(dt, 10);
      this.fx.update(dt);
      return;
    }

    if (this.state === "playing") {
      this.runTime += dt;
      this.playerMode = "run";
      this.updatePlayer(dt);
      this.player.update(dt, { grounded: this.grounded, vy: this.vy, speed: this.speed, mode: "run" });
    } else if (this.state === "dying") {
      this.deathTimer += dt;
      this.player.update(dt, { grounded: false, vy: 0, speed: 0, mode: "dead" });
      if (this.deathTimer > 1.05) {
        this.respawn();
      }
    } else if (this.state === "win") {
      this.winTimer += dt;
      this.player.group.rotation.y += dt * 2.4;
      this.player.update(dt, { grounded: true, vy: 0, speed: 0, mode: "win" });
      if (this.winTimer < 3.2 && Math.random() < dt * 6) {
        const p = this.player.group.position;
        this.fx.spawn(p.x + (Math.random() - 0.5) * 8, p.y + 4 + Math.random() * 3, p.z + (Math.random() - 0.5) * 8, {
          count: 12, color: [0xffd24a, 0x37e6ff, 0xff66a8, 0x7dff8a][(Math.random() * 4) | 0],
          speed: 3, life: 1.4, gravity: -1, size: 0.2,
        });
      }
    } else if (this.state === "paused") {
      return;
    }

    if (this.state === "playing" || this.state === "dying" || this.state === "win") {
      const p = this.player.group.position;
      this.level.update(dt, p.z);
      this.level.updateShadow(p);
      this.fx.update(dt);
      if (this.state === "dying" && this.playerMode !== "dead") {
        this.player.update(dt, { grounded: false, vy: 0, speed: 0, mode: "dead" });
      }
      this.ui.updateHud(this.runTime, this.coinsRun, p.z / this.worldLength);
    }

    this.updateCamera(dt);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const now = performance.now();
    if (!this.lastT) this.lastT = now;
    let dt = (now - this.lastT) / 1000;
    this.lastT = now;
    if (dt > 0.1) dt = 0.1;
    if (this.state === "paused") {
      this.render();
      return;
    }
    try {
      this.update(dt);
    } catch (e) {
      console.error(e);
    }
    this.render();
  }

  render() {
    if (this.bloomPass.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
}
