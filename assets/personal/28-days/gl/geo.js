/* ============================================================
   Small geometry helpers. Everything in the world is built from
   boxes, cylinders and lathes, measured in metres, then merged so
   a whole street costs a handful of draw calls.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

/* A box whose uv is in metres, so brick and plank patterns keep their size. */
export function box(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]);
    }
  }
  return g;
}

/* Move, turn and scale a geometry. Returns the same geometry. */
export function at(g, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
  g.applyMatrix4(_m);
  return g;
}

/* Merge geometries that may or may not be indexed, keeping position, normal, uv. */
export function merge(list) {
  const clean = list.filter(Boolean).map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    return n;
  });
  return mergeGeometries(clean, false);
}

/* A flat rectangle standing on four given corners (a, b, c, d counter clockwise),
   with uv in metres. For sloped rails and walls that a box cannot make. */
export function quad(a, b, c, d) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array([...a, ...b, ...c, ...a, ...c, ...d]);
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), vd = new THREE.Vector3(...d);
  const n = new THREE.Vector3().crossVectors(vb.clone().sub(va), vd.clone().sub(va)).normalize();
  const w = vb.distanceTo(va), h = vd.distanceTo(va);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Array(6).fill([n.x, n.y, n.z]).flat()), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, w, 0, w, h, 0, 0, w, h, 0, h]), 2));
  return g;
}

/* The inside of a room: floor, ceiling and the walls you ask for, facing in. */
export function room(x0, x1, y0, y1, z0, z1, { floor = true, ceil = true, west = true, east = true, north = true, south = true } = {}) {
  const parts = [];
  if (floor) parts.push(quad([x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]));
  if (ceil) parts.push(quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]));
  if (west) parts.push(quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]));
  if (east) parts.push(quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]));
  if (north) parts.push(quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]));  // the wall at z0, the far one
  if (south) parts.push(quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]));  // the wall at z1, the near one
  return merge(parts);
}

/* a bottle: the cellar shelves are full of them, and the fight throws them */
export function bottleGeometry() {
  const prof = [[0, 0], [0.036, 0], [0.038, 0.02], [0.038, 0.15], [0.03, 0.19], [0.013, 0.22], [0.013, 0.28], [0.016, 0.285], [0, 0.285]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(prof, 8);
}

export { THREE };
