import * as THREE from "three";

const FUR = 0xff8c2e;
const FUR_DARK = 0xd9641a;
const CREAM = 0xffe9c9;
const SCARF = 0xe62e45;
const SHOE = 0x2d2a4a;

function mat(color, rough = 0.75, metal = 0, emissive = null, emissiveI = 0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveI; }
  return m;
}

export class Character {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "character";
    this._build();
    this.phase = 0;
    this._landTimer = 0;
    this._deadTimer = 0;
    this._winTimer = 0;
    this.group.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; }
    });
    this.group.scale.setScalar(1.14);
  }

  _build() {
    const furMat = mat(FUR);
    const darkMat = mat(FUR_DARK);
    const creamMat = mat(CREAM, 0.9);
    const scarfMat = mat(SCARF, 0.6);
    const shoeMat = mat(SHOE, 0.5, 0.2);
    const blackMat = mat(0x1a1626, 0.4);

    this.body = new THREE.Group();
    this.group.add(this.body);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.42, 6, 12), furMat);
    torso.position.y = 0.98;
    this.body.add(torso);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), creamMat);
    belly.scale.set(1, 1.25, 0.6);
    belly.position.set(0, 0.95, 0.2);
    this.body.add(belly);

    this.neck = new THREE.Group();
    this.neck.position.y = 1.28;
    this.body.add(this.neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 16), furMat);
    head.scale.set(1, 0.95, 0.95);
    this.head = head;
    this.neck.add(head);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), creamMat);
    muzzle.scale.set(1, 0.8, 0.85);
    muzzle.position.set(0, -0.06, 0.27);
    this.neck.add(muzzle);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blackMat);
    nose.position.set(0, -0.02, 0.42);
    this.neck.add(nose);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), mat(0xffffff, 0.25));
      eye.position.set(side * 0.13, 0.09, 0.27);
      this.neck.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), blackMat);
      pupil.position.set(side * 0.13, 0.085, 0.335);
      this.neck.add(pupil);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), mat(0xffffff, 0.1, 0));
      shine.position.set(side * 0.13 + 0.015, 0.11, 0.365);
      this.neck.add(shine);

      const ear = new THREE.Group();
      ear.position.set(side * 0.18, 0.26, 0);
      const earMesh = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 8), furMat);
      earMesh.position.y = 0.14;
      ear.add(earMesh);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), creamMat);
      inner.position.set(0, 0.12, 0.035);
      ear.add(inner);
      ear.rotation.z = -side * 0.28;
      ear.name = "ear" + side;
      this.neck.add(ear);
    }

    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.09, 8, 16), scarfMat);
    scarf.rotation.x = Math.PI / 2.2;
    scarf.position.y = 1.26;
    scarf.scale.set(1, 1, 1.25);
    this.body.add(scarf);

    this.scarfTail = new THREE.Group();
    this.scarfTail.position.set(0, 1.22, -0.26);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.05), scarfMat);
    flap.position.y = -0.2;
    this.scarfTail.add(flap);
    this.scarfFlap = flap;
    this.body.add(this.scarfTail);

    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.95, -0.28);
    const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), furMat);
    tailSeg1.rotation.x = Math.PI / 2.6;
    tailSeg1.position.set(0, 0.08, -0.18);
    this.tail.add(tailSeg1);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), creamMat);
    tailTip.position.set(0, 0.22, -0.4);
    this.tail.add(tailTip);
    this.body.add(this.tail);

    this.arms = [];
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.36, 1.12, 0);
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.34, 4, 8), furMat);
      arm.position.y = -0.26;
      shoulder.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), creamMat);
      hand.position.y = -0.5;
      shoulder.add(hand);
      this.body.add(shoulder);
      this.arms.push(shoulder);
    }

    this.legs = [];
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.16, 0.66, 0);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 4, 8), darkMat);
      leg.position.y = -0.26;
      hip.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.34), shoeMat);
      shoe.position.set(0, -0.52, 0.06);
      hip.add(shoe);
      this.body.add(hip);
      this.legs.push(hip);
    }
  }

  reset(x, y, z) {
    this.phase = 0;
    this._landTimer = 0;
    this._deadTimer = 0;
    this._winTimer = 0;
    this.group.position.set(x, y, z);
    this.group.rotation.set(0, 0, 0);
    this.body.rotation.set(0, 0, 0);
    this.body.position.set(0, 0, 0);
    this.group.visible = true;
  }

  onLand() { this._landTimer = 0.22; }

  update(dt, state) {
    const { grounded, vy, speed, mode } = state;

    if (mode === "dead") {
      this._deadTimer += dt;
      this.group.rotation.z += dt * 9;
      this.group.rotation.x += dt * 3;
      this.group.position.y += Math.sin(this._deadTimer * 10) * dt * 2;
      return;
    }
    if (this.group.rotation.z !== 0 || this.group.rotation.x !== 0) {
      this.group.rotation.set(0, 0, 0);
    }

    if (mode === "win") {
      this._winTimer += dt;
      this.group.position.y += 0;
      const hop = Math.abs(Math.sin(this._winTimer * 7));
      this.body.position.y = hop * 0.25;
      this.arms[0].rotation.x = Math.PI + Math.sin(this._winTimer * 7) * 0.4;
      this.arms[1].rotation.x = Math.PI - Math.sin(this._winTimer * 7) * 0.4;
      this.legs[0].rotation.x = 0.3;
      this.legs[1].rotation.x = -0.3;
      this.body.rotation.x = -0.08;
      this.tail.rotation.y = Math.sin(this._winTimer * 9) * 0.5;
      return;
    }

    this.phase += dt * (grounded ? (6 + speed * 0.75) : 4);
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);

    if (this._landTimer > 0) {
      this._landTimer -= dt;
      const k = this._landTimer / 0.22;
      this.body.scale.y = 1 - 0.26 * k;
      this.body.scale.x = this.body.scale.z = 1 + 0.14 * k;
    } else {
      this.body.scale.set(1, 1, 1);
    }

    if (mode === "menu") {
      const t = performance.now() * 0.001;
      this.body.position.y = Math.abs(Math.sin(t * 6)) * 0.25;
      this.body.rotation.x = 0.14;
      this.legs[0].rotation.x = s * 1.1;
      this.legs[1].rotation.x = -s * 1.1;
      this.arms[0].rotation.x = -s * 0.9;
      this.arms[1].rotation.x = s * 0.9;
      this.tail.rotation.y = Math.sin(t * 10) * 0.4;
      this.head.rotation.x = Math.sin(t * 6) * 0.05;
      return;
    }

    if (grounded) {
      const amp = Math.min(1.15, 0.55 + speed * 0.035);
      this.legs[0].rotation.x = s * amp;
      this.legs[1].rotation.x = -s * amp;
      this.arms[0].rotation.x = -s * amp * 0.8;
      this.arms[1].rotation.x = s * amp * 0.8;
      this.arms[0].rotation.z = 0.12;
      this.arms[1].rotation.z = -0.12;
      this.body.position.y = Math.abs(c) * 0.07;
      this.body.rotation.x = 0.14 + speed * 0.004;
      this.head.rotation.y = Math.sin(this.phase * 0.25) * 0.25;
      this.head.rotation.x = Math.sin(this.phase * 2) * 0.05;
    } else {
      const rising = vy > 1;
      this.legs[0].rotation.x = rising ? 0.85 : 0.45;
      this.legs[1].rotation.x = rising ? 0.65 : 0.85;
      this.arms[0].rotation.x = rising ? 0.7 : -0.5;
      this.arms[1].rotation.x = rising ? 0.7 : 0.5;
      const flail = rising ? 0 : Math.sin(this.phase * 3) * 0.5;
      this.arms[0].rotation.z = 0.5 + flail;
      this.arms[1].rotation.z = -0.5 - flail;
      this.body.rotation.x = rising ? 0.28 : -0.12;
      this.body.position.y = 0;
    }

    this.tail.rotation.y = Math.sin(this.phase * 0.9) * 0.35 * (grounded ? 1 : 1.4);
    this.tail.rotation.x = grounded ? Math.sin(this.phase * 2) * 0.25 : 0.4;
    this.scarfTail.rotation.x = 0.5 + Math.sin(this.phase * 1.3) * 0.25 - (grounded ? 0 : 0.4);
    for (const side of [-1, 1]) {
      const ear = this.head.getObjectByName("ear" + side);
      if (ear) ear.rotation.x = grounded ? Math.sin(this.phase * 2) * 0.25 : (vy > 0 ? -0.3 : 0.4);
    }
  }
}

export function buildCharacter() {
  return new Character();
}
