/* ============================================================
   The two fights, held still.

   The corner of Zamenhofa and Miła on the morning of 19 April,
   and Muranowski Square in the days after. Each is one instant,
   stopped: bottles hang in the air with the flame still on the
   rag, a muzzle flash stays lit, plaster knocked off a wall has
   not yet fallen. You walk through it.

   Nobody here has a face. Everything is placed by hand, from the
   accounts: who held the windows and roofs, where the column was
   when it was hit, what was burning.
   ============================================================ */

import * as THREE from 'three';
import { world, rng } from './common.js';
import { plainMaterial } from './materials.js';
import { washMaterial } from './ink.js';
import { box, at, merge, bottleGeometry } from './geo.js';
import { tableau } from './figures.js';
import { FireSet, SmokeSet, Fireball } from './fx.js';
import { walkers } from './walk.js';
import { PLAN } from './plan.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const add = (scene, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m); return m; };

/* ── things that stand in a street ─────────────────────────── */
function armouredCar() {
  return merge([
    at(box(2.0, 1.15, 4.3), 0, 1.25, 0),
    at(box(1.9, 0.85, 1.5), 0, 1.15, 2.5, 0, 0.5),
    at(box(1.7, 0.5, 1.0), 0, 1.65, -1.75, 0, -0.3),
    at(cyl(0.78, 0.95, 0.62, 10), 0, 2.13, -0.3),
    at(cyl(0.05, 0.05, 1.5, 6), 0, 2.2, 0.7, 0, Math.PI / 2),
    at(box(2.3, 0.08, 1.2), 0, 1.02, 1.6), at(box(2.3, 0.08, 1.2), 0, 1.02, -1.5),
    ...[-1.5, 1.6].flatMap((dz) => [-1, 1].flatMap((sx) => [
      at(cyl(0.5, 0.5, 0.3, 14), sx * 1.0, 0.5, dz, 0, 0, Math.PI / 2),
      at(cyl(0.2, 0.2, 0.34, 8), sx * 1.0, 0.5, dz, 0, 0, Math.PI / 2),
    ])),
  ]);
}
/* a small tracked carrier with a gun shield */
function carrier() {
  const parts = [
    at(box(1.5, 0.75, 3.9), 0, 0.95, 0),
    at(box(1.4, 0.6, 1.2), 0, 1.0, 2.1, 0, 0.45),
    at(box(1.7, 0.95, 0.06), 0, 1.8, -0.2, 0, -0.12),
    at(box(0.06, 0.8, 1.2), -0.82, 1.7, -0.8), at(box(0.06, 0.8, 1.2), 0.82, 1.7, -0.8),
    at(cyl(0.045, 0.045, 1.5, 6), 0, 1.75, 0.5, 0, Math.PI / 2),
  ];
  for (const sx of [-1, 1]) {
    parts.push(at(box(0.36, 0.5, 3.5), sx * 0.9, 0.4, 0));
    parts.push(at(cyl(0.33, 0.33, 0.36, 10), sx * 0.9, 0.4, 1.75, 0, 0, Math.PI / 2), at(cyl(0.33, 0.33, 0.36, 10), sx * 0.9, 0.4, -1.75, 0, 0, Math.PI / 2));
    for (let i = 0; i < 5; i++) parts.push(at(cyl(0.2, 0.2, 0.4, 8), sx * 0.9, 0.24, -1.3 + i * 0.65, 0, 0, Math.PI / 2));
    parts.push(at(box(0.5, 0.05, 3.7), sx * 0.9, 0.72, 0));
  }
  return merge(parts);
}
function fieldGun() {
  const parts = [
    at(cyl(0.075, 0.095, 2.3, 8), 0, 1.12, 0.95, 0, Math.PI / 2 - 0.2),
    at(cyl(0.13, 0.13, 0.9, 8), 0, 0.92, -0.05, 0, Math.PI / 2 - 0.2),
    at(box(1.55, 1.0, 0.05), 0, 1.05, 0.15, 0, -0.14),
    at(cyl(0.05, 0.05, 1.5, 6), 0, 0.62, 0, 0, 0, Math.PI / 2),
    at(box(0.12, 0.12, 2.5), -0.42, 0.36, -1.35, 0.17, 0.2), at(box(0.12, 0.12, 2.5), 0.42, 0.36, -1.35, -0.17, 0.2),
    at(box(0.3, 0.3, 0.08), -0.63, 0.1, -2.5), at(box(0.3, 0.3, 0.08), 0.63, 0.1, -2.5),
  ];
  for (const sx of [-1, 1]) {
    parts.push(at(new THREE.TorusGeometry(0.6, 0.05, 6, 16), sx * 0.78, 0.65, 0, Math.PI / 2));
    parts.push(at(cyl(0.1, 0.1, 0.12, 8), sx * 0.78, 0.65, 0, 0, 0, Math.PI / 2));
    for (let i = 0; i < 6; i++) parts.push(at(box(0.04, 1.16, 0.04), sx * 0.78, 0.65, 0, 0, i * Math.PI / 6));
  }
  /* shells, stood in a row behind the trail */
  for (let i = 0; i < 4; i++) parts.push(at(cyl(0.05, 0.05, 0.42, 7), -1.3 + i * 0.14, 0.21, -1.4));
  return merge(parts);
}
/* an advertising column */
export function kiosk() {
  return merge([
    at(cyl(0.72, 0.78, 0.35, 14), 0, 0.175, 0),
    at(cyl(0.66, 0.66, 2.9, 14), 0, 1.8, 0),
    at(cyl(0.78, 0.7, 0.16, 14), 0, 3.3, 0),
    at(new THREE.ConeGeometry(0.74, 0.55, 14), 0, 3.65, 0),
    at(new THREE.SphereGeometry(0.1, 8, 6), 0, 3.98, 0),
  ]);
}
/* the tall lamp standard of a Warsaw square: two arms, two hanging lamps */
export function lampStandard() {
  const parts = [at(cyl(0.09, 0.16, 9.2, 8), 0, 4.6, 0), at(cyl(0.24, 0.3, 0.8, 8), 0, 0.4, 0)];
  for (const sx of [-1, 1]) {
    const arc = new THREE.TorusGeometry(0.75, 0.035, 5, 10, Math.PI);
    parts.push(at(arc, sx * 0.75, 8.6, 0));
    parts.push(at(new THREE.SphereGeometry(0.2, 8, 6), sx * 1.5, 8.35, 0, 0, 0, 0, 1, 1.25, 1));
    parts.push(at(cyl(0.02, 0.02, 0.3, 4), sx * 1.5, 8.55, 0));
  }
  return merge(parts);
}

