/* ============================================================
   What stands in the street: the wall, the bridge, the wagons,
   the people, the cellars, the flags, the synagogue, the rubble,
   the candles, and the photographs on the walls.
   ============================================================ */

import * as THREE from 'three';
import { rng } from './common.js';
import { brickMaterial, woodMaterial, plainMaterial, photoMaterial, flagMaterial, rubbleMaterial } from './materials.js';
import { washMaterial } from './ink.js';
import { box, at, merge, quad, room, bottleGeometry } from './geo.js';
import { crowd, scatter } from './figures.js';
import { walkers } from './walk.js';
import { PLAN } from './plan.js';
import { logoGeometry, logoBlock } from './logo.js';
import { buildGuardDogs } from './dogs.js';

const P = PLAN;
const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
const add = (scene, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m); return m; };

/* ── the wall, and the wire on top of it ───────────────────── */
function wallRun(x0, z0, x1, z1, { h = 3.2, t = 0.45, barbs = true, gap = null } = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ry = Math.atan2(-(z1 - z0), x1 - x0);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const brick = [at(box(len, h, t), cx, h / 2, cz, ry), at(box(len, 0.12, t + 0.12), cx, h + 0.06, cz, ry)];
  const iron = [];
  const R = rng(Math.floor(Math.abs(x0 * 13 + z0 * 7)) + 3);
  const open = (d) => gap && d > gap[0] && d < gap[1];
  for (let d = 0.6; d < len; d += 2.6) {
    if (open(d)) continue;
    const px = x0 + (x1 - x0) * d / len, pz = z0 + (z1 - z0) * d / len;
    iron.push(at(box(0.05, 0.85, 0.05), px, h + 0.5, pz, ry, 0.25));
  }
  for (let s = 0; s < 3; s++) {
    const y = h + 0.3 + s * 0.24;
    const off = 0.06 + s * 0.06;
    if (gap) {
      /* the strands, cut: each end hangs a little */
      for (const [a, b, sag] of [[0, gap[0], -1], [gap[1], len, 1]]) {
        const mx = x0 + (x1 - x0) * (a + b) / 2 / len, mz = z0 + (z1 - z0) * (a + b) / 2 / len;
        iron.push(at(box(b - a, 0.018, 0.018), mx - Math.sin(ry) * off, y, mz - Math.cos(ry) * off, ry));
        const ex = x0 + (x1 - x0) * (sag < 0 ? b : a) / len;
        iron.push(at(box(0.016, 0.3 + s * 0.12, 0.016), ex + sag * 0.05, y - 0.13 - s * 0.05, z0 - off, 0, 0, sag * 0.35));
      }
    } else iron.push(at(box(len, 0.018, 0.018), cx - Math.sin(ry) * off, y, cz - Math.cos(ry) * off, ry));
    if (!barbs) continue;
    for (let d = 0.3; d < len; d += 0.42 + R() * 0.25) {
      if (open(d)) continue;
      const px = x0 + (x1 - x0) * d / len - Math.sin(ry) * off, pz = z0 + (z1 - z0) * d / len - Math.cos(ry) * off;
      iron.push(at(box(0.012, 0.11, 0.012), px, y, pz, R() * 3, R() * 3, R() * 3));
    }
  }
  return { brick, iron };
}

function buildWalls(scene) {
  const brick = [], iron = [];
  const put = (w) => { brick.push(...w.brick); iron.push(...w.iron); };
  const L = P.ladder;
  put(wallRun(-P.half, P.wallZ, P.half, P.wallZ, { gap: [L.x + P.half - 0.75, L.x + P.half + 0.75] }));
  /* the ladder */
  const wood = [];
  const run = L.top + 0.5, back = -run * L.lean, lenL = Math.hypot(run, back), tilt = -Math.atan2(back, run);
  for (const s of [-1, 1]) wood.push(at(box(0.05, lenL, 0.07), L.x + s * 0.22, run / 2, L.z0 - back / 2, 0, tilt));
  for (let y = L.c0; y < run - 0.1; y += 0.3) wood.push(at(box(0.44, 0.035, 0.045), L.x, y, L.z0 + L.lean * y, 0, tilt));
  add(scene, merge(wood), woodMaterial());
  /* Chłodna is walled along both sides */
  const ca = P.cross.z1, cb = P.cross.z0;
  for (const z of [ca, cb]) {
    put(wallRun(-30, z, 30, z));
    put(wallRun(-92, z, -30, z, { barbs: false }));
    put(wallRun(30, z, 92, z, { barbs: false }));
  }
  /* the loading yard */
  put(wallRun(P.yard.x1, P.yard.z0, P.yard.x1, P.yard.z1, { barbs: false, h: 2.6 }));
  add(scene, merge(brick), brickMaterial());
  add(scene, merge(iron), plainMaterial({ color: [0.045, 0.04, 0.036], rough: 0.2 }));
}

/* ── the wooden bridge over Chłodna ────────────────────────── */
function buildBridge(scene) {
  const B = P.bridge;
  const w = 3.2, y = B.y;
  const wood = [];
  const len = B.deckA - B.deckB;
  const zc = (B.deckA + B.deckB) / 2;
  wood.push(at(box(w, 0.18, len), 0, y - 0.09, zc));
  for (const x of [-1.25, 1.25]) wood.push(at(box(0.24, 0.36, len), x, y - 0.36, zc));
  const n = 28, rise = y / n;
  const stairs = (zTop, zFoot) => {
    const run = (zFoot - zTop) / n;
    for (let i = 0; i < n; i++) wood.push(at(box(w, 0.07, Math.abs(run) + 0.04), 0, y - (i + 1) * rise + rise - 0.035, zTop + (i + 0.5) * run));
    for (const x of [-1.5, 1.5]) {
      wood.push(quad([x, 0, zFoot], [x, y, zTop], [x, y + 1.05, zTop], [x, 1.05, zFoot]));
      wood.push(quad([x, -0.35, zFoot], [x, y - 0.35, zTop], [x, y, zTop], [x, 0, zFoot]));
    }
  };
  stairs(B.deckA, B.stairA);
  stairs(B.deckB, B.stairB);
  for (const x of [-1.56, 1.56]) wood.push(at(box(0.08, 1.05, len), x, y + 0.525, zc));
  /* trestles */
  const legs = [B.deckA - 0.3, P.cross.z1 - 1.4, P.cross.z0 + 1.4, B.deckB + 0.3];
  for (const z of legs) {
    for (const x of [-1.45, 1.45]) wood.push(at(box(0.26, y, 0.26), x, y / 2, z));
    wood.push(at(box(3.4, 0.14, 0.1), 0, y * 0.5, z, 0, 0, 0.95));
    wood.push(at(box(3.4, 0.14, 0.1), 0, y * 0.5, z, 0, 0, -0.95));
    wood.push(at(box(3.1, 0.2, 0.22), 0, y - 0.6, z));
  }
  add(scene, merge(wood), woodMaterial({ tint: [0.17, 0.125, 0.085], plank: 0.17, vertical: 1, side: THREE.DoubleSide }));
}

