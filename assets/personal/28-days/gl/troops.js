/* ============================================================
   The men sent to clear the ghetto, and what they brought.

   By his own report Jürgen Stroop had, on an average day, 36
   officers and 2,054 men: Waffen-SS, Order Police, Trawniki
   guards, army engineers and gunners. They came with rifles and
   submachine guns, machine guns, flame throwers, a tank and two
   armoured cars, a howitzer and three light anti aircraft guns.
   Against pistols and bottles of petrol.

   They are drawn here as the reference sheets draw them: cut
   from flat planes, in field grey, helmeted and faceless, each
   with what he carried. At the Umschlagplatz they stand along
   the lines to the wagons. In the burning streets an assault
   squad works down the houses with a flame thrower, a tank and a
   lorry behind it. On the last day they stand round Stroop.

   The street itself is dressed from the same sheets: crates,
   barrels, a hand cart, washing on a line.

   Source for the forces and their arms: the Stroop Report, May
   1943; United States Holocaust Memorial Museum.
   ============================================================ */

import * as THREE from 'three';
import { plainMaterial, woodMaterial } from './materials.js';
import { washMaterial } from './ink.js';
import { box, at, merge } from './geo.js';
import { tableau } from './figures.js';
import { rng } from './common.js';
import { PLAN } from './plan.js';

const P = PLAN;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const cyl = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg);
const lie = (r, len, seg = 8) => cyl(r, r, len, seg).rotateX(Math.PI / 2);             // lying along z
const wheel = (r, w, seg = 10) => cyl(r, r, w, seg).rotateZ(Math.PI / 2);                // on its axle
const add = (scene, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m); return m; };
const Z1 = V(0, 0, 1), q = new THREE.Quaternion();
/* a part of a weapon: made lying along +z at the origin, then pointed the way it is aimed, at a place */
const aimed = (g, pos, dir, along = 0, down = 0) => {
  g.applyQuaternion(q.setFromUnitVectors(Z1, dir));
  g.translate(pos.x + dir.x * along, pos.y + dir.y * along - down, pos.z + dir.z * along);
  return g;
};

/* ── machines. Each is built at the origin with its front to -z, in three parts: [steel, dark, cloth] ── */
function tank() {
  const a = [], d = [];
  a.push(at(box(2.5, 0.7, 5.4), 0, 0.95, 0), at(box(2.3, 0.45, 3.4), 0, 1.5, 0.3), at(box(2.3, 0.55, 1.3), 0, 1.3, -2.25, 0, 0.5));
  a.push(at(box(1.75, 0.58, 1.95), 0, 2.0, 0.0), at(box(0.95, 0.46, 0.45), 0, 1.98, -1.15), at(lie(0.075, 2.5), 0, 1.98, -2.55), at(lie(0.11, 0.3), 0, 1.98, -3.75));
  a.push(at(cyl(0.3, 0.32, 0.26, 8), 0.4, 2.4, 0.45), at(box(0.9, 0.3, 1.1), 0, 1.86, 1.6));
  for (const s of [-1, 1]) {
    d.push(at(box(0.52, 0.82, 5.8), s * 1.38, 0.47, 0));
    a.push(at(box(0.6, 0.08, 5.9), s * 1.38, 0.93, 0));                                  // the guard over the track
    for (let i = 0; i < 7; i++) d.push(at(wheel(0.3, 0.14), s * 1.66, 0.34, -2.4 + i * 0.8));
    d.push(at(wheel(0.36, 0.16), s * 1.66, 0.55, -2.85), at(wheel(0.33, 0.16), s * 1.66, 0.52, 2.85));
  }
  return [merge(a), merge(d), null];
}
function lorry() {
  const a = [], d = [], c = [];
  a.push(at(box(1.5, 0.82, 1.45), 0, 1.2, -2.3), at(box(1.95, 1.45, 1.35), 0, 1.52, -0.95), at(box(1.7, 0.2, 5.9), 0, 0.72, 0));
  a.push(at(box(2.15, 0.5, 3.4), 0, 1.08, 1.45), at(box(1.95, 0.12, 0.14), 0, 0.72, -3.1));
  d.push(at(box(1.62, 0.52, 0.05), 0, 1.86, -1.64), at(box(1.3, 0.5, 0.06), 0, 1.2, -3.04));          // the glass, the grille
  for (const s of [-1, 1]) {
    d.push(at(wheel(0.46, 0.3), s * 0.92, 0.46, -2.2), at(wheel(0.46, 0.34), s * 0.98, 0.46, 1.95));
    a.push(at(box(0.5, 0.1, 1.25), s * 0.95, 0.98, -2.2, 0, 0.12), at(cyl(0.11, 0.11, 0.1, 8).rotateX(Math.PI / 2), s * 0.62, 1.25, -3.08));
  }
  c.push(at(box(2.15, 1.25, 3.4), 0, 1.95, 1.45), at(box(1.9, 0.3, 3.2), 0, 2.68, 1.45));              // the canvas over the back
  return [merge(a), merge(d), merge(c)];
}
function flak() {
  const a = [], d = [];
  for (let i = 0; i < 3; i++) a.push(at(box(0.12, 0.1, 1.5), Math.sin(i * 2.094) * 0.7, 0.1, Math.cos(i * 2.094) * 0.7, i * 2.094));
  a.push(at(cyl(0.2, 0.3, 0.6, 8), 0, 0.45, 0), at(box(0.72, 0.5, 0.95), 0, 1.0, 0.1), at(box(1.25, 0.85, 0.05), 0, 1.22, -0.42, 0, -0.2));
  a.push(at(box(0.3, 0.06, 0.34), 0.5, 0.82, 0.55));                                                   // the layer's seat
  d.push(at(lie(0.035, 2.1), 0, 1.72, -1.2, 0, 0.48), at(lie(0.06, 0.55), 0, 1.28, -0.3, 0, 0.48), at(box(0.1, 0.3, 0.2), 0, 1.5, -0.1));
  return [merge(a), merge(d), null];
}
function mortar() {
  const d = [at(box(0.52, 0.05, 0.52), 0, 0.03, 0.12), at(cyl(0.06, 0.06, 1.1, 8), 0, 0.52, -0.2, 0, -0.55)];
  for (const s of [-1, 1]) d.push(at(cyl(0.014, 0.014, 0.8, 5), s * 0.16, 0.36, -0.56, 0, 0.25, s * 0.38));
  d.push(at(box(0.3, 0.2, 0.2), 0.5, 0.1, 0.1));                                                       // a box of bombs
  return [null, merge(d), null];
}

