/* ============================================================
   People.

   Nobody here is a character and nobody has an invented face.
   What a photograph keeps of someone at a distance is the outline:
   the set of the shoulders, a cap, a long coat, a child's height,
   the way a body leans when it runs. So that is what is modelled,
   and it is drawn in the hand of the book: washes and a pen line
   (see ink.js).

   Each figure is a small skeleton (hips, spine, two legs, two
   arms, a head) posed by angles, then dressed: a coat, a hat, and
   whatever is in the hands. One pose is one line in POSES.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './common.js';
import { blobMaterial } from './materials.js';
import { washMaterial, lineMaterial, QUALITY } from './ink.js';
import { starOnBand, noStar } from './star.js';
import { garment, lapel } from './garment.js';

const R = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

/* A limb's direction. a: swung forward from hanging straight down. b: lifted out to the side. */
const dir = (a, b, side) => V(side * Math.sin(b * R), -Math.cos(a * R) * Math.cos(b * R), Math.sin(a * R) * Math.cos(b * R));

function clean(g) {
  const n = g.index ? g.toNonIndexed() : g;
  if (!g.userData.smoothSkin) n.computeVertexNormals(); // Keep cloth faceted; skin retains interpolated normals.
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
  return n;
}
const q = new THREE.Quaternion();
/* a tapered tube from p0 to p1 */
function limb(p0, p1, r0, r1, seg = 6) {
  const d = p1.clone().sub(p0), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, Math.min(Math.max(seg, 8), 12), 3, false);
  // Elbow gathers and long fabric creases remain actual geometry at grazing angles.
  if (r0 > .035) {
    const p = g.attributes.position;
    for (let i=0;i<p.count;i++) {
      const a=Math.atan2(p.getZ(i),p.getX(i)), t=p.getY(i)/len+.5;
      const fold=1+.055*Math.sin(a*5+t*2)+.035*Math.cos(t*19+a*2);
      p.setXYZ(i,p.getX(i)*fold,p.getY(i),p.getZ(i)*fold);
    }
    g.computeVertexNormals();
  }
  g.applyQuaternion(q.setFromUnitVectors(UP, d.normalize()));
  g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  return g;
}
function ball(p, r, s = [1, 1, 1], rot = null, w = 7, h = 4) {
  const g = new THREE.SphereGeometry(r, Math.min(Math.max(w, 8), 12), Math.min(Math.max(h, 5), 8));
  g.scale(s[0], s[1], s[2]);
  if (rot) g.applyQuaternion(rot);
  g.translate(p.x, p.y, p.z);
  return g;
}
/* the peak of a cap: half a thin disc, pointing forward */
function peak(p, r, rot = null) {
  const g = new THREE.CylinderGeometry(r, r, 0.012, 12, 1, false, -Math.PI / 2, Math.PI);
  if (rot) g.applyQuaternion(rot);
  g.translate(p.x, p.y, p.z);
  return g;
}
function block(p, sx, sy, sz, rot = null) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (rot) g.applyQuaternion(rot);
  g.translate(p.x, p.y, p.z);
  return g;
}
function tube(p, rt, rb, h, rot = null, s = [1, 1, 1], seg = 14, open = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
  g.scale(s[0], s[1], s[2]);
  if (rot) g.applyQuaternion(rot);
  g.translate(p.x, p.y, p.z);
  return g;
}

/* ── poses ─────────────────────────────────────────────────────
   leg: [thigh forward, thigh out, shin forward]
   arm: [upper forward, upper out, forearm forward, forearm out]
   lean: the spine tipped forward. twist: the shoulders turned. head: [nod, turn]
   ──────────────────────────────────────────────────────────── */
