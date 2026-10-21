/* ============================================================
   The night of 13 May 1943.

   Soviet bombers came over Warsaw, for the railway and the
   airfield. They are the only aircraft in this story: the Germans
   never bombed the ghetto from the air.

   What the people in the ruins saw of it: the stream going over,
   high up, a few of them caught and held by the searchlights; the
   shells bursting round them; the light guns hosing tracer up from
   the edge of the city; flares coming down slowly on parachutes,
   and under them the ruins lit like day, their shadows turning.

   Everything here is worked out from the clock alone, so a given
   second of the night always looks the same.
   ============================================================ */

import * as THREE from 'three';
import { world, GLSL_NOISE, GLSL_LIGHT, clamp } from './common.js';
import { merge, quad } from './geo.js';

const N_BEAMS = 5, N_PLANES = 9, N_BURSTS = 22, N_QUADS = 72, N_FLARES = 2;
export const N_SPOTS = 10;
const BEAM_LEN = 420, BEAM_SPREAD = 0.032, CLOUD = 300;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ── the bomber ────────────────────────────────────────────── */
/* A slab that narrows and thins toward its tip: a wing, a tailplane, a fin.
   Each end: p where it is [up, across], le and te where its edges are along the body, t how thick.
   n: the way its thickness runs [up, across]. */
function slab(root, tip, n) {
  const c = (s, x, sg) => [x, s.p[0] + n[0] * sg * s.t / 2, s.p[1] + n[1] * sg * s.t / 2];
  const rLp = c(root, root.le, 1), rLm = c(root, root.le, -1), rTp = c(root, root.te, 1), rTm = c(root, root.te, -1);
  const tLp = c(tip, tip.le, 1), tLm = c(tip, tip.le, -1), tTp = c(tip, tip.te, 1), tTm = c(tip, tip.te, -1);
  return [quad(rLp, tLp, tTp, rTp), quad(rLm, rTm, tTm, tLm), quad(rLm, tLm, tLp, rLp), quad(rTp, tTp, tTm, rTm), quad(tLp, tLm, tTm, tTp)];
}
/* a body of revolution lying along the line of flight: [radius, how far along] */
function body(prof, y = 0, z = 0) {
  return new THREE.LatheGeometry(prof.map(([r, x]) => new THREE.Vector2(r, x)), 12).rotateZ(-Math.PI / 2).translate(0, y, z);
}
/* A twin engined bomber of the long range force: a long glazed nose, a mid wing, one fin.
   It flies along +x; metres. */
function bomberGeometry() {
  const parts = [];
  parts.push(body([[0.02, -9.0], [0.3, -8.2], [0.55, -6], [0.82, -2.5], [0.95, 0.5], [0.95, 3.2], [0.8, 4.6], [0.5, 5.5], [0.02, 5.85]]));
  for (const s of [-1, 1]) {
    parts.push(...slab({ p: [-0.1, s * 0.6], le: 1.9, te: -2.6, t: 0.55 }, { p: [0.75, s * 10.7], le: 0.2, te: -1.5, t: 0.14 }, [1, 0]));
    parts.push(body([[0.02, -2.6], [0.4, -1.6], [0.62, 0.6], [0.62, 2.6], [0.45, 3.2], [0.12, 3.6], [0.02, 3.9]], -0.3, s * 3.05));
    parts.push(...slab({ p: [0.35, s * 0.3], le: -6.9, te: -8.8, t: 0.22 }, { p: [0.45, s * 3.5], le: -7.6, te: -8.7, t: 0.08 }, [1, 0]));
  }
  parts.push(...slab({ p: [0.5, 0], le: -6.6, te: -9.0, t: 0.25 }, { p: [3.1, 0], le: -8.0, te: -9.1, t: 0.08 }, [0, 1]));
  return merge(parts);
}