/* ── the other Warsaw, seen from the bridge ────────────────── */
function buildTram(scene) {
  const g = new THREE.Group();
  const body = merge([
    at(box(9, 1.25, 2.25), 0, 1.0, 0),
    at(box(9, 0.3, 2.25), 0, 2.85, 0),
    at(box(8.6, 0.16, 1.9), 0, 3.08, 0),
    at(box(0.06, 1.1, 0.06), -1.2, 3.7, 0, 0, 0, 0.5),
    at(box(0.06, 1.1, 0.06), -0.5, 3.7, 0, 0, 0, -0.5),
  ]);
  const posts = [];
  for (let i = 0; i <= 8; i++) for (const z of [-1.1, 1.1]) posts.push(at(box(0.09, 1.1, 0.06), -4.4 + i * 1.1, 2.17, z));
  g.add(new THREE.Mesh(merge([body, ...posts]), plainMaterial({ color: [0.2, 0.07, 0.05], rough: 0.25 })));
  // Individual recessed panes replace the glowing solid block. This is an
  // interpretive period tram, not a reconstruction of an identified vehicle.
  const iron=[], trim=[], glass=[], panels=[], lamps=[], timber=[];
  for(const z of [-1.1,1.1]) {
    for(let i=0;i<8;i++) {
      const x=-3.85+i*1.1;
      glass.push(at(box(.95,.88,.025),x,2.18,z));
      trim.push(at(box(1.02,.045,.065),x,1.72,z),at(box(1.02,.045,.065),x,2.67,z));
      panels.push(at(box(.91,.72,.022),x,1.15,z*1.03));
      for(const dx of [-.36,.36]) iron.push(at(new THREE.SphereGeometry(.018,6,4),x+dx,1.43,z*1.05));
    }
    trim.push(at(box(8.9,.065,.07),0,1.59,z*1.04));
    for(const x of [-3.85,3.85]) {
      // Platform doors, glazing division, handles and boarding steps.
      trim.push(at(box(.055,1.85,.085),x-.47,1.72,z*1.035),at(box(.055,1.85,.085),x+.47,1.72,z*1.035));
      iron.push(at(box(.025,.23,.055),x+.28,1.62,z*1.065));
      for(let j=0;j<2;j++) iron.push(at(box(.93,.08,.28),x,.49+j*.18,z*(1.13-j*.05)));
    }
  }
  for(const end of [-1,1]) {
    const x=end*4.52;
    panels.push(at(box(.08,1.14,2.12),x,1.08,0));
    for(const z of [-.67,0,.67]) {
      glass.push(at(box(.035,.86,.57),x,2.18,z));
      trim.push(at(box(.08,.045,.63),x,1.73,z),at(box(.08,.045,.63),x,2.64,z));
    }
    for(const z of [-1,-.335,.335,1])trim.push(at(box(.08,.98,.055),x,2.18,z));
    // Headlamp housing, lens, bumper and coupler read from the bridge view.
    iron.push(at(cyl(.19,.19,.12,16).rotateZ(Math.PI/2),x+end*.09,1.16,0));
    lamps.push(at(cyl(.145,.145,.025,20).rotateZ(Math.PI/2),x+end*.16,1.16,0));
    iron.push(at(box(.18,.14,1.8),x+end*.13,.64,0),at(box(.46,.12,.14),x+end*.32,.5,0));
    trim.push(at(box(.04,.18,.88),x+end*.06,2.87,0));
    for(const z of [-.7,.7])iron.push(at(box(.024,.4,.024),x+end*.08,2.02,z,0,.25));
  }
  iron.push(at(box(7.8,.24,1.75),0,.47,0));
  for(const x of [-2.7,2.7]) {
    iron.push(at(cyl(.085,.085,2.0,12).rotateX(Math.PI/2),x,.4,0));
    for(const z of [-.86,.86]) {
      iron.push(at(cyl(.4,.4,.16,20).rotateX(Math.PI/2),x,.4,z));
      trim.push(at(cyl(.16,.16,.18,16).rotateX(Math.PI/2),x,.4,z*1.02));
      iron.push(at(box(1.12,.13,.15),x,.62,z),at(box(.08,.28,.16),x-.42,.52,z),at(box(.08,.28,.16),x+.42,.52,z));
    }
  }
  for(let x=-3;x<=3;x+=1.2) {
    timber.push(at(box(.66,.11,1.65),x,1.23,0),at(box(.09,.68,1.65),x-.29,1.57,0));
    iron.push(at(box(.42,.07,.7),x,3.2,0));
  }
  // Roof seams and a bow collector reaching the contact wire.
  for(let x=-4;x<4.1;x+=.65)iron.push(at(box(.025,.022,1.85),x,3.175,0));
  const rod=(a,b,r=.025)=>{const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const geo=cyl(r,r,d.length(),8);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));geo.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);return geo;};
  for(const z of [-.55,.55]) {iron.push(rod([-1.5,3.25,z],[-.5,4.05,z]),rod([-.5,4.05,z],[-1.5,4.85,z]));}
  iron.push(at(box(.12,.055,1.65),-1.5,4.87,0));
  add(g,merge(panels),plainMaterial({color:[.22,.085,.052],rough:.7}));
  add(g,merge(glass),plainMaterial({color:[.07,.085,.078],rough:.12}));
  add(g,merge(trim),plainMaterial({color:[.34,.28,.17],rough:.5}));
  add(g,merge(iron),plainMaterial({color:[.045,.045,.038],rough:.45}));
  add(g,merge(timber),woodMaterial({tint:[.19,.115,.055],plank:.12}));
  add(g,merge(lamps),plainMaterial({color:[.65,.5,.28],emissive:[.3,.21,.1]}));
  g.position.set(0, 0, (P.cross.z0 + P.cross.z1) / 2 + 2.2);
  g.traverse((o) => { o.frustumCulled = false; });
  scene.add(g);
  const overhead=[];
  const cz=(P.cross.z0+P.cross.z1)/2;
  for(const z of [cz-2.2,cz+2.2]) overhead.push(rod([-100,4.9,z],[100,4.9,z],.015));
  for(let x=-80;x<=80;x+=20) {
    for(const z of [cz-10.5,cz+10.5]) {
      overhead.push(at(cyl(.065,.1,5.5,10),x,2.75,z),at(cyl(.16,.2,.35,10),x,.175,z));
      overhead.push(rod([x,5.3,z],[x,5.02,cz],.018));
    }
    overhead.push(rod([x,5.02,cz],[x,4.9,cz-2.2],.025),rod([x,5.02,cz],[x,4.9,cz+2.2],.025));
  }
  add(scene,merge(overhead),plainMaterial({color:[.055,.05,.043],rough:.6}));

  /* a church at the far end of the street, as in the photograph */
  const ch = merge([
    at(box(16, 19, 12), 0, 9.5, 0),
    at(box(6, 30, 6), 0, 15, -6.5), at(box(6, 30, 6), 0, 15, 6.5),
    at(new THREE.ConeGeometry(4.3, 13, 4), 0, 36.5, -6.5, Math.PI / 4), at(new THREE.ConeGeometry(4.3, 13, 4), 0, 36.5, 6.5, Math.PI / 4),
  ]);
  add(scene, at(ch, 136, 0, (P.cross.z0 + P.cross.z1) / 2), plainMaterial({ color: [0.2, 0.19, 0.17], rough: 0.3 }));
  return g;
}