export const POSES = {
  stand:     { legL: [3, 4, 1], legR: [-2, 4, -3], armL: [4, 8, 10, 6], armR: [-3, 8, 6, 6], lean: 2 },
  pockets:   { legL: [2, 5, 0], legR: [-4, 6, -6], armL: [10, 12, 38, -4], armR: [10, 12, 38, -4], lean: 4, head: [8, 0] },
  cold:      { legL: [2, 3, 0], legR: [-1, 3, -2], armL: [28, 6, 84, -42], armR: [24, 6, 78, -42], lean: 9, head: [14, 0] },
  stoop:     { legL: [6, 4, -4], legR: [-3, 4, -10], armL: [16, 6, 24, 4], armR: [20, 8, 52, 2], lean: 21, head: [16, 0] },
  look:      { legL: [3, 5, 1], legR: [-3, 5, -4], armL: [3, 8, 8, 6], armR: [40, 10, 118, -14], lean: 1, head: [-12, 28] },
  walkA:     { legL: [27, 2, 10], legR: [-21, 2, -46], armL: [-20, 6, -6, 5], armR: [24, 6, 46, 3], lean: 6 },
  walkB:     { legL: [-21, 2, -46], legR: [27, 2, 10], armL: [24, 6, 46, 3], armR: [-20, 6, -6, 5], lean: 6 },
  trudge:    { legL: [20, 2, 4], legR: [-15, 3, -34], armL: [-6, 6, 4, 4], armR: [6, 7, 10, 5], lean: 15, head: [18, 0] },
  carry:     { legL: [24, 2, 8], legR: [-18, 2, -40], armL: [-16, 6, -2, 5], armR: [2, 9, 4, 7], lean: 8, head: [6, 0] },
  sack:      { legL: [20, 3, 2], legR: [-14, 3, -34], armL: [22, 6, 128, -8], armR: [22, 6, 128, -8], lean: 25, head: [12, 0] },
  mother:    { legL: [4, 4, 0], legR: [-3, 4, -4], armL: [36, 8, 96, -30], armR: [30, 6, 84, -36], lean: 5, head: [16, -14] },
  seated:    { legL: [72, 7, -14], legR: [66, 9, -20], armL: [34, 6, 62, -8], armR: [30, 6, 58, -8], lean: 16, head: [14, 0] },
  /* the fight */
  march:     { legL: [26, 2, 8], legR: [-20, 2, -42], armL: [-18, 6, -6, 4], armR: [28, 10, 98, -24], lean: 4 },
  aim:       { legL: [22, 6, 6], legR: [-16, 9, -26], armL: [66, 4, 78, -12], armR: [50, 30, 104, -34], lean: 12, twist: -12, head: [4, 6] },
  aimDn:     { legL: [20, 6, 4], legR: [-16, 9, -26], armL: [66, 4, 78, -12], armR: [50, 30, 104, -34], lean: 38, twist: -12, head: [22, 6] },
  aimUp:     { legL: [20, 7, 4], legR: [-18, 9, -28], armL: [104, 4, 118, -12], armR: [86, 32, 140, -34], lean: -8, twist: -12, head: [-26, 6] },
  kneel:     { legL: [82, 8, -6], legR: [-6, 6, -96], armL: [62, 4, 76, -12], armR: [46, 30, 100, -34], lean: 14, twist: -12, head: [2, 6] },
  kneelUp:   { legL: [82, 8, -6], legR: [-6, 6, -96], armL: [100, 4, 114, -12], armR: [84, 32, 136, -34], lean: -6, twist: -12, head: [-24, 6] },
  pistol:    { legL: [18, 6, 4], legR: [-14, 8, -22], armL: [8, 12, 44, 0], armR: [86, 8, 88, 4], lean: 8, twist: -18, head: [0, 14] },
  pistolDn:  { legL: [14, 6, 2], legR: [-12, 8, -20], armL: [20, 14, 70, -10], armR: [52, 8, 54, 4], lean: 26, twist: -14, head: [24, 10] },
  thrower:   { legL: [30, 5, 12], legR: [-26, 9, -42], armL: [72, 16, 60, 6], armR: [-88, 50, 176, 12], lean: -9, twist: -32, head: [-6, 22] },
  throwDn:   { legL: [16, 6, 4], legR: [-18, 9, -30], armL: [40, 20, 66, 0], armR: [-70, 58, 168, 16], lean: 14, twist: -28, head: [22, 18] },
  run:       { legL: [56, 3, -14], legR: [-36, 3, -112], armL: [-46, 8, 26, 4], armR: [50, 8, 112, -6], lean: 20 },
  runGun:    { legL: [-34, 3, -108], legR: [54, 3, -16], armL: [30, 10, 86, -26], armR: [26, 12, 80, -30], lean: 24, head: [-6, 0] },
  duck:      { legL: [62, 8, -28], legR: [24, 9, -82], armL: [36, 10, 80, -10], armR: [142, 20, 204, -8], lean: 34, head: [26, 0] },
  recoil:    { legL: [-16, 7, -28], legR: [22, 8, 6], armL: [82, 20, 134, -32], armR: [-22, 26, -8, 22], lean: -17, head: [-10, -20] },
  back:      { legL: [-22, 6, -30], legR: [14, 9, -4], armL: [-30, 30, 10, 26], armR: [60, 26, 120, -10], lean: -10, twist: 20, head: [-4, -24] },
  crew:      { legL: [38, 7, -10], legR: [-10, 9, -52], armL: [54, 8, 62, 0], armR: [58, 8, 66, 0], lean: 44, head: [-16, 0] },
  point:     { legL: [4, 5, 1], legR: [-4, 6, -6], armL: [-10, 26, 44, -44], armR: [84, 12, 86, 6], lean: 0, head: [-4, 10] },
  raise:     { legL: [6, 6, 2], legR: [-6, 7, -8], armL: [6, 10, 14, 6], armR: [168, 14, 178, 6], lean: -4, head: [-14, 0] },
  watch:     { legL: [4, 5, 1], legR: [-3, 5, -4], armL: [30, 8, 96, -30], armR: [26, 8, 90, -32], lean: 6, head: [18, 0] },
  gunner:    { legL: [84, 10, -8], legR: [-4, 8, -98], armL: [58, 10, 72, -18], armR: [52, 14, 70, -22], lean: 30, head: [-12, 0] },
};