/* ── the instant itself ────────────────────────────────────── */
class Frozen {
  constructor(scene, lights, name) {
    this.scene = scene; this.lights = lights; this.name = name;
    this.bottles = []; this.flames = []; this.pos = []; this.col = []; this.chips = []; this.dust = [];
    this.marks = [];            // where a sound belongs
    this.lamps = [];
    this.R = rng(name.length * 977 + 5);
  }

  /* a bottle part way along its throw, with the rag alight and the path behind it still glowing */
  bottle(from, to, s, lift = 2.4) {
    const p = (k) => from.clone().lerp(to, k).add(V(0, Math.sin(k * Math.PI) * lift, 0));
    const here = p(s), ahead = p(s + 0.02);
    this.bottles.push({ pos: here, dir: ahead.clone().sub(here).normalize(), spin: this.R() * 6 });
    this.flames.push({ pos: here.clone().add(V(0, 0.05, 0)), w: 0.42, h: 0.62 });
    for (let i = 1; i <= 5; i++) {
      const k = s - i * 0.045;
      if (k < 0.02) break;
      this.flames.push({ pos: p(k), w: 0.2 - i * 0.026, h: 0.26 - i * 0.03 });
    }
    this.marks.push({ pos: here, kind: 'bottle' });
    this.lamps.push({ pos: here, base: 0.5 });
    return here;
  }

  /* petrol the moment after the glass breaks */
  splash(pos, n = 9, r = 1.3) {
    for (let i = 0; i < n; i++) {
      const a = this.R() * 6.28, d = Math.sqrt(this.R()) * r;
      this.flames.push({ pos: pos.clone().add(V(Math.cos(a) * d, this.R() * 0.5, Math.sin(a) * d)), w: 0.5 + this.R() * 0.7, h: 0.7 + this.R() * 1.3 });
    }
    this.burst(pos, V(0, 1, 0), 26, 1.7, 0.02, 0.05);
    this.marks.push({ pos, kind: 'burst' });
    this.lamps.push({ pos: pos.clone().add(V(0, 0.8, 0)), base: 1.3 });
  }

  quad(a, b, c, d, ca, cb, cc, cd) {
    this.pos.push(...a.toArray(), ...b.toArray(), ...c.toArray(), ...a.toArray(), ...c.toArray(), ...d.toArray());
    this.col.push(...ca, ...cb, ...cc, ...ca, ...cc, ...cd);
  }

