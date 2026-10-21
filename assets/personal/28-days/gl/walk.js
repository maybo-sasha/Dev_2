/* ============================================================
   People walking.

   A figure is posed by angles (figures.js). To walk, it is posed
   again at sixteen moments of one stride, and all sixteen are kept
   in a texture. The shader finds where in its stride each walker
   is and blends the two nearest moments. Every stride it takes, the
   walker moves on by exactly the length of a stride, so the foot
   that is on the ground stays where it is put.

   A walker walks along a path: straight ahead from where it was
   placed, so far, and then it fades and comes back at the start,
   as a print fades, a dot at a time.
   ============================================================ */

import * as THREE from 'three';
import { person, OUTFITS } from './figures.js';
import { washMaterial, lineMaterial, QUALITY } from './ink.js';
import { world, rng } from './common.js';

const FRAMES = 16;
const TW = 2048;                  // texels across the stride texture

/* The ways of walking. Angles in degrees: the swing of the thigh, the bend of the knee as the
   foot takes the weight and as it swings through, the swing of the arm and the bend of the
   elbow, how far the body leans, and how the head is held. */
export const GAITS = {
  walk:   { thigh: 21, bias: 2, out: 3, k0: 4, kLoad: 12, kSwing: 52, arm: 17, armBias: 3, armOut: 7, elbow: 12, elbowSwing: 18, lean: 4, twist: 5, head: 5, cadence: 0.9 },
  stroll: { thigh: 17, bias: 2, out: 3, k0: 4, kLoad: 10, kSwing: 46, arm: 11, armBias: 4, armOut: 7, elbow: 14, elbowSwing: 12, lean: 3, twist: 4, head: 7, cadence: 0.78 },
  trudge: { thigh: 15, bias: 1, out: 4, k0: 7, kLoad: 10, kSwing: 40, arm: 5, armBias: 6, armOut: 8, elbow: 18, elbowSwing: 6, lean: 13, twist: 3, head: 17, cadence: 0.68 },
  march:  { thigh: 24, bias: 2, out: 2, k0: 3, kLoad: 10, kSwing: 56, arm: 22, armBias: 1, armOut: 6, elbow: 6, elbowSwing: 14, lean: 2, twist: 4, head: 0, cadence: 0.95 },
  wade:   { thigh: 19, bias: 4, out: 6, k0: 12, kLoad: 10, kSwing: 46, arm: 12, armBias: 10, armOut: 24, elbow: 34, elbowSwing: 10, lean: 24, twist: 6, head: -4, cadence: 0.62 },
};

const bump = (x, c, w) => { let d = x - c; d -= Math.round(d); return Math.exp(-(d * d) / (w * w)); };

/* one moment of a stride. ph 0: the left heel comes down. hold: an arm that carries something
   and does not swing ('L', 'R', or 'both'). */
export function walkPose(ph, gait = 'walk', hold = null) {
  const G = typeof gait === 'string' ? GAITS[gait] : gait;
  const tau = Math.PI * 2;
  const leg = (q) => {
    const thigh = G.thigh * Math.cos(tau * q) + G.bias;
    const knee = G.k0 + G.kLoad * bump(q, 0.12, 0.07) + G.kSwing * bump(q, 0.7, 0.13);
    return [thigh, G.out, thigh - knee];
  };
  const arm = (q, held) => {
    const s = held ? 0.15 : 1;
    const a = -G.arm * Math.cos(tau * q) * s + G.armBias + (held ? 8 : 0);
    const bend = G.elbow + G.elbowSwing * Math.max(0, -Math.cos(tau * q)) * s + (held ? 6 : 0);
    return [a, G.armOut, a + bend, -G.armOut * 0.3];
  };
  return {
    legL: leg(ph), legR: leg(ph + 0.5),
    armL: arm(ph, hold === 'L' || hold === 'both'), armR: arm(ph + 0.5, hold === 'R' || hold === 'both'),
    lean: G.lean, twist: G.twist * Math.sin(tau * ph), head: [G.head + 2 * Math.sin(tau * 2 * ph), 0],
  };
}

