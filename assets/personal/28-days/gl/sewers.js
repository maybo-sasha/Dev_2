/* ============================================================
   The sewers, 9 and 10 May 1943.

   A brick sewer under the street, egg shaped, too low to stand up
   in, with black water running in the bottom of it. The fighters
   wade on ahead in two files, bent under the vault, behind the lamp
   of the man who knows the way. At the end of it a shaft with iron
   rungs goes up to a manhole, and the lid has been pushed aside:
   daylight.

   It lies under the ruins at the end of the burning street, out of
   the way of everything else; the walk cuts to it and from it.
   ============================================================ */

import * as THREE from 'three';
import { world, GLSL_NOISE, GLSL_LIGHT, rng, clamp } from './common.js';
import { brickMaterial, plainMaterial } from './materials.js';
import { box, at, merge } from './geo.js';
import { walkers } from './walk.js';

export const SEWER = { z0: -699, z1: -752, floor: -6.62, water: -6.36, shaftZ: -750.4, top: -4.86, start: -702 };

/* the egg: wider at the top than at the invert, a round crown. [x, y] from the invert. */
function eggProfile(n = 28) {
  const pts = [];
  const W = 0.78, Hh = 1.76;
  const ym = Hh - W;                                   // where the round crown begins
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.sin(a), c = Math.cos(a);
    const y = (1 - c) / 2 * Hh;
    /* below: a tall narrow ellipse down to the invert. Above: a half circle */
    const w = y < ym ? W * Math.sqrt(Math.max(0, 1 - Math.pow((ym - y) / ym, 2))) : Math.sqrt(Math.max(0, W * W - (y - ym) * (y - ym)));
    pts.push([s >= 0 ? w : -w, y]);
  }
  return pts;
}

/* the tube: the profile carried along the sewer, the bricks laid lengthwise in rings */
function tube(z0, z1, floor, step = 0.5) {
  const prof = eggProfile();
  const pos = [], uv = [], idx = [];
  const n = Math.ceil((z0 - z1) / step);
  let per = 0; const lens = [0];
  for (let i = 1; i < prof.length; i++) { per += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); lens.push(per); }
  for (let j = 0; j <= n; j++) {
    const z = z0 - (z0 - z1) * j / n;
    for (let i = 0; i < prof.length; i++) {
      pos.push(prof[i][0], floor + prof[i][1], z);
      uv.push(z0 - z, Math.min(lens[i], per - lens[i]));   // metres along, metres up from the invert
    }
  }
  const m = prof.length;
  for (let j = 0; j < n; j++) for (let i = 0; i < m - 1; i++) {
    const a = j * m + i, b = a + 1, c = a + m, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* the shaft up to the street. Its foot is cut to the vault it comes down into. */
const SHAFT_R = 0.52;
function shaftGeo(S) {
  const W = 0.78, ym = 1.76 - W;
  const pos = [], uv = [], idx = [];
  const n = 28, rings = 12;
  for (let k = 0; k <= rings; k++) for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const x = Math.cos(a) * SHAFT_R, z = Math.sin(a) * SHAFT_R;
    const foot = S.floor + ym + Math.sqrt(W * W - x * x) - 0.015;
    const y = foot + (0.01 - foot) * k / rings;
    pos.push(x, y, S.shaftZ + z);
    uv.push(a * SHAFT_R, y + 7);
  }
  for (let k = 0; k < rings; k++) for (let i = 0; i < n; i++) {
    const a = k * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/* a wall across the sewer, its bricks the size of bricks */
function wallGeo(w, h, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  const u = g.attributes.uv;
  for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w, u.getY(i) * h);
  return g.translate(x, y, z);
}

/* black water, running, catching the lamp */
function waterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...world },
    vertexShader: /* glsl */ `
      varying vec3 vP;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        float t = uTime;
        /* it runs toward the river */
        vec2 q = vec2(vP.x * 3.0, vP.z * 1.2 + t * 0.6);
        float h1 = fbm(q), h2 = fbm(q * 2.3 + vec2(t * 0.2, -t * 0.4));
        vec3 N = normalize(vec3((h1 - 0.5) * 0.5 + (h2 - 0.5) * 0.3, 1.0, (fbm(q + 7.0) - 0.5) * 0.5));
        vec3 V = normalize(cameraPosition - vP);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        /* the lamp, broken up in it */
        vec3 spec = vec3(0.0);
        for (int i = 0; i < ${8}; i++) {
          vec3 L = uLights[i].xyz - vP;
          float d2 = dot(L, L);
          vec3 Hh = normalize(normalize(L) + V);
          float nh = max(dot(N, Hh), 0.0);
          spec += uLightCols[i] * uLights[i].w * (pow(nh, 260.0) * 0.55 + pow(nh, 30.0) * 0.045) / (1.0 + d2 * 0.05);
        }
        vec3 c = vec3(0.012, 0.014, 0.01) + spec + uSkyCol * fres * 0.6;
        /* the scum that floats on it */
        c *= 0.75 + 0.5 * fbm(vec2(vP.x * 1.4, vP.z * 0.5 + t * 0.6) + 3.0);
        gl_FragColor = vec4(applyFog(c, vP), 1.0);
      }
    `,
  });
}