/* ── Umschlagplatz ─────────────────────────────────────────── */
function buildYard(scene) {
  const Y = P.yard;
  const tx = Y.trackX;
  const wood = [], iron = [], dark = [];
  iron.push(at(box(0.07, 0.13, 90), tx - 0.72, 0.065, (Y.z0 + Y.z1) / 2));
  iron.push(at(box(0.07, 0.13, 90), tx + 0.72, 0.065, (Y.z0 + Y.z1) / 2));
  for (let z = Y.z1 + 10; z > Y.z0 - 10; z -= 0.7) wood.push(at(box(2.5, 0.1, 0.24), tx, 0.03, z));
  const centres = [];
  for (let i = 0; i < 5; i++) {
    const z = Y.z1 - 9 - i * 10.4;
    centres.push(z);
    wood.push(at(box(2.7, 2.5, 9.2), tx, 2.45, z));
    dark.push(at(box(2.92, 0.12, 9.4), tx, 3.76, z));
    dark.push(at(box(1.7, 0.1, 9.4), tx, 3.87, z));
    iron.push(at(box(2.4, 0.26, 9.0), tx, 1.08, z));
    for (const dz of [-2.9, 2.9]) for (const dx of [-0.76, 0.76]) iron.push(at(cyl(0.47, 0.47, 0.12, 14), tx + dx, 0.47, z + dz, 0, 0, Math.PI / 2));
    /* the open door, the door slid back, and the small barred window */
    dark.push(at(box(0.06, 2.1, 1.9), tx - 1.36, 2.4, z));
    wood.push(at(box(0.08, 2.1, 1.9), tx - 1.41, 2.4, z + 1.95));
    dark.push(at(box(0.06, 0.42, 0.85), tx - 1.36, 3.3, z - 3.3));
    for (let b = 0; b < 5; b++) iron.push(at(box(0.03, 0.42, 0.03), tx - 1.4, 3.3, z - 3.6 + b * 0.15));
    /* a plank up to the door */
    wood.push(quad([tx - 3.6, 0.02, z + 0.8], [tx - 3.6, 0.02, z - 0.8], [tx - 1.4, 1.3, z - 0.8], [tx - 1.4, 1.3, z + 0.8]));
  }
  /* the engine: a tender behind it, the boiler, the cab, the chimney, and the wheels under it */
  {
    const z0 = Y.z1 - 9 - 4 * 10.4 - 4.6, eng = [], red = [];
    const lie = (r, len, seg = 9) => cyl(r, r, len, seg).rotateX(Math.PI / 2);
    eng.push(at(box(2.6, 1.9, 4.6), tx, 2.2, z0 - 2.9));                          // the tender
    eng.push(at(box(2.5, 0.3, 4.9), tx, 1.1, z0 - 2.9));
    const c0 = z0 - 5.6;                                                           // the back of the cab
    eng.push(at(box(2.7, 2.5, 2.3), tx, 2.75, c0 - 1.15));
    eng.push(at(box(3.0, 0.14, 2.7), tx, 4.07, c0 - 1.15));
    eng.push(at(lie(1.02, 6.2), tx, 2.45, c0 - 5.4));                              // the boiler
    eng.push(at(lie(1.1, 0.7), tx, 2.45, c0 - 8.75));                              // the smokebox
    eng.push(at(cyl(0.3, 0.38, 1.1, 8), tx, 3.9, c0 - 8.6));                       // the chimney
    eng.push(at(cyl(0.42, 0.42, 0.55, 8), tx, 3.6, c0 - 5.6), at(cyl(0.34, 0.34, 0.45, 8), tx, 3.55, c0 - 3.6));
    eng.push(at(box(2.5, 0.34, 9.6), tx, 1.2, c0 - 4.6));                          // the frame
    eng.push(at(box(2.7, 0.5, 0.22), tx, 1.0, c0 - 9.5));                          // the buffer beam
    for (const s of [-1, 1]) {
      for (const dz of [-2.3, -4.2, -6.1]) red.push(at(cyl(0.78, 0.78, 0.14, 12), tx + s * 0.78, 0.78, c0 + dz, 0, 0, Math.PI / 2));
      red.push(at(cyl(0.45, 0.45, 0.12, 10), tx + s * 0.78, 0.45, c0 - 8.2, 0, 0, Math.PI / 2));
      for (const dz of [-1.3, -4.4]) eng.push(at(cyl(0.47, 0.47, 0.12, 10), tx + s * 0.76, 0.47, z0 + dz, 0, 0, Math.PI / 2));
      eng.push(at(box(0.07, 0.1, 4.4), tx + s * 0.9, 0.82, c0 - 4.2));             // the rod that joins the wheels
      eng.push(at(lie(0.1, 0.5), tx + s * 0.62, 1.15, c0 - 9.75));                 // the buffers
    }
    add(scene, merge(eng), plainMaterial({ color: [0.045, 0.043, 0.04], rough: 0.3 }));
    add(scene, merge(red), plainMaterial({ color: [0.16, 0.04, 0.03], rough: 0.35 }));
  }
  add(scene, merge(wood), woodMaterial({ tint: [0.16, 0.11, 0.075], plank: 0.15, vertical: 1, side: THREE.DoubleSide }));
  add(scene, merge(iron), plainMaterial({ color: [0.04, 0.038, 0.035], rough: 0.25 }));
  add(scene, merge(dark), plainMaterial({ color: [0.012, 0.011, 0.01], rough: 0.1 }));

  /* what people were told to bring, and what was left */
  const R = rng(911);
  const cases = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < 120; i++) {
    const inYard = i < 80;
    const x = inYard ? Y.x0 + 1 + R() * 13 : (R() < 0.5 ? -1 : 1) * (1.5 + R() * 5.5);
    const z = inYard ? Y.z0 + 4 + R() * (Y.z1 - Y.z0 - 8) : Y.z0 - R() * 34;
    const flat = R() < 0.6;
    const k = 0.7 + R() * 0.7;
    q.setFromEuler(e.set(flat ? Math.PI / 2 : 0, R() * 6.28, flat ? 0 : (R() - 0.5) * 0.3));
    m.compose(v.set(x, flat ? 0.1 * k : 0.19 * k, z), q, s.set(k, k, k * (0.8 + R() * 0.6)));
    cases.push(m.clone());
  }
  const im = new THREE.InstancedMesh(box(0.62, 0.38, 0.2), plainMaterial({ color: [0.13, 0.085, 0.05], rough: 0.5 }), cases.length);
  cases.forEach((mm, i) => im.setMatrixAt(i, mm));
  im.frustumCulled = false;
  scene.add(im);
  return centres;
}

/* ── the cellars ───────────────────────────────────────────── */
function zWall(z, xa, xb, y0, y1, door, inwardPlus) {
  /* a wall across the corridor at z, with a doorway cut in it */
  const parts = [];
  const mk = (x0, x1, a, b) => {
    if (x1 - x0 < 0.01 || b - a < 0.01) return;
    parts.push(inwardPlus
      ? quad([x0, a, z], [x1, a, z], [x1, b, z], [x0, b, z])
      : quad([x1, a, z], [x0, a, z], [x0, b, z], [x1, b, z]));
  };
  if (!door) { mk(xa, xb, y0, y1); return parts; }
  mk(xa, door.x0, y0, y1);
  mk(door.x1, xb, y0, y1);
  mk(door.x0, door.x1, door.top, y1);
  return parts;
}

function stairShaft(stone, brick, { x0, x1, zTop, zBot, floor }) {
  const n = 17, rise = -floor / n, run = (zBot - zTop) / n;
  for (let i = 0; i < n; i++) {
    stone.push(at(box(x1 - x0, rise, Math.abs(run) + 0.02), (x0 + x1) / 2, -(i + 0.5) * rise, zTop + (i + 0.5) * run));
    /* fill under the tread so the stair is a solid thing */
    stone.push(at(box(x1 - x0, 0.5, Math.abs(run) + 0.02), (x0 + x1) / 2, -(i + 1) * rise - 0.25, zTop + (i + 0.5) * run));
  }
  const za = Math.min(zTop, zBot), zb = Math.max(zTop, zBot);
  brick.push(room(x0, x1, floor, 0, za, zb, { floor: false, ceil: false, north: false, south: false }));
  /* the closed end, behind the top step */
  if (zTop > zBot) brick.push(...zWall(zTop, x0, x1, floor, 0, null, false));
  else brick.push(...zWall(zTop, x0, x1, floor, 0, null, true));
}