  /* a shot: the flash at the muzzle, and the round on its way */
  shot(muzzle, target, { kind = 'shot', reach = 1, hit = true, flashOnly = false, flash = true } = {}) {
    const d = target.clone().sub(muzzle);
    const len = d.length() * reach; d.normalize();
    const up = Math.abs(d.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    const a = V().crossVectors(d, up).normalize(), b = V().crossVectors(d, a).normalize();
    const hot = [1.0, 0.82, 0.45, 1], warm = [1.0, 0.5, 0.14, 0.9], none = [1, 0.4, 0.1, 0];
    /* the flash: a long tongue forward, and a star around the muzzle */
    if (flash) for (const side of [a, b]) {
      const w = side.clone().multiplyScalar(0.085);
      const tip = muzzle.clone().addScaledVector(d, 0.62);
      this.quad(muzzle.clone().sub(w), muzzle.clone().add(w), tip, tip, hot, hot, none, none);
    }
    for (let i = 0; i < (flash ? 6 : 0); i++) {
      const ang = i / 6 * 6.28 + this.R();
      const r = a.clone().multiplyScalar(Math.cos(ang)).addScaledVector(b, Math.sin(ang));
      const t = V().crossVectors(d, r).multiplyScalar(0.035);
      const tip = muzzle.clone().addScaledVector(r, 0.16 + this.R() * 0.12).addScaledVector(d, 0.07);
      this.quad(muzzle.clone().sub(t), muzzle.clone().add(t), tip, tip, hot, hot, none, none);
    }
    if (flash) {
      this.marks.push({ pos: muzzle.clone(), kind });
      this.lamps.push({ pos: muzzle.clone().addScaledVector(d, 0.3), base: 0.55 });
    }
    if (flashOnly) return;
    /* the round: a streak that fades behind it */
    const head = muzzle.clone().addScaledVector(d, len * (0.35 + this.R() * 0.5));
    const tail = head.clone().addScaledVector(d, -Math.min(len * 0.3, 5.5));
    for (const side of [a, b]) {
      const w = side.clone().multiplyScalar(0.02);
      this.quad(tail.clone().sub(w), tail.clone().add(w), head.clone().add(w), head.clone().sub(w), none, none, warm, warm);
    }
    if (hit) this.burst(muzzle.clone().addScaledVector(d, len), d.clone().negate(), 9, 0.5, 0.015, 0.045);
  }

  /* what a hit knocks loose, not yet fallen */
  burst(pos, normal, n = 14, r = 0.8, s0 = 0.02, s1 = 0.08, dust = true) {
    for (let i = 0; i < n; i++) {
      const v = V(this.R() - 0.5, this.R() - 0.5, this.R() - 0.5).normalize();
      if (v.dot(normal) < 0) v.negate();
      v.lerp(normal, 0.25).normalize();
      this.chips.push({ pos: pos.clone().addScaledVector(v, 0.1 + Math.pow(this.R(), 0.7) * r), s: s0 + this.R() * (s1 - s0), rot: [this.R() * 6, this.R() * 6, this.R() * 6] });
    }
    if (dust) this.dust.push({ pos: pos.clone().addScaledVector(normal, r * 0.3), size: r * 0.7, rise: r * 0.6, n: 2 });
  }

  build(bottleGeo) {
    const { scene } = this;
    /* bottles */
    const bm = new THREE.InstancedMesh(bottleGeo, plainMaterial({ color: [0.1, 0.08, 0.04], emissive: [0.28, 0.12, 0.02] }), Math.max(1, this.bottles.length));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    this.bottles.forEach((b, i) => {
      q.setFromUnitVectors(V(0, 1, 0), b.dir).multiply(q2.setFromEuler(new THREE.Euler(b.spin, 0, 0.6)));
      m.compose(b.pos.clone().sub(V(0, 0.14, 0)), q, V(1.3, 1.3, 1.3));
      bm.setMatrixAt(i, m);
    });
    bm.count = this.bottles.length;
    /* chips of plaster and brick */
    const cm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.6, 0.8), plainMaterial({ color: this.chipColor || [0.3, 0.25, 0.2], rough: 0.5 }), Math.max(1, this.chips.length));
    this.chips.forEach((c, i) => {
      q.setFromEuler(new THREE.Euler(...c.rot));
      m.compose(c.pos, q, V(c.s, c.s, c.s));
      cm.setMatrixAt(i, m);
    });
    cm.count = this.chips.length;
    /* flashes and streaks */
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 4));
    this.uAmount = { value: 0 };
    const light = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uAmount: this.uAmount },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute vec4 aCol; varying vec4 vC; void main() { vC = aCol; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'precision highp float; varying vec4 vC; uniform float uAmount; void main() { gl_FragColor = vec4(vC.rgb * (1.2 + 2.2 * vC.a), vC.a * uAmount); }',
    }));
    light.renderOrder = 7;
    this.meshes = [bm, cm, light];
    for (const x of this.meshes) { x.frustumCulled = false; x.userData.free = true; scene.add(x); }
    this.fire = new FireSet(scene, this.lights, this.flames.length ? this.flames : [{ pos: V(0, -99, 0), w: 0.1, h: 0.1 }], {});
    this.fire.mesh.userData.free = true;
    this.smoke = new SmokeSet(scene, this.dust.length ? this.dust : [{ pos: V(0, -99, 0), size: 0.1, rise: 0.1, n: 1 }], { color: [0.42, 0.39, 0.34], seed: 9 + this.name.length, speed: 0.4, drift: [0.1, 0.05], opacity: 0.4 });
    this.smoke.mesh.userData.free = true;
    /* what the flashes light */
    this.lamps = this.lamps.map((l) => this.lights.add({ pos: l.pos, color: new THREE.Color(1.0, 0.62, 0.28), base: l.base, group: this.name, flicker: 0 }));
    this.set(0);
    return this;
  }

  set(v) {
    const on = v > 0.004;
    for (const x of this.meshes) x.visible = on;
    this.uAmount.value = v;
    this.fire.amount = v;
    this.smoke.amount = v;
    this.lights.set(this.name, v);
  }
}