/* ── clothes ───────────────────────────────────────────────── */
export const OUTFITS = {
  man:      { coat: 0.76, head: 'cap', band: true },
  manHat:   { coat: 0.7, head: 'hat', band: true },
  manBare:  { coat: 0.5, head: 'bare', band: true },
  woman:    { coat: 0.78, head: 'scarf', flare: 1.25, scale: 0.94, narrow: 0.9, band: true },
  womanHair: { coat: 0.74, head: 'hair', flare: 1.2, scale: 0.94, narrow: 0.9, band: true },
  /* the other Warsaw, outside the wall: the same coats, and no band */
  manOut:   { coat: 0.62, head: 'cap' },
  manHatOut: { coat: 0.7, head: 'hat' },
  womanOut: { coat: 0.78, head: 'scarf', flare: 1.25, scale: 0.94, narrow: 0.9 },
  womanHairOut: { coat: 0.74, head: 'hair', flare: 1.2, scale: 0.94, narrow: 0.9 },
  child:    { coat: 0.18, head: 'cap', scale: 0.63, big: 1.24, shorts: true },
  girl:     { coat: 0.6, head: 'scarf', scale: 0.6, big: 1.24, flare: 1.3 },
  soldier:  { coat: 0.42, head: 'helmet', boots: true, belt: true, broad: 1.1 },
  officer:  { coat: 0.76, head: 'peak', boots: true, belt: true, broad: 1.06 },
  fighter:  { coat: 0.36, head: 'cap' },
  fighterB: { coat: 0.34, head: 'beret' },
  fighterW: { coat: 0.5, head: 'hair', scale: 0.94, narrow: 0.9, flare: 1.15 },
};