function buildBunkers(scene, lights) {
  const brick = [], stone = [], wood = [], dark = [];
  const bottles = [];

  const furnish = (x0, x1, z0, z1, floor, ceil, seed) => {
    const R = rng(seed);
    /* beams */
    for (let z = z1 - 1.2; z > z0; z -= 2.1) wood.push(at(box(x1 - x0, 0.2, 0.24), (x0 + x1) / 2, ceil - 0.1, z));
    for (const x of [x0 + 0.25, x1 - 0.25]) for (let z = z1 - 1.2; z > z0; z -= 4.2) wood.push(at(box(0.2, ceil - floor, 0.2), x, (floor + ceil) / 2, z));
    /* bunks along the east wall */
    for (let z = z1 - 2.4; z > z0 + 2; z -= 2.5) {
      for (const y of [floor + 0.45, floor + 1.4]) {
        wood.push(at(box(0.95, 0.07, 2.0), x1 - 0.62, y, z));
        dark.push(at(box(0.85, 0.12, 1.8), x1 - 0.62, y + 0.1, z));
      }
      for (const dz of [-1, 1]) wood.push(at(box(0.08, 1.7, 0.08), x1 - 1.08, floor + 0.85, z + dz));
    }
    /* a table */
    const tx = x0 + 2.4, tz = (z0 + z1) / 2 - 1;
    wood.push(at(box(1.7, 0.07, 0.95), tx, floor + 0.78, tz));
    for (const dx of [-0.75, 0.75]) for (const dz of [-0.38, 0.38]) wood.push(at(box(0.07, 0.78, 0.07), tx + dx, floor + 0.39, tz + dz));
    for (let i = 0; i < 7; i++) bottles.push([tx - 0.6 + R() * 1.2, floor + 0.815, tz - 0.3 + R() * 0.6]);
    /* crates */
    for (let i = 0; i < 6; i++) {
      const cx = x0 + 0.6 + R() * 1.2, cz = z0 + 1 + R() * (z1 - z0 - 6);
      wood.push(at(box(0.75, 0.5, 0.55), cx, floor + 0.25, cz, R() * 0.6));
      if (R() < 0.5) wood.push(at(box(0.7, 0.45, 0.5), cx + 0.05, floor + 0.73, cz, R() * 0.8));
    }
    return { tx, tz };
  };

  /* the first cellar: where the two undergrounds are told */
  const b = P.bunker1;
  stairShaft(stone, brick, { x0: b.x0, x1: b.x1, zTop: b.stairTop, zBot: b.stairBot, floor: b.floor });
  const rx0 = -12, rx1 = -2, ceil1 = -0.9;
  brick.push(room(rx0, rx1, b.floor, ceil1, b.roomEnd, b.stairBot, { north: false, south: false }));
  brick.push(...zWall(b.stairBot, rx0, rx1, b.floor, 0, { x0: b.x0, x1: b.x1, top: -1.05 }, false));
  brick.push(...zWall(b.roomEnd, rx0, rx1, b.floor, ceil1, { x0: b.x0, x1: b.x1, top: -1.25 }, true));
  const t1 = furnish(rx0, rx1, b.roomEnd, b.stairBot, b.floor, ceil1, 31);
  /* the tunnel dug onward */
  brick.push(room(b.x0, b.x1, b.floor, -1.2, b.tunnelEnd, b.roomEnd, { north: false, south: false }));
  for (let z = b.roomEnd - 2; z > b.tunnelEnd + 1; z -= 2.6) {
    wood.push(at(box(b.x1 - b.x0, 0.16, 0.2), (b.x0 + b.x1) / 2, -1.28, z));
    for (const x of [b.x0 + 0.1, b.x1 - 0.1]) wood.push(at(box(0.16, 2.1, 0.18), x, b.floor + 1.05, z));
  }
  /* a shelf of bottles filled with petrol */
  wood.push(at(box(0.32, 0.05, 9), b.x0 + 0.2, b.floor + 1.15, b.roomEnd - 12));
  const Rb = rng(57);
  for (let i = 0; i < 34; i++) bottles.push([b.x0 + 0.2 + (Rb() - 0.5) * 0.12, b.floor + 1.175, b.roomEnd - 7.7 - i * 0.26]);
  for (let i = 0; i < 5; i++) wood.push(at(box(0.6, 0.45, 0.8), b.x0 + 0.35, b.floor + 0.23, b.roomEnd - 22 - i * 2.2, Rb() * 0.2));
  brick.push(...zWall(b.tunnelEnd, b.x0, b.x1, b.floor, 0, { x0: b.x0, x1: b.x1, top: -1.2 }, false));
  stairShaft(stone, brick, { x0: b.x0, x1: b.x1, zTop: b.exitTop, zBot: b.tunnelEnd, floor: b.floor });

  lights.add({ pos: new THREE.Vector3(t1.tx, b.floor + 1.25, t1.tz), color: new THREE.Color(1.0, 0.6, 0.26), base: 2.6, group: 'bunker1', flicker: 0.18 });
  lights.add({ pos: new THREE.Vector3(-6.5, -1.6, b.roomEnd - 17), color: new THREE.Color(1.0, 0.58, 0.24), base: 1.7, group: 'bunker1', flicker: 0.2 });
  lights.add({ pos: new THREE.Vector3(-6.5, -1.6, b.tunnelEnd + 5), color: new THREE.Color(1.0, 0.58, 0.24), base: 1.2, group: 'bunker1', flicker: 0.2 });

  /* Miła 18 */
  const c = P.bunker2;
  stairShaft(stone, brick, { x0: c.x0, x1: c.x1, zTop: c.stairTop, zBot: c.stairBot, floor: c.floor });
  const cx0 = -13, cx1 = -1, ceil2 = -1.0;
  brick.push(room(cx0, cx1, c.floor, ceil2, c.roomEnd, c.stairBot, { north: false, south: false }));
  brick.push(...zWall(c.stairBot, cx0, cx1, c.floor, 0, { x0: c.x0, x1: c.x1, top: -1.15 }, false));
  brick.push(...zWall(c.roomEnd, cx0, cx1, c.floor, 0, { x0: c.x0, x1: c.x1, top: -1.15 }, true));
  const t2 = furnish(cx0, cx1, c.roomEnd, c.stairBot, c.floor, ceil2, 73);
  stairShaft(stone, brick, { x0: c.x0, x1: c.x1, zTop: c.exitTop, zBot: c.roomEnd, floor: c.floor });
  lights.add({ pos: new THREE.Vector3(t2.tx, c.floor + 1.25, t2.tz), color: new THREE.Color(1.0, 0.55, 0.22), base: 2.4, group: 'bunker2', flicker: 0.3 });

  add(scene, merge(brick), brickMaterial({ tint: [0.8, 0.78, 0.75], damp: 1, side: THREE.DoubleSide }));
  add(scene, merge(stone), plainMaterial({ color: [0.13, 0.12, 0.11], rough: 0.5 }));
  add(scene, merge(wood), woodMaterial({ tint: [0.15, 0.1, 0.065], plank: 0.2, vertical: 0, side: THREE.DoubleSide }));
  add(scene, merge(dark), plainMaterial({ color: [0.06, 0.055, 0.05], rough: 0.6 }));

  /* the lamps themselves: a small flame behind glass */
  const lampGeo = merge([at(cyl(0.05, 0.07, 0.12, 8), 0, 0.06, 0), at(new THREE.SphereGeometry(0.055, 8, 6), 0, 0.2, 0, 0, 0, 0, 1, 1.5, 1)]);
  const lamp1 = add(scene, at(lampGeo.clone(), t1.tx, b.floor + 0.815, t1.tz), plainMaterial({ color: [0.3, 0.2, 0.1], emissive: [2.2, 1.2, 0.4] }));
  const lamp2 = add(scene, at(lampGeo.clone(), t2.tx, c.floor + 0.815, t2.tz), plainMaterial({ color: [0.3, 0.2, 0.1], emissive: [2.2, 1.2, 0.4] }));

  /* bottles */
  const bottleGeo = bottleGeometry();
  const bm = new THREE.InstancedMesh(bottleGeo, plainMaterial({ color: [0.1, 0.075, 0.03], rough: 0.2, emissive: [0.012, 0.008, 0.002] }), bottles.length);
  const m = new THREE.Matrix4();
  bottles.forEach(([x, y, z], i) => bm.setMatrixAt(i, m.makeTranslation(x, y, z)));
  bm.frustumCulled = false;
  scene.add(bm);

  /* those who waited in Miła 18 */
  const Rm = rng(1818);
  const inside = [];
  for (let i = 0; i < 11; i++) {
    const seated = Rm() < 0.45;
    inside.push({ kind: seated ? (Rm() < 0.5 ? 'seated' : 'seatedW') : ['man3', 'woman2', 'watcher', 'man2'][Math.floor(Rm() * 4)], x: cx0 + 1 + Rm() * 3.6, y: c.floor, z: c.roomEnd + 2 + Rm() * (c.stairBot - c.roomEnd - 4), ry: Math.PI / 2 + (Rm() - 0.5) });
  }
  const waiting = crowd(scene, inside, washMaterial());

  return { lamp1, lamp2, bottleGeo, waiting, table1: t1, table2: t2 };
}