/* nearest window bay of a house front to a point on the ground */
const bayNear = (fac, x, z) => {
  let best = 0, bd = 1e9;
  for (let b = 0; b < fac.bays; b++) {
    const p = fac.floor(b, 0);
    const d = Math.hypot(p[0] - x, p[2] - z);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
};

/* ── Zamenhofa and Miła, 19 April ──────────────────────────── */
function buildMila(scene, lights, S, bottleGeo) {
  const { H, corners } = S;
  const { ne, nw, se, sw } = corners;
  const zc = PLAN.mila.z;
  const carAt = V(1.6, 0, zc - 0.5), carrierAt = V(-1.7, 0, zc - 19);
  const iron = plainMaterial({ color: [0.04, 0.042, 0.036], rough: 0.4 });
  add(scene, at(armouredCar(), carAt.x, 0, carAt.z, 0.22, 0, 0.03), iron);
  add(scene, at(carrier(), carrierAt.x, 0, carrierAt.z, -0.16), iron);
  add(scene, at(kiosk(), -5.5, 0, zc + 14.2), plainMaterial({ color: [0.2, 0.18, 0.15], rough: 0.5 }));

  /* the fighters: on the balconies, at the windows, on a roof, in a gateway */
  const F = [];
  const onBalcony = (fac, x, z, f, pose, outfit, props, tx, tz, along = 0) => {
    const b = H.balconyAt(fac, bayNear(fac, x, z), f);
    const p = b.stand(0.46, along);
    F.push({ pose, outfit, props, x: p[0], y: p[1], z: p[2], ry: face(p[0], p[2], tx, tz) });
    return F.length - 1;
  };
  const atWindow = (fac, x, z, f, pose, outfit, props, tx, tz) => {
    const p = fac.sill(bayNear(fac, x, z), f, -0.08);
    F.push({ pose, outfit, props: { ...props, half: true }, x: p[0], y: p[1] - 0.16, z: p[2], ry: face(p[0], p[2], tx, tz) });
    return F.length - 1;
  };
  const A = onBalcony(nw.zam, -8, zc + 10.5, 0, 'throwDn', 'fighter', { bottle: true }, carAt.x, carAt.z);
  const B = onBalcony(nw.zam, -8, zc + 15.5, 1, 'pistolDn', 'fighterB', { pistol: true }, -1, zc - 1);
  const C = onBalcony(nw.front, -11, zc + 7, 0, 'aimDn', 'fighter', { rifle: 'hands' }, -3, zc - 4);
  const D = onBalcony(ne.zam, 8, zc + 11.5, 1, 'throwDn', 'fighterW', { bottle: true }, carAt.x, carAt.z);
  const E = atWindow(ne.zam, 8, zc + 16, 0, 'pistolDn', 'fighter', { pistol: true }, 3, zc - 2);
  const G = onBalcony(sw.zam, -8, zc - 11, 0, 'throwDn', 'fighterB', { bottle: true }, carrierAt.x, carrierAt.z);
  const Hh = atWindow(sw.zam, -8, zc - 16, 1, 'aimDn', 'fighter', { rifle: 'hands' }, -3.6, zc - 17);
  const I = onBalcony(se.zam, 8, zc - 12, 1, 'pistolDn', 'fighterW', { pistol: true }, 2, zc - 10);
  const J = onBalcony(se.front, 11.5, zc - 7, 0, 'throwDn', 'fighter', { bottle: true }, 3, zc - 4);
  atWindow(se.zam, 8, zc - 17.5, 0, 'pistolDn', 'fighterB', { pistol: true }, 2, zc - 14);
  atWindow(nw.zam, -8, zc + 12.5, 2, 'watch', 'fighterW', {}, 0, zc);
  /* on the roof at the corner */
  const rp = V3(ne.roofAt(ne.W / 2 - 1.6, -1.1));
  F.push({ pose: 'thrower', outfit: 'fighter', props: { bottle: true }, x: rp.x, y: rp.y, z: rp.z, ry: face(rp.x, rp.z, carAt.x, carAt.z) });
  const K = F.length - 1;
  const rp2 = V3(ne.roofAt(ne.W / 2 - 4.2, -1.3));
  F.push({ pose: 'raise', outfit: 'fighterB', props: {}, x: rp2.x, y: rp2.y, z: rp2.z, ry: face(rp2.x, rp2.z, 0, zc) });
  /* at street level */
  F.push({ pose: 'pistol', outfit: 'fighter', props: { pistol: true }, x: -7.25, z: zc + 24, ry: face(-7.25, zc + 24, -1, zc - 2) });
  const L = F.length - 1;
  F.push({ pose: 'aim', outfit: 'fighterB', props: { rifle: 'hands' }, x: 7.2, z: zc + 26.5, ry: face(7.2, zc + 26.5, 3, zc - 2) });
  const M = F.length - 1;
  F.push({ pose: 'kneel', outfit: 'fighter', props: { rifle: 'hands' }, x: -5.7, z: zc + 15.3, ry: face(-5.7, zc + 15.3, -2.6, zc - 2) });
  const N = F.length - 1;
  const fighters = tableau(scene, F);

  /* the column, caught in the crossing */
  const Sd = [];
  const so = (pose, x, z, tx, tz, props = { rifle: 'hands' }, outfit = 'soldier') => { Sd.push({ pose, outfit, props, x, z, ry: face(x, z, tx, tz) }); return Sd.length - 1; };
  so('recoil', -2.5, zc + 0.9, carAt.x, carAt.z, { rifle: 'slung' });
  so('duck', 3.9, zc - 1.6, 8, zc + 8, { rifle: 'slung' });
  const s1 = so('kneelUp', -2.9, zc - 2.3, -8, zc + 10.5);
  const s2 = so('kneelUp', 4.5, zc - 4.6, 8, zc + 11.5);
  const s3 = so('aimUp', -4.8, zc - 6.6, -8, zc + 15);
  so('duck', -7.1, zc - 8.2, -8, zc - 20, { rifle: 'slung' });
  so('run', 5.9, zc - 10, 5.4, zc - 40, { rifle: 'slung' });
  so('run', -5.7, zc - 13.5, -5.2, zc - 40, { rifle: 'slung' });
  so('runGun', 2.3, zc - 14.5, 3, zc - 40);
  so('runGun', 6.3, zc - 5.5, 9, zc - 6);
  so('back', 1.7, zc - 7.7, 0, zc + 10, { rifle: 'slung' });
  so('back', -2.0, zc - 10.6, -4, zc + 6, { rifle: 'slung' });
  so('point', -4.1, zc - 16.6, -8, zc + 4, {}, 'officer');
  so('recoil', 0.7, zc - 17.6, carrierAt.x, carrierAt.z, { rifle: 'slung' });
  so('duck', -4.0, zc - 21.5, -1.7, zc - 19, { rifle: 'slung' });
  const s4 = so('aimUp', 3.4, zc - 20.5, 8, zc - 12);
  so('kneel', 1.4, zc - 24, 0, zc);
  so('march', 0.6, zc - 27.5, 0.6, zc);
  so('back', 2.7, zc - 29, 2.7, zc + 5, { rifle: 'slung' });
  so('stand', 1.6, zc - 31.5, 1, zc, { rifle: 'slung' });
  so('march', 3.7, zc - 32.5, 3.5, zc);
  const soldiers = tableau(scene, Sd, washMaterial({ dress: 'grey' }));

  /* the instant */
  const Z = new Frozen(scene, lights, 'mila');
  const fm = fighters.marks, sm = soldiers.marks;
  Z.bottle(fm[A].hand, V(carAt.x, 1.9, carAt.z + 0.2), 0.6, 2.0);
  Z.bottle(fm[D].hand, V(1.0, 0.2, zc + 2.8), 0.42, 2.6);
  Z.bottle(fm[J].hand, V(3.2, 0.2, zc - 4.2), 0.74, 1.6);
  Z.bottle(fm[K].hand, V(carAt.x + 0.4, 1.6, carAt.z - 1), 0.3, 4.5);
  Z.splash(V(carrierAt.x + 2.3, 0.1, carrierAt.z + 2.4));
  Z.shot(fm[B].muzzle, V(-2.5, 1.2, zc + 0.9), { hit: false, reach: 0.9 });
  Z.shot(fm[C].muzzle, V(-2.9, 0.1, zc - 2.0));
  Z.shot(fm[E].muzzle, V(3.9, 0.05, zc - 1.2));
  Z.shot(fm[Hh].muzzle, V(-4.1, 0.05, zc - 16.2));
  Z.shot(fm[I].muzzle, V(2.6, 0.05, zc - 14.2));
  Z.shot(fm[L].muzzle, V(-2.4, 1.3, zc + 0.8), { hit: false, reach: 0.8 });
  Z.shot(fm[M].muzzle, V(carAt.x + 0.8, 1.4, carAt.z + 1.4));
  Z.shot(fm[N].muzzle, V(-2.9, 0.9, zc - 2.3), { hit: false, reach: 0.7 });
  /* fire coming back up at the balconies */
  Z.shot(sm[s1].muzzle, fm[A].hand.clone().add(V(-0.5, 0.9, 0.8)));
  Z.shot(sm[s2].muzzle, fm[D].hand.clone().add(V(0.5, 1.1, -0.9)));
  Z.shot(sm[s3].muzzle, fm[B].hand.clone().add(V(-0.5, 0.6, -1.0)));
  Z.shot(sm[s4].muzzle, fm[I].hand.clone().add(V(0.5, 0.8, 0.9)));
  /* a window gone, the glass still in the air */
  const wp = V3(ne.zam.sill(bayNear(ne.zam, 8, zc + 8.5), 1, 0.1));
  Z.burst(wp.clone().add(V(0, 0.9, 0)), V(-1, -0.2, 0), 40, 1.9, 0.012, 0.04, false);
  Z.build(bottleGeo);

  /* what is burning when you arrive, and where bottles keep landing until time stops */
  const fires = [{ pos: V(carAt.x, 0.9, carAt.z), w: 2.8, h: 3.4 }];
  const Rr = rng(77);
  for (let i = 0; i < 7; i++) fires.push({ pos: V((Rr() - 0.5) * 8, 0, zc + 4 - Rr() * 24), w: 1.2 + Rr() * 1.2, h: 1.4 + Rr() * 1.6 });
  const throwers = [A, D, G, J, K].map((i) => ({ x: fm[i].hand.x, y: fm[i].hand.y - 1.7, z: fm[i].hand.z }));

  return { frozen: Z, fires, throwers, carAt, fighters, soldiers, roof: rp };
}

/* ── Muranowski Square ─────────────────────────────────────── */
function buildSquare(scene, lights, S, bottleGeo) {
  const { H, flagHouse: fh } = S;
  const sq = PLAN.square;
  const cz = (sq.z0 + sq.z1) / 2;
  const iron = plainMaterial({ color: [0.04, 0.042, 0.036], rough: 0.4 });
  const gunAt = V(20, 0, cz - 13.5);
  const target = V3(fh.front.floor(bayNear(fh.front, -40, cz - 4), 3, 0)).add(V(0, 1.4, 0));
  const gunRy = face(gunAt.x, gunAt.z, target.x, target.z);
  add(scene, at(fieldGun(), gunAt.x, 0, gunAt.z, gunRy), iron);
  add(scene, at(armouredCar(), 13, 0, cz + 14, -Math.PI / 2 + 0.3), iron);
  add(scene, at(kiosk(), 3.2, 0, cz - 12.5), plainMaterial({ color: [0.2, 0.18, 0.15], rough: 0.5 }));
  add(scene, at(lampStandard(), 0, 0, cz), plainMaterial({ color: [0.045, 0.045, 0.042], rough: 0.3 }));

  /* the ŻZW: on the roof with the flags, at the windows, on the balconies */
  const F = [];
  const roof = (lx, lz, pose, outfit, props, tx, tz) => {
    const p = fh.roofAt(lx, lz);
    F.push({ pose, outfit, props, x: p[0], y: p[1], z: p[2], ry: face(p[0], p[2], tx, tz) });
    return F.length - 1;
  };
  const G1 = roof(2.2, -0.95, 'gunner', 'fighter', { mg: true }, 6, cz + 4);
  const G2 = roof(-4.6, -0.95, 'kneel', 'fighterB', { rifle: 'hands' }, 12, cz - 8);
  const G3 = roof(6.8, -1.0, 'aimDn', 'fighter', { rifle: 'hands' }, 9, cz + 12);
  roof(-0.3, -2.2, 'raise', 'fighterB', {}, 10, cz);
  roof(-8.2, -1.6, 'watch', 'fighterW', {}, 10, cz - 10);
  roof(3.6, -2.4, 'crew', 'fighter', {}, 6, cz + 4);
  const win = (z, f, pose, outfit, props, tx, tz) => {
    const p = fh.front.sill(bayNear(fh.front, -40, z), f, -0.08);
    F.push({ pose, outfit, props: { ...props, half: true }, x: p[0], y: p[1] - 0.16, z: p[2], ry: face(p[0], p[2], tx, tz) });
    return F.length - 1;
  };
  const W1 = win(cz + 6.5, 1, 'aimDn', 'fighter', { rifle: 'hands' }, 4, cz + 12);
  const W2 = win(cz - 1.5, 2, 'pistolDn', 'fighterB', { pistol: true }, 8, cz - 6);
  const W3 = win(cz - 7.5, 0, 'aimDn', 'fighterW', { rifle: 'hands' }, 6, cz - 14);
  const W4 = win(cz + 3, 3, 'pistolDn', 'fighter', { pistol: true }, 12, cz + 6);
  const bal = H.balconyAt(fh.front, bayNear(fh.front, -40, cz + 8.5), 0);
  const bp = bal.stand(0.46);
  F.push({ pose: 'throwDn', outfit: 'fighter', props: { bottle: true }, x: bp[0], y: bp[1], z: bp[2], ry: face(bp[0], bp[2], -18, cz + 10) });
  const T1 = F.length - 1;
  const fighters = tableau(scene, F);

  /* the attack across the square */
  const Sd = [];
  const so = (pose, x, z, tx, tz, props = { rifle: 'hands' }, outfit = 'soldier') => { Sd.push({ pose, outfit, props, x, z, ry: face(x, z, tx, tz) }); return Sd.length - 1; };
  const back = V(-Math.sin(gunRy), 0, -Math.cos(gunRy)), side = V(Math.cos(gunRy), 0, -Math.sin(gunRy));
  const by = (b, s) => gunAt.clone().addScaledVector(back, b).addScaledVector(side, s);
  let p = by(0.9, -0.95); so('crew', p.x, p.z, target.x, target.z, {});
  p = by(1.6, 0.9); so('kneel', p.x, p.z, target.x, target.z, {});
  p = by(3.4, -1.9); so('point', p.x, p.z, target.x, target.z, {}, 'officer');
  p = by(2.8, 1.9); so('duck', p.x, p.z, target.x, target.z, { rifle: 'slung' });
  const a1 = so('kneelUp', 6.5, cz + 5, -40, cz + 2);
  const a2 = so('aimUp', 11.5, cz - 4.5, -40, cz - 4);
  const a3 = so('kneelUp', 4.4, cz - 11.6, -40, cz - 6);
  so('duck', 4.9, cz - 13.4, -40, cz, { rifle: 'slung' });
  so('runGun', -4, cz + 9.5, -30, cz + 8);
  so('runGun', 1.5, cz + 15.5, -30, cz + 12);
  so('run', -9.5, cz - 4.5, 12, cz - 9, { rifle: 'slung' });
  so('recoil', -13, cz + 4.5, -40, cz + 3, { rifle: 'slung' });
  so('duck', -7.5, cz + 1.8, -40, cz, { rifle: 'slung' });
  so('back', 8.5, cz + 11, -40, cz + 8, { rifle: 'slung' });
  const a4 = so('aim', 15.2, cz + 12.6, -40, cz + 6);
  so('kneel', 10.9, cz + 16.2, -40, cz + 8);
  const soldiers = tableau(scene, Sd, washMaterial({ dress: 'grey' }));

  const Z = new Frozen(scene, lights, 'square');
  const fm = fighters.marks, sm = soldiers.marks;
  /* the machine gun: a line of rounds walking across the cobbles */
  for (let i = 0; i < 6; i++) {
    const hitAt = V(-8 + i * 3.1, 0.04, cz + 3.2 + Math.sin(i * 1.7) * 0.9);
    Z.shot(fm[G1].muzzle, hitAt, { kind: 'mg', flash: i === 0 });
  }
  Z.shot(fm[G2].muzzle, V(4.4, 0.9, cz - 11.6));
  Z.shot(fm[G3].muzzle, V(1.5, 0.05, cz + 15));
  Z.shot(fm[W1].muzzle, V(-4, 0.05, cz + 9.2));
  Z.shot(fm[W2].muzzle, V(-9.5, 0.05, cz - 4.3), { hit: true });
  Z.shot(fm[W3].muzzle, V(3.2, 2.0, cz - 12.4));
  Z.shot(fm[W4].muzzle, V(6.5, 0.05, cz + 5.6));
  Z.bottle(fm[T1].hand, V(-13, 0.3, cz + 4.6), 0.55, 2.2);
  /* the answer */
  Z.shot(sm[a1].muzzle, fm[W1].hand.clone().add(V(0.2, 0.7, 0.9)));
  Z.shot(sm[a2].muzzle, fm[G1].hand.clone().add(V(0.4, -0.5, 1.1)));
  Z.shot(sm[a3].muzzle, fm[W2].hand.clone().add(V(0.2, 0.6, -0.9)));
  Z.shot(sm[a4].muzzle, fm[G3].hand.clone().add(V(0.4, -0.6, -1.0)));
  /* the gun has just fired: the shell is in the wall and the wall is in the air */
  const muzzle = gunAt.clone().add(V(Math.sin(gunRy) * 2.1, 1.5, Math.cos(gunRy) * 2.1));
  Z.shot(muzzle, target, { kind: 'gun', hit: false, reach: 0.4 });
  Z.burst(target, V(1, 0.15, 0), 120, 5.5, 0.05, 0.3, false);
  Z.dust.push({ pos: target.clone().add(V(1.6, 0.5, 0)), size: 4.2, rise: 3.5, n: 7 }, { pos: muzzle.clone(), size: 1.4, rise: 1.0, n: 4 });
  Z.marks.push({ pos: target.clone(), kind: 'shell' });
  Z.lamps.push({ pos: target.clone().add(V(2.2, 0, 0)), base: 1.5 });
  Z.build(bottleGeo);

  const fires = [{ pos: V(13, 0.9, cz + 14), w: 2.4, h: 2.8 }];
  return { frozen: Z, fires, gunAt, target, fighters, soldiers };
}

/* ── Świętojerska, the brushmakers' block, 20 April, three in the afternoon ──
   Stroop's men come in along the street. The mine under the street goes off among them: the
   instant is held with the fire at its biggest, the cobbles and brick in the air, the men thrown,
   and the fighters at the windows above already firing down. */
function buildBrush(scene, lights, S, bottleGeo) {
  const { H } = S;
  const B = PLAN.brush;
  const blast = V3(B.blast);
  const houses = (side) => H.list.filter((r) => Math.sign(r.x) === side && Math.abs(Math.abs(r.x) - PLAN.half) < 0.8 && r.z < B.z0 - 2 && r.z > B.z1 + 2);
  const left = houses(-1), right = houses(1);
  const houseAt = (list, z) => list.reduce((a, r) => (Math.abs(r.z - z) < Math.abs(a.z - z) ? r : a), list[0]);
  const F = [];
  const atWindow = (side, z, f, pose, outfit, props, tx, tz) => {
    const rec = houseAt(side < 0 ? left : right, z);
    const fac = rec.front;
    const p = fac.sill(bayNear(fac, side * PLAN.half, z), Math.min(f, fac.nf - 1), -0.08);
    F.push({ pose, outfit, props: { ...props, half: true }, x: p[0], y: p[1] - 0.16, z: p[2], ry: face(p[0], p[2], tx, tz) });
    return F.length - 1;
  };
  const W1 = atWindow(1, -621, 1, 'throwDn', 'fighter', { bottle: true }, 0.5, -618);
  const W2 = atWindow(1, -628, 2, 'pistolDn', 'fighterB', { pistol: true }, -0.5, -617);
  const W3 = atWindow(1, -633, 1, 'aimDn', 'fighter', { rifle: 'hands' }, -1.2, -616);
  const W4 = atWindow(-1, -623, 1, 'pistolDn', 'fighterW', { pistol: true }, 1.5, -619);
  const W5 = atWindow(-1, -630, 2, 'throwDn', 'fighter', { bottle: true }, 1.2, -616);
  const W6 = atWindow(-1, -618, 3, 'aimDn', 'fighterB', { rifle: 'hands' }, 1.8, -612);
  atWindow(-1, -634, 1, 'watch', 'fighterW', {}, 2, -624);
  atWindow(1, -615, 2, 'pistolDn', 'fighter', { pistol: true }, -1, -612);
  /* one on the roof of the workshop, with a bottle */
  const rr = houseAt(right, -626);
  const rp = V3(rr.roofAt(-1.2, -1.2));
  F.push({ pose: 'thrower', outfit: 'fighter', props: { bottle: true }, x: rp.x, y: rp.y, z: rp.z, ry: face(rp.x, rp.z, 0, -616) });
  const RF = F.length - 1;
  const fighters = tableau(scene, F);

  /* the men in the street: thrown by it, caught near it, and the column behind still coming */
  const Sd = [];
  const so = (pose, x, z, tx, tz, props = { rifle: 'slung' }, outfit = 'soldier') => { Sd.push({ pose, outfit, props, x, z, ry: face(x, z, tx, tz) }); return Sd.length - 1; };
  so('recoil', -0.7, -624.6, blast.x, blast.z);
  so('back', 4.7, -623.9, blast.x, blast.z);
  so('duck', -0.9, -627.6, blast.x, blast.z);
  so('recoil', 5.2, -629.8, blast.x, blast.z);
  so('duck', 2.0, -620.4, blast.x, blast.z);
  so('run', -1.6, -621.8, -1.0, -600);
  so('run', 3.9, -619.6, 4.5, -600);
  const s1 = so('kneelUp', -2.6, -617.6, 7.6, -628, { rifle: 'hands' });
  const s2 = so('aimUp', 1.4, -615.4, -7.6, -628, { rifle: 'hands' });
  so('point', -1.2, -613.2, 3, -626, {}, 'officer');
  so('kneel', 3.4, -614.8, 3, -626, { rifle: 'hands' });
  const soldiers = tableau(scene, Sd, washMaterial({ dress: 'grey' }));
  /* and the column marching in behind them: it walks until time stops, mid stride */
  const col = [];
  for (let i = 0; i < 12; i++) col.push({ kind: 'soldier', x: i % 2 ? 3.6 : -3.3, z: -611 - Math.floor(i / 2) * 1.1, ry: Math.PI, len: 9, ph: (i % 2) * 0.5 + Math.floor(i / 2) * 0.13 });
  const column = walkers(scene, col, { dress: 'grey', seed: 21 });

  /* the instant */
  const Z = new Frozen(scene, lights, 'brush');
  Z.chipColor = [0.13, 0.085, 0.06];
  const fm = fighters.marks, sm = soldiers.marks;
  const R = rng(2004);
  /* the street itself thrown up: cobbles, brick, iron, and dust going out in a ring */
  for (let i = 0; i < 260; i++) {
    const a = R() * Math.PI * 2, up = Math.pow(R(), 0.6);
    const v = V(Math.cos(a) * (1 - up * 0.7), 0.25 + up * 1.1, Math.sin(a) * (1 - up * 0.7)).normalize();
    const d = 1.2 + Math.pow(R(), 0.8) * 7.5;
    Z.chips.push({ pos: blast.clone().add(V(0, -1.4, 0)).addScaledVector(v, d), s: 0.05 + R() * R() * 0.32, rot: [R() * 6, R() * 6, R() * 6] });
  }
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    Z.dust.push({ pos: blast.clone().add(V(Math.cos(a) * 4.2, -1.2, Math.sin(a) * 4.2)), size: 2.6, rise: 1.6, n: 3 });
  }
  Z.dust.push({ pos: blast.clone().add(V(0, 2.5, 0)), size: 4.5, rise: 6, n: 5 });
  /* flames still on what was thrown */
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.28, d = 2 + R() * 3;
    Z.flames.push({ pos: blast.clone().add(V(Math.cos(a) * d, -1.5 + R() * 1.2, Math.sin(a) * d)), w: 0.5 + R() * 0.8, h: 0.6 + R() * 1.2 });
  }
  /* glass out of the windows nearest it */
  for (const [side, z, f] of [[1, -625, 1], [1, -628, 0], [-1, -627, 1], [1, -623, 2]]) {
    const rec = houseAt(side < 0 ? left : right, z);
    const p = V3(rec.front.sill(bayNear(rec.front, side * PLAN.half, z), f, 0.1)).add(V(0, 0.9, 0));
    Z.burst(p, V(-side, -0.1, 0), 30, 1.6, 0.012, 0.04, false);
  }
  /* the fighters' fire, and the answer from the street */
  Z.bottle(fm[W1].hand, V(0.4, 0.2, -617.5), 0.55, 1.4);
  Z.bottle(fm[W5].hand, V(1.0, 0.2, -616), 0.4, 1.8);
  Z.bottle(fm[RF].hand, V(0.2, 0.2, -615.5), 0.32, 3.2);
  Z.shot(fm[W2].muzzle, V(-0.4, 1.0, -616.8));
  Z.shot(fm[W3].muzzle, V(-1.0, 0.1, -615.6));
  Z.shot(fm[W4].muzzle, V(1.6, 0.9, -618.8), { hit: false, reach: 0.85 });
  Z.shot(fm[W6].muzzle, V(1.8, 0.05, -612.4));
  Z.shot(sm[s1].muzzle, fm[W3].hand.clone().add(V(0.5, 0.7, 0.8)));
  Z.shot(sm[s2].muzzle, fm[W5].hand.clone().add(V(-0.5, 0.8, 0.9)));
  Z.marks.push({ pos: blast.clone(), kind: 'shell' });
  Z.lamps.push({ pos: blast.clone().add(V(0, 0.4, 0)), base: 3.2 }, { pos: blast.clone().add(V(-3.5, 1.5, 2)), base: 1.4 });
  Z.build(bottleGeo);
  const ball = new Fireball(scene, { pos: blast, r: 3.6, seed: 4.2 });

  /* what is alight in the houses that afternoon */
  const fires = [];
  for (const [side, z, f] of [[-1, -611, 3], [1, -637, 2], [-1, -640, 1]]) {
    const rec = houseAt(side < 0 ? left : right, z);
    const p = V3(rec.front.sill(bayNear(rec.front, side * PLAN.half, z), f, -0.3));
    fires.push({ pos: p.add(V(0, 0.2, 0)), w: 1.4, h: 1.8 });
  }
  return { frozen: Z, ball, fires, fighters, soldiers, column, blast };
}

/* ── the assault squad of the photograph, in the burning street ── */
function buildSquad(scene) {
  const z = PLAN.burn.z0 - 55;
  const Sd = [
    { pose: 'march', outfit: 'soldier', props: { rifle: 'hands' }, x: 2.7, z: z + 0.4, ry: 0.25 },
    { pose: 'walkB', outfit: 'soldier', props: { rifle: 'slung' }, x: 3.8, z: z - 0.5, ry: 0.2 },
    { pose: 'walkA', outfit: 'soldier', props: { rifle: 'slung' }, x: 5.2, z: z + 0.9, ry: 0.3 },
    { pose: 'march', outfit: 'soldier', props: { rifle: 'hands' }, x: 6.3, z: z - 0.2, ry: 0.22 },
  ];
  return tableau(scene, Sd, washMaterial({ dress: 'grey' }));
}

export function buildCombat(scene, lights, S) {
  const bottleGeo = bottleGeometry();
  const mila = buildMila(scene, lights, S, bottleGeo);
  const square = buildSquare(scene, lights, S, bottleGeo);
  const brush = buildBrush(scene, lights, S, bottleGeo);
  const squad = buildSquad(scene);
  return { mila, square, brush, squad };
}