/* ── one person ────────────────────────────────────────────── */
export function person(poseName = 'stand', outfitName = 'man', props = {}) {
  const pose = typeof poseName === 'string' ? POSES[poseName] : poseName;
  const o = typeof outfitName === 'string' ? OUTFITS[outfitName] : outfitName;
  /* cloth 0, skin 1, iron 2: the shader draws each a little differently */
  const parts = [], tones = [], bands = [];
  const put = (tone, ...gs) => { for (const g of gs) { parts.push(g); tones.push(tone); } };
  const sh = 0.19 * (o.broad || 1) * (o.narrow || 1);

  /* legs, hung from the hips; the lowest point decides how high the hips are */
  const hips = [V(-0.095, 0, 0), V(0.095, 0, 0)];
  const legs = [pose.legL, pose.legR].map((l, i) => {
    const side = i ? 1 : -1;
    const knee = hips[i].clone().addScaledVector(dir(l[0], l[1], side), 0.45);
    const ankle = knee.clone().addScaledVector(dir(l[2], l[1] * 0.4, side), 0.43);
    return { knee, ankle, shin: l[2] };
  });
  let low = Infinity;
  for (const l of legs) low = Math.min(low, l.ankle.y - 0.075, l.knee.y - 0.07);
  /* half: only what shows above a window sill */
  const half = !!props.half;
  const py = half ? 0 : (pose.pelvisY !== undefined ? pose.pelvisY : -low);
  const pelvis = V(0, py, 0);
  if (!half) legs.forEach((l, i) => {
    const hip = hips[i].clone().add(pelvis), knee = l.knee.clone().add(pelvis), ankle = l.ankle.clone().add(pelvis);
    const rs = o.boots ? 0.07 : 0.058;
    put(0, limb(hip, knee, o.boots ? 0.11 : 0.085, 0.067), ball(knee, 0.065));
    put(o.boots ? 2 : o.shorts ? 1 : 0, limb(knee, ankle, rs + 0.006, rs * 0.86));
    /* a foot: flat when it is on the ground, trailing when it is in the air */
    const lifted = ankle.y > 0.16;
    const fq = new THREE.Quaternion().setFromEuler(new THREE.Euler(lifted ? Math.min(1.1, Math.max(-0.4, -l.shin * R * 0.7)) : 0, 0, 0));
    put(2, block(ankle.clone().add(V(0, -0.03, 0.055).applyQuaternion(fq)), 0.105, 0.085, 0.23, fq));
  });

  /* the spine */
  const Rt = new THREE.Quaternion().setFromEuler(new THREE.Euler((pose.lean || 0) * R, (pose.twist || 0) * R, 0, 'YXZ'));
  const T = (x, y, z) => V(x, y, z).applyQuaternion(Rt).add(pelvis);
  put(0, ball(pelvis, 0.165, [1.0, 0.72, 0.74]));
  const jacket=garment([[0,.15,.10],[.12,.142,.095],[.31,.16,.105],[.46,sh,.115],[.53,.085,.073]],16,5);
  jacket.applyQuaternion(Rt); jacket.translate(pelvis.x,pelvis.y,pelvis.z); put(0,jacket);
  // Lapels overlap the coat front and frame a light shirt collar.
  for (const side of [-1,1]) {
    const l=lapel([[side*.07,.54],[side*.16,.43],[side*.08,.33],[0,.2],[side*.04,.44]],.006);
    l.translate(0,0,.112); l.applyQuaternion(Rt); l.translate(pelvis.x,pelvis.y,pelvis.z); put(0,l);
    const c=lapel([[0,.49],[side*.07,.55],[side*.11,.43],[side*.05,.39]],.005);
    c.translate(0,0,.121); c.applyQuaternion(Rt); c.translate(pelvis.x,pelvis.y,pelvis.z); put(.3,c);
  }
  for (let i=0;i<3;i++) put(2,ball(T(.027,.12+i*.085,.111),.009,[1,1,.5],Rt,6,4));
  put(0, ball(T(0, 0.5, 0), sh + 0.012, [1.12, 0.42, 0.7], Rt));
  if (o.belt) {
    put(2, tube(T(0, 0.1, 0), 0.163, 0.163, 0.055, Rt, [1.02, 1, 0.72], 8));
    put(.3, block(T(0, .1, .126), .06, .047, .016, Rt));
    // Angular field pockets, cartridge pouches and a diagonal leather shoulder strap.
    for (const side of [-1, 1]) {
      put(0, block(T(side * .106, .32, .107), .105, .105, .028, Rt));
      put(2, block(T(side * .12, .053, .139), .097, .09, .065, Rt));
      put(0, block(T(side * .16, .487, 0), .09, .028, .125, Rt));
    }
    const strap = lapel([[-.15,.5],[-.115,.51],[.15,.105],[.112,.1]], .008);
    strap.translate(0,0,.144); strap.applyQuaternion(Rt); strap.translate(pelvis.x,pelvis.y,pelvis.z); put(3,strap);
    put(3, block(T(0,.28,-.175), .255,.3,.13,Rt));
    put(3, block(T(-.2,-.08,0), .12,.22,.18,Rt));
  }

  // Pocket flaps and a center seam remain tied to the torso across walking poses.
  for (const side of [-1,1]) {
    put(0,block(T(side*.105,.19,.111),.075,.013,.013,Rt));
    put(2,ball(T(side*.105,.185,.123),.006,[1,1,.45],Rt,6,4));
  }
  put(0,block(T(.012,.26,.113),.008,.26,.008,Rt));

  /* the coat, falling between the legs' two directions */
  if (o.coat > 0.05 && !half) {
    const down = legs[0].knee.clone().add(legs[1].knee).multiplyScalar(0.5).normalize().lerp(V(0, -1, 0), 0.45).normalize();
    const len = o.coat * 0.86;
    const cq = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), down);
    const spread = Math.abs(legs[0].knee.z - legs[1].knee.z);
    const hem = .165 + len * .17 * (o.flare || 1);
    const g = garment([[-len/2,hem,.98*hem],[-len*.22,hem*.94,hem*.94],[0,.17,.17],[len*.3,.16,.16],[len/2,.158,.158]],16,5);
    if (!o.flare) {
      // Open the lower front of an overcoat so its two tails reveal the trousers.
      // The cut is made before posing, keeping every animation frame's topology identical.
      const p = g.attributes.position, indices = [];
      for (let i=0;i<g.index.count;i+=3) {
        const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)];
        const x=ids.reduce((s,k)=>s+p.getX(k),0)/3;
        const y=ids.reduce((s,k)=>s+p.getY(k),0)/3;
        const z=ids.reduce((s,k)=>s+p.getZ(k),0)/3;
        if (!(y<len*.2 && z>0 && Math.abs(x)<z*.65)) indices.push(...ids);
      }
      g.setIndex(indices);
    }
    g.scale(1, 1, 0.72 + spread * 0.8);
    g.translate(0, -len / 2 + 0.06, 0);
    g.applyQuaternion(cq);
    g.translate(pelvis.x, pelvis.y, pelvis.z);
    put(0, g);
  }

  /* arms */
  const hands = [pose.armL, pose.armR].map((a, i) => {
    const side = i ? 1 : -1;
    const shoulder = T(side * sh, 0.47, 0);
    const elbow = shoulder.clone().addScaledVector(dir(a[0], a[1], side).applyQuaternion(Rt), 0.29);
    const fore = dir(a[2], a[3], side).applyQuaternion(Rt);
    const wrist = elbow.clone().addScaledVector(fore, 0.26);
    put(0, ball(shoulder, 0.081), limb(shoulder, elbow, 0.079, 0.062), ball(elbow, 0.063), limb(elbow, wrist, 0.063, 0.049));
    /* the band every Jew in Warsaw was made to wear: white, on the right arm */
    if ((props.band || o.band) && i === 1) {
      const b0 = shoulder.clone().lerp(elbow, 0.36), b1 = shoulder.clone().lerp(elbow, 0.7);
      put(0.3, limb(b0, b1, 0.083, 0.077, 8));
      /* the star looks out from the arm, away from the body */
      bands[parts.length - 1] = { mid: b0.clone().lerp(b1, 0.5), axis: b0.clone().sub(b1), face: V(1, 0, 0.25).applyQuaternion(Rt), r: 0.08 };
    }
    const hand = wrist.clone().addScaledVector(fore, 0.05);
    put(1, ball(hand, 0.04, [0.74, 1.3, 0.5], new THREE.Quaternion().setFromUnitVectors(UP, fore)));
    // A separate thumb and cuff make gestures readable without portrait features.
    const handQ = new THREE.Quaternion().setFromUnitVectors(UP, fore);
    const thumb = hand.clone().add(V(side * .025, -.008, .017).applyQuaternion(handQ));
    put(1, ball(thumb,.018,[.65,1.25,.75],handQ,8,5));
    put(0, limb(wrist.clone().addScaledVector(fore,-.035),wrist,.052,.05,8));
    return { hand, fore, elbow };
  });

  /* head */
  const hd = pose.head || [10, -4];
  const Rh = Rt.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((hd[0] - (pose.lean || 0) * 0.45) * R, hd[1] * R, 0, 'YXZ')));
  const neck = T(0, 0.55, 0.005);
  const big = o.big || 1;
  const Hd = (x, y, z) => V(x, y, z).multiplyScalar(big).applyQuaternion(Rh).add(neck);
  put(1, limb(T(0, 0.5, 0), Hd(0, 0.07, 0.005), 0.056, 0.05, 6));
  const face = new THREE.SphereGeometry(.1 * big, 24, 16);
  face.scale(.82, 1.23, .92); face.applyQuaternion(Rh);
  const faceCenter = Hd(0, .155, .025);
  face.translate(faceCenter.x, faceCenter.y, faceCenter.z);
  face.userData.smoothSkin = true;
  put(1, face);
  const cy = 0.155;
  if (o.head === 'cap') {
    put(0, ball(Hd(0, cy + 0.072, -0.008), 0.122 * big, [1.0, 0.5, 1.08], Rh, 12, 6));
    put(0, peak(Hd(0, cy + 0.058, 0.07), 0.1 * big, Rh.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, 0, 0)))));
  } else if (o.head === 'hat') {
    put(0, tube(Hd(0, cy + 0.06, 0.004), 0.15, 0.158, 0.012, Rh, [1, 1, 1.2], 16));
    put(0, tube(Hd(0, cy + 0.112, 0), 0.094, 0.108, 0.1, Rh, [1, 1, 1.12], 14));
    put(0, ball(Hd(0, cy + 0.16, 0), 0.094, [1, 0.3, 1.12], Rh, 12, 5));
  } else if (o.head === 'scarf') {
    // Open at the face: a folded hood and trailing triangular scarf ends.
    const hood = new THREE.SphereGeometry(.128 * big, 12, 6, Math.PI, Math.PI);
    hood.scale(1,1.18,1.1); hood.applyQuaternion(Rh);
    const hp = Hd(0,cy+.012,-.014); hood.translate(hp.x,hp.y,hp.z); put(0,hood);
    put(0, ball(Hd(0,cy+.115,-.005),.12*big,[1,.25,1.05],Rh,6,3));
    for (const side of [-1,1]) put(0,limb(Hd(side*.105,cy+.07,-.005),Hd(side*.1,cy-.1,.005),.032*big,.046*big,4));
    put(0, tube(Hd(0, cy - 0.15, -0.03), 0.09*big, 0.17*big, 0.16*big, Rh, [1, 1, .8], 5));
    for (const side of [-1,1]) {
      const end = lapel([[0,0],[side*.11,-.045],[side*.2,-.24],[side*.035,-.17]],.009);
      end.applyQuaternion(Rh); const ep = Hd(side*.04,cy-.065,-.105);
      end.translate(ep.x,ep.y,ep.z); put(3,end);
    }
  } else if (o.head === 'hair') {
    put(0, ball(Hd(0, cy + 0.02, -0.024), 0.112 * big, [0.98, 1.0, 1.0], Rh, 9, 7));
    put(0, ball(Hd(0, cy - 0.06, -0.05), 0.094 * big, [1.1, 1.0, 0.8], Rh, 7, 5));
  } else if (o.head === 'beret') {
    put(0, ball(Hd(0.018, cy + 0.088, -0.006), 0.128, [1.05, 0.34, 1.08], Rh.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2))), 9, 5));
  } else if (o.head === 'helmet') {
    const hq = Rh.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0, 0)));
    const dome = new THREE.SphereGeometry(0.134, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1.0, 0.92, 1.14); dome.applyQuaternion(hq);
    const hp = Hd(0, cy + 0.06, -0.004); dome.translate(hp.x, hp.y, hp.z);
    put(2, dome);
    /* the skirt of the helmet: flared, lower behind than in front */
    const skirt = new THREE.CylinderGeometry(.134,.156,.065,12,1,true,Math.PI/3,Math.PI*4/3);
    skirt.scale(1,1,1.18); skirt.applyQuaternion(hq);
    const sp=Hd(0,cy+.03,-.02); skirt.translate(sp.x,sp.y,sp.z); put(2,skirt);
    put(2, peak(Hd(0,cy+.052,.07),.11,hq));
  } else if (o.head === 'peak') {
    put(0, tube(Hd(0, cy + 0.1, -0.014), 0.148, 0.118, 0.07, Rh.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, 0))), [1, 1, 1.1], 10));
    put(0, peak(Hd(0, cy + 0.062, 0.075), 0.095, Rh.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.34, 0, 0)))));
  } else {
    put(0, ball(Hd(0, cy + 0.03, -0.016), 0.1 * big, [0.9, 0.9, 1.0], Rh, 8, 6));
  }

  /* what is in the hands */
  const [L, Rg] = hands;
  if (props.rifle === 'hands' || props.mg) {
    const axis = L.hand.clone().sub(Rg.hand).normalize();
    const rq = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), axis);
    const at = (z, y = 0) => Rg.hand.clone().addScaledVector(axis, z).add(V(0, y, 0));
    put(3, block(at(0.14), 0.045, 0.062, 1.0, rq));                       // wooden stock and fore end
    put(3, block(at(-0.26, -0.03), 0.045, 0.11, 0.3, rq));                // the butt
    put(2, block(at(.18,.038), .033,.025,.42,rq));                         // receiver
    put(2, tube(at(0.78, 0.008), 0.014, 0.014, 0.42, rq.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), [1, 1, 1], 5));
    if (props.mg) {
      put(0, tube(at(0.5, 0.01), 0.034, 0.034, 0.5, rq.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))), [1, 1, 1], 7));
      put(0, block(at(0.72, -0.16), 0.02, 0.32, 0.02, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.35))));
      put(0, block(at(0.72, -0.16), 0.02, 0.32, 0.02, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.35))));
    }
  } else if (props.rifle === 'slung') {
    const a = T(0.13, 0.62, -0.13), b = T(-0.1, -0.22, -0.15);
    put(0, block(a.clone().add(b).multiplyScalar(0.5), 0.045, a.distanceTo(b) + 0.2, 0.06, new THREE.Quaternion().setFromUnitVectors(UP, a.clone().sub(b).normalize())));
  }
  if (props.pistol) {
    const pq = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), Rg.fore);
    put(2, block(Rg.hand.clone().addScaledVector(Rg.fore, 0.1), 0.03, 0.036, 0.19, pq));
    put(2, block(Rg.hand.clone().add(V(0, -0.05, 0)), 0.03, 0.09, 0.04, pq));
  }
  if (props.bottle) {
    put(0, tube(Rg.hand.clone().addScaledVector(Rg.fore, 0.14), 0.016, 0.04, 0.24, new THREE.Quaternion().setFromUnitVectors(UP, Rg.fore), [1, 1, 1], 7));
  }
  if (props.case) {
    put(0, block(Rg.hand.clone().add(V(0, -0.24, 0)), 0.15, 0.36, 0.52));
    put(0, block(Rg.hand.clone().add(V(0, -0.04, 0)), 0.02, 0.06, 0.12));
  }
  if (props.sack || props.satchel) {
    put(3, block(T(0,.27,-.21), .29,.38,.19,Rt));
    put(3, block(T(0,.45,-.22), .31,.08,.2,Rt));
    for (const side of [-1,1]) put(3, limb(T(side*.12,.49,.1),T(side*.12,.03,.1),.016,.016,4));
  }
  if (props.teddy) {
    const at = L.hand.clone().lerp(Rg.hand,.5).add(V(0,.035,.065));
    put(3, ball(at,.095,[.8,1.2,.7]), ball(at.clone().add(V(0,.15,0)),.065));
    for (const side of [-1,1]) {
      put(3, ball(at.clone().add(V(side*.052,.2,0)),.025));
      put(3, limb(at.clone().add(V(side*.06,.04,0)),at.clone().add(V(side*.11,-.06,0)),.028,.025));
      put(3, ball(at.clone().add(V(side*.04,-.13,.015)),.035,[.8,1.4,1]));
    }
  }
  if (props.bundle) put(0, ball(Rg.hand.clone().add(V(0.02, -0.14, 0.02)), 0.19, [0.9, 1.1, 0.85], null, 8, 6));
  if (props.baby) {
    const c = L.hand.clone().lerp(Rg.hand, 0.45).add(V(0, 0.08, -0.02));
    put(0, ball(c, 0.15, [0.9, 1.5, 0.85], Rt, 8, 6));
    put(1, ball(c.clone().add(V(-0.03, 0.26, 0.02)), 0.085, [1, 1, 1], null, 8, 6));
  }
  if (props.cane) {
    const tip = V(Rg.hand.x + 0.04, 0, Rg.hand.z + 0.16);
    put(0, limb(Rg.hand, tip, 0.014, 0.012, 5));
  }

  const g = mergeGeometries(parts.map((p, i) => {
    const c = clean(p);
    if (bands[i]) starOnBand(c, bands[i].mid, bands[i].axis, bands[i].face, bands[i].r); else noStar(c);
    c.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count).fill(tones[i]), 1));
    /* how heavy the pen is round it: iron and small things get a finer line */
    c.setAttribute('aEdge', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count).fill(tones[i] > 1.5 ? 0.6 : 1), 1));
    return c;
  }), false);
  // Consistent elongated illustration proportions; also transform prop anchors below.
  const silhouette = V(.86,1.08,.9);
  g.scale(silhouette.x,silhouette.y,silhouette.z);
  if (o.scale) g.scale(o.scale, o.scale, o.scale);
  /* where the right hand ended up: a thrown bottle or a muzzle flash starts here */
  g.userData.hand = Rg.hand.clone().multiplyScalar(o.scale || 1);
  g.userData.muzzle = props.rifle === 'hands' || props.mg
    ? Rg.hand.clone().addScaledVector(L.hand.clone().sub(Rg.hand).normalize(), 1.0).multiplyScalar(o.scale || 1)
    : Rg.hand.clone().addScaledVector(Rg.fore, 0.2).multiplyScalar(o.scale || 1);
  g.userData.hand.multiply(silhouette);
  g.userData.muzzle.multiply(silhouette);
  g.userData.aim = (props.rifle === 'hands' || props.mg ? L.hand.clone().sub(Rg.hand) : Rg.fore.clone()).multiply(silhouette).normalize();
  return g;
}

