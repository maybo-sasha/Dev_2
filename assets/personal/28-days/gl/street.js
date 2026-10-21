/* ============================================================
   The street: sky, ground, the rows of tenements with their
   balconies, and the gas lamps. The houses themselves are built
   in tenement.js.
   ============================================================ */

import * as THREE from 'three';
import { world, rng, GLSL_NOISE } from './common.js';
import { groundMaterial, plainMaterial } from './materials.js';
import { Tenements, balconyGeometry } from './tenement.js';
import { box, at, merge } from './geo.js';
import { PLAN } from './plan.js';

/* ── sky ───────────────────────────────────────────────────── */
function buildSky(scene) {
  const uniforms = {
    ...world,
    uSkyTop: { value: new THREE.Color(0.1, 0.1, 0.12) },
    uGlowCol: { value: new THREE.Color(1.0, 0.35, 0.08) },
    uGlow: { value: 0 },
    uCloud: { value: 0.5 },
    uSpots: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 1, 0, 0)) },      // which way, how bright
    uSpotCols: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 1)) },   // its colour, how tight
    uSpotOn: { value: 0 },
    uSunShow: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vDir;
      uniform vec3 uSkyTop, uFogCol, uGlowCol;
      uniform float uGlow, uCloud, uSpotOn, uSunShow;
      uniform vec3 uSunDir, uSunCol;
      uniform vec4 uSpots[10]; uniform vec4 uSpotCols[10];
      ${GLSL_NOISE}
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 c = mix(uFogCol, uSkyTop, smoothstep(0.0, 0.55, h));
        /* smoke and cloud, drifting */
        vec2 q = d.xz / (0.32 + max(d.y, 0.0));
        float n = fbm(q * vec2(0.22, 0.5) + vec2(uTime * 0.006, uTime * 0.002));
        float n2 = fbm(q * vec2(0.6, 1.3) + 9.0 - vec2(uTime * 0.01, 0.0));
        float cl = smoothstep(0.3, 0.75, n * 0.72 + n2 * 0.28) * uCloud * smoothstep(-0.02, 0.22, h);
        vec3 cloudCol = mix(uFogCol * 0.6, uFogCol * 1.2, n2);
        /* lit from underneath by the fires */
        cloudCol += uGlowCol * uGlow * (1.0 - smoothstep(0.0, 0.5, h)) * (0.4 + 0.6 * n);
        c = mix(c, cloudCol, cl);
        c += uGlowCol * uGlow * 0.35 * exp(-max(h, 0.0) * 6.0);
        /* stars, when the sky is dark enough for them, and where nothing is between */
        float night = 1.0 - smoothstep(0.02, 0.1, dot(uSkyTop, vec3(0.3, 0.59, 0.11)));
        if (night > 0.01 && d.y > 0.02) {
          vec2 sp = d.xz / (d.y + 0.4) * 46.0;
          vec2 id = floor(sp);
          vec2 jit = hash22(id) - 0.5;
          float st = step(0.93, hash21(id + 7.0)) * smoothstep(0.16, 0.0, length(fract(sp) - 0.5 - jit * 0.6));
          float tw = 0.7 + 0.3 * sin(uTime * (1.5 + hash21(id) * 3.0) + hash21(id + 3.0) * 6.28);
          c += vec3(0.8, 0.85, 1.0) * st * tw * night * (1.0 - cl * 1.3) * smoothstep(0.02, 0.3, d.y) * (0.25 + 0.75 * hash21(id + 11.0)) * 0.55;
        }

        /* the sun itself: its disc, the glare round it, and the sky it warms. Cloud dims it, and is lit at its edges */
        if (uSunShow > 0.004) {
          float sd = max(dot(d, uSunDir), 0.0);
          float low = 1.0 - smoothstep(0.0, 0.5, uSunDir.y);
          vec3 sunc = uSunCol * (pow(sd, 2400.0) * 16.0 + pow(sd, 260.0) * 0.7 + pow(sd, 24.0) * (0.12 + 0.16 * low) + pow(sd, 4.0) * 0.06 * low);
          c += sunc * (1.0 - cl * 0.6) * uSunShow;
          c += uSunCol * cl * pow(sd, 12.0) * 0.22 * uSunShow;
        }

        /* lights from below, falling on the cloud: it takes them, the clear air between hardly does */
        if (uSpotOn > 0.5) {
          vec3 lit = vec3(0.0);
          for (int i = 0; i < 10; i++) lit += uSpotCols[i].rgb * uSpots[i].w * exp((max(dot(d, uSpots[i].xyz), 0.0) - 1.0) * uSpotCols[i].a);
          c += lit * (0.22 + 1.4 * cl) * (0.7 + 0.6 * n2);
        }
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);
  return uniforms;
}

