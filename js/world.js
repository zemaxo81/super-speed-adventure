import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

export const WORLDS = [
  {
    id: "prairie", name: "Prairie Tropicale", icon: "🌴", length: 980,
    sky: [0x2f8fff, 0xbfe9ff], fog: 0xcfe9ff, fogDensity: 0.0075,
    hemi: [0xbfe4ff, 0x3e7a34, 1.1], dir: [0xfff1cf, 2.6],
    water: { color: 0x1a8fd4, kind: "ocean" },
    top: "grass", side: "soil", deco: ["tree", "bush", "flower", "rock"],
    particles: "motes", baseSpeed: 13.2,
    card: ["linear-gradient(160deg,#37b6ff,#7ee08a)"],
  },
  {
    id: "peaks", name: "Monts Rocheux", icon: "⛰️", length: 1020,
    sky: [0x4f8edb, 0xe8eef7], fog: 0xe6ecf5, fogDensity: 0.007,
    hemi: [0xdff0ff, 0x556070, 1.0], dir: [0xffffff, 2.7],
    water: { color: 0x4a7f9e, kind: "ocean" },
    top: "rock", side: "rockdark", deco: ["pine", "rock", "pine", "bush"],
    particles: "snow", baseSpeed: 14.0,
    card: ["linear-gradient(160deg,#5a8fc9,#d8e4ee)"],
  },
  {
    id: "volcano", name: "Royaume Volcanique", icon: "🌋", length: 1040,
    sky: [0x1c0a14, 0xff5a26], fog: 0x38100e, fogDensity: 0.011,
    hemi: [0xff9a6b, 0x2a0f0c, 1.15], dir: [0xffb08a, 2.2],
    water: { color: 0xff4a12, kind: "lava" },
    top: "basalt", side: "basalt", deco: ["spire", "emberRock"],
    particles: "embers", baseSpeed: 14.6,
    card: ["linear-gradient(160deg,#2b0f12,#ff5722)"],
  },
  {
    id: "glacier", name: "Royaume Glacé", icon: "❄️", length: 1080,
    sky: [0x16305c, 0x9fd0ff], fog: 0xc4dcff, fogDensity: 0.0095,
    hemi: [0xdff2ff, 0x7a94b8, 1.2], dir: [0xeaf6ff, 2.4],
    water: { color: 0x77b7e8, kind: "ocean" },
    top: "ice", side: "iceDark", deco: ["iceSpike", "pine", "rock"],
    particles: "snow", baseSpeed: 15.2, lowFriction: true,
    card: ["linear-gradient(160deg,#7fb6ff,#e9f7ff)"],
  },
  {
    id: "desert", name: "Dunes Ardentes", icon: "🏜️", length: 1120,
    sky: [0x4da3ff, 0xffe0a8], fog: 0xf0d8a6, fogDensity: 0.008,
    hemi: [0xfff0d0, 0xa8793e, 1.05], dir: [0xffdfae, 2.9],
    water: { color: 0xc9a15e, kind: "none" },
    top: "sand", side: "sandstone", deco: ["cactus", "rock", "palm"],
    particles: "sand", baseSpeed: 15.8,
    card: ["linear-gradient(160deg,#ffb74d,#ff8a65)"],
  },
  {
    id: "city", name: "Cité Néon", icon: "🌃", length: 1200,
    sky: [0x030618, 0x14295e], fog: 0x0a1330, fogDensity: 0.011,
    hemi: [0x4455aa, 0x120d24, 0.9], dir: [0x8899ff, 1.7],
    water: { color: 0x0c1e4a, kind: "ocean" },
    top: "metal", side: "metalSide", deco: ["building", "billboard", "antenna"],
    particles: "motes", baseSpeed: 16.4, night: true, bloom: 1.35,
    card: ["linear-gradient(160deg,#0b1030,#e040fb,#37e6ff)"],
  },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const texCache = {};

function canvasTex(key, size, draw, repeat) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (typeof draw === "function") draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.repeat.set(repeat, repeat);
  texCache[key] = t;
  return t;
}

function noise(ctx, s, base, colors, count, sizeMin, sizeMax) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
    const r = sizeMin + Math.random() * (sizeMax - sizeMin);
    ctx.fillRect(Math.random() * s, Math.random() * s, r, r);
  }
}