/* ── the kinds of people a street has ──────────────────────── */
export const KINDS = {
  man:      ['stand', 'man'],
  man2:     ['pockets', 'man'],
  man3:     ['cold', 'manBare'],
  hat:      ['stand', 'manHat'],
  hat2:     ['look', 'manHat'],
  old:      ['stoop', 'manHat', { cane: true }],
  woman:    ['stand', 'woman'],
  woman2:   ['cold', 'woman'],
  woman3:   ['look', 'womanHair'],
  mother:   ['mother', 'woman', { baby: true }],
  carrier:  ['carry', 'man', { case: true }],
  carrierW: ['carry', 'woman', { bundle: true }],
  sack:     ['sack', 'man', { sack: true }],
  walker:   ['walkA', 'man'],
  walker2:  ['walkB', 'manHat'],
  walkerW:  ['walkA', 'woman'],
  trudge:   ['trudge', 'woman'],
  child:    ['stand', 'child', { satchel: true }],
  child2:   ['walkB', 'child', { satchel: true }],
  girl:     ['mother', 'girl', { teddy: true }],
  seated:   ['seated', 'man'],
  seatedW:  ['seated', 'woman'],
  watcher:  ['watch', 'manBare'],
};

const cache = {};
export function kindGeometry(kind) {
  if (!cache[kind]) cache[kind] = person(...KINDS[kind]);
  return cache[kind];
}

