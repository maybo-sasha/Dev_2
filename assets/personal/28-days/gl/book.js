/* ============================================================
   The cover.

   The home page is the cover of the book, taken apart into depth.
   Furthest back is the fire it is printed on: the colours are the
   print's own, lifted off a photograph of the cover, and a shader
   moves the flame through them. In front of the fire stands the
   logo, the words and the candle, laid out as the book has them.
   Nearest of all, across the top left, run the two strands of
   barbed wire.

   Then the fire burns through all of it, from the middle out, and
   the hole it leaves is the way into the street.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { world, GLSL_NOISE, rng } from './common.js';
import { PLAN } from './plan.js';
import { BURN } from './logo.js';
import { buildLockup } from './emblem.js';

const ART = 1610 / 1204;          // the shape of the cover
const KB = 0.5;                   // the burn is measured in half metres, so it crosses the page at a walk
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ── the fire ──────────────────────────────────────────────── */
function fireMaterial(map, burn, toBook) {
  return new THREE.ShaderMaterial({
    uniforms: { ...world, uMap: { value: map }, uBurn: burn, uDelay: { value: 0 }, uToBook: toBook, uCrop: { value: new THREE.Vector4(0, 0, 1, 1) }, uAspect: { value: 1.78 }, uWar: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook; uniform vec4 uCrop;
      varying vec2 vUv; varying vec2 vB; varying vec3 vP; varying vec2 vS;
      void main() {
        vUv = uCrop.xy + uv * uCrop.zw;
        vS = uv;
        vB = (uToBook * vec4(position, 1.0)).xy;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv; varying vec2 vB; varying vec3 vP; varying vec2 vS;
      uniform sampler2D uMap;
      uniform float uAspect, uWar;
      ${GLSL_NOISE}
      ${BURN}
      float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      /* distance from p to the segment a b, and how far along it */
      vec2 seg(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); return vec2(length(p - a - ab * t), t); }
      void main() {
        float bf = burnFront(vB);
        if (bf < 0.0) discard;
        vec2 uv = vUv;
        float t = uTime;

        /* the print, breathing: what is looked up drifts a little, upward */
        vec2 drift = vec2(fbm(uv * vec2(1.5, 1.1) + vec2(0.0, -t * 0.012)), fbm(uv * vec2(1.3, 1.6) + vec2(5.0, -t * 0.016))) - 0.5;
        vec3 base = texture2D(uMap, uv + drift * 0.02).rgb;
        float red = clamp((base.r - max(base.g, base.b)) * 2.6, 0.0, 1.0);       // how much of it is flame
        float lumB = dot(base, vec3(0.3, 0.59, 0.11));

        /* the flame the print cannot move. Long tongues that lean and fold over one another:
           each layer of noise is stretched upward, climbs at its own speed, and is pushed
           sideways by the one under it. */
        vec2 q = uv * vec2(3.4, 1.25);
        float lean = fbm(q * 0.5 + vec2(3.0, -t * 0.02));
        q.x += (lean - 0.5) * 1.3;
        float a = fbm(vec2(q.x * 0.9, q.y * 0.7 - t * 0.055));
        float b = fbm(vec2(q.x * 2.1 + a * 1.2, q.y * 1.2 - t * 0.1));
        float c = fbm(vec2(q.x * 4.6 + b * 0.9, q.y * 2.2 - t * 0.17));
        float n = a * 0.5 + b * 0.32 + c * 0.18;
        float lick = smoothstep(0.3, 0.72, n);

        vec3 col = base * mix(1.0, 0.5 + 1.15 * lick, red);
        /* where a tongue is hottest it goes from the print's red towards orange */
        col += vec3(0.85, 0.3, 0.04) * pow(lick, 3.0) * red * 0.5;
        /* smoke moves too, slowly */
        float grey = (1.0 - red) * smoothstep(0.05, 0.3, lumB);
        col *= 1.0 + grey * (fbm(uv * vec2(2.2, 1.6) + vec2(t * 0.01, -t * 0.006)) - 0.5) * 0.5;

        /* ── behind the fire, the fighting ──
           In the black at the head of the cover, the night of a battle: tracer climbing from
           the roofs, the flash of something exploding streets away, a flare coming down slowly.
           Only where the print is dark. */
        vec2 P = vec2(vS.x * uAspect, vS.y);
        float dark = smoothstep(0.2, 0.04, lumB) * smoothstep(0.5, 0.7, vS.y) * uWar;
        vec3 sky = col;

        /* a flash, streets away: it lights the smoke from inside */
        float fl = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float period = 2.9 + fi * 1.4;
          float k = floor((t + fi * 1.7) / period), ph = fract((t + fi * 1.7) / period) * period;
          vec2 at0 = vec2((0.08 + 0.84 * h1(k * 3.3 + fi)) * uAspect, 0.66 + 0.2 * h1(k * 5.1 + fi * 2.0));
          float life = exp(-ph * 3.0) * step(h1(k * 7.7 + fi), 0.7);
          float r = length(P - at0);
          fl += life * (0.5 * exp(-r * r / 0.02) + 0.6 * exp(-r * r / 0.0008));
        }
        col += sky * fl * 2.2 * dark + vec3(1.0, 0.6, 0.28) * fl * 0.22 * dark;

        /* tracer: a stream of glowing rounds from a roof, climbing away and fading */
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float period = 2.3 + fi * 0.9;
          float k = floor(t / period + fi * 10.0);
          float ph = fract(t / period + fi * 10.0);
          float on = step(0.4, h1(k * 1.7 + fi * 9.0)) * (1.0 - smoothstep(0.55, 0.7, ph));
          vec2 g0 = vec2((0.12 + 0.76 * h1(k + fi * 4.0)) * uAspect, 0.6);
          float ang = 0.55 + 0.8 * h1(k * 3.0 + fi);
          vec2 dir = vec2(cos(ang) * (h1(k * 9.0) < 0.5 ? -1.0 : 1.0), sin(ang));
          vec2 sd = seg(P, g0, g0 + dir * 0.7);
          /* the rounds: one every so far along, each a short streak */
          float along = sd.y * 0.7;
          float pos = fract((along - ph * 1.6) * 7.0);
          float round0 = smoothstep(0.62, 0.95, pos) * (1.0 - smoothstep(0.95, 1.0, pos));
          float tr = (1.0 - smoothstep(0.0, 0.0022, sd.x)) * round0 * on * (1.0 - sd.y) * step(0.01, along);
          col += vec3(1.0, 0.78, 0.45) * tr * 2.4 * dark;
        }

        /* a flare, coming down slowly, and the smoke it leaves */
        for (int i = 0; i < 2; i++) {
          float fi = float(i);
          float period = 11.0 + fi * 4.0;
          float k = floor((t + fi * 5.0) / period), ph = fract((t + fi * 5.0) / period);
          vec2 at1 = vec2((0.15 + 0.5 * h1(k * 4.4 + fi * 3.0)) * uAspect + sin(ph * 6.0) * 0.01, 0.98 - ph * 0.28);
          float r = length(P - at1);
          float on = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.75, 1.0, ph)) * (0.8 + 0.2 * nz(vec2(t * 9.0, fi)));
          float dk = smoothstep(0.2, 0.04, lumB);
          col += (vec3(1.0, 0.95, 0.85) * exp(-r * r / 0.00002) * 2.0 + vec3(1.0, 0.78, 0.55) * exp(-r * r / 0.004) * 0.2 + sky * exp(-r * r / 0.03) * 0.7) * on * dk * uWar;
          float trail = (1.0 - smoothstep(0.0, 0.004 + (P.y - at1.y) * 0.05, abs(P.x - at1.x))) * step(at1.y, P.y) * exp(-(P.y - at1.y) * 9.0);
          col = mix(col, vec3(0.2, 0.18, 0.17), trail * 0.22 * on * dk * uWar);
        }

        /* the cloth the cover is printed on */
        vec2 wv = uv * vec2(620.0, 464.0);
        col *= 0.95 + 0.06 * sin(wv.x) * sin(wv.y) * clamp(1.0 - fwidth(wv.x) * 0.4, 0.0, 1.0);

        /* and where the fire of the page has reached it */
        float lit0 = smoothstep(0.0, 0.03, uBurn);
        col = mix(col, vec3(0.01, 0.006, 0.004), smoothstep(0.34, 0.04, bf) * 0.93 * lit0);
        float glow = smoothstep(0.075, 0.0, bf) * lit0;
        col += vec3(1.0, 0.4, 0.06) * glow * glow * 3.0 * (0.7 + 0.3 * nz(vB * 30.0 + uTime * 0.5));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/* ── the wire across the top left ──────────────────────────── */
function wireMaterial(burn, toBook) {
  return new THREE.ShaderMaterial({
    uniforms: { ...world, uBurn: burn, uDelay: { value: 0.1 }, uToBook: toBook },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook;
      varying vec2 vB; varying vec3 vN;
      void main() {
        vB = (uToBook * vec4(position, 1.0)).xy;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vB; varying vec3 vN;
      ${GLSL_NOISE}
      ${BURN}
      void main() {
        float bf = burnFront(vB);
        if (bf < 0.0) discard;
        /* white ink, as it is drawn on the cover, catching a little of the fire from below */
        vec3 c = vec3(0.9, 0.89, 0.86) * (0.72 + 0.28 * vN.y) + vec3(0.2, 0.05, 0.0) * max(-vN.y, 0.0);
        c = mix(c, vec3(1.0, 0.4, 0.08), smoothstep(0.3, 0.0, bf) * smoothstep(0.0, 0.03, uBurn));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}

/* A strand as the cover draws it: two or three thin lines that keep company without
   quite touching, and at intervals a knot with two long points through it. */
function wire(points, seed) {
  const R = rng(seed);
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const len = curve.getLength();
  const parts = [];
  const n = Math.floor(len * 14);
  for (let k = 0; k < 3; k++) {
    const pts = [];
    const amp = 0.012 + k * 0.006, ph = k * 2.1 + seed;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const c = curve.getPointAt(u), tg = curve.getTangentAt(u);
      const a = V().crossVectors(tg, V(0, 0, 1)).normalize();
      const w = Math.sin(u * len * 5.2 + ph) + 0.5 * Math.sin(u * len * 11.0 + ph * 2.0);
      pts.push(c.addScaledVector(a, w * amp).add(V(0, 0, Math.cos(u * len * 5.2 + ph) * amp)));
    }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.0058 - k * 0.0012, 5));
  }
  for (let d = 0.3; d < len - 0.1; d += 0.62 + R() * 0.16) {
    const u = d / len;
    const c = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const ang = Math.atan2(tg.y, tg.x);
    /* the knot: a few turns of wire round the strand */
    const coil = [];
    for (let i = 0; i <= 26; i++) { const tt = i / 26; const a = tt * Math.PI * 7; coil.push(V((tt - 0.5) * 0.09, Math.cos(a) * 0.022, Math.sin(a) * 0.022)); }
    const knot = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 40, 0.005, 4);
    knot.rotateZ(ang); knot.translate(c.x, c.y, c.z);
    parts.push(knot);
    /* two points, long and thin, crossing it */
    for (const tip of [-0.38 - R() * 0.2, 0.3 + R() * 0.25]) {
      const g = new THREE.CylinderGeometry(0.0014, 0.0052, 0.21 + R() * 0.08, 4);
      g.translate(0, (R() - 0.5) * 0.05, 0);
      g.rotateZ(ang + tip);
      g.translate(c.x + (R() - 0.5) * 0.02, c.y, c.z + 0.012);
      parts.push(g);
    }
  }
  return mergeGeometries(parts.map((g) => { const x = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(x.attributes)) if (!['position', 'normal'].includes(k)) x.deleteAttribute(k); return x; }), false);
}