function buildTextures() {
  canvasTex("grass", 256, (c, s) => {
    noise(c, s, "#4fae3e", ["#5cc24a", "#459c37", "#69d155", "#3f8f33"], 2600, 2, 7);
    c.strokeStyle = "rgba(120,220,90,0.5)";
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * s, y = Math.random() * s;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y - 6); c.stroke();
    }
  });
  canvasTex("soil", 256, (c, s) => noise(c, s, "#7a5230", ["#8a5f3a", "#6b442a", "#94683f", "#5d3a22"], 2000, 2, 9));
  canvasTex("rock", 256, (c, s) => {
    noise(c, s, "#8d8f96", ["#9b9da5", "#7d7f88", "#a8aab1", "#6e7076"], 1800, 2, 10);
    c.strokeStyle = "rgba(60,62,70,0.35)";
    for (let i = 0; i < 26; i++) {
      c.beginPath();
      let x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += Math.random() * 30 - 15; y += Math.random() * 22; c.lineTo(x, y); }
      c.stroke();
    }
  });
  canvasTex("rockdark", 256, (c, s) => noise(c, s, "#65676e", ["#71737a", "#595b62", "#7e8087", "#4c4e55"], 1800, 2, 9));
  canvasTex("basalt", 256, (c, s) => {
    noise(c, s, "#2c2429", ["#372e33", "#221b20", "#3f353b", "#1b1519"], 1900, 2, 9);
    c.strokeStyle = "rgba(255,90,20,0.85)";
    c.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      let x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += Math.random() * 46 - 23; y += Math.random() * 34; c.lineTo(x, y); }
      c.stroke();
    }
    c.lineWidth = 1;
  });
  canvasTex("basaltLava", 256, (c, s) => {
    c.fillStyle = "#000"; c.fillRect(0, 0, s, s);
    c.strokeStyle = "#ff5a18"; c.lineWidth = 3.5;
    for (let i = 0; i < 16; i++) {
      c.beginPath();
      let x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += Math.random() * 46 - 23; y += Math.random() * 34; c.lineTo(x, y); }
      c.stroke();
    }
  });
  canvasTex("ice", 256, (c, s) => {
    noise(c, s, "#bfe2ff", ["#d4ecff", "#a8d4f8", "#e6f6ff", "#98c8ee"], 1600, 3, 12);
    c.strokeStyle = "rgba(255,255,255,0.65)";
    for (let i = 0; i < 20; i++) {
      c.beginPath();
      const y = Math.random() * s;
      c.moveTo(0, y); c.lineTo(s, y + Math.random() * 30 - 15);
      c.stroke();
    }
  });
  canvasTex("iceDark", 256, (c, s) => noise(c, s, "#7fb4dd", ["#8fc0e6", "#6ea3cc", "#a2cef0"], 1500, 3, 10));
  canvasTex("sand", 256, (c, s) => {
    noise(c, s, "#e3bd77", ["#ecca8a", "#d9b169", "#f4d795", "#cf9f58"], 2400, 2, 8);
    c.strokeStyle = "rgba(180,140,80,0.35)";
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      const y = Math.random() * s;
      c.moveTo(0, y); c.bezierCurveTo(s * 0.3, y - 14, s * 0.6, y + 14, s, y);
      c.stroke();
    }
  });
  canvasTex("sandstone", 256, (c, s) => noise(c, s, "#c69a58", ["#d2a764", "#b98c4c", "#dcb271"], 1700, 2, 9));
  canvasTex("metal", 256, (c, s) => {
    noise(c, s, "#2a3040", ["#303849", "#232936", "#384154"], 1200, 3, 8);
    c.strokeStyle = "rgba(90,110,150,0.5)";
    c.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      c.beginPath(); c.moveTo((s / 8) * i, 0); c.lineTo((s / 8) * i, s); c.stroke();
      c.beginPath(); c.moveTo(0, (s / 8) * i); c.lineTo(s, (s / 8) * i); c.stroke();
    }
  });
  canvasTex("metalSide", 256, (c, s) => {
    noise(c, s, "#20242e", ["#282e3a", "#191d26", "#2f3644"], 1000, 3, 8);
    c.fillStyle = "#37e6ff";
    c.shadowColor = "#37e6ff"; c.shadowBlur = 10;
    c.fillRect(0, s * 0.42, s, 4);
    c.fillStyle = "#ff40d0";
    c.shadowColor = "#ff40d0";
    c.fillRect(0, s * 0.6, s, 3);
  });
  canvasTex("windows", 256, (c, s) => {
    c.fillStyle = "#0d1120"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 10; x++) {
        if (Math.random() < 0.55) continue;
        c.fillStyle = Math.random() < 0.5 ? "#ffd77a" : (Math.random() < 0.5 ? "#7ae6ff" : "#ff7ad9");
        c.fillRect(x * (s / 10) + 3, y * (s / 16) + 3, s / 10 - 6, s / 16 - 6);
      }
    }
  });
  canvasTex("lavaSurface", 256, (c, s) => {
    noise(c, s, "#ff4a12", ["#ff7a2a", "#ffd23e", "#c92f08", "#ff9c3a"], 900, 4, 16);
  });
  canvasTex("cloud", 128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.55, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    for (let i = 0; i < 5; i++) {
      const x = s * 0.25 + Math.random() * s * 0.5;
      const y = s * 0.4 + Math.random() * s * 0.2;
      const r = s * (0.16 + Math.random() * 0.14);
      const gg = c.createRadialGradient(x, y, 2, x, y, r);
      gg.addColorStop(0, "rgba(255,255,255,0.9)");
      gg.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gg;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
  });
  canvasTex("sun", 128, (c, s) => {
    const g = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,240,1)");
    g.addColorStop(0.28, "rgba(255,240,180,0.95)");
    g.addColorStop(0.6, "rgba(255,200,90,0.35)");
    g.addColorStop(1, "rgba(255,180,60,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  });
}

const SKY_VERT = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uNight;
varying vec3 vPos;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 dir = normalize(vPos);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uBottom, uTop, pow(h, 0.75));
  if (uNight > 0.5) {
    vec2 grid = floor(dir.xz * 60.0 + dir.y * 30.0);
    float star = step(0.9975, hash(grid)) * smoothstep(0.02, 0.2, dir.y);
    col += star * vec3(0.9);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

function mat(color, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: opts.rough !== undefined ? opts.rough : 0.85, metalness: opts.metal || 0 });
  if (opts.map) m.map = opts.map;
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.emissiveI !== undefined ? opts.emissiveI : 1; }
  if (opts.emissiveMap) { m.emissiveMap = opts.emissiveMap; }
  return m;
}

function swayShader(material, uTimeUniform, amp) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTimeUniform;
    shader.uniforms.uSway = { value: amp };
    shader.vertexShader = "uniform float uTime;\nuniform float uSway;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        transformed.x += sin(uTime * 1.7 + instanceMatrix[3][0] * 0.35 + instanceMatrix[3][2] * 0.21) * uSway * max(transformed.y * 0.25, 0.0);
        transformed.z += cos(uTime * 1.3 + instanceMatrix[3][0] * 0.27) * uSway * 0.25 * max(transformed.y * 0.25, 0.0);
      #endif`
    );
  };
  return material;
}

export class Level {
  constructor(worldIndex, quality, fx) {
    const def = WORLDS[worldIndex];
    this.def = def;
    this.worldIndex = worldIndex;
    this.diff = worldIndex / (WORLDS.length - 1);
    this.quality = quality;
    this.fx = fx;
    this.group = new THREE.Group();
    this.group.name = "level";
    this.rng = mulberry32(hashStr(def.id) + 97);
    this.platforms = [];
    this.spikes = [];
    this.sliders = [];
    this.spinners = [];
    this.coins = [];
    this.checkpoints = [];
    this.movers = [];
    this.decorAnims = [];
    this.time = 0;
    this.length = def.length;
    this.uTime = { value: 0 };
    this._disposables = new Set();

    buildTextures();
    this._buildEnvironment();
    this._buildTrack();
    this._buildBackdrop();
    this._buildAmbientParticles();
  }