/* the stride: how far the body goes on while one foot is on the ground, twice */
function strideOf(G, scale) {
  const R = Math.PI / 180;
  let zMax = -1e9, zMin = 1e9;
  for (let i = 0; i <= 40; i++) {
    const q = i / 80;                                  // the first half: the left foot is down
    const thigh = G.thigh * Math.cos(Math.PI * 2 * q) + G.bias;
    const knee = G.k0 + G.kLoad * bump(q, 0.12, 0.07) + G.kSwing * bump(q, 0.7, 0.13);
    const z = 0.45 * Math.sin(thigh * R) + 0.43 * Math.sin((thigh - knee) * R);
    zMax = Math.max(zMax, z); zMin = Math.min(zMin, z);
  }
  return 2 * (zMax - zMin) * 0.9 * scale;              // 0.9: the figure is drawn a little narrow front to back
}

/* the kinds of walker: [gait, outfit, props, the arm that carries] */
export const WALKERS = {
  man:      ['walk', 'man'],
  manHat:   ['walk', 'manHat'],
  woman:    ['walk', 'woman'],
  womanH:   ['stroll', 'womanHair'],
  child:    ['walk', 'child'],
  carrier:  ['walk', 'man', { case: true }, 'R'],
  bundle:   ['trudge', 'woman', { bundle: true }, 'R'],
  sack:     ['trudge', 'man', { sack: true }, 'both'],
  trudge:   ['trudge', 'woman'],
  trudgeM:  ['trudge', 'manHat'],
  mother:   ['trudge', 'woman', { baby: true }, 'both'],
  soldier:  ['march', 'soldier', { rifle: 'slung' }],
  /* the other Warsaw */
  manO:     ['walk', 'manOut'],
  manHatO:  ['walk', 'manHatOut'],
  womanO:   ['walk', 'womanOut'],
  womanHO:  ['stroll', 'womanHairOut'],
  carrierO: ['walk', 'manOut', { case: true }, 'R'],
  fighter:  ['wade', 'fighter'],
  fighterW: ['wade', 'fighterW'],
  fighterB: ['wade', 'fighterB'],
};

const baked = {};
function bake(kind) {
  if (baked[kind]) return baked[kind];
  const [gait, outfit, props = {}, hold = null] = WALKERS[kind];
  const frames = [];
  for (let f = 0; f < FRAMES; f++) frames.push(person(walkPose(f / FRAMES, gait, hold), outfit, props));
  const V = frames[0].attributes.position.count;
  for (const g of frames) if (g.attributes.position.count !== V) throw new Error('walker ' + kind + ': frames differ');
  const rows = Math.ceil(V / TW);
  const H = 2 * FRAMES * rows;
  const data = new Uint16Array(TW * H * 4);
  const half = THREE.DataUtils.toHalfFloat;
  frames.forEach((g, f) => {
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let i = 0; i < V; i++) {
      const row = Math.floor(i / TW), x = i - row * TW;
      const ip = ((f * rows + row) * TW + x) * 4, inn = (((FRAMES + f) * rows + row) * TW + x) * 4;
      data[ip] = half(P[i * 3]); data[ip + 1] = half(P[i * 3 + 1]); data[ip + 2] = half(P[i * 3 + 2]); data[ip + 3] = half(1);
      data[inn] = half(N[i * 3]); data[inn + 1] = half(N[i * 3 + 1]); data[inn + 2] = half(N[i * 3 + 2]); data[inn + 3] = half(0);
    }
  });
  const tex = new THREE.DataTexture(data, TW, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  const G = GAITS[gait];
  const scale = OUTFITS[outfit].scale || 1;
  baked[kind] = { geo: frames[0], tex, info: new THREE.Vector4(FRAMES, rows, TW, 0), stride: strideOf(G, scale), cadence: G.cadence };
  return baked[kind];
}