/* ── flags ─────────────────────────────────────────────────── */
function flagOn(scene, poles, p, kind, { ry = Math.PI / 2 - 0.35, h = 6.4, w = 3.3 } = {}) {
  poles.push(at(cyl(0.05, 0.06, h, 6), p[0], p[1] + h / 2, p[2]));
  const geo = new THREE.PlaneGeometry(w, w * 0.62, 28, 12).translate(w / 2, 0, 0);
  const mesh = new THREE.Mesh(geo, flagMaterial(kind));
  mesh.position.set(p[0], p[1] + h - w * 0.36, p[2]);
  mesh.rotation.y = ry;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function buildFlags(scene, street) {
  const poles = [];
  const fh = street.flagHouse;
  /* the two on the roof at Muranowski Square: Poland's, and the blue and white */
  const out = [
    flagOn(scene, poles, fh.roofAt(-3.2, -1.6), 0),
    flagOn(scene, poles, fh.roofAt(3.2, -1.6), 1),
  ];
  /* and one over the corner of Miła */
  const ne = street.corners.ne;
  out.push(flagOn(scene, poles, ne.roofAt(ne.W / 2 - 3.0, -2.4), 3, { ry: Math.PI + 0.5, h: 5.2, w: 2.6 }));
  add(scene, merge(poles), plainMaterial({ color: [0.07, 0.06, 0.05] }));
  return out;
}

/* The flags later attributed to the two organizations, hung in the cellar. */
function buildBanners(scene, bunkers) {
  const b = P.bunker1;
  const out = [];
  const hang = (kind, x, y, z, ry, caption) => {
    const w = 1.5;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.64, 14, 8), flagMaterial(kind, { hung: true }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.frustumCulled = false;
    scene.add(mesh);
    out.push({ id: 'banner' + kind, z, range: 7, caption, mesh, mat: mesh.material, pos: mesh.position.clone() });
  };
  hang(3, -11.9, b.floor + 1.62, bunkers.table1.tz - 2.3, Math.PI / 2, 'The flag later attributed to the ŻOB.');
  hang(2, b.x1 - 0.06, b.floor + 1.5, b.roomEnd - 11.5, -Math.PI / 2, 'The flag later attributed to the ŻZW.');
  return out;
}

/* ── the Great Synagogue on Tłomackie Street ───────────────── */
function buildSynagogue(scene) {
  const { x, z } = P.synagogue;
  const seg = (w, h, d, a = 6, b = 5, c = 6) => new THREE.BoxGeometry(w, h, d, a, b, c);
  const stone = [
    at(seg(34, 17, 26, 10, 6, 8), x - 4, 8.5, z),
    at(seg(20, 11, 9, 6, 4, 3), x - 6, 5.5, z - 17.5),
    at(seg(20, 11, 9, 6, 4, 3), x - 6, 5.5, z + 17.5),
    /* the steps up to the portico */
    at(seg(8.5, 0.4, 27, 2, 1, 8), x + 17, 0.2, z),
    at(seg(7.3, 0.4, 26, 2, 1, 8), x + 16.4, 0.6, z),
    at(seg(6.1, 0.4, 25, 2, 1, 8), x + 15.8, 1.0, z),
    /* entablature, and a cornice round the main block and the wings */
    at(seg(4.2, 1.7, 23, 2, 1, 8), x + 15.6, 13.4, z),
    at(seg(35.2, 0.9, 27.2, 10, 1, 8), x - 4, 17.2, z),
    at(seg(35.6, 0.5, 27.6, 10, 1, 8), x - 4, 12.4, z),
    at(seg(21, 0.7, 10, 6, 1, 3), x - 6, 11.2, z - 17.5),
    at(seg(21, 0.7, 10, 6, 1, 3), x - 6, 11.2, z + 17.5),
    /* the dome: a drum with a ring under it, the shell, and the lantern */
    at(new THREE.CylinderGeometry(8.3, 8.3, 0.8, 24, 1), x - 2, 17.9, z),
    at(new THREE.CylinderGeometry(7.6, 7.6, 5.5, 24, 3), x - 2, 20.6, z),
    at(new THREE.CylinderGeometry(8.0, 8.0, 0.6, 24, 1), x - 2, 23.5, z),
    at(new THREE.SphereGeometry(7.9, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), x - 2, 23.6, z, 0, 0, 0, 1, 1.1, 1),
    at(new THREE.CylinderGeometry(1.25, 1.45, 3.0, 8, 2), x - 2, 33.4, z),
    at(new THREE.SphereGeometry(1.5, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), x - 2, 34.9, z),
    at(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5, 2), x - 2, 37.4, z),
  ];
  /* the portico: four columns, each with a base and a capital */
  for (const dz of [-9.2, -3.1, 3.1, 9.2]) {
    stone.push(at(new THREE.CylinderGeometry(0.82, 0.96, 10.6, 14, 6), x + 16, 6.9, z + dz));
    stone.push(at(seg(2.3, 0.5, 2.3, 1, 1, 1), x + 16, 1.45, z + dz), at(seg(2.4, 0.7, 2.4, 1, 1, 1), x + 16, 12.25, z + dz));
  }
  /* ribs on the dome */
  for (let i = 0; i < 12; i++) {
    const ang = i / 12 * Math.PI * 2;
    const rib = new THREE.TorusGeometry(8.0, 0.14, 4, 10, Math.PI / 2);
    rib.rotateY(ang);
    stone.push(at(rib, x - 2, 23.6, z, 0, 0, 0, 1, 1.1, 1));
  }
  /* pilasters between the windows of the long sides */
  for (const sz of [-1, 1]) for (let i = 0; i <= 5; i++) stone.push(at(seg(0.9, 15.4, 0.35, 1, 5, 1), x - 19.5 + i * 6.2, 8.2, z + sz * 13.15));
  /* the pediment */
  const tri = new THREE.Shape([new THREE.Vector2(-11.5, 0), new THREE.Vector2(11.5, 0), new THREE.Vector2(0, 4.2)]);
  const ped = new THREE.ExtrudeGeometry(tri, { depth: 4.2, bevelEnabled: false, steps: 2 });
  stone.push(at(ped, x + 17.7, 14.25, z, -Math.PI / 2));

  /* windows and doors: tall, round headed, dark */
  const dark = [];
  const arch = (px, py, pz, w, h, ry) => {
    dark.push(at(seg(w, h, 0.16, 1, 2, 1), px, py + h / 2, pz, ry));
    const head = new THREE.CylinderGeometry(w / 2, w / 2, 0.16, 12, 1, false, 0, Math.PI);
    head.rotateX(Math.PI / 2); head.rotateZ(Math.PI / 2);
    dark.push(at(head, px, py + h, pz, ry));
  };
  for (const dz of [-6.1, 0, 6.1]) arch(x + 13.05, 1.3, z + dz, 2.3, dz === 0 ? 6.4 : 5.2, Math.PI / 2);
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 5; i++) arch(x - 16.4 + i * 6.2, 3.2, z + sz * 13.06, 2.2, 7.2, sz > 0 ? 0 : Math.PI);
    for (let i = 0; i < 3; i++) arch(x - 12.5 + i * 6.5, 2.4, z + sz * 22.06, 1.9, 5.0, sz > 0 ? 0 : Math.PI);
    arch(x + 4.06, 2.4, z + sz * 17.5, 1.9, 5.0, Math.PI / 2);
  }
  for (let i = 0; i < 10; i++) {
    const ang = i / 10 * Math.PI * 2;
    arch(x - 2 + Math.sin(ang) * 7.62, 19.0, z + Math.cos(ang) * 7.62, 1.2, 2.4, ang);
  }
  const mat = plainMaterial({ color: [0.3, 0.28, 0.25], rough: 0.4, collapse: true, side: THREE.DoubleSide });
  const mesh = add(scene, merge(stone), mat);
  /* the same fall for the windows, so they come down with the walls they are in */
  const darkMat = plainMaterial({ color: [0.02, 0.019, 0.018], rough: 0.2, collapse: true, side: THREE.DoubleSide });
  darkMat.uniforms.uCollapse = mat.uniforms.uCollapse;
  add(scene, merge(dark), darkMat);
  return { mesh, mat, pos: new THREE.Vector3(x, 12, z) };
}

