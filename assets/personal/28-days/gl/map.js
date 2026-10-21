/* ============================================================
   Where they fought.

   The ghetto as it was on the eve of the uprising, as a model on a
   table under one lamp: every block of houses, the wall round it,
   the rest of the city dark beyond. The camera goes from one place
   of the fighting to the next, and each lights up as it is named.
   The table can be turned by hand. Where the way divides, the model
   is where the visitor chooses: the two fights of the first day are
   shown on it from above, and a touch on either goes there.

   The same model, small, stands in the corner of the picture for
   the whole walk in place of a list of chapters: it shows where in
   the ghetto you are.

   The blocks are traced from the map by BorysMapping (Wikimedia
   Commons, CC BY-SA 4.0), see map-data.js. One pixel of that map is
   a tenth of a unit here; x runs east and z south.
   ============================================================ */

import * as THREE from 'three';
import { world, GLSL_NOISE } from './common.js';
import { MAP_SIZE, INSIDE, OUTSIDE, HELD, WALL } from './map-data.js';

const K = 0.1;
const CX = 880, CY = 760;                      // the middle of the model, in map pixels
const X = (px) => (px - CX) * K, Z = (py) => (py - CY) * K;

/* the places, in map pixels, read off the map's own address labels.
   go: a place the visitor can choose to go to, and which fight it is */
export const PLACES = {
  crossing:  { at: [780, 446], label: 'Zamenhofa and Miła', area: 'central', org: 'zob', go: 'zob' },
  nalewki:   { at: [1172, 433], label: '33 Nalewki Street', area: 'central', org: 'zob' },
  square:    { at: [1252, 172], label: '7 Muranowska · ŻZW headquarters', area: 'square', org: 'zzw', go: 'zzw' },
  tunnel:    { at: [1173, 96], label: 'The tunnel, out to 6 Muranowska', area: 'square', org: 'zzw' },
  brush:     { at: [1478, 520], label: 'The brushmakers', area: 'brush', org: 'zob' },
  swieto:    { at: [1509, 530], label: '32 Świętojerska', area: 'brush', org: 'zob', small: true },
  shops:     { at: [760, 1250], label: 'Többens and Schultz', area: 'shops', org: 'both' },
  mila18:    { at: [866, 351], label: '18 Miła · ŻOB command', area: 'bunkers', org: 'zob' },
  franc30:   { at: [1298, 396], label: '30 Franciszkańska', area: 'bunkers', org: 'zob' },
};
/* the areas the camera visits: where it looks, how far back it stands, and how much is lit */
const AREAS = {
  all:     { at: [900, 760], r: 0, dist: 205, tilt: 1.02, turn: -0.22 },
  central: { at: [930, 450], r: 330, dist: 70, tilt: 0.86, turn: -0.42 },
  square:  { at: [1215, 165], r: 150, dist: 54, tilt: 0.8, turn: -0.15 },
  brush:   { at: [1475, 510], r: 145, dist: 52, tilt: 0.82, turn: 0.25 },
  shops:   { at: [760, 1250], r: 330, dist: 78, tilt: 0.86, turn: -0.6 },
  bunkers: { at: [900, 380], r: 150, dist: 46, tilt: 0.7, turn: -0.3 },
  dive:    { at: [780, 446], r: 70, dist: 9, tilt: 0.32, turn: -0.3 },
  /* where the visitor chooses: both fights of the first day in one look */
  choose:  { at: [1015, 335], r: 0, dist: 128, tilt: 0.93, turn: -0.2 },
};
/* when, in the chapter, the camera is at each: [fraction, area] */
const SHOTS = [[0, 'all'], [0.17, 'all'], [0.25, 'central'], [0.36, 'central'], [0.42, 'square'], [0.53, 'square'], [0.59, 'brush'], [0.7, 'brush'], [0.76, 'shops'], [0.86, 'shops'], [0.9, 'bunkers'], [0.965, 'bunkers'], [1.0, 'dive']];