  _track(key) {
    this._disposables.add(key);
    return key;
  }

  _buildEnvironment() {
    const d = this.def;
    this.uSkyTop = { value: new THREE.Color(d.sky[0]) };
    this.uSkyBottom = { value: new THREE.Color(d.sky[1]) };
    this.uNight = { value: d.night ? 1 : 0 };

    const skyGeo = new THREE.SphereGeometry(1500, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: this.uSkyTop, uBottom: this.uSkyBottom, uNight: this.uNight },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(this.sky);

    const sunMat = new THREE.SpriteMaterial({ map: canvasTex("sun", 128, sunDraw, 0), transparent: true, depthWrite: false, fog: false });
    this.sun = new THREE.Sprite(sunMat);
    this.sun.scale.set(90, 90, 1);
    this.sun.position.set(-140, 150, 420);
    this.group.add(this.sun);

    this.hemi = new THREE.HemisphereLight(d.hemi[0], d.hemi[1], d.hemi[2]);
    this.group.add(this.hemi);
    this.dir = new THREE.DirectionalLight(d.dir[0], d.dir[1]);
    this.dir.position.set(-40, 60, -30);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(2048, 2048);
    const sc = this.dir.shadow.camera;
    sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -20; sc.near = 1; sc.far = 220;
    this.dir.shadow.bias = -0.0004;
    this.dir.shadow.normalBias = 0.02;
    this.group.add(this.dir);
    this.group.add(this.dir.target);

    if (d.fog) {
      this.fog = new THREE.FogExp2(d.fog, d.fogDensity);
    }

    const w = d.water;
    if (w.kind === "ocean") {
      if (this.quality === "high") {
        const ref = new Reflector(new THREE.PlaneGeometry(1600, 2000), {
          clipBias: 0.003, textureWidth: 1024, textureHeight: 1024, color: w.color,
        });
        ref.rotation.x = -Math.PI / 2;
        ref.position.set(0, -6, this.length * 0.25);
        this.group.add(ref);
        this.reflectTarget = new THREE.Mesh(
          new THREE.PlaneGeometry(1600, 2000),
          new THREE.MeshBasicMaterial({ color: w.color, transparent: true, opacity: 0.42, depthWrite: false })
        );
        this.reflectTarget.rotation.x = -Math.PI / 2;
        this.reflectTarget.position.set(0, -5.95, this.length * 0.25);
        this.group.add(this.reflectTarget);
        this.waterMesh = ref;
      } else {
        const geo = new THREE.PlaneGeometry(1600, 2000, 40, 40);
        const base = new THREE.MeshStandardMaterial({
          color: w.color, roughness: 0.15, metalness: 0.7,
        });
        this.waterMesh = new THREE.Mesh(geo, base);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.set(0, -6, this.length * 0.25);
        this.group.add(this.waterMesh);
      }
    } else if (w.kind === "lava") {
      const tex = canvasTex("lavaSurface", 256, (c, s) => {}, 4);
      const matL = new THREE.MeshStandardMaterial({
        color: 0xff5416, emissive: 0xff4408, emissiveIntensity: 1.5,
        emissiveMap: tex, map: tex, roughness: 0.6,
      });
      this.waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1600, 2000), matL);
      this.waterMesh.rotation.x = -Math.PI / 2;
      this.waterMesh.position.set(0, -6, this.length * 0.25);
      this.group.add(this.waterMesh);
      this.lavaTex = tex;
    } else {
      const base = new THREE.MeshStandardMaterial({ color: w.color, roughness: 1 });
      this.waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1600, 2000), base);
      this.waterMesh.rotation.x = -Math.PI / 2;
      this.waterMesh.position.set(0, -6, this.length * 0.25);
      this.group.add(this.waterMesh);
    }

    if (this.def.particles) this._ambientGroup = new THREE.Group();
  }

  _platformMaterial(kind) {
    const repeatV = 2;
    switch (kind) {
      case "grass": {
        const t = canvasTex("grass", 256, null, 0).clone();
        t.needsUpdate = true; t.repeat.set(1.4, 1.4);
        const side = canvasTex("soil", 256, null, 0);
        return [mat(0xffffff, { map: side }), mat(0xffffff, { map: side }), mat(0xffffff, { map: t, rough: 0.9 }), mat(0xffffff, { map: side }), mat(0xffffff, { map: side }), mat(0xffffff, { map: side })];
      }
      case "rock": return mkRockPair("rock", "rockdark");
      case "basalt": {
        const t = canvasTex("basalt", 256, null, 0).clone();
        t.needsUpdate = true; t.repeat.set(1.4, 1.4);
        const lt = canvasTex("basaltLava", 256, null, 0).clone();
        lt.needsUpdate = true; lt.repeat.set(1.4, 1.4);
        const topMat = mat(0x332a2f, { map: t, rough: 0.75, emissive: 0xff4408, emissiveI: 0.85, emissiveMap: lt });
        const sideMat = mat(0x241d21, { map: canvasTex("basalt", 256, null, 0), rough: 0.85 });
        return mkMats(topMat, sideMat);
      }
      case "ice": {
        const t = canvasTex("ice", 256, null, 0).clone(); t.needsUpdate = true; t.repeat.set(1.4, 1.4);
        const topMat = mat(0xffffff, { map: t, rough: 0.18, metal: 0.1 });
        const sideMat = mat(0xffffff, { map: canvasTex("iceDark", 256, null, 0), rough: 0.4 });
        return mkMats(topMat, sideMat);
      }
      case "sand": {
        const t = canvasTex("sand", 256, null, 0).clone(); t.needsUpdate = true; t.repeat.set(1.4, 1.4);
        const topMat = mat(0xffffff, { map: t, rough: 0.95 });
        const sideMat = mat(0xffffff, { map: canvasTex("sandstone", 256, null, 0) });
        return mkMats(topMat, sideMat);
      }
      case "metal": {
        const t = canvasTex("metal", 256, null, 0).clone(); t.needsUpdate = true; t.repeat.set(1.4, 1.4);
        const topMat = mat(0xffffff, { map: t, rough: 0.5, metal: 0.5 });
        const sideMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.4, map: canvasTex("metalSide", 256, null, 0), emissiveMap: canvasTex("metalSide", 256, null, 0), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.75 });
        return mkMats(topMat, sideMat);
      }
      default: return mkMats(mat(0x8d8f96), mat(0x595b62));
    }
  }

  addPlatform(z0, z1, width, topY) {
    const len = z1 - z0;
    const thick = 4.2;
    const geo = new THREE.BoxGeometry(width, thick, len);
    const mats = this._platformMaterial(this.def.top);
    const mesh = new THREE.Mesh(geo, mats);
    mesh.position.set(0, topY - thick / 2, (z0 + z1) / 2);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    this.group.add(mesh);
    const p = { mesh, z0, z1, w: width, top: topY, x: 0, baseX: 0, mover: false };
    this.platforms.push(p);
    return p;
  }

  _buildTrack() {
    const rng = this.rng;
    const diff = this.diff;
    const startTop = 0;
    this.addPlatform(-14, 26, 7, startTop);

    let z = 26;
    let top = startTop;
    let lastType = "";
    const nextCpAt = [this.length * 0.28, this.length * 0.55, this.length * 0.8];
    let cpIndex = 0;

    while (z < this.length - 34) {
      if (cpIndex < nextCpAt.length && z >= nextCpAt[cpIndex] - 8) {
        const p = this.addPlatform(z, z + 13, 7, top);
        this.checkpoints.push({ z: z + 7, top, mesh: this._makeFlag(z + 7, top), taken: false });
        z += 13;
        cpIndex++;
        lastType = "checkpoint";
        continue;
      }

      const roll = rng();
      let type;
      const w = [];
      w.push(["run", lastType === "gap" ? 0.05 : 0.16]);
      w.push(["gap", 0.2]);
      w.push(["gapCoins", 0.14]);
      w.push(["stepUp", top > 8 ? 0.05 : 0.14]);
      w.push(["stepDown", top < -2 ? 0.05 : 0.1]);
      w.push(["moverX", 0.09]);
      w.push(["slider", 0.1]);
      w.push(["spinner", diff > 0.25 ? 0.09 : 0.03]);
      w.push(["spikeRow", 0.1]);
      w.push(["narrow", 0.07]);
      let total = 0;
      for (const item of w) total += item[1];
      let pick = rng() * total;
      for (const item of w) {
        pick -= item[1];
        if (pick <= 0) { type = item[0]; break; }
      }
      if (type === lastType && rng() < 0.55) type = "run";

      switch (type) {
        case "run": {
          const len = 10 + rng() * 9;
          this.addPlatform(z, z + len, 6.5, top);
          if (rng() < 0.75) this._coinRow(z + 2, z + len - 2, top);
          z += len;
          break;
        }
        case "gap": {
          const g = 3 + diff * 2.6 + rng() * 1.6;
          const len = 9 + rng() * 8;
          z += g;
          this.addPlatform(z, z + len, 6.5, top);
          if (rng() < 0.55) this._coinRow(z + 2, z + len - 2, top);
          z += len;
          break;
        }
        case "gapCoins": {
          const g = 4.5 + diff * 2.4 + rng() * 1.5;
          this._coinArc(z, g, top);
          z += g;
          this.addPlatform(z, z + 11, 6.5, top);
          z += 11;
          break;
        }
        case "stepUp": {
          const rise = 1 + rng() * 0.9;
          const g = 3.6 + diff * 1.4;
          z += g;
          top += rise;
          const len = 10 + rng() * 8;
          this.addPlatform(z, z + len, 6.5, top);
          if (rng() < 0.6) this._coinRow(z + 2, z + len - 2, top);
          z += len;
          break;
        }
        case "stepDown": {
          const drop = -(0.8 + rng() * 1.4);
          const g = 4 + diff;
          z += g;
          top += drop;
          const len = 10 + rng() * 8;
          this.addPlatform(z, z + len, 6.5, top);
          z += len;
          break;
        }
        case "moverX": {
          const g = 4.5 + diff * 1.5;
          const pz = z + g / 2;
          const platLen = 5.2;
          const moverTop = top;
          this._makeMovingPlatform(pz, platLen, moverTop, rng);
          z += g + platLen + 1.5;
          break;
        }
        case "slider": {
          const len = 12 + rng() * 6;
          const p = this.addPlatform(z, z + len, 6.5, top);
          this._makeSlider(p, rng);
          if (rng() < 0.5) this._coinArc(z - 2.5, 3.5, top);
          z += len;
          break;
        }
        case "spinner": {
          const len = 13 + rng() * 5;
          const p = this.addPlatform(z, z + len, 6.8, top);
          this._makeSpinner(p, rng);
          z += len;
          break;
        }
        case "spikeRow": {
          const len = 10 + rng() * 6;
          const p = this.addPlatform(z, z + len, 6.5, top);
          const count = 1 + Math.floor(diff * 2.4 + rng() * 1.4);
          this._makeSpikeRow(z + len * 0.5, top, count);
          if (rng() < 0.5) this._coinArc(z - 2, 4.6, top);
          z += len;
          break;
        }
        case "narrow": {
          const len = 10 + rng() * 9;
          this.addPlatform(z, z + len, 3.4, top);
          if (rng() < 0.55) this._coinRow(z + 2, z + len - 2, top);
          z += len;
          break;
        }
        default:
          z += 8;
      }
      lastType = type;
    }

    this.addPlatform(this.length - 34, this.length + 26, 8, top);
    this.finishTop = top;
    this._makeFinishGate(this.length, top);
    this._decoratePlatforms();
  }

  _coinRow(z0, z1, top) {
    if (z1 - z0 < 2) return;
    const n = Math.max(3, Math.floor((z1 - z0) / 2.4));
    for (let i = 0; i < n; i++) this._addCoin(0, top + 1.15, z0 + ((z1 - z0) / (n - 1)) * i);
  }

  _coinArc(zStart, gap, top) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const zc = zStart + f * gap;
      const y = top + 1.0 + Math.sin(f * Math.PI) * 2.1;
      this._addCoin(0, y, zc);
    }
  }

  _addCoin(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 18);
    const m = new THREE.MeshStandardMaterial({ color: 0xffc93a, emissive: 0xa06a00, emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.85 });
    const mesh = new THREE.Mesh(geo, m);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.coins.push({ mesh, taken: false, x, y, z });
  }

  _makeMovingPlatform(zCenter, len, topY, rng) {
    const thick = 1.4;
    const mats = this._platformMaterial(this.def.top);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, thick, len), mats);
    mesh.position.set(0, topY - thick / 2, zCenter);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    const range = 1.9 + rng() * 1.3;
    const speed = 1.4 + rng() * 1.1 + this.diff * 0.8;
    const p = { mesh, z0: zCenter - len / 2, z1: zCenter + len / 2, w: 4.6, top: topY, x: 0, baseX: 0, range, speed, phase: rng() * Math.PI * 2, mover: true };
    this.platforms.push(p);
    this.movers.push(p);
    return p;
  }

  _makeSlider(platform, rng) {
    const top = platform.top;
    const midZ = (platform.z0 + platform.z1) / 2;
    const body = new THREE.Group();
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.25, 1.5),
      mat(0xb3202f, { rough: 0.4, metal: 0.3, emissive: 0x600000, emissiveI: 0.4 }));
    core.position.y = 0.62;
    body.add(core);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 10), mat(0xe8e8ef, { rough: 0.3, metal: 0.7 }));
    tip.position.y = 1.55;
    tip.rotation.z = Math.PI;
    body.add(tip);
    body.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    body.position.set(0, top, (platform.z0 + platform.z1) / 2);
    this.group.add(body);
    const range = (platform.w / 2) - 1.05;
    this.sliders.push({ mesh: body, z: midZ, top, range, speed: 2.6 + rng() * 2 + this.diff * 2, phase: rng() * Math.PI * 2, baseX: 0, x: 0 });
  }

  _makeSpinner(platform, rng) {
    const top = platform.top;
    const zc = (platform.z0 + platform.z1) / 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.1, 10), mat(0x454a5c, { rough: 0.4, metal: 0.6 }));
    post.position.set(0, top + 0.55, zc);
    post.castShadow = true;
    this.group.add(post);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.5, 0.6),
      mat(0xd6b021, { rough: 0.35, metal: 0.5, emissive: 0x553b00, emissiveI: 0.5 }));
    bar.position.set(0, top + 0.95, zc);
    bar.castShadow = true;
    this.group.add(bar);
    this.spinners.push({ mesh: bar, z: zc, top, y: top + 0.95, half: 3.6, angle: rng() * Math.PI * 2, speed: 1.5 + rng() * 0.9 + this.diff * 1.1 });
  }

  _makeSpikeRow(z, top, count) {
    const group = new THREE.Group();
    const geo = new THREE.ConeGeometry(0.42, 1.1, 8);
    const m = mat(0xc4ccd8, { rough: 0.25, metal: 0.7 });
    for (let i = 0; i < count; i++) {
      const spike = new THREE.Mesh(geo, m);
      spike.position.set((i - (count - 1) / 2) * 1.35, top + 0.55, 0);
      spike.castShadow = true;
      group.add(spike);
    }
    group.position.set(0, 0, z);
    this.group.add(group);
    this.spikes.push({ z, top, count, mesh: group });
  }

  _makeFlag(z, top) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8), mat(0xe8e8ef, { rough: 0.3, metal: 0.7 }));
    pole.position.y = top + 1.7;
    pole.castShadow = true;
    group.add(pole);
    const flagTex = canvasTex("sun", 128, sunDraw, 0);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.95, 8, 4),
      new THREE.MeshStandardMaterial({ color: 0x37e6ff, emissive: 0x0a7a92, emissiveIntensity: 0.7, side: THREE.DoubleSide, roughness: 0.6 })
    );
    flag.position.set(0.78, top + 2.85, 0);
    flag.castShadow = true;
    group.add(flag);
    group.position.set(2.4, 0, z);
    this.group.add(group);
    this.decorAnims.push({ type: "flag", mesh: flag, baseX: 0.78 });
    return group;
  }

  _makeFinishGate(z, top) {
    const group = new THREE.Group();
    const pm = mat(0xe8e8ef, { rough: 0.3, metal: 0.7 });
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 0.8), pm);
      pillar.position.set(side * 3.6, top + 3.75, 0);
      pillar.castShadow = true;
      group.add(pillar);
    }
    const bannerCanvas = document.createElement("canvas");
    bannerCanvas.width = 512; bannerCanvas.height = 96;
    const bc = bannerCanvas.getContext("2d");
    bc.fillStyle = "#141024"; bc.fillRect(0, 0, 512, 96);
    bc.fillStyle = "#ffb300"; bc.font = "900 58px 'Segoe UI', sans-serif";
    bc.textAlign = "center"; bc.textBaseline = "middle";
    bc.fillText("🏁 ARRIVÉE 🏁", 256, 52);
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    bannerTex.colorSpace = THREE.SRGBColorSpace;
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 1.6),
      new THREE.MeshStandardMaterial({ map: bannerTex, emissive: 0xffffff, emissiveMap: bannerTex, emissiveIntensity: 0.75, side: THREE.DoubleSide })
    );
    banner.position.set(0, top + 6.4, 0);
    group.add(banner);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 5.6),
      new THREE.MeshBasicMaterial({ color: 0x37e6ff, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.position.set(0, top + 2.8, 0);
    group.add(glow);
    group.position.set(0, 0, z);
    this.group.add(group);
    this.finishGlow = glow;
  }

  _decoratePlatforms() {
    const rng = this.rng;
    const decoTypes = this.def.deco;
    const spread = Math.min(1, 0.5 + this.platforms.length / 30);
    for (const p of this.platforms) {
      if (p.mover) continue;
      if (p.z1 < 20 && p.z0 < 0) continue;
      const len = p.z1 - p.z0;
      const n = Math.floor(len / 7);
      for (let i = 0; i < n; i++) {
        if (rng() > 0.62 * spread) continue;
        const side = rng() < 0.5 ? -1 : 1;
        const x = side * (p.w / 2 + 0.7) + (rng() - 0.5) * 0.4;
        const z = p.z0 + rng() * len;
        const type = decoTypes[(rng() * decoTypes.length) | 0];
        this._spawnProp(type, x, p.top, z, p.w - 1.4);
      }
    }
  }

  _propInstances = null;

  _spawnProp(type, x, topY, z, laneWidth) {
    if (Math.abs(x) > laneWidth / 2 + 2.2) return;
    if (!this._propInstances) this._propInstances = [];
    this._propInstances.push({ type, x, topY, z });
  }

  _buildBackdrop() {
    const rng = this.rng;
    const d = this.def;
    const defs = {
      tree: { geo: () => new THREE.IcosahedronGeometry(1.5, 1), color: 0x2e8b3a, trunk: true, sway: 0.05 },
      bush: { geo: () => new THREE.IcosahedronGeometry(0.55, 1), color: 0x4db358, sway: 0.07 },
      flower: { geo: () => new THREE.SphereGeometry(0.2, 6, 6), color: 0xff7ab8, sway: 0.1, stem: true },
      pine: { geo: () => new THREE.ConeGeometry(1.2, 3.2, 8), color: 0x2d6b4f, trunk: true, sway: 0.03 },
      spire: { geo: () => new THREE.ConeGeometry(0.7, 3.4, 6), color: 0x2a2226, emissive: 0x4a0e00, emissiveI: 0.35 },
      emberRock: { geo: () => new THREE.DodecahedronGeometry(0.8), color: 0x4a2a26, emissive: 0xff4400, emissiveI: 0.5 },
      iceSpike: { geo: () => new THREE.ConeGeometry(0.55, 2.6, 7), color: 0xbfe4ff, rough: 0.15, metal: 0.1 },
      cactus: { geo: () => new THREE.CapsuleGeometry(0.35, 1.5, 4, 10), color: 0x3f9a4a },
      palm: { geo: () => new THREE.ConeGeometry(1.1, 2.6, 7), color: 0x5aa54a, trunk: true, sway: 0.07 },
      rock: { geo: () => new THREE.DodecahedronGeometry(0.9), color: 0x8d8f96 },
      building: { geo: () => new THREE.BoxGeometry(1, 1, 1), color: 0x141a2c, emissive: 0xffffff, emissiveI: 0.85, emissiveMap: "windows", scaleToLane: true },
      billboard: { geo: () => new THREE.BoxGeometry(2.4, 1.4, 0.15), color: 0x2a2f44, emissive: 0xffffff, emissiveI: 1.1, emissiveMap: "windows" },
      antenna: { geo: () => new THREE.CylinderGeometry(0.08, 0.12, 5, 6), color: 0x39405c, emissive: 0xff40d0, emissiveI: 0.9 },
    };
    this.instanceGroups = {};
    const byType = {};
    for (const item of this._propInstances || []) {
      (byType[item.type] = byType[item.type] || []).push(item);
    }
    for (const type of Object.keys(byType)) {
      const cfg = defs[type];
      if (!cfg) continue;
      const items = byType[type];
      const geo = cfg.geo();
      let material;
      if (type === "building" || type === "billboard") {
        const tex = canvasTex("windows", 256, null, 0);
        material = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6, metalness: 0.3, emissive: new THREE.Color(cfg.emissive), emissiveIntensity: cfg.emissiveI, emissiveMap: tex });
      } else {
        material = mat(cfg.color, { rough: cfg.rough !== undefined ? cfg.rough : 0.8, metal: cfg.metal || 0, emissive: cfg.emissive, emissiveI: cfg.emissiveI });
      }
      if (cfg.sway) swayShader(material, this.uTime, cfg.sway);
      const scale = type === "tree" ? 1 : (type === "pine" ? 1 : 0.8);
      const im = new THREE.InstancedMesh(geo, material, items.length);
      im.castShadow = type !== "billboard";
      im.receiveShadow = false;
      const dummy = new THREE.Object3D();
      const trunkItems = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const s = 0.7 + this.rng() * 0.7;
        dummy.position.set(it.x, it.topY + (cfg.stem ? 0.55 : 0.4) * s * (type === "building" ? 0 : 1), it.z);
        if (cfg.stem) dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        if (cfg.trunk) trunkItems.push({ x: it.x, topY: it.topY, z: it.z, s });
      }
      im.instanceMatrix.needsUpdate = true;
      this.group.add(im);
      this.instanceGroups[type] = im;
      if (cfg.trunk && trunkItems.length) {
        const trunkGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.4, 7);
        const trunkMat = mat(type === "palm" ? 0x9a6a3a : 0x6b4a2a);
        const tm = new THREE.InstancedMesh(trunkGeo, trunkMat, trunkItems.length);
        tm.castShadow = true;
        const td = new THREE.Object3D();
        for (let i = 0; i < trunkItems.length; i++) {
          const it = trunkItems[i];
          td.position.set(it.x, it.topY + 0.3, it.z);
          td.scale.setScalar(it.s);
          td.updateMatrix();
          tm.setMatrixAt(i, td.matrix);
        }
        tm.instanceMatrix.needsUpdate = true;
        this.group.add(tm);
      }
    }

    if (d.id !== "city") this._buildIslands();
    if (d.id === "peaks" || d.id === "volcano" || d.id === "glacier" || d.id === "desert") this._buildDistantMountains();
    if (d.id !== "city" && d.id !== "volcano") this._buildClouds();
  }

  _buildIslands() {
    const rng = this.rng;
    const decoTypes = this.def.deco;
    for (let i = 0; i < 16; i++) {
      const side = rng() < 0.5 ? -1 : 1;
      const x = side * (16 + rng() * 30);
      const z = rng() * (this.length + 80) - 20;
      const topY = -3 + rng() * 6;
      const sx = 5 + rng() * 8;
      const sz = 5 + rng() * 8;
      const thick = this.def.water.kind === "ocean" || this.def.water.kind === "lava" ? 3 + rng() * 3 : 5;
      const mats = this._platformMaterial(this.def.top);
      const island = new THREE.Mesh(new THREE.BoxGeometry(sx, thick, sz), mats);
      island.position.set(x, topY - thick / 2, z);
      this.group.add(island);
      const nProps = 1 + Math.floor(rng() * 3);
      for (let k = 0; k < nProps; k++) {
        const type = decoTypes[(rng() * decoTypes.length) | 0];
        const px = x + (rng() - 0.5) * sx * 0.5;
        const pz = z + (rng() - 0.5) * sz * 0.5;
        this._placeStandalone(type, px, topY, pz);
      }
    }
  }

  _standaloneProps = null;

  _placeStandalone(type, x, topY, z) {
    if (!this._standaloneProps) this._standaloneProps = [];
    this._standaloneProps.push({ type, x, topY, z });
  }

  _buildStandalone() {
    if (!this._standaloneProps) return;
    const defs = {
      tree: { geo: () => new THREE.IcosahedronGeometry(1.5, 1), color: 0x2e8b3a, trunk: true, sway: 0.05 },
      bush: { geo: () => new THREE.IcosahedronGeometry(0.55, 1), color: 0x4db358, sway: 0.07 },
      flower: { geo: () => new THREE.SphereGeometry(0.2, 6, 6), color: 0xff7ab8, sway: 0.1, stem: true },
      pine: { geo: () => new THREE.ConeGeometry(1.2, 3.2, 8), color: 0x2d6b4f, trunk: true, sway: 0.03 },
      spire: { geo: () => new THREE.ConeGeometry(0.7, 3.4, 6), color: 0x2a2226, emissive: 0x4a0e00, emissiveI: 0.35 },
      emberRock: { geo: () => new THREE.DodecahedronGeometry(0.8), color: 0x4a2a26, emissive: 0xff4400, emissiveI: 0.5 },
      iceSpike: { geo: () => new THREE.ConeGeometry(0.55, 2.6, 7), color: 0xbfe4ff, rough: 0.15 },
      cactus: { geo: () => new THREE.CapsuleGeometry(0.35, 1.5, 4, 10), color: 0x3f9a4a },
      palm: { geo: () => new THREE.ConeGeometry(1.1, 2.6, 7), color: 0x5aa54a, trunk: true, sway: 0.07 },
      rock: { geo: () => new THREE.DodecahedronGeometry(0.9), color: 0x8d8f96 },
    };
    const byType = {};
    for (const item of this._standaloneProps) (byType[item.type] = byType[item.type] || []).push(item);
    for (const type of Object.keys(byType)) {
      const cfg = defs[type];
      if (!cfg) continue;
      const items = byType[type];
      const im = new THREE.InstancedMesh(cfg.geo(), cfg.sway ? swayShader(mat(cfg.color, { rough: 0.8, emissive: cfg.emissive, emissiveI: cfg.emissiveI }), this.uTime, cfg.sway) : mat(cfg.color, { rough: 0.85, emissive: cfg.emissive, emissiveI: cfg.emissiveI }), items.length);
      im.castShadow = true;
      const dummy = new THREE.Object3D();
      const trunks = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const s = 0.8 + this.rng() * 0.8;
        dummy.position.set(it.x, it.topY + 0.4 * s + (cfg.stem ? (type === "flower" ? 0.55 : 0.4) : 0), it.z);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        if (cfg.trunk) trunks.push(it);
      }
      im.instanceMatrix.needsUpdate = true;
      this.group.add(im);
      if (cfg.trunk) {
        const tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.2, 1.4, 7), mat(0x6b4a2a), trunks.length);
        tm.castShadow = true;
        const td = new THREE.Object3D();
        for (let i = 0; i < trunks.length; i++) {
          td.position.set(trunks[i].x, trunks[i].topY + 0.3, trunks[i].z);
          td.scale.setScalar(1.4);
          td.updateMatrix();
          tm.setMatrixAt(i, td.matrix);
        }
        tm.instanceMatrix.needsUpdate = true;
        this.group.add(tm);
      }
    }
  }

  _buildDistantMountains() {
    const rng = this.rng;
    const d = this.def;
    const colors = {
      peaks: [0x6b7480, 0x7e8894],
      volcano: [0x341418, 0x2a1014],
      glacier: [0xbcd8f0, 0xa8c8e8],
      desert: [0xd8b06a, 0xc89c58],
    };
    const cols = colors[d.id] || [0x777, 0x888];
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (70 + rng() * 220);
      const z = rng() * (this.length + 120) - 30;
      const h = 40 + rng() * 90;
      const w = 30 + rng() * 55;
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(w, h, 5 + ((rng() * 3) | 0)),
        mat(cols[(rng() * cols.length) | 0], { rough: 1 })
      );
      mountain.position.set(x, h / 2 - 14, z);
      mountain.rotation.y = rng() * Math.PI;
      this.group.add(mountain);
      if (d.id === "volcano" && rng() < 0.4) {
        mountain.material = mat(0x2a1014, { emissive: 0xff4400, emissiveI: 0.5 });
      }
    }
  }

  _buildClouds() {
    const rng = this.rng;
    const cmat = new THREE.SpriteMaterial({ map: texCache["cloud"], transparent: true, opacity: 0.85, depthWrite: false, fog: false });
    for (let i = 0; i < 14; i++) {
      const sprite = new THREE.Sprite(cmat.clone());
      const s = 26 + rng() * 42;
      sprite.scale.set(s, s * 0.5, 1);
      sprite.position.set((rng() - 0.5) * 260, 34 + rng() * 55, rng() * (this.length + 100) - 40);
      this.group.add(sprite);
      this.decorAnims.push({ type: "cloud", mesh: sprite, speed: 0.4 + rng() * 1 });
    }
  }

  _buildAmbientParticles() {
    const kind = this.def.particles;
    const N = this.quality === "high" ? 320 : 160;
    const positions = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    const rng = this.rng;
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (rng() - 0.5) * 60;
      positions[i * 3 + 1] = rng() * 22 - 4;
      positions[i * 3 + 2] = rng() * 1;
      seeds[i] = rng() * 100;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
    let color, size, opacity;
    if (kind === "snow") { color = 0xffffff; size = 0.14; opacity = 0.85; }
    else if (kind === "embers") { color = 0xff7a2a; size = 0.12; opacity = 0.9; }
    else if (kind === "sand") { color = 0xffd890; size = 0.08; opacity = 0.4; }
    else { color = 0xfff6c0; size = 0.09; opacity = 0.55; }
    const pmat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity, depthWrite: false,
      blending: kind === "embers" ? THREE.AdditiveBlending : THREE.NormalBlending,
      sizeAttenuation: true,
    });
    this.ambient = new THREE.Points(geo, pmat);
    this.ambient.frustumCulled = false;
    this.ambientData = { positions, seeds, N, kind };
    this.group.add(this.ambient);
  }

  updateAmbient(playerZ, t) {
    const { positions, seeds, N, kind } = this.ambientData;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const baseZ = playerZ + ((seeds[i] * 7.13) % 190) - 45;
      let x = positions[i3];
      let y = positions[i3 + 1];
      if (kind === "snow") {
        x = ((seeds[i] * 3.7) % 56) - 28 + Math.sin(t * 0.7 + seeds[i]) * 2.4;
        y = 18 - ((t * (1.4 + (seeds[i] % 1)) + seeds[i] * 3) % 26);
      } else if (kind === "embers") {
        x = ((seeds[i] * 5.1) % 50) - 25 + Math.sin(t * 1.1 + seeds[i] * 2) * 1.6;
        y = -5 + ((t * (2.2 + (seeds[i] % 1.6)) + seeds[i] * 5) % 20);
      } else if (kind === "sand") {
        x = ((seeds[i] * 4.3) % 60) - 30 + Math.sin(t * 0.25 + seeds[i]) * 4;
        y = -2 + ((seeds[i] * 1.7) % 12) + Math.sin(t * 0.5 + i) * 0.25;
      } else {
        x = ((seeds[i] * 3.3) % 44) - 22 + Math.sin(t * 0.5 + seeds[i]) * 1.2;
        y = 1 + ((seeds[i] * 2.9) % 9) + Math.sin(t * 0.8 + i) * 0.25;
      }
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = baseZ;
    }
    this.ambient.geometry.attributes.position.needsUpdate = true;
  }

  update(dt, playerZ) {
    this.time += dt;
    const t = this.time;
    this.uTime.value = t;

    for (const p of this.movers) {
      p.x = Math.sin(t * p.speed + p.phase) * p.range;
      p.mesh.position.x = p.x;
    }
    for (const s of this.sliders) {
      s.x = Math.sin(t * s.speed + s.phase) * s.range;
      s.mesh.position.x = s.x;
    }
    for (const s of this.spinners) {
      s.angle += dt * s.speed;
      s.mesh.rotation.y = s.angle;
    }
    for (const c of this.coins) {
      if (!c.taken) c.mesh.rotation.z += dt * 3.2;
    }
    for (const d of this.decorAnims) {
      if (d.type === "flag") d.mesh.position.x = d.baseX + Math.sin(t * 6 + d.mesh.position.y) * 0.25;
      else if (d.type === "cloud") d.mesh.position.x += dt * d.speed * 0.25;
    }
    if (this.finishGlow) {
      this.finishGlow.material.opacity = 0.1 + Math.abs(Math.sin(t * 2.4)) * 0.13;
    }
    if (this.lavaTex) {
      this.lavaTex.offset.set(t * 0.015, t * 0.01);
    }
    if (this.waterMesh && this.waterMesh.material && this.def.water.kind === "lava") {
      this.waterMesh.material.emissiveIntensity = 1.35 + Math.sin(t * 1.8) * 0.25;
    }
    this.updateAmbient(playerZ, t);
    this.sky.position.z = playerZ;
    this.sun.position.z = playerZ + 420;
    if (this._standaloneBuilt === undefined) {
      this._standaloneBuilt = true;
      this._buildStandalone();
    }
  }

  updateShadow(playerPos) {
    this.dir.position.set(playerPos.x - 35, playerPos.y + 55, playerPos.z - 25);
    this.dir.target.position.copy(playerPos);
    this.dir.target.updateMatrixWorld();
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
    this.group.clear();
    for (const key of this._disposables) {
    }
  }
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mkMats(topMat, sideMat) {
  return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
}

function mkRockPair(topKey, sideKey) {
  const t = canvasTex(topKey, 256, null, 0).clone();
  t.needsUpdate = true; t.repeat.set(1.4, 1.4);
  const topMat = mat(0xffffff, { map: t, rough: 0.9 });
  const sideMat = mat(0xffffff, { map: canvasTex(sideKey, 256, null, 0), rough: 0.95 });
  return mkMats(topMat, sideMat);
}

function sunDraw(c, s) {
  const g = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,240,1)");
  g.addColorStop(0.28, "rgba(255,240,180,0.95)");
  g.addColorStop(0.6, "rgba(255,200,90,0.35)");
  g.addColorStop(1, "rgba(255,180,60,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
}