/* ── what was left ─────────────────────────────────────────── */
/* A heap of rubble: a lumpy dome, flat shaded so every facet is a broken face. */
function heap(x, z, r, h, seed) {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const n = 0.8 + 0.2 * Math.sin(vx * 5.1 + seed) * Math.sin(vz * 4.3 + seed * 1.7) + 0.16 * Math.sin(vy * 7.0 + vx * 3.0 + seed * 2.1) + 0.1 * Math.sin(vx * 13.0 + vz * 11.0 + seed);
    pos.setXYZ(i, vx * r * n, Math.max(vy, -0.25) * h * n, vz * r * n);
  }
  g.computeVertexNormals();
  return at(g, x, -0.05, z);
}

function buildRuins(scene) {
  const R = rng(2025);
  const F = P.field;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const mats = [];
  const push = (x, y, z, sx, sy, sz) => {
    q.setFromEuler(e.set(R() * 1.6 - 0.8, R() * 6.28, R() * 1.6 - 0.8));
    m.compose(v.set(x, y, z), q, s.set(sx, sy, sz));
    mats.push(m.clone());
  };
  const inSyn = (x, z, pad = 0) => x < -30 + pad && z > P.synagogue.z - 33 - pad && z < P.synagogue.z + 33 + pad;

  /* heaps at the foot of the burnt houses */
  const heaps = [];
  for (let i = 0; i < 46; i++) {
    const z = P.burn.z0 - 26 - R() * (P.burn.z0 - P.ruinZ - 26);
    const side = R() < 0.5 ? -1 : 1;
    const r = 1.2 + R() * 2.2;
    if (STANDS.some((st) => Math.abs(st.z - z) < r + 2.4 && Math.sign(st.x) === side)) continue;
    heaps.push([side * (8.4 - r * 0.45), z, r, 0.5 + R() * 1.1]);
  }
  /* the field: mounds of broken brick as far as the fog */
  for (let i = 0; i < 120; i++) {
    const r = 3 + R() * 8;
    const x = (R() - 0.5) * 210, z = P.ruinZ - 4 - R() * 250;
    if (Math.abs(x) - r < 2.3) continue;
    if (inSyn(x, z, r)) continue;
    if (Math.hypot(x, z - P.mound.z) < 12 + r) continue;
    if (STANDS.some((st) => Math.hypot(st.x - x, st.z - z) < r + 2.6)) continue;
    heaps.push([x, z, r, 0.7 + R() * 2.9]);
  }
  add(scene, merge(heaps.map((hp, i) => heap(hp[0], hp[1], hp[2], hp[3], i * 1.37))), rubbleMaterial());

  /* loose pieces: bricks and lumps of wall, on the heaps and across the road */
  for (let i = 0; i < 2600; i++) {
    const hp = heaps[Math.floor(R() * heaps.length)];
    const a = R() * 6.28, rr = Math.sqrt(R()) * hp[2] * 1.05;
    const x = hp[0] + Math.cos(a) * rr, z = hp[1] + Math.sin(a) * rr;
    if (Math.abs(x) < 1.5) continue;
    const y = hp[3] * 0.8 * Math.sqrt(Math.max(0, 1 - (rr / hp[2]) ** 2));
    const k = 0.14 + R() * R() * 0.6;
    push(x, y + k * 0.25, z, k * (1 + R() * 1.4), k * (0.4 + R() * 0.6), k * (0.6 + R()));
  }
  for (let i = 0; i < 500; i++) {
    const x = (R() < 0.5 ? -1 : 1) * (1.4 + R() * R() * 14), z = P.burn.z0 - 30 - R() * 370;
    if (inSyn(x, z)) continue;
    if (Math.hypot(x, z - P.mound.z) < 17) continue;
    const k = 0.1 + R() * 0.28;
    push(x, k * 0.2, z, k * (1 + R()), k * 0.45, k * (0.6 + R() * 0.6));
  }
  const chunks = new THREE.InstancedMesh(box(1, 1, 1), brickMaterial({ tint: [0.8, 0.76, 0.72] }), mats.length);
  mats.forEach((mm, i) => chunks.setMatrixAt(i, mm));
  chunks.frustumCulled = false;
  scene.add(chunks);

  /* chimneys and stubs of wall, still upright */
  const stubs = [];
  for (let i = 0; i < 26; i++) {
    const x = (R() < 0.5 ? -1 : 1) * (9 + R() * 80), z = P.ruinZ - 20 - R() * 220;
    if (inSyn(x, z, 4)) continue;
    if (Math.hypot(x, z - P.mound.z) < 34) continue;
    /* keep the view of the synagogue clear from the road */
    if (x > -32 && x < 12 && z > P.synagogue.z - 42 && z < P.synagogue.z + 48) continue;
    const hgt = 3.5 + R() * R() * 11;
    stubs.push(at(box(0.9 + R() * 1.6, hgt, 0.8 + R()), x, hgt / 2, z, R() * 3, (R() - 0.5) * 0.1, (R() - 0.5) * 0.1));
  }
  add(scene, merge(stubs), brickMaterial({ tint: [0.7, 0.68, 0.66] }));

  /* one church stood in the middle of it */
  const gable = new THREE.Shape([new THREE.Vector2(-7.5, 0), new THREE.Vector2(7.5, 0), new THREE.Vector2(0, 8.5)]);
  const stoneC = [
    at(box(15, 17, 36), 0, 8.5, 0),
    at(new THREE.ExtrudeGeometry(gable, { depth: 36, bevelEnabled: false }), 0, 17, -18),
    /* the aisles, lower, down both sides */
    at(box(5, 9, 32), -10, 4.5, -1), at(box(5, 9, 32), 10, 4.5, -1),
    /* the apse */
    at(new THREE.CylinderGeometry(6.5, 6.5, 15, 12, 1, false, Math.PI / 2, Math.PI), 0, 7.5, -18),
    /* the tower: three stages, a belfry, a spire and four pinnacles */
    at(box(8, 20, 8), 0, 10, 21.5), at(box(7.2, 14, 7.2), 0, 27, 21.5), at(box(6.4, 9, 6.4), 0, 38.5, 21.5),
    at(box(8.6, 0.8, 8.6), 0, 20.2, 21.5), at(box(7.8, 0.7, 7.8), 0, 34.2, 21.5), at(box(7.2, 0.7, 7.2), 0, 43.2, 21.5),
    at(new THREE.ConeGeometry(4.6, 20, 8), 0, 53.5, 21.5, Math.PI / 8),
  ];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) stoneC.push(at(new THREE.ConeGeometry(0.7, 4.5, 4), sx * 3, 45.6, 21.5 + sz * 3, Math.PI / 4));
  /* buttresses between the windows */
  for (const sx of [-1, 1]) for (let i = 0; i <= 5; i++) stoneC.push(at(box(1.1, 11, 1.4), sx * 12.9, 5.5, -15 + i * 6), at(box(0.9, 6, 1.2), sx * 7.9, 13, -15 + i * 6));
  const darkC = [];
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
    darkC.push(at(box(0.2, 5.5, 1.5), sx * 12.55, 4.6, -12 + i * 6), at(box(0.2, 4.6, 1.3), sx * 7.55, 13.4, -12 + i * 6));
  }
  for (const [dx, dz, ry] of [[0, 3.25, 0], [0, -3.25, 0], [3.25, 0, Math.PI / 2], [-3.25, 0, Math.PI / 2]]) darkC.push(at(box(1.6, 5, 0.2), dx, 39, 21.5 + dz, ry), at(box(1.3, 4.2, 0.2), dx * 1.12, 27, 21.5 + dz * 1.12, ry));
  darkC.push(at(box(3.2, 5.6, 0.2), 0, 2.8, 25.55), at(new THREE.CylinderGeometry(2.1, 2.1, 0.2, 14), 0, 13.5, 25.55, 0, Math.PI / 2));
  const cx = 104, cz = F.z0 - 92, cr = -2.25;
  add(scene, at(merge(stoneC), cx, 0, cz, cr), plainMaterial({ color: [0.2, 0.19, 0.18], rough: 0.35 }));
  add(scene, at(merge(darkC), cx, 0, cz, cr), plainMaterial({ color: [0.02, 0.02, 0.02], rough: 0.1 }));

  /* the mound over the command bunker: a low rise of earth, and a stone standing on it */
  /* the cap of a wide sphere, so it meets the ground at a shallow angle */
  const rise = new THREE.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, 0.9).translate(0, -Math.cos(0.9), 0);
  add(scene, at(rise, 0, -0.03, P.mound.z, 0, 0, 0, 14.2, 5.6, 11.6), plainMaterial({ color: [0.06, 0.057, 0.048], rough: 0.5 }));
  /* a rough boulder, as the one that stands there: broken faces, wider at the foot, level enough on top */
  const stone = new THREE.IcosahedronGeometry(1, 1);
  const sp = stone.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const vx = sp.getX(i), vy = sp.getY(i), vz = sp.getZ(i);
    const n = 0.86 + 0.2 * Math.sin(vx * 7.3 + vy * 3.1 + 1) * Math.sin(vz * 6.1 - vy * 4.3 + 2) + 0.1 * Math.sin(vy * 9 + vx * 5);
    const foot = 1.12 - 0.2 * vy;
    sp.setXYZ(i, vx * 1.3 * n * foot, Math.min(vy * 1.5 * n, 1.12), vz * 0.72 * n * foot);
  }
  stone.computeVertexNormals();
  /* (the boulder is not set up: the monument stands on the mound in its place, on its own stone. See gl/monument.js) */


  /* twenty eight candles, set on the slope of it, where they can be seen from the path */
  const slope = (x, z) => 5.6 * (Math.sqrt(Math.max(0, 1 - (x / 14.2) ** 2 - (z / 11.6) ** 2)) - Math.cos(0.9)) - 0.03;
  const cm = new THREE.InstancedMesh(cyl(0.05, 0.055, 0.12, 10), plainMaterial({ color: [0.6, 0.55, 0.44], rough: 0.15, emissive: [0.05, 0.035, 0.018] }), 28);
  const flames = [];
  for (let i = 0; i < 28; i++) {
    const row = i % 2, col = Math.floor(i / 2);
    const x = (col - 6.5) * 0.52 + row * 0.26;
    const dz = 6.3 + row * 0.55 + Math.abs(col - 6.5 + row * 0.5) * 0.05;
    const z = P.mound.z + dz, y = slope(x, dz);
    cm.setMatrixAt(i, m.makeTranslation(x, y + 0.05, z));
    flames.push(new THREE.Vector3(x, y + 0.105, z));
  }
  cm.frustumCulled = false;
  scene.add(cm);
  return { flames };
}