/* A crowd: a list of { kind, x, y, z, ry, s } placed as instanced meshes
   that share one material, so the whole crowd can leave together. */
export function crowd(scene, people, material = washMaterial()) {
  const byKind = {};
  for (const p of people) (byKind[p.kind] ||= []).push(p);
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const meshes = [];
  const pen = lineMaterial(material);
  for (const [kind, list] of Object.entries(byKind)) {
    const mesh = new THREE.InstancedMesh(kindGeometry(kind), material, list.length);
    list.forEach((p, i) => {
      const k = p.s || 1;
      qq.setFromEuler(e.set(0, p.ry || 0, 0));
      m.compose(v.set(p.x, p.y || 0, p.z), qq, s.set(k, k, k));
      mesh.setMatrixAt(i, m);
    });
    mesh.frustumCulled = false;
    scene.add(mesh);
    meshes.push(mesh);
    if (!QUALITY.pen) continue;
    /* the pen line: the same people in the same places, drawn a little larger and inside out */
    const line = new THREE.InstancedMesh(mesh.geometry, pen, list.length);
    line.instanceMatrix = mesh.instanceMatrix;
    line.frustumCulled = false;
    line.userData.noShadow = true;
    scene.add(line);
    meshes.push(line);
  }
  meshes.push(blobs(scene, people, material.uniforms.uGone));
  return { material, meshes, show(on) { meshes.forEach((x) => { x.visible = on; }); } };
}