/* The soft dark patch under a walker's feet, going with it. */
function blobMaterial(clock, gone, stay) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...world, uWalkT: clock, uGone: gone, uStay: { value: stay ? 1 : 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 aWalk;
      uniform float uWalkT, uStay; uniform vec3 uWalker;
      varying vec2 vUv; varying float vEnd; varying vec3 vP;
      void main() {
        vUv = uv;
        float cyc = uWalkT * aWalk.y + aWalk.x;
        float len = max(aWalk.w, 0.001);
        float along = (mod(cyc * aWalk.z, len) - len * 0.5) * (1.0 - uStay);
        vEnd = smoothstep(len * 0.4, len * 0.5, abs(along)) * (1.0 - uStay);
        vec3 p = position + vec3(0.0, 0.0, along);
        vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vec3 foot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, along, 1.0)).xyz;
        vec2 offW = foot.xz - uWalker.xz;
        float nearW = length(offW);
        wp.xz += (nearW > 0.001 ? offW / nearW : vec2(1.0, 0.0)) * smoothstep(1.35, 0.3, nearW) * step(abs(foot.y - uWalker.y), 1.2) * 0.8;
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv; varying float vEnd; varying vec3 vP;
      uniform float uGone;
      uniform vec3 uFogCol; uniform float uFogDen;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = 1.0 - smoothstep(0.15, 1.0, r);
        float fog = 1.0 - exp(-uFogDen * uFogDen * dot(vP - cameraPosition, vP - cameraPosition));
        a = a * a * 0.55 * (1.0 - smoothstep(0.0, 0.7, uGone)) * (1.0 - vEnd) * (1.0 - fog);
        gl_FragColor = vec4(vec3(0.0), a);
      }
    `,
  });
}
const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/* the clock every walker in the street keeps: the world's own time, which stops when time is held */
export const WALK_CLOCK = { value: 0 };

/* Walkers: a list of { kind, x, y, z, ry, len, s, ph }. They walk the way they face, along a path
   len long that is centred where they were put. clock: a { value } in seconds, shared by all. */
export function walkers(scene, list, { dress = 'lilac', clock = WALK_CLOCK, pace = 1, seed = 1, gone = null, speed = 0, stay = false } = {}) {
  const R = rng(seed);
  const byKind = {};
  for (const w of list) (byKind[w.kind] ||= []).push(w);
  const goneU = gone || { value: 0 };
  const goneAxis = { value: new THREE.Vector4(0, 0, 0, 0) };
  const meshes = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const all = [];
  for (const [kind, ws] of Object.entries(byKind)) {
    const B = bake(kind);
    const geo = B.geo.clone();
    const aw = new Float32Array(ws.length * 4);
    const mat = washMaterial({ dress, walk: { tex: B.tex, info: B.info, clock, stay } });
    mat.uniforms.uGone = goneU;
    mat.uniforms.uGoneAxis = goneAxis;
    const mesh = new THREE.InstancedMesh(geo, mat, ws.length);
    ws.forEach((w, i) => {
      const k = w.s || 1;
      q.setFromEuler(e.set(0, w.ry || 0, 0));
      m.compose(v.set(w.x, w.y || 0, w.z), q, s.set(k, k, k));
      mesh.setMatrixAt(i, m);
      /* speed: the clock counts metres, and every walker covers one metre a tick of it */
      const cad = speed ? speed / (B.stride * k) : B.cadence * pace * (w.pace || 1) * (0.92 + R() * 0.16);
      aw[i * 4] = w.start !== undefined ? w.start * (w.len || 40) / (B.stride * k) : (w.ph !== undefined ? w.ph : R() * 40);
      aw[i * 4 + 1] = cad;
      aw[i * 4 + 2] = B.stride * k;
      aw[i * 4 + 3] = w.len || 40;
      all.push({ ...w, cad, stride: B.stride * k });
    });
    geo.setAttribute('aWalk', new THREE.InstancedBufferAttribute(aw, 4));
    mesh.frustumCulled = false;
    mesh.userData.noShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    if (QUALITY.pen) {
      const line = new THREE.InstancedMesh(geo, lineMaterial(mat), ws.length);
      line.instanceMatrix = mesh.instanceMatrix;
      line.frustumCulled = false;
      line.userData.noShadow = true;
      scene.add(line);
      meshes.push(line);
    }
    /* and a patch of shade under each, walking with it */
    const blob = new THREE.InstancedMesh(blobGeo, blobMaterial(clock, goneU, stay), ws.length);
    ws.forEach((w, i) => {
      const k = (w.s || 1) * (/child/.test(kind) ? 0.66 : 1);
      q.setFromEuler(e.set(0, w.ry || 0, 0));
      m.compose(v.set(w.x, (w.y || 0) + 0.025, w.z), q, s.set(0.95 * k, 1, 1.2 * k));
      blob.setMatrixAt(i, m);
    });
    const bgeo = blob.geometry = blobGeo.clone();
    bgeo.setAttribute('aWalk', new THREE.InstancedBufferAttribute(aw, 4));
    blob.frustumCulled = false;
    blob.renderOrder = 1;
    blob.userData.noShadow = true;
    scene.add(blob);
    meshes.push(blob);
  }
  return { meshes, clock, gone: goneU, goneAxis, list: all, show(on) { meshes.forEach((x) => { x.userData.hidden = !on; x.visible = on; }); } };
}