/* The first day, from above. The way each German column came, in map pixels, and where it was stopped.
   One column came up Zamenhofa from the gate at Gęsia Street and was caught in the crossing with Miła;
   another came in along Nalewki and was stopped at the corner of Gęsia; in the afternoon the square
   was attacked across its open side. (POLIN, calendar of the uprising; USHMM.) The lines follow the
   streets of the traced map; they are where the fighting was, not a survey. */
const ROUTES = [
  { org: 'zob', pts: [[975, 566], [900, 520], [840, 483], [792, 453]] },
  { org: 'zob', pts: [[1262, 560], [1222, 500], [1188, 452]] },
  { org: 'zzw', pts: [[1118, 318], [1160, 262], [1205, 212], [1236, 186]] },
];
/* where the fighters fired from: [x, y, which fight] */
const SHOTS_AT = [
  [770, 432, 0], [795, 462, 0], [762, 452, 0], [802, 438, 0], [778, 470, 0], [1160, 428, 0], [1182, 440, 0],
  [1252, 172, 1], [1266, 160, 1], [1240, 160, 1], [1272, 182, 1], [1228, 178, 1], [1258, 150, 1],
];

/* rings of the traced map into shapes: the outer rings, and (for the wall) the holes in them */
function shapes(list, { holes = false } = {}) {
  const ring = (r) => { const pts = []; for (let i = 0; i < r.p.length; i += 2) pts.push(new THREE.Vector2(X(r.p[i]), -Z(r.p[i + 1]))); return pts; };
  const outers = list.filter((r) => r.a > 0).map((r) => ({ r, shape: new THREE.Shape(ring(r)), box: new THREE.Box2().setFromPoints(ring(r)) }));
  if (holes) {
    for (const h of list.filter((r) => r.a < 0)) {
      const pts = ring(h), hb = new THREE.Box2().setFromPoints(pts);
      let best = null;
      for (const o of outers) if (o.box.containsBox(hb) && (!best || o.r.a < best.r.a)) best = o;
      if (best) best.shape.holes.push(new THREE.Path(pts));
    }
  }
  return outers.map((o) => o.shape);
}
function prisms(list, height, opts) {
  const g = new THREE.ExtrudeGeometry(shapes(list, opts), { depth: height, bevelEnabled: false, curveSegments: 1 });
  /* the shapes were drawn in x and -z: stand them up, so they rise in y */
  g.rotateX(-Math.PI / 2);
  return g;
}