function bomberMaterial(B) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...world, uBeamO: B.o, uBeamD: B.d, uBeamI: B.i, uFlare: B.flare },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN;
      void main() {
        mat4 m = modelMatrix * instanceMatrix;
        vec4 w = m * vec4(position, 1.0);
        vP = w.xyz; vN = normalize(mat3(m) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN;
      uniform vec3 uBeamO[${N_BEAMS}]; uniform vec4 uBeamD[${N_BEAMS}]; uniform float uBeamI[${N_BEAMS}];
      uniform vec4 uFlare;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        /* a dark shape, its belly a little warm from the fires under it */
        vec3 c = vec3(0.011, 0.011, 0.013) + vec3(1.0, 0.35, 0.08) * 0.014 * max(-N.y, 0.0);
        /* caught in a searchlight it is suddenly silver */
        for (int i = 0; i < ${N_BEAMS}; i++) {
          vec3 d = vP - uBeamO[i];
          float al = dot(d, uBeamD[i].xyz);
          float rad = length(d - uBeamD[i].xyz * al);
          float R = 0.6 + al * uBeamD[i].w;
          float inb = (1.0 - smoothstep(R * 0.7, R * 1.15, rad)) * step(0.0, al);
          c += vec3(0.6, 0.7, 0.86) * uBeamI[i] * inb * (0.22 + 0.78 * max(dot(N, -uBeamD[i].xyz), 0.0)) * 0.42;
        }
        c += vec3(1.0, 0.86, 0.6) * uFlare.w * (0.25 + 0.75 * max(dot(N, normalize(uFlare.xyz - vP)), 0.0)) * 0.035;
        gl_FragColor = vec4(mix(c, uFogCol, fogAmount(vP) * 0.45), 1.0);
      }
    `,
  });
}

/* ── a searchlight ─────────────────────────────────────────── */
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { ...world, uAmount: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying float vAlong; varying float vAng;
      void main() {
        vAlong = position.y;
        vAng = atan(position.z, position.x);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vP = w.xyz;
        vN = mat3(modelMatrix) * vec3(position.x, 0.0, position.z);
        vN = vN / max(length(vN), 1e-5);
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying float vAlong; varying float vAng;
      uniform float uAmount;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 Vd = normalize(cameraPosition - vP);
        /* thickest through its middle, nothing at its edge */
        float body = pow(clamp(abs(dot(normalize(vN), Vd)), 0.0, 1.0), 1.5);
        float al = clamp(vAlong, 0.0, 1.0);
        float fall = pow(1.0 - al, 1.15) * smoothstep(0.0, 0.02, al) * smoothstep(1.0, 0.8, al);
        /* the smoke it passes through */
        float dust = 0.6 + 0.8 * fbm(vec2(al * 9.0 - uTime * 0.03, vAng * 0.6 + uTime * 0.02));
        float haze = 1.0 - fogAmount(vP) * 0.9;
        gl_FragColor = vec4(vec3(0.5, 0.6, 0.78) * body * fall * dust * haze * uAmount, 1.0);
      }
    `,
  });
}