/* ── the whole street ──────────────────────────────────────── */
export function buildStreet(scene, lights, stage) {
  const P = PLAN;
  const sky = buildSky(scene);

  /* ground */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 1300).rotateX(-Math.PI / 2),
    groundMaterial({
      crossZ0: P.cross.z0, crossZ1: P.cross.z1,
      yard: [P.yard.x0, P.yard.z0, P.yard.x1 + 30, P.yard.z1],
      wallZ: P.wallZ, burnZ: P.battle.z0 - 20, ruinZ: P.ruinZ,
      mila: [P.mila.z0, P.mila.z1],
      loop: [0, (P.square.z0 + P.square.z1) / 2, 15.5],
    }),
  );
  ground.position.set(0, 0, -470);
  ground.frustumCulled = false;
  scene.add(ground);

  /* houses */
  const H = new Tenements();
  const L = Math.PI / 2, Rr = -Math.PI / 2;   // left row faces +x, right row faces -x
  const h = P.half;

  // from before the book to the bridge
  H.row({ from: 40, to: P.bridge.stairA - 1, line: -h, side: L, seed: 1 });
  H.row({ from: 40, to: P.bridge.stairA - 1, line: h, side: Rr, seed: 2 });
  // Chłodna, on both sides of the bridge
  const ca = P.cross.z1 + 1.5, cb = P.cross.z0 - 1.5;
  H.row({ from: h, to: 92, line: ca, side: Math.PI, seed: 3, along: 'x', startCorner: true });
  H.row({ from: -h, to: -92, line: ca, side: Math.PI, seed: 4, along: 'x', startCorner: true });
  H.row({ from: h, to: 92, line: cb, side: 0, seed: 5, along: 'x', startCorner: true });
  H.row({ from: -h, to: -92, line: cb, side: 0, seed: 6, along: 'x', startCorner: true });
  // from the bridge to Miła
  const ma = P.mila.z1, mb = P.mila.z0;
  H.row({ from: cb - 13, to: ma + 13.5, line: -h, side: L, seed: 7 });
  H.row({ from: cb - 13, to: P.yard.z1, line: h, side: Rr, seed: 8 });
  H.row({ from: P.yard.z0, to: ma + 13.5, line: h, side: Rr, seed: 9 });
  // the four corners of Zamenhofa and Miła, and Miła running off both ways
  const fight = { burn: 0.16, ruin: 0 };
  const cornerOf = (o) => {
    const r = H.row({ ...o, along: 'x', startCorner: true, force: fight, hMin: 17, hMax: 21 })[0];
    r.zam = r.sides.left || r.sides.right;            // the end of the house that looks on to Zamenhofa
    return r;
  };
  const corners = {
    ne: cornerOf({ from: h, to: 74, line: ma, side: Math.PI, seed: 21 }),
    nw: cornerOf({ from: -h, to: -74, line: ma, side: Math.PI, seed: 22 }),
    se: cornerOf({ from: h, to: 74, line: mb, side: 0, seed: 23 }),
    sw: cornerOf({ from: -h, to: -74, line: mb, side: 0, seed: 24 }),
  };
  // from Miła to the square
  H.row({ from: mb - 13.5, to: P.square.z1, line: -h, side: L, seed: 25, endCorner: true });
  H.row({ from: mb - 13.5, to: P.square.z1, line: h, side: Rr, seed: 26, endCorner: true });
  // around Muranowski Square
  const sq = P.square;
  const flagHouse = H.add({ x: -sq.half, z: sq.flagZ, ry: L, W: 20, H: 24.5, seed: 77.7, burn: 0.18, ruin: 0, balcony: 0.3, flat: true });
  H.add({ x: -sq.half, z: sq.flagZ + 19, ry: L, W: 18, H: 18, seed: 78.2, burn: 0.5, ruin: 0.08 });
  H.add({ x: -sq.half, z: sq.flagZ - 19, ry: L, W: 18, H: 19.5, seed: 79.4, burn: 0.45, ruin: 0.1 });
  H.row({ from: sq.z1, to: sq.z0, line: sq.half, side: Rr, seed: 10, force: { burn: 0.7, ruin: 0.12 } });
  for (const sd of [-1, 1]) {
    H.add({ x: sd * 30.5, z: sq.z1, ry: Math.PI, W: 19, H: 17, seed: 80 + sd, burn: 0.4, ruin: 0.05 });
    H.add({ x: sd * 30.5, z: sq.z0, ry: 0, W: 19, H: 18, seed: 83 + sd, burn: 0.6, ruin: 0.15 });
  }
  // the burning street, down to the edge of the rubble
  H.row({ from: sq.z0, to: P.ruinZ, line: -h, side: L, seed: 11, startCorner: true });
  H.row({ from: sq.z0, to: P.ruinZ, line: h, side: Rr, seed: 12, startCorner: true });
  // a few shells left standing further out
  const Rf = rng(4242);
  for (let i = 0; i < 16; i++) {
    const z = P.ruinZ - 10 - Rf() * 215;
    const x = (Rf() < 0.5 ? -1 : 1) * (17 + Rf() * 62);
    if (x < -30 && z > P.synagogue.z - 34 && z < P.synagogue.z + 34) continue;
    H.add({ x, z, ry: Rf() * Math.PI * 2, W: 7 + Rf() * 8, H: 9 + Rf() * 9, D: 0.6, seed: 300 + i * 1.7, burn: 0.3, ruin: 0.9, balcony: 0, plain: true, gate: false });
  }

  /* the fight needs somewhere to stand: do this before the balconies are built */
  if (stage) stage({ H, corners, flagHouse });

  for (const mesh of H.meshes()) scene.add(mesh);

  /* balconies, in the same stretches as the houses so the far ones can be skipped */
  const balGeo = balconyGeometry(merge, at, box);
  const balMat = plainMaterial({ color: [0.05, 0.047, 0.044], rough: 0.5 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  const groups = new Map();
  for (const bl of H.balconies) {
    const key = Math.floor(bl.p[2] / 90);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(bl);
  }
  for (const list of groups.values()) {
    const bal = new THREE.InstancedMesh(balGeo, balMat, list.length);
    list.forEach((bl, i) => {
      q.setFromEuler(e.set(0, bl.ry, 0));
      m4.compose(v.set(...bl.p), q, sc);
      bal.setMatrixAt(i, m4);
    });
    bal.frustumCulled = false;
    scene.add(bal);
  }

  /* gas lamps */
  const postGeo = merge([
    at(new THREE.CylinderGeometry(0.06, 0.1, 4.3, 8), 0, 2.15, 0),
    at(new THREE.CylinderGeometry(0.14, 0.16, 0.5, 8), 0, 0.25, 0),
    at(box(0.5, 0.04, 0.04), 0, 3.4, 0),
    at(new THREE.CylinderGeometry(0.2, 0.05, 0.12, 6), 0, 4.72, 0),
  ]);
  const glassGeo = new THREE.CylinderGeometry(0.16, 0.11, 0.38, 6);
  const spots = [];
  const lampOk = (z) => !(z < P.bridge.stairA + 6 && z > P.bridge.stairB - 6)
    && !(z < P.bunker1.stairTop + 4 && z > P.bunker1.stairBot - 4)
    && !(z < P.bunker1.tunnelEnd + 4 && z > P.bunker1.exitTop - 4);
  let k = 0;
  for (let z = 22; z > P.square.z1 + 6; z -= 24, k++) {
    if (!lampOk(z)) continue;
    if (z < P.mila.z1 + 3 && z > P.mila.z0 - 3) continue;
    const side = k % 2 ? 1 : -1;
    if (side > 0 && z < P.yard.z1 + 4 && z > P.yard.z0 - 4) continue;
    spots.push([side * 5.05, z]);
  }
  for (let x = -70; x <= 70; x += 28) spots.push([x, P.cross.z1 - 2.2]);
  const posts = new THREE.InstancedMesh(postGeo, plainMaterial({ color: [0.05, 0.05, 0.048], rough: 0.3 }), spots.length);
  const lampMat = plainMaterial({ color: [0.2, 0.17, 0.12], emissive: [0, 0, 0] });
  const glass = new THREE.InstancedMesh(glassGeo, lampMat, spots.length);
  spots.forEach(([x, z], i) => {
    m4.makeTranslation(x, 0, z); posts.setMatrixAt(i, m4);
    m4.makeTranslation(x, 4.48, z); glass.setMatrixAt(i, m4);
    lights.add({ pos: new THREE.Vector3(x, 4.3, z), color: new THREE.Color(1.0, 0.62, 0.3), base: 1.5, group: 'lamp', flicker: 0.12 });
  });
  posts.frustumCulled = glass.frustumCulled = false;
  scene.add(posts, glass);

  return { sky, houses: H, flagHouse, corners, lampMat, ground };
}