/* the model's paint: paper and card, lit by the lamp, and an area lit from inside when it is named */
function modelMaterial(base, { held = 0, wall = 0 } = {}, S) {
  return new THREE.ShaderMaterial({
    uniforms: { ...world, uBase: { value: new THREE.Color(...base) }, uHeld: { value: held }, uWall: { value: wall }, uArea: S.area, uGlow: S.glow, uShow: S.show },
    polygonOffset: held > 0, polygonOffsetFactor: held > 0 ? -1 : 0, polygonOffsetUnits: held > 0 ? -1 : 0,
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying vec3 vL;
      void main() {
        vL = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz; vN = mat3(modelMatrix) * normal;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec3 vL;
      uniform vec3 uBase; uniform float uHeld, uWall, uGlow, uShow; uniform vec4 uArea;
      uniform vec3 uSunDir, uSunCol, uSkyCol;
      ${GLSL_NOISE}
      void main() {
        /* a sliver of a face from the tracing can have no direction: give it one, or it poisons the glow */
        float nl = length(vN);
        vec3 N = nl > 1e-5 ? vN / nl : vec3(0.0, 1.0, 0.0);
        /* the lamp over the table, and what the room gives back */
        float lamp = max(dot(N, normalize(uSunDir)), 0.0);
        float pool = exp(-dot(vP.xz, vP.xz) / 9000.0);
        vec3 c = uBase * (uSunCol * lamp * (0.45 + 0.75 * pool) + uSkyCol * (0.55 + 0.45 * N.y));
        /* card has a grain */
        c *= 0.93 + 0.1 * nz(vP.xz * 3.1 + vP.y * 7.0);
        /* the named area, lit as if from inside: the tops warm, the sides a little */
        float d = length(vP.xz - uArea.xy);
        float lit = (1.0 - smoothstep(uArea.z * 0.55, max(uArea.z, 0.01), d)) * uArea.w;
        c += vec3(1.0, 0.36, 0.08) * lit * (0.22 + 0.5 * step(0.5, N.y)) * (0.4 + 0.6 * uHeld) * uGlow;
        /* buildings that were held glow as embers when the bunkers are named */
        c = mix(c, c * 0.55 + vec3(0.9, 0.28, 0.05) * (0.25 + 0.6 * step(0.5, N.y)), uHeld * uGlow * 0.85);
        c = mix(c, vec3(0.03, 0.025, 0.02), uWall);
        c *= uShow;
        if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}

/* a ribbon laid along a street: the way a column came, with its head where it was stopped */
function ribbon(pts, y, w) {
  const pos = [], uv = [];
  let run = 0;
  const P = pts.map(([x, z]) => new THREE.Vector2(X(x), Z(z)));
  const total = P.slice(1).reduce((s, p, i) => s + p.distanceTo(P[i]), 0);
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], d = b.clone().sub(a), len = d.length();
    const n = new THREE.Vector2(-d.y, d.x).normalize().multiplyScalar(w / 2);
    const u0 = run / total, u1 = (run + len) / total;
    const q = [[a.x - n.x, a.y - n.y, u0, 0], [a.x + n.x, a.y + n.y, u0, 1], [b.x + n.x, b.y + n.y, u1, 1], [b.x - n.x, b.y - n.y, u1, 0]];
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(q[k][0], y, q[k][1]); uv.push(q[k][2] * total, q[k][3]); }
    run += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.userData.total = total;
  return g;
}

export function buildMap() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 900);
  const S = { area: { value: new THREE.Vector4(0, 0, 1, 0) }, glow: { value: 1 }, show: { value: 1 }, held: { value: 0 } };

  /* the table under it */
  const table = new THREE.Mesh(new THREE.PlaneGeometry(420, 420).rotateX(-Math.PI / 2), modelMaterial([0.08, 0.07, 0.06], {}, S));
  table.position.y = -0.02;
  scene.add(table);
  const geo = { outside: prisms(OUTSIDE, 0.9), inside: prisms(INSIDE, 1.3), held: prisms(HELD, 1.52), wall: prisms(WALL, 2.1, { holes: true }) };
  scene.add(new THREE.Mesh(geo.outside, modelMaterial([0.2, 0.19, 0.18], {}, S)));
  scene.add(new THREE.Mesh(geo.inside, modelMaterial([0.62, 0.58, 0.5], {}, S)));
  const heldMat = modelMaterial([0.5, 0.42, 0.33], { held: 1 }, S);
  heldMat.uniforms.uHeld = S.held;
  scene.add(new THREE.Mesh(geo.held, heldMat));
  scene.add(new THREE.Mesh(geo.wall, modelMaterial([0.05, 0.045, 0.04], { wall: 1 }, S)));

  /* pins at the places: a thin stem, and a head that burns */
  const pins = {};
  const stem = new THREE.CylinderGeometry(0.06, 0.06, 1, 6).translate(0, 0.5, 0);
  const head = new THREE.SphereGeometry(0.42, 16, 10);
  for (const [id, pl] of Object.entries(PLACES)) {
    const g = new THREE.Group();
    const col = pl.org === 'zzw' ? new THREE.Color(0.7, 0.8, 1.0) : new THREE.Color(1.0, 0.45, 0.1);
    const m = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(3), transparent: true });
    const s = new THREE.Mesh(stem, new THREE.MeshBasicMaterial({ color: 0x1a1612, transparent: true }));
    s.scale.y = pl.small ? 3 : 5;
    const h = new THREE.Mesh(head, m);
    h.position.y = s.scale.y;
    g.add(s, h);
    g.position.set(X(pl.at[0]), 1.3, Z(pl.at[1]));
    scene.add(g);
    pins[id] = { id, g, head: h, stem: s, mat: m, smat: s.material, top: new THREE.Vector3(g.position.x, 1.3 + s.scale.y + 0.6, g.position.z), place: pl, v: 0 };
  }
  /* the ŻZW tunnel: a line of light under the wall */
  const tA = PLACES.square.at, tB = PLACES.tunnel.at;
  const tunnelGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X(tA[0]), 1.0, Z(tA[1])), new THREE.Vector3(X(tB[0]), 1.0, Z(tB[1]))]);
  const tunnelMat = new THREE.LineDashedMaterial({ color: 0xb4c8ff, dashSize: 0.8, gapSize: 0.6, transparent: true });
  const tunnel = new THREE.Line(tunnelGeo, tunnelMat);
  tunnel.computeLineDistances();
  scene.add(tunnel);

  /* ── the fights, from above ── */
  const F = { time: { value: 0 }, on: { value: new THREE.Vector2(0, 0) } };       // how much of each fight is shown: the ŻOB's, the ŻZW's
  const routes = ROUTES.map((r) => {
    const g = ribbon(r.pts, 1.62, 0.7);
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: F.time, uOn: F.on, uWhich: { value: r.org === 'zzw' ? 1 : 0 }, uLen: { value: g.userData.total } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; uniform float uTime, uWhich, uLen; uniform vec2 uOn;
        void main() {
          float on = mix(uOn.x, uOn.y, uWhich);
          /* men in a column: marks that move up the street, and stop where they were stopped */
          float along = vUv.x;
          float head = uLen * (0.55 + 0.45 * (0.5 + 0.5 * sin(uTime * 0.5 + uWhich * 2.0)));
          float marks = step(0.45, fract((along - uTime * 1.4) * 0.9));
          float a = marks * step(along, head) * smoothstep(0.0, 0.25, 0.5 - abs(vUv.y - 0.5));
          /* thrown back: the head of it flares */
          float hit = exp(-abs(along - head) * 1.2) * (0.6 + 0.4 * sin(uTime * 9.0));
          vec3 c = mix(vec3(0.42, 0.5, 0.46), vec3(1.0, 0.5, 0.15) * 2.4, hit * 0.8);
          gl_FragColor = vec4(c * 1.5, (a * 0.9 + hit * 0.5) * on);
        }
      `,
    }));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return mesh;
  });
  /* the shots from the houses: sparks that come and go */
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(SHOTS_AT.length * 3), ss = new Float32Array(SHOTS_AT.length * 2);
  SHOTS_AT.forEach(([x, y, w], i) => { sp[i * 3] = X(x); sp[i * 3 + 1] = 1.9; sp[i * 3 + 2] = Z(y); ss[i * 2] = i * 0.731; ss[i * 2 + 1] = w; });
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(ss, 2));
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: F.time, uOn: F.on, uScale: { value: 600 } },
    vertexShader: /* glsl */ `
      attribute vec2 aSeed; uniform float uTime, uScale; uniform vec2 uOn; varying float vA;
      void main() {
        float t = uTime * (2.2 + fract(aSeed.x * 3.7) * 2.0) + aSeed.x * 17.0;
        float fire = pow(max(0.0, sin(t) * sin(t * 2.7 + aSeed.x) ), 6.0);
        vA = (0.25 + fire * 2.4) * mix(uOn.x, uOn.y, aSeed.y);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.3 + fire * 2.6) * uScale / max(-mv.z, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: 'precision highp float; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vec3(1.0, 0.62, 0.22) * a * vA, 1.0); }',
  }));
  sparks.frustumCulled = false; sparks.renderOrder = 4;
  scene.add(sparks);
  /* the two flags on the roof at Muranowska: two small leaves of colour */
  const flagGeo = new THREE.PlaneGeometry(1.1, 0.7).translate(0.55, 0, 0);
  const flags = [[0xf2f2f2, 0xd8262e, -0.5], [0xf4f4f8, 0x2a56c8, 0.5]].map(([a, b, dx]) => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(a).multiplyScalar(1.4), side: THREE.DoubleSide, transparent: true }));
    const bot = new THREE.Mesh(flagGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(b).multiplyScalar(1.4), side: THREE.DoubleSide, transparent: true }));
    top.scale.y = 0.5; top.position.y = 0.175; bot.scale.y = 0.5; bot.position.y = -0.175;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5).translate(0, -0.75, 0), new THREE.MeshBasicMaterial({ color: 0x15120f, transparent: true }));
    g.add(top, bot, pole);
    g.position.set(X(1252) + dx + 1.4, 3.6, Z(172) + 0.9);
    g.userData.mats = [top.material, bot.material, pole.material];
    scene.add(g);
    return g;
  });

  /* the path of the camera: from area to area */
  const target = new THREE.Vector3(), pos = new THREE.Vector3(), off = new THREE.Vector3(), t0 = new THREE.Vector3(), p0 = new THREE.Vector3();
  const frame = (name, out, lookOut) => {
    const a = AREAS[name];
    const tx = X(a.at[0]), tz = Z(a.at[1]);
    lookOut.set(tx, 0, tz);
    const ang = a.turn;
    out.set(tx + Math.sin(ang) * a.dist * Math.cos(a.tilt), a.dist * Math.sin(a.tilt), tz + Math.cos(ang) * a.dist * Math.cos(a.tilt));
  };
  const keys = SHOTS.map(([f, name]) => { const p = new THREE.Vector3(), l = new THREE.Vector3(); frame(name, p, l); return { f, p, l, name }; });
  const smooth = (t) => t * t * (3 - 2 * t);
  const chP = new THREE.Vector3(), chL = new THREE.Vector3();
  frame('choose', chP, chL);
  const st = { choose: 0, fly: 0, yaw: 0, pitch: 0, zoom: 1 };
  const UP = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3();

  const lit = new THREE.Vector4();
  return {
    scene, camera, pins, PLACES, geo,
    /* be there at once, without the move: for when the map is brought up from somewhere else */
    snap(choose) { st.choose = choose ? 1 : 0; st.fly = 0; st.yaw = st.pitch = 0; st.zoom = 1; },
    /* f: how far through the chapter. t: the time, for the slow drift of the camera.
       o: { yaw, pitch: the hand on the table. choose: the visitor is choosing where to go.
            to: the place chosen, once it is. seen: { zob, zzw }. zoom: nearer or further } */
    update(f, t, aspect, o = {}, dt = 0.016) {
      let i = 0;
      while (i < keys.length - 2 && f > keys[i + 1].f) i++;
      const A = keys[i], B = keys[i + 1];
      const k = smooth(Math.min(1, Math.max(0, (f - A.f) / (B.f - A.f))));
      pos.lerpVectors(A.p, B.p, k);
      target.lerpVectors(A.l, B.l, k);
      /* choosing: both fights in one look. Chosen: down to the place itself. */
      const ease = 1 - Math.exp(-dt * 3.2);
      st.choose += ((o.choose ? 1 : 0) - st.choose) * ease;
      st.fly += ((o.to ? 1 : 0) - st.fly) * (1 - Math.exp(-dt * 2.4));
      const c = smooth(Math.min(1, st.choose));
      pos.lerp(chP, c); target.lerp(chL, c);
      if (o.to && PLACES[o.to]) {
        const pl = PLACES[o.to];
        t0.set(X(pl.at[0]), 0.6, Z(pl.at[1]));
        p0.set(t0.x - 3.5, 7.5, t0.z + 11);
        const fl = smooth(Math.min(1, st.fly));
        pos.lerp(p0, fl); target.lerp(t0, fl);
      }
      /* the hand on the table: it turns about what the camera looks at, and tips */
      st.yaw += ((o.yaw || 0) - st.yaw) * (1 - Math.exp(-dt * 8));
      st.pitch += ((o.pitch || 0) - st.pitch) * (1 - Math.exp(-dt * 8));
      st.zoom += ((o.zoom || 1) - st.zoom) * (1 - Math.exp(-dt * 6));
      off.subVectors(pos, target).multiplyScalar(st.zoom);
      off.applyAxisAngle(UP, -st.yaw * 1.4);
      side.crossVectors(UP, off).normalize();
      const elev = Math.atan2(off.y, Math.hypot(off.x, off.z));
      const want = Math.min(1.45, Math.max(0.22, elev - st.pitch * 0.9));
      off.applyAxisAngle(side, -(want - elev));
      pos.copy(target).add(off);
      /* a slow turn, as a camera on a crane drifts */
      pos.x += Math.sin(t * 0.07) * 1.2; pos.z += Math.cos(t * 0.05) * 1.2;
      camera.position.copy(pos);
      camera.lookAt(target);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      /* which area is named now: the one the camera is at, or going to */
      const name = c > 0.5 ? 'choose' : (k < 0.5 ? A.name : B.name);
      const ar = AREAS[name];
      const strength = name === 'all' || name === 'dive' || name === 'choose' ? 0 : 1;
      lit.set(X(ar.at[0]), Z(ar.at[1]), Math.max(ar.r, 60) * K, strength);
      S.area.value.lerp(lit, 0.08);
      S.held.value += ((name === 'bunkers' ? 1 : 0) - S.held.value) * 0.08;
      /* the pins of the named area stand up; the rest are low. Choosing, the two fights stand. */
      const seen = o.seen || {};
      for (const pin of Object.values(pins)) {
        const on = name === 'choose' ? (pin.place.go ? 1 : 0) : (pin.place.area === name ? 1 : 0);
        pin.v += (on - pin.v) * 0.1;
        const beat = name === 'choose' && pin.place.go && !seen[pin.place.go] ? 0.12 * Math.sin(t * 3.2) : 0;
        pin.g.scale.setScalar(0.25 + 0.75 * pin.v + beat);
        pin.mat.opacity = 0.35 + 0.65 * pin.v;
        pin.smat.opacity = 0.3 + 0.7 * pin.v;
      }
      tunnelMat.opacity = name === 'square' || name === 'choose' ? 1 : 0.15;
      /* the fights themselves, where the camera is over them */
      F.time.value = t;
      const fz = name === 'choose' || name === 'central' || name === 'dive' ? 1 : 0, fq = name === 'choose' || name === 'square' ? 1 : 0;
      F.on.value.x += (fz - F.on.value.x) * 0.06;
      F.on.value.y += (fq - F.on.value.y) * 0.06;
      sparks.material.uniforms.uScale.value = 900 * (innerHeight / 810);
      flags.forEach((g, n) => {
        g.rotation.y = Math.sin(t * 2.1 + n) * 0.25;
        for (const m of g.userData.mats) m.opacity = F.on.value.y;
        g.visible = F.on.value.y > 0.02;
      });
      return { name, camera, target };
    },
  };
}