/* ── weapons in the hand. m: where a figure's right hand is, and the way it points (see tableau) ── */
const mp40 = (m) => [aimed(box(0.045, 0.075, 0.36), m.hand, m.aim, 0.14), aimed(lie(0.013, 0.24, 6), m.hand, m.aim, 0.44),
  aimed(box(0.03, 0.2, 0.045), m.hand, m.aim, 0.22, 0.13), aimed(box(0.02, 0.02, 0.3), m.hand, m.aim, -0.16, -0.01)];
const flameLance = (m, f) => {
  const back = V(-Math.sin(f.ry), 0, -Math.cos(f.ry));                                                 // behind him
  return [aimed(lie(0.02, 1.05, 6), m.hand, m.aim, 0.55), aimed(lie(0.035, 0.14, 6), m.hand, m.aim, 1.1),
    at(cyl(0.11, 0.11, 0.52, 8), f.x + back.x * 0.2 - back.z * 0.11, 1.26, f.z + back.z * 0.2 + back.x * 0.11),
    at(cyl(0.11, 0.11, 0.52, 8), f.x + back.x * 0.2 + back.z * 0.11, 1.26, f.z + back.z * 0.2 - back.x * 0.11),
    at(box(0.05, 0.05, 0.5), (m.hand.x + f.x) / 2, 1.05, (m.hand.z + f.z) / 2, f.ry)];                 // the hose
};
const grenade = (m) => [at(cyl(0.014, 0.014, 0.3, 6), m.hand.x, m.hand.y + 0.12, m.hand.z), at(cyl(0.036, 0.036, 0.11, 7), m.hand.x, m.hand.y + 0.32, m.hand.z)];