export function buildBook(scene, lights, tex) {
  const group = new THREE.Group();
  group.name = 'The cover';
  group.position.set(0, PLAN.book.y, PLAN.book.z);
  const burn = { value: 0 };

  /* the fire, far back */
  const fireTo = { value: new THREE.Matrix4() };
  const fire = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fireMaterial(tex.cover, burn, fireTo));
  fire.position.z = -2.4;
  group.add(fire);

  /* the logo: the words and the mark */
  const lockup = buildLockup({ burn, fire: 1, heat: 0.9, self: 0.84, face: [0.97, 0.96, 0.93], tex, look: 'cover' });
  const stage = new THREE.Group();          // what turns a little towards the hand
  stage.add(lockup.group);
  group.add(stage);

  /* smoke drifting across in front of the logo */
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...world, uBurn: burn, uDelay: { value: 0.05 }, uToBook: fireTo },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook;
      varying vec2 vS; varying vec2 vB;
      void main() { vS = uv; vB = (uToBook * vec4(position, 1.0)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vS; varying vec2 vB;
      ${GLSL_NOISE}
      ${BURN}
      void main() {
        float bf = burnFront(vB);
        if (bf < 0.0) discard;
        float t = uTime;
        vec2 q = vS * vec2(2.6, 1.6) + vec2(t * 0.022, -t * 0.012);
        float n = fbm(q + fbm(q * 1.7 + vec2(-t * 0.03, 0.0)) * 0.9);
        float a = smoothstep(0.52, 0.8, n) * 0.26 * smoothstep(0.0, 0.25, vS.y) * (1.0 - smoothstep(0.75, 1.0, vS.y));
        a *= smoothstep(0.0, 0.3, bf);
        /* lit from underneath by the fire */
        vec3 c = mix(vec3(0.05, 0.035, 0.03), vec3(0.42, 0.16, 0.05), smoothstep(0.6, 0.0, vS.y));
        gl_FragColor = vec4(c, a);
      }
    `,
  }));
  smoke.position.z = 0.55;
  smoke.renderOrder = 5;
  group.add(smoke);

  /* fire nearer than the logo: flames that rise across its foot. The logo stands in the fire. */
  const front = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: { ...world, uBurn: burn, uDelay: { value: 0.03 }, uToBook: fireTo, uAspect: { value: 1.78 } },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook;
      varying vec2 vS; varying vec2 vB;
      void main() { vS = uv; vB = (uToBook * vec4(position, 1.0)).xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vS; varying vec2 vB;
      uniform float uAspect;
      ${GLSL_NOISE}
      ${BURN}
      void main() {
        float bf = burnFront(vB);
        if (bf < 0.0) discard;
        float t = uTime;
        vec2 p = vec2(vS.x * uAspect * 2.6, vS.y * 3.0);
        /* each tongue leans, and the higher it climbs the further it wanders */
        float w1 = fbm(vec2(p.x * 0.5 + 3.0, p.y * 0.45 - t * 0.42));
        float w2 = fbm(vec2(p.x * 1.2 - 7.0, p.y * 1.0 - t * 0.8));
        p.x += ((w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.4) * p.y;
        float n = fbm(vec2(p.x * 1.0, p.y * 0.8 - t * 1.0));
        float n2 = fbm(vec2(p.x * 2.6 + 5.0, p.y * 1.9 - t * 1.7));
        /* how high the fire stands, along the foot of the picture: higher toward the candle */
        float stand = 0.1 + 0.2 * fbm(vec2(vS.x * uAspect * 1.1 + t * 0.015, 1.7)) + 0.1 * smoothstep(0.45, 0.95, vS.x);
        float f = n * 0.8 + n2 * 0.42 - vS.y / stand * 0.56 + 0.1;
        float a = smoothstep(0.44, 0.8, f) * smoothstep(0.0, 0.25, bf);
        vec3 c = mix(vec3(0.5, 0.03, 0.0), vec3(1.0, 0.3, 0.02), smoothstep(0.44, 0.62, f));
        c = mix(c, vec3(1.0, 0.64, 0.13), smoothstep(0.6, 0.86, f));
        c = mix(c, vec3(1.0, 0.92, 0.66), smoothstep(0.86, 1.2, f));
        gl_FragColor = vec4(c * a * 1.15, a * 0.62);
      }
    `,
  }));
  front.position.z = 0.42;
  front.renderOrder = 4;
  group.add(front);

  /* the wire, nearest. Placed in half heights of the view, as the cover has it. */
  const wireTo = { value: new THREE.Matrix4() };
  const wires = new THREE.Mesh(mergeGeometries([
    wire([[-3.1, -0.02], [-1.78, 0.62], [-1.54, 0.78], [-1.04, 1.06], [-0.55, 1.26], [-0.1, 1.5]].map(([x, y]) => V(x, y, 0)), 3),
    wire([[-3.0, -1.5], [-1.78, -0.43], [-1.61, -0.2], [-1.31, 0.06], [-1.09, 0.2], [-0.82, 0.355], [-0.42, 0.63], [-0.15, 0.805], [0.43, 1.136], [0.82, 1.267], [1.3, 1.44]].map(([x, y]) => V(x, y, 0.08)), 4),
  ], false), wireMaterial(burn, wireTo));
  wires.position.z = 1.3;
  group.add(wires);

  group.traverse((o) => { o.frustumCulled = false; });
  scene.add(group);

  /* the flame of the candle lights the words beside it */
  const glow = lights.add({ pos: new THREE.Vector3(), color: new THREE.Color(1.0, 0.5, 0.16), base: 1.5, group: 'book', flicker: 0.35 });

  const m = new THREE.Matrix4(), kb = new THREE.Matrix4().makeScale(KB, KB, KB);
  const fit = { aspect: 0, fov: 0, key: '' };
  const tmp = new THREE.Vector3();

  return {
    group, burn, lockup,
    /* px, py: where the hand is, -1 to 1. open: 0 on the cover, 1 once the fire has it. */
    update(t, px, py, open, camera, frame) {
      const calm = 1 - open;
      /* lay the cover out for this screen. It is done while the cover is whole. */
      const key = frame ? [frame.x0, frame.x1, frame.y0, frame.y1, frame.side].join() : '';
      if (camera && (open < 0.02 || !fit.aspect) && (fit.aspect !== camera.aspect || fit.fov !== camera.fov || fit.key !== key)) {
        fit.aspect = camera.aspect; fit.fov = camera.fov; fit.key = key;
        const half = Math.tan(camera.fov * Math.PI / 360);
        const dist = camera.position.z - group.position.z;
        const hH = half * dist, hW = hH * camera.aspect;
        /* the fire fills the view, and keeps its own shape by showing less of itself */
        const dF = dist - fire.position.z;
        const fH = 2 * half * dF * 1.2, fW = fH * camera.aspect;
        fire.scale.set(fW, fH, 1);
        fire.material.uniforms.uAspect.value = camera.aspect;
        const crop = fire.material.uniforms.uCrop.value;
        if (camera.aspect > ART) { const h = ART / camera.aspect; crop.set(0, (1 - h) * 0.62, 1, h); } else { const w = camera.aspect / ART; crop.set((1 - w) * 0.62, 0, w, 1); }
        fire.updateMatrix();
        fireTo.value.copy(kb).multiply(fire.matrix);
        const dFr = dist - front.position.z;
        front.scale.set(2 * half * dFr * camera.aspect * 1.04, 2 * half * dFr * 1.04, 1);
        front.material.uniforms.uAspect.value = camera.aspect;
        const dS = dist - smoke.position.z;
        smoke.scale.set(2 * half * dS * camera.aspect * 1.05, 2 * half * dS * 1.05, 1);
        /* the logo: as large as the part of the screen left to it allows. Beside the words of the
           page it stands at the right, as the candle does on the cover; above them, in the middle. */
        const b = lockup.box;
        const f = frame || { x0: 0.5, x1: 0.91, y0: 0.09, y1: 0.965, side: true };
        const fx0 = (2 * f.x0 - 1) * hW, fx1 = (2 * f.x1 - 1) * hW, fy0 = (1 - 2 * f.y1) * hH, fy1 = (1 - 2 * f.y0) * hH;
        const s = Math.min((fy1 - fy0) / b.y1, (fx1 - fx0) / (b.x1 - b.x0));
        lockup.group.scale.setScalar(s);
        lockup.group.position.set(f.side ? fx1 - b.x1 * s : (fx0 + fx1) / 2 - b.cx * s, (fy0 + fy1) / 2 - b.y1 * s / 2, 0);
        /* the wire: it comes in at the left edge and leaves by the top, whatever the shape of the
           screen, and on a narrow one it is drawn smaller so it keeps to its corner */
        const dW = dist - wires.position.z, wH = half * dW;
        const a = Math.min(1, Math.max(0, (camera.aspect - 0.5) / 1.0));
        const k = 0.55 + 0.45 * a;
        wires.scale.setScalar(wH * k);
        wires.position.x = (-camera.aspect + 1.78 * k) * wH;
        wires.position.y = (0.45 - 0.88 * a + 0.43 * k) * wH;
        wires.updateMatrix();
        wireTo.value.copy(kb).multiply(wires.matrix);
      }
      /* the logo turns a little towards the hand, and the wire slides against it */
      stage.rotation.y = (px * 0.1 + Math.sin(t * 0.31) * 0.02) * calm;
      stage.rotation.x = (-py * 0.05) * calm;
      wires.position.z = 1.3;
      wires.rotation.z = Math.sin(t * 0.23) * 0.004 * calm;
      fire.position.x = -px * 0.12 * calm;
      fire.position.y = py * 0.07 * calm;
      stage.updateMatrix();
      lockup.group.updateMatrix();
      m.copy(kb).multiply(stage.matrix).multiply(lockup.group.matrix);
      lockup.place(m);
      /* the light of the flame, where the flame is */
      tmp.set(0.4, 6.2, 1.2).applyMatrix4(lockup.group.matrix).applyMatrix4(stage.matrix).add(group.position);
      glow.pos.copy(tmp);
      glow.level = 1;
    },
  };
}