/* ── the small map in the corner ──────────────────────────────
   Where each chapter of the walk is, in map pixels. The first chapters are in the part of the ghetto
   that was gone by 1943 and that this map does not show: the small ghetto, south of Chłodna Street.
   They are marked on its southern edge. Places marked ~ are not on the traced map and are put where
   the street is, not surveyed. */
export const WHERE = {
  wall: [905, 1560], inside: [1010, 1575], bridge: [800, 1575],
  trains: [470, 300],          // ~ the Umschlagplatz, on Stawki Street
  two: [925, 610], zzw: PLACES.square.at, january: [735, 385],
  april: PLACES.crossing.at, flags: PLACES.square.at, brush: PLACES.brush.at,
  burning: [1075, 540], mila: PLACES.mila18.at,
  sewers: [1374, 308],         // 22 Franciszkańska, where they went down
  raid: [1010, 430],
  lastday: [1330, 1110],       // ~ Tłomackie Street
  after: PLACES.mila18.at,
};

export function buildMini(atlas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 900);
  const U = { uRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uAlpha: { value: 1 } };
  const paint = (rgb, flat = 0) => new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { ...U, uBase: { value: new THREE.Color(...rgb) }, uFlat: { value: flat } },
    vertexShader: 'varying vec3 vN; void main() { vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vN; uniform vec3 uBase; uniform vec4 uRect; uniform float uAlpha, uFlat;
      void main() {
        float nl = length(vN);
        vec3 N = nl > 1e-5 ? vN / nl : vec3(0.0, 1.0, 0.0);
        float l = mix(0.42 + 0.58 * max(dot(N, normalize(vec3(-0.4, 0.8, 0.45))), 0.0), 1.0, uFlat);
        /* it has no edge: it is laid on the picture and thins away */
        vec2 q = (gl_FragCoord.xy - uRect.xy) / uRect.zw * 2.0 - 1.0;
        float a = 1.0 - smoothstep(0.72, 1.0, length(q * vec2(0.96, 1.0)));
        gl_FragColor = vec4(uBase * l, a * uAlpha);
      }
    `,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), paint([0.03, 0.026, 0.022], 1));
  ground.position.y = -0.05; ground.renderOrder = 0;
  scene.add(ground);
  scene.add(new THREE.Mesh(atlas.geo.outside, paint([0.1, 0.092, 0.085])));
  scene.add(new THREE.Mesh(atlas.geo.inside, paint([0.5, 0.46, 0.4])));
  scene.add(new THREE.Mesh(atlas.geo.held, paint([0.56, 0.5, 0.42])));
  scene.add(new THREE.Mesh(atlas.geo.wall, paint([0.02, 0.018, 0.016], 1)));
  /* you are here: a light, and a ring that widens from it */
  const you = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff6b1c, transparent: true }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, depthTest: false }));
  ring.renderOrder = 5; you.renderOrder = 6;
  scene.add(you, ring);
  /* the way walked so far */
  const order = Object.keys(WHERE);
  const pts = order.map((id) => new THREE.Vector3(X(WHERE[id][0]), 2.4, Z(WHERE[id][1])));
  const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff6b1c, transparent: true, opacity: 0.75, depthTest: false }));
  trail.renderOrder = 4;
  scene.add(trail);
  const tgt = new THREE.Vector3(X(900), 0, Z(800));
  camera.position.set(tgt.x - 62, 268, tgt.z + 172);
  camera.lookAt(tgt);
  camera.updateMatrixWorld();
  const here = new THREE.Vector3(), v = new THREE.Vector3();
  let shown = 0;
  return {
    scene, camera, order,
    /* where a chapter's place falls in the little picture, 0 to 1 across and down. null: it has none */
    place(id, aspect) {
      if (!WHERE[id]) return null;
      camera.aspect = aspect; camera.updateProjectionMatrix();
      v.set(X(WHERE[id][0]), 2.4, Z(WHERE[id][1])).project(camera);
      return [(v.x + 1) / 2, (1 - v.y) / 2];
    },
    /* rect: where on the screen it goes, in CSS pixels from the top left. id: the chapter. k: how far into it. */
    render(renderer, rect, id, k, t, dt, on) {
      shown += ((on && WHERE[id] ? 1 : 0) - shown) * (1 - Math.exp(-dt * 5));
      if (shown < 0.01 || rect.w < 8) return;
      const i = order.indexOf(id);
      if (i >= 0) {
        /* between one place and the next, the light moves along the way */
        const nx = order[i + 1] && k > 0.75 ? pts[i + 1] : pts[i];
        v.copy(pts[i]).lerp(nx, k > 0.75 ? (k - 0.75) * 2 : 0);
        here.lerp(v, here.lengthSq() ? 1 - Math.exp(-dt * 4) : 1);
        trail.geometry.setDrawRange(0, i + 1);
      }
      you.position.copy(here);
      const p = (t * 0.6) % 1;
      ring.position.copy(here); ring.scale.setScalar(3 + p * 16); ring.material.opacity = (1 - p) * 0.85;
      const dpr = renderer.getPixelRatio(), H = renderer.domElement.height / dpr;
      U.uRect.value.set(rect.x * dpr, (H - rect.y - rect.h) * dpr, rect.w * dpr, rect.h * dpr);
      U.uAlpha.value = shown;
      you.material.opacity = shown; trail.material.opacity = 0.75 * shown;
      camera.aspect = rect.w / rect.h; camera.updateProjectionMatrix();
      const auto = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(null);
      renderer.setScissorTest(true);
      renderer.setViewport(rect.x, H - rect.y - rect.h, rect.w, rect.h);
      renderer.setScissor(rect.x, H - rect.y - rect.h, rect.w, rect.h);
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, renderer.domElement.width / dpr, H);
      renderer.autoClear = auto;
    },
  };
}