/* gone: the switch that empties the yard: its guards leave with the trains */
export function buildTroops(scene, gone) {
  const steel = [], dark = [], cloth = [], wood = [], arms = [];
  const park = (parts, x, z, ry) => parts.forEach((g, i) => { if (g) [steel, dark, cloth][i].push(at(g, x, 0, z, ry)); });
  const S = (pose, x, z, ry, props, outfit = 'soldier') => ({ pose, outfit, x, y: 0, z, ry, props });
  const rifle = { rifle: 'hands' };

  /* ── the Umschlagplatz: rifles along the lines, an officer, a machine gun covering the yard, a lorry ── */
  const Y = P.yard, w = [0, 1, 2, 3, 4].map((i) => Y.z1 - 9 - i * 10.4);
  const yardMat = washMaterial({ dress: 'grey' });
  yardMat.uniforms.uGone = gone;
  tableau(scene, [
    S('march', 19.4, w[0] + 2.7, Math.PI, rifle), S('stand', 17.2, w[1] - 2.8, 0, rifle), S('march', 11.6, w[2] + 2.8, Math.PI, rifle),
    S('stand', 19.6, w[3] - 2.8, 0, rifle), S('march', 12.4, w[4] + 2.8, Math.PI, rifle), S('aim', 8.9, w[1] + 2.6, Math.PI - 0.5, rifle),
    S('point', 9.6, Y.z1 - 2.6, -2.5, {}, 'officer'), S('stand', 11.0, Y.z1 - 2.2, -2.2, rifle),
    S('gunner', 21.5, Y.z1 - 3.2, 2.6, { mg: true }), S('kneel', 22.4, Y.z1 - 3.8, 2.4),
  ], yardMat);
  park(lorry(), 15.2, Y.z1 - 0.2, Math.PI / 2);

  /* ── the burning streets: an assault squad, a flame thrower, a tank and a lorry behind them ── */
  const bz = P.burn.z0 - 18;                                                                           // -664
  const squad = tableau(scene, [
    S('aim', -3.5, bz - 0.2, -Math.PI / 2 - 0.1), S('pistol', -2.6, bz + 1.5, -Math.PI / 2 + 0.25), S('thrower', -2.9, bz - 2.4, -1.25),
    S('point', -1.95, bz - 0.9, -1.95, {}, 'officer'), S('march', 2.5, bz + 3.0, Math.PI, rifle), S('aimUp', 6.4, bz - 4.2, Math.PI / 2, rifle),
    S('crew', -3.4, bz - 16.2, Math.PI + 0.3), S('kneel', -5.0, bz - 17.0, Math.PI + 0.2), S('stand', -2.4, bz - 20.6, 2.8, rifle),
  ], washMaterial({ dress: 'grey' }));
  const [flamer, gunner, thrower] = squad.marks;
  arms.push(...flameLance(flamer, flamer), ...mp40(gunner), ...grenade(thrower));
  park(tank(), 4.5, bz, 0.06);
  park(lorry(), 4.7, bz - 9.6, -0.05);
  park(flak(), -4.1, bz - 16.8, 0.5);
  park(mortar(), -3.1, bz - 20.2, 0.2);
  /* the jet of the flame thrower, toward the houses: where each tongue of it stands */
  const noz = flamer.hand.clone().addScaledVector(flamer.aim, 1.2);
  const jet = [0.5, 1.2, 2.0, 2.9, 3.8].map((d, i) => ({ pos: V(noz.x + flamer.aim.x * d, noz.y - 0.25 + d * 0.16, noz.z + flamer.aim.z * d), w: 0.5 + i * 0.3, h: 0.55 + i * 0.36 }));

  /* ── the last day: the men round Stroop, as he blows up the synagogue ── */
  const last = tableau(scene, [
    S('stand', -5.0, -782.2, -2.0, rifle), S('pistol', -2.4, -785.4, -2.2), S('watch', -5.8, -785.2, -1.9), S('march', -1.2, -781.4, -2.3, rifle),
  ], washMaterial({ dress: 'grey' }));
  arms.push(...mp40(last.marks[1]));
  park(lorry(), 8.6, -779, 0.4);

  /* ── the street, dressed: crates and barrels by the doors, a hand cart, washing on a line ── */
  const R = rng(1940);
  const clear = (x, z) => Math.abs(x) > 5.2;
  for (let z = -66; z > -142; z -= 5.2 + R() * 4) {
    const s = R() < 0.5 ? -1 : 1, x = s * (7.62 + R() * 0.1);                    // hard against the house fronts, clear of the people
    if (!clear(x, z)) continue;
    const k = R();
    if (k < 0.45) {
      wood.push(at(box(0.7, 0.5, 0.55), x, 0.25, z, R()));
      if (R() < 0.6) wood.push(at(box(0.6, 0.42, 0.5), x, 0.71, z + 0.04, R()));
      if (R() < 0.5) wood.push(at(box(0.55, 0.4, 0.5), x - s * 0.1, 0.2, z - 0.75, R()));
    } else if (k < 0.8) {
      for (let i = 0; i < 1 + Math.floor(R() * 2); i++) { wood.push(at(cyl(0.27, 0.24, 0.8, 9), x, 0.4, z - i * 0.62)); dark.push(at(cyl(0.285, 0.285, 0.05, 9), x, 0.55, z - i * 0.62)); }
    } else {
      /* a hand cart, its shafts on the ground */
      wood.push(at(box(0.8, 0.34, 1.4), x - s * 0.1, 0.62, z, s * 0.12), at(box(0.06, 0.06, 1.3), x - s * 0.1, 0.35, z + 1.1, s * 0.12, 0.32));
      for (const sx of [-1, 1]) dark.push(at(wheel(0.36, 0.05, 10), x - s * 0.1 + sx * 0.46, 0.36, z, s * 0.12));
    }
  }
  /* washing, from one side of the street to the other, high up */
  for (const z of [-84, -108, -131]) {
    const y = 6.6 + R() * 1.4;
    dark.push(at(box(15.6, 0.015, 0.015), 0, y, z));
    for (let x = -6.6; x < 6.8; x += 0.75 + R() * 0.8) if (R() < 0.75) cloth.push(at(box(0.45 + R() * 0.35, 0.55 + R() * 0.5, 0.02), x, y - 0.38, z, (R() - 0.5) * 0.3));
  }

  const grey = plainMaterial({ color: [0.085, 0.09, 0.075], rough: 0.5 });
  if (steel.length) add(scene, merge(steel), grey);
  if (dark.length) add(scene, merge(dark), plainMaterial({ color: [0.025, 0.024, 0.022], rough: 0.3 }));
  if (cloth.length) add(scene, merge(cloth), plainMaterial({ color: [0.3, 0.25, 0.17], rough: 0.9, side: THREE.DoubleSide }));
  if (wood.length) add(scene, merge(wood), woodMaterial({ tint: [0.17, 0.115, 0.07], plank: 0.14, vertical: 1 }));
  if (arms.length) add(scene, merge(arms), plainMaterial({ color: [0.02, 0.02, 0.022], rough: 0.25 }));
  return { jet };
}