/* light hanging in damp air: a soft round glow that faces whoever looks at it */
function glow(color, size) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Vector3(...color) }, uSize: { value: size }, uAmount: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uSize; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mv.xy += position.xy * uSize;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uCol; uniform float uAmount; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = pow(max(1.0 - r, 0.0), 2.4) + 0.5 * exp(-r * r * 60.0);
        gl_FragColor = vec4(uCol * a * uAmount, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.frustumCulled = false;
  mesh.userData.free = true;
  mesh.renderOrder = 6;
  return mesh;
}

export function buildSewers(scene, lights) {
  const S = SEWER;
  const group = new THREE.Group();
  group.name = 'The sewer';
  group.userData.noShadow = true;

  /* the sewer itself, and the shaft up to the street */
  const brick = brickMaterial({ tint: [0.62, 0.6, 0.55], damp: 1, side: THREE.DoubleSide });
  /* the vault is open where the shaft comes down into it */
  const vault = brickMaterial({ tint: [0.62, 0.6, 0.55], damp: 1, side: THREE.DoubleSide, hole: [0, S.shaftZ, SHAFT_R, S.floor + 0.98] });
  group.add(new THREE.Mesh(tube(S.z0, S.z1, S.floor), vault));
  /* the ends: walled, so the dark does not open on the sky */
  const capW = 1.7, capH = 1.9;
  for (const z of [S.z0, S.z1]) group.add(new THREE.Mesh(wallGeo(capW, capH, 0, S.floor + capH / 2, z), brick));
  group.add(new THREE.Mesh(shaftGeo(S), brick));
  /* iron rungs up the shaft, on the side away from the walk */
  const iron = [];
  for (let y = S.top + 0.1; y < -0.2; y += 0.3) iron.push(at(box(0.42, 0.03, 0.03), 0, y, S.shaftZ - 0.42), at(box(0.03, 0.03, 0.12), -0.2, y, S.shaftZ - 0.46), at(box(0.03, 0.03, 0.12), 0.2, y, S.shaftZ - 0.46));
  /* in the tunnel: a pipe along the wall, on iron brackets */
  iron.push(at(box(0.07, 0.07, S.z0 - S.z1 - 0.4), 0.72, S.floor + 1.0, (S.z0 + S.z1) / 2));
  for (let z = S.z0 - 2; z > S.z1 + 1; z -= 3.2) iron.push(at(box(0.1, 0.02, 0.05), 0.73, S.floor + 0.955, z));
  group.add(new THREE.Mesh(merge(iron), plainMaterial({ color: [0.05, 0.04, 0.03], rough: 0.4 })));
  /* the lid of the manhole, pushed to one side */
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.06, 20), plainMaterial({ color: [0.06, 0.055, 0.05], rough: 0.3 }));
  lid.position.set(0.62, 0.03, S.shaftZ - 0.3);
  group.add(lid);

  /* the water */
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1.6, S.z0 - S.z1).rotateX(-Math.PI / 2), waterMaterial());
  water.position.set(0, S.water, (S.z0 + S.z1) / 2);
  group.add(water);

  group.traverse((o) => { o.frustumCulled = false; });

  /* the lamp that goes ahead, carried by the guide; a stub of candle nearer; daylight down the shaft */
  const lamp = lights.add({ pos: new THREE.Vector3(0, S.floor + 1.2, S.z0 - 3), color: new THREE.Color(1.0, 0.8, 0.5), base: 2.3, group: 'sewer', flicker: 0.18 });
  const candle = lights.add({ pos: new THREE.Vector3(0, S.floor + 1.1, S.z0 - 3), color: new THREE.Color(1.0, 0.62, 0.3), base: 0.36, group: 'sewer', flicker: 0.45 });
  const day = lights.add({ pos: new THREE.Vector3(0, -0.9, S.shaftZ), color: new THREE.Color(0.8, 0.86, 0.95), base: 5, group: 'daylight', flicker: 0 });
  const lampGlow = glow([1.0, 0.72, 0.36], 2.3), lampCore = glow([3.4, 2.5, 1.2], 0.16);
  const candleGlow = glow([1.0, 0.55, 0.2], 0.8), candleCore = glow([2.6, 1.6, 0.5], 0.05);
  const dayGlow = glow([0.75, 0.82, 0.95], 3.2);
  dayGlow.position.set(0, -0.4, S.shaftZ);
  group.add(lampGlow, lampCore, candleGlow, candleCore, dayGlow);
  scene.add(group);

  /* the fighters, wading ahead in two files, as fast as you go: their clock is the distance walked.
     Each keeps its distance in front, until it reaches the shaft and goes up into the light. */
  const clock = { value: 0 };
  const R = rng(510);
  const list = [];
  const kinds = ['fighterW', 'fighter', 'fighterB', 'fighter', 'fighterW', 'fighterB', 'fighter'];
  const LEN = 72, START = 0.12;
  const ahead = [];
  for (let i = 0; i < 7; i++) {
    const guide = i === 6;
    const d = guide ? 12.6 : 3.5 + i * 1.45;
    const x = guide ? 0.02 : (i % 2 ? 0.2 : -0.22) + (R() - 0.5) * 0.06;
    ahead.push({ d, x });
    list.push({ kind: kinds[i], x, y: S.floor + 0.02, z: S.start - d - (0.5 - START) * LEN, ry: Math.PI, len: LEN, start: START, s: 0.95 + R() * 0.04 });
  }
  const fighters = walkers(scene, list, { clock, speed: 1, seed: 33 });
  /* the line across their way: under the shaft */
  fighters.goneAxis.value.set(-(S.shaftZ + 0.7), -(S.shaftZ - 0.25), 0, 2);

  const GUIDE = ahead[6], HOLDS = ahead[1];
  return {
    group, water, lamp, day, clock, fighters, lid,
    /* camZ: how far the walk has come. lampK, dayK: how bright the lamp is, and the day. */
    update(camZ, lampK, dayK, t) {
      const walked = Math.max(0, S.start - camZ);
      clock.value = walked;
      /* the lamp, in the guide's hand, a step in front of him; then up the rungs with him */
      const gz = S.start - GUIDE.d - walked - 0.45;
      const up = Math.max(0, S.shaftZ - gz);                       // how far past the foot of the shaft
      lamp.pos.set(0.3 * (1 - clamp(up / 0.5)), Math.min(S.floor + 1.2 + up * 0.8, -1.6), Math.max(gz, S.shaftZ));
      const fl = 0.86 + 0.14 * Math.sin(t * 11.0) * Math.sin(t * 6.3);
      lampGlow.position.copy(lamp.pos); lampCore.position.copy(lamp.pos);
      lampGlow.material.uniforms.uAmount.value = 0.34 * lampK * fl;
      lampCore.material.uniforms.uAmount.value = lampK * fl;
      /* the candle goes out of sight with the one who holds it */
      const cz = S.start - HOLDS.d - walked - 0.3;
      const ck = lampK * (1 - clamp((S.shaftZ + 0.9 - cz) / 0.6));
      candle.pos.set(HOLDS.x + 0.2, S.floor + 1.12, cz);
      candle.level = ck;
      candleGlow.position.copy(candle.pos); candleCore.position.copy(candle.pos);
      candleGlow.material.uniforms.uAmount.value = 0.3 * ck * (0.8 + 0.2 * Math.sin(t * 17.0));
      candleCore.material.uniforms.uAmount.value = ck;
      /* daylight in the mouth of the shaft */
      dayGlow.material.uniforms.uAmount.value = dayK * 0.5;
    },
  };
}