/* Where a body meets the ground the light does not reach. One soft dark patch
   under each person keeps them standing on the street and not floating over it. */
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function blobs(scene, people, gone) {
  const list = people.filter((p) => !(p.props && p.props.half));
  const mesh = new THREE.InstancedMesh(blobGeo, blobMaterial(gone), Math.max(1, list.length));
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach((p, i) => {
    const k = (p.s || 1) * (p.kind && /child|girl/.test(p.kind) ? 0.66 : 1);
    qq.setFromEuler(e.set(0, p.ry || 0, 0));
    m.compose(V(p.x, (p.y || 0) + 0.025, p.z), qq, V(0.95 * k, 1, 1.2 * k));
    mesh.setMatrixAt(i, m);
  });
  mesh.count = list.length;
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  scene.add(mesh);
  return mesh;
}

/* Individually posed figures, merged into one mesh: a tableau.
   list: [{ pose, outfit, props, x, y, z, ry, s }]. Returns the mesh and where each
   figure's hand and muzzle are in the world. */
export function tableau(scene, list, material = washMaterial()) {
  const geos = [], marks = [];
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
  for (const f of list) {
    const g = person(f.pose, f.outfit, f.props || {});
    const k = f.s || 1;
    qq.setFromEuler(e.set(0, f.ry || 0, 0));
    m.compose(V(f.x, f.y || 0, f.z), qq, V(k, k, k));
    const hand = g.userData.hand.clone().applyMatrix4(m);
    const muzzle = g.userData.muzzle.clone().applyMatrix4(m);
    const aim = g.userData.aim.clone().applyQuaternion(qq);
    g.applyMatrix4(m);
    geos.push(g);
    marks.push({ ...f, hand, muzzle, aim });
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos, false), material);
  mesh.frustumCulled = false;
  material.uniforms.uStill.value = 1;
  scene.add(mesh);
  const line = new THREE.Mesh(mesh.geometry, lineMaterial(material));
  line.frustumCulled = false;
  line.userData.noShadow = true;
  scene.add(line);
  blobs(scene, list, material.uniforms.uGone);
  /* shown and hidden together: the wash, and its line */
  return { mesh, line, material, marks, show(on) { for (const o of [mesh, line]) { o.userData.hidden = !on; o.visible = on; } } };
}