/* ── photographs: the record, standing next to the model ───── */
export const STANDS = [
  { id: 'wall', x: -5.7, z: -40, w: 3.5, caption: 'Workers raising the ghetto wall, 1940 or 1941.' },
  { id: 'tram', x: 5.7, z: -80, w: 3.4, caption: 'A tram marked with the Star of David, Leszno and Karmelicka Streets, May 1941. Ludwig Knobloch, Bundesarchiv.' },
  { id: 'smuggle', x: -5.7, z: -92, w: 3.3, caption: 'Smuggling food over the ghetto wall, 1941.' },
  { id: 'children', x: 5.7, z: -104, w: 2.8, caption: 'Children in the ghetto. Mariańska Street.' },
  { id: 'cans', x: -5.7, z: -115, w: 3.2, caption: 'The metal boxes and milk cans in which the Oneg Shabbat archive was buried.' },
  { id: 'ringelblum', x: 5.6, z: -124, w: 1.1, caption: 'Emanuel Ringelblum, the historian who led the archive.' },
  { id: 'crowd', x: -5.7, z: -134, w: 3.3, caption: 'Men wearing the armband, Prosta Street, May 1941. Ludwig Knobloch, Bundesarchiv.' },
  { id: 'pocket', x: -5.8, z: -471, w: 3.4, caption: 'A gun brought up against a house that was still fighting. From the Stroop Report.' },
  { id: 'squareflag', x: -9.5, z: -559, w: 3.0, ry: 0.95, caption: 'The house on Muranowski Square where the flags were raised.' },
  { id: 'gun', x: 22.8, z: -584.6, w: 3.3, ry: -1.9, caption: 'A German gun crew shelling a building. From the Stroop collection.' },
  { id: 'stroop', x: -5.7, z: -613, w: 3.4, caption: 'Jürgen Stroop, centre, with his men in the ghetto. He led the attack on the brushmakers himself.' },
  { id: 'askaris', x: 5.7, z: -649, w: 3.3, caption: 'Trawniki guards used in the operation, at a doorway. From the Stroop Report.' },
  { id: 'nalewki', x: 5.7, z: -646, w: 2.3, caption: 'Houses burning on Nalewki Street, 1943.' },
  { id: 'squad', x: -5.8, z: -657, w: 3.4, caption: 'An assault squad. From the Stroop Report.' },
  { id: 'armed', x: -5.7, z: -672, w: 3.4, caption: 'Fighters taken prisoner. Stroop captioned it: these bandits resisted with arms.' },
  { id: 'fighters', x: 5.7, z: -681, w: 2.2, caption: 'Women of the pioneer movement, captured with weapons. From the Stroop Report.' },
  { id: 'boy', x: -5.7, z: -690, w: 3.5, caption: 'Pulled from the bunkers by force. From the Stroop Report, 1943.' },
  { id: 'march', x: 6.2, z: -762, w: 3.5, caption: 'Marched to the Umschlagplatz. From the Stroop Report, 1943.' },
  { id: 'mound', x: 6.4, z: -914, w: 3.8, caption: 'The mound over the bunker at 18 Miła Street, as it is today. Photograph by Adrian Grycuk.' },
  { id: 'edelman', x: -5.6, z: -927, w: 1.2, caption: 'Marek Edelman, a commander in the ŻOB. He became a cardiologist in Łódź.' },
  { id: 'lubetkin', x: 5.6, z: -933, w: 1.35, caption: 'Zivia Lubetkin, of the ŻOB command. She left the ghetto through the sewers on 10 May 1943.' },
  { id: 'zuckerman', x: -5.6, z: -939, w: 1.2, caption: 'Yitzhak Zuckerman, of the ŻOB command, giving evidence at the Eichmann trial, 1961.' },
  { id: 'rotem', x: 5.8, z: -945, w: 2.4, caption: 'Simcha Rotem, who led fighters out through the sewers. Photographed in 2013 by Joanna Król.' },
];