/* ── shells bursting: a flash, and the smoke it leaves hanging ── */
function burstMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { ...world, uAmount: { value: 1 }, uLit: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aBirth; attribute float aSeed;
      uniform float uTime, uPx, uDpr;
      varying float vAge; varying float vSeed; varying float vFog;
      void main() {
        vAge = uTime - aBirth; vSeed = aSeed;
        float age = max(vAge, 0.0);
        /* the wind takes the smoke */
        vec3 p = position + vec3(1.1, -0.25, 0.3) * age * (0.6 + aSeed);
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float size = mix(5.0, 19.0, 1.0 - exp(-age * 0.6)) * (0.7 + 0.6 * aSeed);
        size = max(size, 30.0 * exp(-age * 12.0));
        gl_PointSize = (vAge < 0.0 || vAge > 10.0) ? 0.0 : min(size / -mv.z / uPx * uDpr, 400.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        vFog = 1.0 - exp(-pow(d * 0.0055 * 0.55, 1.35));
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying float vAge; varying float vSeed; varying float vFog;
      uniform float uAmount, uLit; uniform vec3 uFogCol;
      ${GLSL_NOISE}
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q) * 2.0;
        float n = fbm(q * 1.6 + vSeed * 17.0);
        float puff = smoothstep(1.0, 0.2, r + (n - 0.5) * 0.9);
        float a = puff * 0.62 * smoothstep(0.0, 0.3, vAge) * pow(max(1.0 - vAge / 10.0, 0.0), 1.5);
        vec3 smoke = mix(vec3(0.012, 0.012, 0.016), uFogCol * 0.7, 0.35 + 0.4 * n);
        smoke += vec3(0.16, 0.135, 0.1) * uLit * (0.35 + 0.65 * smoothstep(-0.5, 0.3, q.y)) * (0.6 + 0.8 * n);
        float flash = exp(-vAge * 12.0);
        vec3 fire = vec3(1.0, 0.74, 0.42) * flash * (exp(-r * r * 5.0) * 2.2 + exp(-r * r * 70.0) * 7.0);
        /* the red heart of it, a moment longer */
        fire += vec3(1.0, 0.36, 0.08) * exp(-vAge * 3.0) * exp(-r * r * 9.0) * 0.5 * puff;
        float keep = (1.0 - vFog * 0.5) * uAmount;
        gl_FragColor = vec4((fire + smoke * a) * keep, a * keep);
      }
    `,
  });
}

/* ── a flare under its parachute, and the engines' exhausts: points of light ── */
function lightMaterial(kind) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...world },
    vertexShader: /* glsl */ `
      attribute float aI;
      uniform float uPx, uDpr;
      varying float vI;
      void main() {
        vI = aI;
        vec4 mv = viewMatrix * vec4(position, 1.0);
        ${kind === 'flare'
          ? 'gl_PointSize = aI < 0.004 ? 0.0 : min(84.0 / -mv.z / uPx * uDpr, 480.0);'
          : 'gl_PointSize = aI < 0.004 ? 0.0 : clamp(2.4 / -mv.z / uPx * uDpr, 1.6 * uDpr, 5.0 * uDpr);'}
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying float vI;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        ${kind === 'flare'
          ? 'float a = exp(-r * r * 1400.0) * 16.0 + exp(-r * r * 160.0) * 2.0 + exp(-r * r * 12.0) * 0.2 + pow(max(1.0 - r, 0.0), 3.0) * 0.045; vec3 c = vec3(1.0, 0.87, 0.64);'
          : 'float a = exp(-r * r * 5.0) * 1.3; vec3 c = vec3(1.0, 0.52, 0.2);'}
        gl_FragColor = vec4(c * a * vI, 1.0);
      }
    `,
  });
}

/* sky: the uniforms of the sky, which is told where the lights fall on the cloud */
export function buildRaid(scene, sky) {
  const group = new THREE.Group();
  group.name = 'The raid';
  group.userData.noShadow = true;

  /* ── the stream ── */
  const SPAN = 960, SPEED = 24, HEAD = V(1, 0, -0.07).normalize(), SIZE = 1.25;
  const planeS = (i, t) => (((i * SPAN / N_PLANES + hash(i + 3) * 40 + t * SPEED) % SPAN) + SPAN) % SPAN - SPAN / 2;
  const planeAt = (i, t, out) => {
    const s = planeS(i, t);
    return out.set(s * HEAD.x, 122 + (hash(i + 7) - 0.5) * 34 + Math.sin(t * 0.3 + i * 2.1) * 2.5, -1030 + s * HEAD.z + (hash(i) - 0.5) * 110);
  };
  /* the one the lights are holding: the leader of those overhead */
  const held = (t) => {
    let best = -1, bs = -1e9;
    for (let i = 0; i < N_PLANES; i++) { const s = planeS(i, t); if (s > -230 && s < 190 && s > bs) { bs = s; best = i; } }
    return best;
  };

  const B = {
    o: { value: Array.from({ length: N_BEAMS }, () => V(0, 0, 0)) },
    d: { value: Array.from({ length: N_BEAMS }, () => new THREE.Vector4(0, 1, 0, BEAM_SPREAD)) },
    i: { value: new Array(N_BEAMS).fill(0) },
    flare: { value: new THREE.Vector4(0, 200, -900, 0) },
  };
  const planes = new THREE.InstancedMesh(bomberGeometry(), bomberMaterial(B), N_PLANES);
  group.add(planes);
  const exGeo = new THREE.BufferGeometry();
  const exPos = new Float32Array(N_PLANES * 2 * 3), exI = new Float32Array(N_PLANES * 2);
  exGeo.setAttribute('position', new THREE.BufferAttribute(exPos, 3));
  exGeo.setAttribute('aI', new THREE.BufferAttribute(exI, 1));
  group.add(new THREE.Points(exGeo, lightMaterial('exhaust')));

  /* ── the searchlights: where each stands, where it idles, how it wanders ── */
  const BEAMS = [
    { o: V(-170, 0, -930), az: 0.5, el: 1.0, track: true },
    { o: V(120, 0, -990), az: -0.4, el: 1.05, track: true },
    { o: V(250, 0, -880), az: -0.9, el: 0.95 },
    { o: V(-290, 0, -1010), az: 0.9, el: 0.9 },
    { o: V(30, 0, -1090), az: 0.1, el: 1.15, track: true, late: true },
  ];
  const beamGeo = new THREE.CylinderGeometry(1, 0.03, 1, 28, 1, true).translate(0, 0.5, 0);
  const UP = V(0, 1, 0);
  BEAMS.forEach((b, i) => {
    b.mesh = new THREE.Mesh(beamGeo, beamMaterial());
    const R = BEAM_LEN * BEAM_SPREAD + 0.6;
    b.mesh.scale.set(R, BEAM_LEN, R);
    b.mesh.position.copy(b.o);
    b.mesh.renderOrder = 4;
    b.dir = null;
    B.o.value[i].copy(b.o);
    group.add(b.mesh);
  });

  /* ── the heavy guns' shells ── */
  const bGeo = new THREE.BufferGeometry();
  const bPos = new Float32Array(N_BURSTS * 3), bBirth = new Float32Array(N_BURSTS).fill(-1e5), bSeed = new Float32Array(N_BURSTS);
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  bGeo.setAttribute('aBirth', new THREE.BufferAttribute(bBirth, 1));
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1));
  const bursts = new THREE.Points(bGeo, burstMaterial());
  bursts.renderOrder = 5;
  group.add(bursts);
  const EVERY = 0.6;
  const burstTime = (k) => k * EVERY + hash(k) * 0.45;

  /* ── the light guns' tracer ── */
  const GUNS = [{ o: V(-95, 3, -905), every: 3.9, ph: 0.4 }, { o: V(150, 3, -950), every: 5.1, ph: 2.2 }, { o: V(25, 3, -1010), every: 6.3, ph: 4.0 }];
  const ROUNDS = 12, GAP = 0.11, LIFE = 2.3, V0 = 230, G = 12;
  const tGeo = new THREE.BufferGeometry();
  const tPos = new Float32Array(N_QUADS * 4 * 3), tA = new Float32Array(N_QUADS * 4);
  const tIdx = [];
  for (let q = 0; q < N_QUADS; q++) tIdx.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  tGeo.setAttribute('aA', new THREE.BufferAttribute(tA, 1));
  tGeo.setIndex(tIdx);
  const tracer = new THREE.Mesh(tGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aA; varying float vA; void main() { vA = aA; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'precision highp float; varying float vA; void main() { gl_FragColor = vec4(vec3(1.0, 0.5, 0.17) * (0.6 + 3.4 * vA * vA) * vA, 1.0); }',
  }));
  tracer.renderOrder = 6;
  group.add(tracer);

  /* ── the flares ── */
  const fGeo = new THREE.BufferGeometry();
  const fPos = new Float32Array(N_FLARES * 3), fI = new Float32Array(N_FLARES);
  fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute('aI', new THREE.BufferAttribute(fI, 1));
  const flares = new THREE.Points(fGeo, lightMaterial('flare'));
  flares.renderOrder = 6;
  group.add(flares);
  const FLARE_EVERY = 46;
  const FLARES = [{ x: -85, z: -960, off: 0 }, { x: 125, z: -1015, off: 23 }];

  group.traverse((o) => { o.frustumCulled = false; o.userData.free = true; });
  group.visible = false;
  scene.add(group);

  /* working room */
  const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), sc = V(SIZE, SIZE, SIZE);
  const p = V(), a = V(), b = V(), c = V(), want = V(), side = V(), X = V(1, 0, 0);
  const yaw = Math.atan2(-HEAD.z, HEAD.x);
  const state = { k: null, bomb: null, gun: GUNS.map(() => null) };
  const flare = { dir: V(0, 1, 0), col: [1.0, 0.88, 0.66], amount: 0 };
  const events = [];
  const spot = (i, dir, I, r, g, bl, tight) => { sky.uSpots.value[i].set(dir.x, dir.y, dir.z, I); sky.uSpotCols.value[i].set(r, g, bl, tight); };
  const heard = (kind, at, cam, delay, far) => {
    c.copy(at).applyMatrix4(cam.matrixWorldInverse);
    events.push({ kind, pan: clamp(c.x / Math.max(1, Math.abs(c.z)), -1, 1), far, delay });
  };

  return {
    group, flare,
    /* t: the hour. k: how much of the raid is overhead, 0 to 1. Returns what is heard, and when. */
    update(t, k, camera, dt) {
      events.length = 0;
      const on = k > 0.01;
      group.visible = on;
      sky.uSpotOn.value = on ? 1 : 0;
      if (!on) { flare.amount = 0; state.k = null; return events; }
      const cam = camera.position;
      const first = state.k === null;

      /* the stream */
      for (let i = 0; i < N_PLANES; i++) {
        planeAt(i, t, p);
        q1.setFromAxisAngle(UP, yaw).multiply(q2.setFromAxisAngle(X, Math.sin(t * 0.4 + i * 1.7) * 0.05));
        planes.setMatrixAt(i, m4.compose(p, q1, sc));
        for (const s of [0, 1]) {
          a.set(-1.9, -0.4, s ? 3.05 : -3.05).multiplyScalar(SIZE).applyQuaternion(q1).add(p);
          exPos.set([a.x, a.y, a.z], (i * 2 + s) * 3);
          exI[i * 2 + s] = k * (0.75 + 0.25 * Math.sin(t * 31 + i * 5 + s * 2));
        }
      }
      planes.instanceMatrix.needsUpdate = true;
      exGeo.attributes.position.needsUpdate = true; exGeo.attributes.aI.needsUpdate = true;

      /* the lights: two hold the leader, one comes to it late, the rest search */
      const hi = held(t);
      const turn = first ? 1 : 1 - Math.exp(-dt * 1.3);
      BEAMS.forEach((bm, i) => {
        const az = bm.az + 0.5 * Math.sin(t * (0.11 + i * 0.023) + i * 2.4), el = bm.el + 0.2 * Math.sin(t * (0.083 + i * 0.017) + i * 1.3);
        want.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));
        if (bm.track && hi >= 0 && !(bm.late && planeS(hi, t) < -40)) {
          planeAt(hi, t, p);
          /* a hand on a wheel: never quite still on it */
          want.copy(p).sub(bm.o).normalize();
          want.x += Math.sin(t * 1.3 + i * 4) * 0.012; want.z += Math.sin(t * 0.9 + i * 2) * 0.012; want.normalize();
        }
        if (!bm.dir) bm.dir = want.clone(); else bm.dir.lerp(want, turn).normalize();
        bm.mesh.quaternion.setFromUnitVectors(UP, bm.dir);
        const I = k * (0.85 + 0.15 * Math.sin(t * 7 + i * 3));
        bm.mesh.material.uniforms.uAmount.value = 0.5 * I;
        B.d.value[i].set(bm.dir.x, bm.dir.y, bm.dir.z, BEAM_SPREAD);
        B.i.value[i] = I;
        /* where it comes to rest on the cloud */
        a.copy(bm.o).addScaledVector(bm.dir, CLOUD / Math.max(bm.dir.y, 0.2)).sub(cam).normalize();
        spot(i, a, 0.3 * I, 0.55, 0.65, 0.85, 1100);
      });

      /* the shells */
      const kNow = Math.floor(t / EVERY);
      if (kNow !== state.k) {
        for (let j = 0; j < N_BURSTS; j++) {
          const kk = kNow - j, slot = ((kk % N_BURSTS) + N_BURSTS) % N_BURSTS;
          const tb = burstTime(kk);
          if (hash(kk + 0.7) > k * 1.15) { bBirth[slot] = -1e5; continue; }
          let who = held(tb);
          if (who < 0 || hash(kk + 0.21) < 0.25) who = Math.floor(hash(kk + 0.3) * N_PLANES);
          planeAt(who, tb, p);
          p.x += (hash(kk + 1.1) - 0.62) * 120; p.y += (hash(kk + 2.2) - 0.55) * 46; p.z += (hash(kk + 3.3) - 0.5) * 110;
          bPos.set([p.x, p.y, p.z], slot * 3);
          bBirth[slot] = tb; bSeed[slot] = hash(kk + 4.4);
          if (!first && kk > state.k) heard('flak', p, camera, Math.max(0, tb - t) + p.distanceTo(cam) / 343, clamp((p.distanceTo(cam) - 220) / 380));
        }
        bGeo.attributes.position.needsUpdate = true; bGeo.attributes.aBirth.needsUpdate = true; bGeo.attributes.aSeed.needsUpdate = true;
        state.k = kNow;
      }
      bursts.material.uniforms.uAmount.value = clamp(k * 1.5);

      /* the tracer */
      let qn = 0;
      tA.fill(0);
      GUNS.forEach((g, gi) => {
        const j0 = Math.floor((t - g.ph) / g.every);
        if (state.gun[gi] !== null && j0 > state.gun[gi] && hash(j0 * 3.1 + gi) < k) heard('gun', g.o, camera, g.o.distanceTo(cam) / 343, 0.5);
        state.gun[gi] = j0;
        for (let jj = j0 - 1; jj <= j0; jj++) {
          if (hash(jj * 3.1 + gi) >= k) continue;
          const T0 = jj * g.every + g.ph;
          const who = held(T0);
          if (who >= 0) planeAt(who, T0 + 1.2, want); else want.set(g.o.x + (hash(jj + gi) - 0.5) * 200, 160, g.o.z - 80);
          want.sub(g.o).normalize();
          want.y += 0.1;
          for (let r = 0; r < ROUNDS && qn < N_QUADS; r++) {
            const age = t - (T0 + r * GAP);
            if (age < 0 || age > LIFE) continue;
            /* the gun walks its fire */
            c.copy(want); c.x += Math.sin(r * 0.5 + jj) * 0.03 + (hash(jj * 13 + r) - 0.5) * 0.02; c.y += (hash(jj * 7 + r) - 0.5) * 0.02; c.normalize();
            const at = (s) => p.copy(g.o).addScaledVector(c, V0 * s).setY(g.o.y + c.y * V0 * s - 0.5 * G * s * s);
            a.copy(at(age)); b.copy(at(Math.max(0, age - 0.075)));
            const w = Math.max(0.06, a.distanceTo(cam) * 0.0011);
            side.copy(a).sub(b).cross(p.copy(cam).sub(a)).normalize().multiplyScalar(w);
            const o = qn * 12, al = smooth(LIFE, LIFE - 0.3, age) * clamp(k * 1.5);
            tPos.set([b.x - side.x, b.y - side.y, b.z - side.z, b.x + side.x, b.y + side.y, b.z + side.z, a.x + side.x, a.y + side.y, a.z + side.z, a.x - side.x, a.y - side.y, a.z - side.z], o);
            tA[qn * 4 + 2] = al; tA[qn * 4 + 3] = al;
            qn++;
          }
        }
      });
      for (let i = qn * 12; i < tPos.length; i++) tPos[i] = 0;
      tGeo.attributes.position.needsUpdate = true; tGeo.attributes.aA.needsUpdate = true;

      /* the flares, coming down */
      let best = 0;
      flare.amount = 0;
      FLARES.forEach((f, i) => {
        const age = (((t + f.off) % FLARE_EVERY) + FLARE_EVERY) % FLARE_EVERY, n = Math.floor((t + f.off) / FLARE_EVERY);
        const I = smooth(0, 1.2, age) * (1 - smooth(33, 38, age)) * (0.82 + 0.18 * Math.sin(t * 23 + i) * Math.sin(t * 14.3)) * clamp(k * 1.6);
        p.set(f.x + (hash(n + i * 9) - 0.5) * 60 + 6 * Math.sin(age * 0.21 + i) + 1.1 * age, 150 - 2.6 * age, f.z + (hash(n * 3 + i) - 0.5) * 60);
        fPos.set([p.x, p.y, p.z], i * 3);
        fI[i] = I;
        a.copy(p).sub(cam);
        const d = a.length();
        a.divideScalar(d);
        spot(N_BEAMS + i, a, 0.11 * I, 1.0, 0.86, 0.62, 16);
        if (I > best) { best = I; flare.dir.copy(a); flare.amount = I; B.flare.value.set(p.x, p.y, p.z, I); }
      });
      if (best === 0) B.flare.value.w = 0;
      bursts.material.uniforms.uLit.value = best;
      fGeo.attributes.position.needsUpdate = true; fGeo.attributes.aI.needsUpdate = true;

      /* the bombs, a long way off: the cloud lights up over them, and the sound comes later */
      const EACH = 5.3, bNow = Math.floor(t / EACH);
      for (let j = 0; j < 2; j++) {
        const bb = bNow - j, tb = bb * EACH + hash(bb + 11) * 3.2, age = t - tb;
        const azm = (hash(bb + 2) - 0.5) * 1.9;
        a.set(Math.sin(azm), 0.02, -Math.cos(azm)).normalize();
        const I = age >= 0 ? Math.exp(-age * 3.2) * (0.5 + 0.9 * hash(bb + 5)) * clamp(k * 1.5) : 0;
        spot(N_BEAMS + N_FLARES + j, a, I, 1.0, 0.62, 0.3, 26);
        if (age >= 0 && state.bomb !== null && bb > state.bomb) { state.bomb = bb; events.push({ kind: 'bomb', pan: clamp(Math.sin(azm) * 1.2, -1, 1), far: 1, delay: 2.2 + hash(bb) * 2.4 }); }
      }
      if (state.bomb === null) state.bomb = bNow;
      spot(N_SPOTS - 1, UP, 0, 0, 0, 0, 1);
      return events;
    },
  };
}