const STREET = ['man', 'man2', 'man3', 'hat', 'hat2', 'old', 'woman', 'woman2', 'woman3', 'mother', 'carrier', 'carrierW', 'sack', 'walker', 'walker2', 'walkerW', 'trudge', 'child', 'child2', 'girl', 'watcher'];

/* Scatter people over a patch of ground. `keep` says where they may stand. */
export function scatter({ n, seed, area, keep = () => true, kinds = STREET, face }) {
  const Rn = rng(seed);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const x = area.x0 + Rn() * (area.x1 - area.x0);
    const z = area.z0 + Rn() * (area.z1 - area.z0);
    if (!keep(x, z)) continue;
    if (out.some((p) => Math.hypot(p.x - x, p.z - z) < 0.75)) continue;
    const kind = kinds[Math.floor(Rn() * kinds.length)];
    const ry = face !== undefined ? face + (Rn() - 0.5) * 1.2 : Rn() * Math.PI * 2;
    out.push({ kind, x, z, ry, s: 0.95 + Rn() * 0.1 });
    /* a small child does not stand alone: put it beside someone */
    if ((kind === 'woman' || kind === 'trudge' || kind === 'walkerW') && Rn() < 0.4) {
      out.push({ kind: Rn() < 0.5 ? 'child' : 'girl', x: x + Math.cos(ry) * 0.42, z: z - Math.sin(ry) * 0.42, ry: ry + (Rn() - 0.5) * 0.5, s: 0.9 + Rn() * 0.2 });
    }
  }
  return out;
}