function buildPlates(scene, tex, bunkers) {
  const out = [];
  const mk = (id, w, seed) => {
    const t = tex[id];
    const h = w * (t.image.height / t.image.width);
    const mat = photoMaterial(t, { seed, glow: 0.5 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    scene.add(mesh);
    return { mesh, mat, h };
  };
  /* a print on an iron stand at the kerb, turned towards whoever is walking up the street */
  const iron = [];
  STANDS.forEach((p, i) => {
    const { mesh, mat, h } = mk(p.id, p.w, i * 1.7 + 1);
    const ry = p.ry !== undefined ? p.ry : (p.x > 0 ? -0.62 : 0.62);
    const y = 1.15 + h / 2;
    mesh.position.set(p.x, y, p.z);
    mesh.rotation.y = ry;
    const put = (g, lx, ly, lz) => iron.push(at(at(g, lx, ly, lz), p.x, 0, p.z, ry));
    put(box(p.w + 0.16, h + 0.16, 0.05), 0, y, -0.04);
    for (const sx of [-1, 1]) {
      put(box(0.06, y + h / 2 + 0.1, 0.06), sx * (p.w / 2 + 0.11), (y + h / 2 + 0.1) / 2, -0.04);
      put(box(0.06, 0.06, 0.9), sx * (p.w / 2 + 0.11), 0.03, -0.3);
    }
    out.push({ ...p, range: 11, mesh, mat, pos: mesh.position.clone() });
  });
  add(scene, merge(iron), plainMaterial({ color: [0.035, 0.033, 0.03], rough: 0.3 }));

  /* in the cellar: a portrait by the lamp, and what a bunker looked like */
  const b = P.bunker1;
  const a = mk('anielewicz', 0.85, 20); a.mat.uniforms.uGlow.value = 0.25;
  a.mesh.position.set(-11.93, b.floor + 1.75, bunkers.table1.tz + 0.2); a.mesh.rotation.y = Math.PI / 2;
  out.push({ id: 'anielewicz', z: bunkers.table1.tz, range: 9, caption: 'Mordechai Anielewicz, commander of the ŻOB.', ...a, pos: a.mesh.position.clone() });
  const bk = mk('bunker', 1.75, 21); bk.mat.uniforms.uGlow.value = 0.22;
  bk.mesh.position.set(b.x1 - 0.04, b.floor + 1.5, b.roomEnd - 19); bk.mesh.rotation.y = -Math.PI / 2;
  out.push({ id: 'bunker', z: b.roomEnd - 19, range: 7, caption: 'A hiding place under the ghetto. From the Stroop Report.', ...bk, pos: bk.mesh.position.clone() });

  /* in the open, on a piece of wall left standing */
  const backs = [];
  const free = (id, w, x, y, z, ry, caption, seed) => {
    const f = mk(id, w, seed);
    f.mesh.position.set(x, y, z); f.mesh.rotation.y = ry;
    const bh = y + f.h / 2 + 1.0;
    backs.push(at(box(w + 1.4, bh, 0.55), x - Math.sin(ry) * 0.36, bh / 2, z - Math.cos(ry) * 0.36, ry));
    out.push({ id, z, range: 22, caption, ...f, pos: f.mesh.position.clone() });
  };
  free('report', 4.6, 8.4, 4.2, P.synagogue.z - 26, -1.05, 'The cover of Stroop\'s report to Himmler, May 1943.', 31);
  add(scene, merge(backs), brickMaterial({ tint: [0.7, 0.68, 0.66] }));
  return out;
}

/* ── everything ────────────────────────────────────────────── */
export function buildProps(scene, lights, tex, street) {
  buildWalls(scene);
  buildBridge(scene);
  const tram = buildTram(scene);
  const wagons = buildYard(scene);
  const bunkers = buildBunkers(scene, lights);
  const flags = buildFlags(scene, street);
  const synagogue = buildSynagogue(scene);
  const ruins = buildRuins(scene);
  const plates = [...buildPlates(scene, tex, bunkers), ...buildBanners(scene, bunkers)];

  /* the street, full. Nobody stands in the middle of the road, or in front of a photograph */
  const clear = (x, z) => Math.abs(x) > 1.8 && !STANDS.some((st) => Math.hypot(st.x - x, st.z - z) < 2.6 || (Math.abs(st.x - x) < 2.4 && z > st.z && z < st.z + 5));
  const STILL = ['man', 'man2', 'man3', 'hat', 'hat2', 'old', 'woman', 'woman2', 'woman3', 'mother', 'child', 'girl', 'watcher', 'seated', 'seatedW', 'sack'];
  const street1 = scatter({ n: 70, seed: 5, area: { x0: -7.3, x1: 7.3, z0: P.bridge.stairA + 3, z1: P.wallZ - 8 }, keep: clear, kinds: STILL });
  const street2 = scatter({ n: 30, seed: 6, area: { x0: -7.3, x1: 7.3, z0: P.yard.z1 + 4, z1: P.bridge.stairB - 4 }, keep: clear, kinds: STILL });
  const people = crowd(scene, [...street1, ...street2]);

  /* and the people going somewhere: up and down the street, in lanes that keep clear of the photographs */
  const Rw = rng(4141);
  const KINDS = ['man', 'manHat', 'woman', 'womanH', 'child', 'carrier', 'bundle', 'trudge', 'trudgeM', 'man', 'woman'];
  const lane = () => { const side = Rw() < 0.5 ? -1 : 1; const r = Rw(); return side * (r < 0.62 ? 2.0 + Rw() * 2.3 : 6.8 + Rw() * 0.55); };
  const walking = [];
  const lanes = (n, z0, z1) => {
    for (let i = 0; i < n; i++) {
      const x = lane(), dir = Rw() < 0.5 ? 0 : Math.PI;
      const len = Math.min(60, Math.abs(z1 - z0));
      walking.push({ kind: KINDS[Math.floor(Rw() * KINDS.length)], x, z: (z0 + z1) / 2 + (Rw() - 0.5) * 6, ry: dir, len, s: 0.95 + Rw() * 0.1 });
    }
  };
  lanes(26, P.bridge.stairA + 2, P.wallZ - 6);
  lanes(16, P.yard.z1 + 3, P.bridge.stairB - 3);
  /* outside the wall, before it: a few, going where they like */
  for (let i = 0; i < 7; i++) walking.push({ kind: ['man', 'manHat', 'womanH', 'woman'][i % 4], x: (i % 2 ? 1 : -1) * (5.4 + Rw() * 1.8), z: -28 + (Rw() - 0.5) * 8, ry: Rw() < 0.5 ? 0 : Math.PI, len: 44 });
  /* Chłodna, under the bridge: the other Warsaw, crossing from side to side */
  const cz = (P.cross.z0 + P.cross.z1) / 2;
  for (let i = 0; i < 14; i++) {
    const z = cz + (Rw() < 0.5 ? -1 : 1) * (5.5 + Rw() * 5.5);
    walking.push({ kind: ['manO', 'manHatO', 'womanHO', 'womanO', 'carrierO'][i % 5], x: (Rw() - 0.5) * 30, z, ry: Rw() < 0.5 ? Math.PI / 2 : -Math.PI / 2, len: 60 });
  }
  /* and across the bridge itself */
  const B = P.bridge;
  for (let i = 0; i < 8; i++) walking.push({ kind: ['man', 'womanH', 'manHat', 'trudge'][i % 4], x: i % 2 ? 0.75 : -0.75, y: B.y, z: (B.deckA + B.deckB) / 2, ry: i % 2 ? 0 : Math.PI, len: Math.abs(B.deckA - B.deckB) - 1, ph: i * 1.7 });
  const passers = walkers(scene, walking, { seed: 9 });

  /* the yard: lines of people walking to the open doors of the wagons, and going in */
  const Ry = rng(1942);
  const lines = [];
  const x0 = 3, x1 = P.yard.trackX - 3.4;
  wagons.forEach((wz) => {
    for (let i = 0; i < 9; i++) {
      const kinds = ['trudge', 'trudgeM', 'mother', 'carrier', 'bundle', 'child', 'sack', 'trudge', 'bundle'];
      lines.push({ kind: kinds[Math.floor(Ry() * kinds.length)], x: (x0 + x1) / 2, z: wz + (Ry() - 0.5) * 1.6, ry: Math.PI / 2, len: x1 - x0, ph: i / 9 * 11 + Ry() * 0.3, s: 0.95 + Ry() * 0.1, pace: 0.85 });
    }
  });
  const waiting = scatter({ n: 28, seed: 9, area: { x0: -7.2, x1: 7.2, z0: P.yard.z1 - 2, z1: P.yard.z1 + 26 }, keep: clear, face: Math.PI, kinds: ['trudge', 'carrier', 'carrierW', 'sack', 'mother', 'old', 'woman2', 'man3', 'child', 'girl', 'walker', 'walkerW'] });
  const deported = crowd(scene, waiting, washMaterial());
  deported.material.uniforms.uGoneAxis.value.set(P.yard.z1 + 26, P.yard.z0, 0, 1);
  const marched = walkers(scene, lines, { seed: 11, gone: deported.material.uniforms.uGone });

  /* guards along the lines, each with a dog that strains at the people passing */
  const guards = buildGuardDogs(scene, [
    { x: 7.5, z: wagons[0] - 2.7, ry: 0 }, { x: 13.5, z: wagons[1] + 2.7, ry: Math.PI },
    { x: 9.2, z: wagons[2] - 2.7, ry: 0 }, { x: 15.0, z: wagons[3] + 2.7, ry: Math.PI },
    { x: 6.6, z: wagons[4] - 2.7, ry: 0 }, { x: 5.2, z: P.yard.z1 + 3.5, ry: -2.2 },
  ], deported.material.uniforms.uGone);

  return { tram, bunkers, flags, synagogue, ruins, plates, people, deported, passers, marched, guards };
}
