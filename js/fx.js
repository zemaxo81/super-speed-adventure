import * as THREE from "three";

const MAX_PARTICLES = 1400;

const VERT = `
attribute float aLife;
attribute float aSize;
attribute vec3 aColor;
attribute vec3 aVelocity;
varying float vLife;
varying vec3 vColor;
void main() {
  vLife = aLife;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float size = aSize * (150.0 / max(1.0, -mv.z)) * clamp(aLife, 0.0, 1.0);
  gl_PointSize = clamp(size, 0.0, 90.0);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = `
varying float vLife;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.08, d) * clamp(vLife, 0.0, 1.0);
  gl_FragColor = vec4(vColor, a);
}
`;

export class Particles {
  constructor(scene) {
    this.count = MAX_PARTICLES;
    this.cursor = 0;
    this.alive = 0;
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);
    this.lifes = new Float32Array(this.count);
    this.dampings = new Float32Array(this.count);
    this.gravities = new Float32Array(this.count);
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(this.velocities, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(this.colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(this.lifes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.geometry = geo;
  }

  spawn(x, y, z, opts = {}) {
    const n = Math.min(opts.count || 10, 220);
    for (let i = 0; i < n; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.count;
      const spread = opts.spread !== undefined ? opts.spread : 0.4;
      const i3 = idx * 3;
      this.positions[i3] = x + (Math.random() - 0.5) * spread;
      this.positions[i3 + 1] = y + (Math.random() - 0.5) * spread;
      this.positions[i3 + 2] = z + (Math.random() - 0.5) * spread;
      let vx, vy, vz;
      if (opts.velocity) {
        vx = opts.velocity.x + (Math.random() - 0.5) * (opts.variance || 2);
        vy = opts.velocity.y + (Math.random() - 0.5) * (opts.variance || 2);
        vz = opts.velocity.z + (Math.random() - 0.5) * (opts.variance || 2);
      } else {
        const s = opts.speed || 3;
        const a = Math.random() * Math.PI * 2;
        const b = Math.random() * Math.PI;
        vx = Math.cos(a) * Math.sin(b) * s;
        vy = Math.abs(Math.cos(b)) * s * 0.9 + (opts.up || 0);
        vz = Math.sin(a) * Math.sin(b) * s;
      }
      this.velocities[i3] = vx;
      this.velocities[i3 + 1] = vy;
      this.velocities[i3 + 2] = vz;
      const c = opts.color !== undefined ? new THREE.Color(opts.color) : new THREE.Color(0xffcc55);
      const v = opts.colorVariance || 0;
      if (v) { c.offsetHSL((Math.random() - 0.5) * v, 0, (Math.random() - 0.5) * v * 0.6); }
      this.colors[i3] = c.r; this.colors[i3 + 1] = c.g; this.colors[i3 + 2] = c.b;
      this.sizes[idx] = (opts.size || 0.16) * (0.6 + Math.random() * 0.8);
      this.lifes[idx] = opts.life || 1;
      this.dampings[idx] = opts.damping !== undefined ? opts.damping : 2.2;
      this.gravities[idx] = opts.gravity !== undefined ? opts.gravity : 5;
    }
  }

  update(dt) {
    const p = this.positions, v = this.velocities, l = this.lifes;
    let any = false;
    for (let i = 0; i < this.count; i++) {
      if (l[i] <= 0) continue;
      any = true;
      l[i] -= dt * 0.9;
      const i3 = i * 3;
      const damp = Math.max(0, 1 - this.dampings[i] * dt);
      v[i3] *= damp;
      v[i3 + 1] = v[i3 + 1] * damp - this.gravities[i] * dt;
      v[i3 + 2] *= damp;
      p[i3] += v[i3] * dt;
      p[i3 + 1] += v[i3 + 1] * dt;
      p[i3 + 2] += v[i3 + 2] * dt;
    }
    if (any || this._dirty) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.aVelocity.needsUpdate = true;
      this.geometry.attributes.aColor.needsUpdate = true;
      this.geometry.attributes.aSize.needsUpdate = true;
      this.geometry.attributes.aLife.needsUpdate = true;
      this._dirty = this.alive > 0;
    }
    if (any) this.alive = 1;
  }

  clear() {
    this.lifes.fill(0);
    this.alive = 0;
    this.geometry.attributes.aLife.needsUpdate = true;
  }
}
