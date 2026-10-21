/* ============================================================
   The mark.

   The book's logo is a memorial candle. Its flame holds a raised
   arm, the fist closed, bound round with barbed wire, a star on
   the shoulder. The wire gathers at the foot of the arm into the
   wick. A candle for the dead whose flame is the hand that fought.

   It is not redrawn here. The drawing itself was taken off the
   logo page of the book and turned into distance fields (img/mark-t
   and img/mark-m): for each of its washes, for its pen line, for
   the figure and for the arm, how far every point is from the edge.
   A shader can cut those at any size and the edge stays as clean as
   ink, so the drawing prints sharp however large it is shown. A
   third plate (img/mark-b) says how far each part stands off the
   page: the sheet it is printed on is raised into that relief, so
   that it turns as a thing and not as a picture.

   It can be printed two ways. As the book has it on its own pages:
   lilac washes and a pen line. Or as the cover has it: the arm in
   white and grey, and the flame actually burning, inside the outline
   the artist drew.

   One unit is a hundred pixels of the photograph the plates were
   made from, and 0, 0 is the middle of the foot of the candle.
   ============================================================ */

import * as THREE from 'three';
import { world, GLSL_NOISE, toScene } from './common.js';
import { BURN, logoGeometry, logoMaterial, logoBlock, logoField } from './logo.js';

/* the plates: their size in pixels at the size they were drawn from, and the pixel that is 0, 0 */
const PW = 440, PH = 1200, OX = 224, OY = 1140;
const RANGE = 16;                 // a distance of RANGE pixels (at twice that size) is stored as 0 or 1
const Y0 = 2.22, Y1 = 10.93;      // the foot and the tip of the flame
const RELIEF = 0.8;               // the height a full value on the relief plate stands for

/* the outline of the flame, read off the drawing: [height, edge] */
const LEFT = [[2.22, 0.06], [2.62, -0.56], [3.2, -0.94], [4.16, -1.25], [5.32, -1.29], [6.3, -0.97], [6.88, -0.47], [7.5, -0.09], [8.22, 0.0], [9.0, -0.15], [9.6, -0.04], [10.03, 0.14], [10.53, 0.68], [10.93, 0.99]];
const RIGHT = [[2.22, 0.06], [2.43, 0.48], [3.2, 0.94], [4.16, 1.25], [5.1, 1.45], [6.3, 1.53], [7.84, 1.68], [8.61, 1.64], [9.19, 1.37], [9.76, 1.07], [10.34, 0.84], [10.72, 0.9], [10.93, 1.0]];

function shapeTexture() {
  const N = 128;
  const at = (pts, y) => {
    if (y <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (y <= pts[i + 1][0]) {
        /* a curve through the points, not a line between them */
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
        const t = (y - p1[0]) / (p2[0] - p1[0]);
        const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
        const t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
      }
    }
    return pts[pts.length - 1][1];
  };
  const data = new Uint16Array(N * 4);
  for (let i = 0; i < N; i++) {
    const y = Y0 + (Y1 - Y0) * i / (N - 1);
    data[i * 4] = THREE.DataUtils.toHalfFloat(at(LEFT, y));
    data[i * 4 + 1] = THREE.DataUtils.toHalfFloat(at(RIGHT, y));
    data[i * 4 + 3] = THREE.DataUtils.toHalfFloat(1);
  }
  const t = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/* the tones below are given as they should look on the screen */
const tones = (list) => list.map((rgb) => new THREE.Vector3(...rgb.map(toScene)));

/* lightest to darkest: bare paper, the wash, its shadow, deep shadow, ink */
const PRINT = [[0.9, 0.895, 0.92], [0.745, 0.725, 0.8], [0.585, 0.565, 0.64], [0.4, 0.385, 0.45], [0.11, 0.1, 0.13]];
/* the lightest tone stops short of white: past it the glow of the grade would take the edges away */
const COVER = [[0.9, 0.9, 0.895], [0.8, 0.795, 0.805], [0.55, 0.545, 0.57], [0.29, 0.285, 0.31], [0.04, 0.036, 0.045]];

const PLATE = /* glsl */ `
  vec2 plateUv(vec2 p) { return vec2((${OX}.0 + p.x * 100.0) / ${PW}.0, (${PH - OY}.0 + p.y * 100.0) / ${PH}.0); }
  /* a stored distance, back to pixels of the 2x plate: positive inside */
  vec4 dist(vec4 v) { return (v - 0.5) * ${(2 * RANGE).toFixed(1)}; }
`;

function plateMaterial(S, tex, look) {
  const arm = look === 'cover' ? COVER : PRINT;
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    extensions: { derivatives: true },
    uniforms: {
      ...world,
      uT: { value: tex.markT }, uM: { value: tex.markM }, uB: { value: tex.markB }, uShape: { value: shapeTexture() },
      uBurn: S.burn, uDelay: { value: 0.2 }, uUseBurn: S.useBurn, uToBook: S.toBook, uShow: S.show, uFire: S.fire,
      uArm: { value: tones(arm) }, uWash: { value: tones(PRINT) },
      uStar: { value: new THREE.Vector3(...(look === 'cover' ? [0.97, 0.74, 0.1] : [0.93, 0.55, 0.36]).map(toScene)) },
      uRelief: S.relief, uFlick: S.flick,
    },
    vertexShader: /* glsl */ `
      uniform sampler2D uB; uniform mat4 uToBook; uniform float uRelief;
      varying vec3 vO; varying vec2 vB; varying vec2 vUv; varying vec3 vP;
      ${PLATE}
      void main() {
        vUv = plateUv(position.xy);
        vO = position;
        /* the sheet is raised where the plate says the figure stands forward */
        vec3 p = position + vec3(0.0, 0.0, textureLod(uB, vUv, 0.0).g * ${RELIEF.toFixed(2)} * uRelief);
        vB = (uToBook * vec4(p, 1.0)).xy;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vO; varying vec2 vB; varying vec2 vUv; varying vec3 vP;
      uniform sampler2D uT, uM, uB, uShape;
      uniform float uUseBurn, uShow, uFire, uRelief, uFlick;
      uniform vec3 uArm[5]; uniform vec3 uWash[5]; uniform vec3 uStar;
      ${GLSL_NOISE}
      ${BURN}
      ${PLATE}
      float tri(vec2 p, float r) {
        const float k = 1.7320508;
        p.x = abs(p.x) - r; p.y = p.y + r / k;
        if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
        p.x -= clamp(p.x, -2.0 * r, 0.0);
        return -length(p) * sign(p.y);
      }
      /* an edge cut out of a distance, as clean as the screen allows */
      float cut(float d) { float w = max(fwidth(d) * 0.75, 0.02); return smoothstep(-w, w, d); }
      vec4 cut4(vec4 d) { vec4 w = max(fwidth(d) * 0.75, vec4(0.02)); return smoothstep(-w, w, d); }
      /* five flat tones and four edges between them: k says which side of each edge this is */
      vec3 five(vec3 pal[5], vec4 k) { return mix(mix(mix(mix(pal[4], pal[3], k.w), pal[2], k.z), pal[1], k.y), pal[0], k.x); }
      /* the colour of something burning at a given heat */
      vec3 burning(float h) {
        vec3 c = mix(vec3(0.16, 0.012, 0.0), vec3(0.62, 0.07, 0.008), smoothstep(0.05, 0.32, h));
        c = mix(c, vec3(0.98, 0.3, 0.03), smoothstep(0.3, 0.56, h));
        c = mix(c, vec3(1.0, 0.62, 0.12), smoothstep(0.52, 0.76, h));
        c = mix(c, vec3(1.0, 0.86, 0.44), smoothstep(0.74, 0.95, h));
        return mix(c, vec3(1.0, 0.97, 0.82), smoothstep(0.95, 1.15, h));
      }

      void main() {
        float bf = 9.0;
        if (uUseBurn > 0.5) { bf = burnFront(vB); if (bf < 0.0) discard; }
        float lit0 = smoothstep(0.0, 0.03, uBurn) * uUseBurn;

        vec2 p = vO.xy;
        float t = uTime;
        vec4 relief = texture2D(uB, vUv);                    // (old arm), relief, a wide halo of the figure
        vec3 here = dist(texture2D(uM, vUv)).xyz;            // pen, figure, arm
        float isArm = cut(here.z);
        float nearArm = 1.0 - smoothstep(0.0, 70.0, -here.z);
        float up = clamp((p.y - ${Y0.toFixed(2)}) / ${(Y1 - Y0).toFixed(2)}, 0.0, 1.0);

        /* the flame is never still: what is looked up sways, more toward the tip and more when
           it burns, and not at all where the arm and the candle are */
        float loose = (1.0 - smoothstep(-40.0, 4.0, here.z)) * smoothstep(2.3, 3.3, p.y);
        float life = 0.3 + 0.7 * uFire;
        vec2 sway = vec2(fbm(vec2(p.x * 0.33 + 3.0, p.y * 0.3 - t * 0.5 * life)) - 0.5,
                         (fbm(vec2(p.x * 0.4 - 7.0, p.y * 0.24 - t * 0.4 * life)) - 0.5) * 0.5);
        vec2 pw = p + sway * (0.05 + 0.3 * up * up) * life * loose;
        pw.x += (fbm(vec2(t * 0.09, 2.3)) - 0.5) * 0.45 * up * up * up * life * loose;
        vec2 uvw = plateUv(pw);
        vec4 kt = cut4(dist(texture2D(uT, uvw)));            // which side of each wash
        vec3 there = dist(texture2D(uM, uvw)).xyz;           // pen, figure, arm, where the flame has swayed to

        /* the arm and the candle: flat tones, a clean edge */
        vec3 armC = five(uArm, kt);
        /* the relief catches the light as a thing does, from where the artist put it */
        vec2 e = vec2(1.5 / ${PW}.0, 1.5 / ${PH}.0);
        float hx = texture2D(uB, vUv + vec2(e.x, 0.0)).g - texture2D(uB, vUv - vec2(e.x, 0.0)).g;
        float hy = texture2D(uB, vUv + vec2(0.0, e.y)).g - texture2D(uB, vUv - vec2(0.0, e.y)).g;
        vec3 nl = normalize(vec3(vec2(-hx, -hy) * (${RELIEF.toFixed(2)} * uRelief / 0.03), 1.0));
        armC *= 1.0 + 0.14 * (dot(nl, normalize(vec3(-0.5, 0.52, 0.69))) - 0.69);

        /* the flame: the artist's outline, filled with fire */
        float s = up;
        vec2 lr = texture2D(uShape, vec2(s, 0.5)).rg;
        float cx = (lr.x + lr.y) * 0.5, hw = max((lr.y - lr.x) * 0.5, 0.02);
        float r = clamp(abs(pw.x - cx) / hw, 0.0, 1.3);
        vec2 q = vec2(pw.x * 0.62, pw.y * 0.3 - t * 0.95);
        float w1 = fbm(q * 1.15 + vec2(0.0, -t * 0.18));
        float n1 = fbm(q * 2.1 + vec2(w1 * 1.7, 0.0));
        float n2 = fbm(q * 4.6 + vec2(n1 * 1.3, -t * 0.7));
        /* the artist's own washes still show inside it: where the drawing is darker, it burns lower */
        float drawn = dot(kt, vec4(0.25));
        float heat = (1.0 - r * r) * 0.66 + (n1 - 0.5) * 0.8 + (n2 - 0.5) * 0.4 + nearArm * 0.24 - s * s * 0.32 + (drawn - 0.5) * 0.2;
        heat *= 0.92 + 0.12 * uFlick;
        vec3 fire = burning(heat) * (0.62 + 0.75 * smoothstep(0.72, 1.12, heat));
        /* on the page, the flame is a lilac wash; burning, it is fire */
        vec3 wash = five(uWash, kt);
        vec3 flameC = mix(wash, fire, uFire);

        /* the arm takes its light from the fire round it, most at its edge */
        float rim = (1.0 - smoothstep(0.0, 14.0, here.z)) * isArm * step(2.3, p.y);
        armC = mix(armC, armC * vec3(1.06, 0.86, 0.66) + vec3(0.16, 0.06, 0.01) * rim * (0.7 + 0.3 * n2), uFire * (0.2 + 0.8 * rim));

        vec3 c = mix(flameC, armC, isArm);

        /* the star on the shoulder: two triangles, drawn with a pen that has colour in it */
        vec2 sp = p - vec2(-0.03, 4.65);
        float st = min(abs(tri(sp, 0.115)), abs(tri(vec2(sp.x, -sp.y), 0.115)));
        c = mix(c, uStar, (1.0 - smoothstep(0.012, 0.012 + fwidth(st) * 1.5 + 0.004, st)) * isArm);

        /* the pen: black on the arm; on the burning flame, a line burnt dark red */
        float line = cut(there.x);
        vec3 ink = mix(uArm[4], mix(uArm[4], vec3(0.22, 0.025, 0.004), uFire), (1.0 - isArm));
        c = mix(c, ink, line * mix(0.96, 0.75, uFire * (1.0 - isArm)));

        float a = cut(there.y);
        /* tongues that leave the outline at the top, when it burns */
        float lickD = there.y + (fbm(vec2(pw.x * 0.9, pw.y * 0.5 - t * 1.3)) - 0.42) * 46.0 * uFire * smoothstep(0.25, 0.9, s);
        float lick = cut(lickD) * (1.0 - a) * smoothstep(2.4, 3.4, p.y) * uFire;
        vec3 lickC = burning(heat * 0.65 + 0.08) * 0.9;

        /* the wick, from the foot of the flame to the wax */
        float wick = 1.0 - smoothstep(0.014, 0.014 + fwidth(p.x) * 1.2, abs(p.x - 0.055 - (p.y - 2.0) * 0.03));
        wick *= step(1.84, p.y) * step(p.y, 2.34);
        c = mix(c, uArm[4], wick);
        a = max(a, wick);

        /* a breath of light round it, as a flame has */
        float glow = relief.b * relief.b * uFire * smoothstep(2.0, 3.6, p.y) * (0.75 + 0.25 * n1);

        /* forming: it comes in the way a wash soaks into paper */
        float gate = 1.0;
        if (uShow < 0.999) gate = smoothstep(0.0, 0.05, uShow * 1.18 - (fbm(p * 0.22 + 3.0) * 0.75 + nz(p * 2.2) * 0.25));

        /* and where the fire of the page has reached it */
        c = mix(c, vec3(0.012, 0.008, 0.005), smoothstep(0.6, 0.08, bf) * 0.93 * lit0);
        float edge = smoothstep(0.14, 0.0, bf) * lit0;
        c += vec3(1.0, 0.38, 0.05) * edge * edge * 2.4;

        float body = max(a, lick) * gate;
        vec3 col = mix(lickC, c, a / max(max(a, lick), 0.0001));
        float fade = smoothstep(0.0, 0.3, bf);
        /* colour times cover, and the glow simply added: this sheet is blended as light on light */
        vec3 outc = col * body + vec3(1.0, 0.36, 0.05) * glow * 0.26 * gate * (1.0 - body);
        outc *= fade; body *= fade;
        if (body < 0.003 && dot(outc, vec3(1.0)) < 0.003) discard;
        gl_FragColor = vec4(outc, body);
      }
    `,
  });
}

/* ── the words, as the cover has them ──────────────────────────
   White letters standing in a fire. They are cut from a field of distances, so their edge is as
   clean as the screen allows. The field also gives each stroke a bevel, which takes the fire from
   below and the night from above; a soft shadow, which seats the letters on the cloth; and
   tongues of flame that climb off the head of every stroke. */
function wordsMaterial(S, F, face) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    extensions: { derivatives: true },
    uniforms: {
      ...world,
      uField: { value: F.tex }, uTexel: { value: new THREE.Vector2(1 / F.W, 1 / F.H) }, uPx: { value: F.px },
      uBurn: S.burn, uDelay: { value: 0.2 }, uUseBurn: S.useBurn, uToBook: S.toBook, uFire: S.fire, uFlick: S.flick,
      uFace: { value: new THREE.Vector3(...face.map(toScene)) },
    },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook;
      varying vec2 vUv; varying vec2 vB; varying vec3 vP; varying vec2 vO;
      void main() {
        vUv = vec2(uv.x, 1.0 - uv.y);
        vO = position.xy;
        vB = (uToBook * vec4(position, 1.0)).xy;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv; varying vec2 vB; varying vec3 vP; varying vec2 vO;
      uniform sampler2D uField; uniform vec2 uTexel; uniform float uPx;
      uniform float uUseBurn, uFire, uFlick; uniform vec3 uFace;
      ${GLSL_NOISE}
      ${BURN}
      float D(vec2 uv) { return texture2D(uField, uv).r; }
      vec3 burning(float h) {
        vec3 c = mix(vec3(0.16, 0.012, 0.0), vec3(0.62, 0.07, 0.008), smoothstep(0.05, 0.32, h));
        c = mix(c, vec3(0.98, 0.3, 0.03), smoothstep(0.3, 0.56, h));
        c = mix(c, vec3(1.0, 0.62, 0.12), smoothstep(0.52, 0.76, h));
        return mix(c, vec3(1.0, 0.86, 0.44), smoothstep(0.74, 0.95, h));
      }
      void main() {
        float bf = 9.0;
        if (uUseBurn > 0.5) { bf = burnFront(vB); if (bf < 0.0) discard; }
        float lit0 = smoothstep(0.0, 0.03, uBurn) * uUseBurn;
        float t = uTime;
        /* one logo unit, in pixels of the field */
        float d = D(vUv);
        float w = max(fwidth(d) * 0.72, 0.3);
        float body = smoothstep(-w, w, d);

        /* the bevel: the stroke rises from its edge over a few pixels, then is flat */
        vec2 e = uTexel * 1.6;
        vec2 g = vec2(D(vUv + vec2(e.x, 0.0)) - D(vUv - vec2(e.x, 0.0)), D(vUv - vec2(0.0, e.y)) - D(vUv + vec2(0.0, e.y)));
        g /= max(length(g), 1e-4);
        float bev = 1.0 - smoothstep(0.0, 20.0, d);
        vec3 N = normalize(vec3(-g * bev * 1.5, 1.0));
        vec3 V = vec3(0.0, 0.0, 1.0);
        float flick = 0.86 + 0.14 * uFlick;
        /* the fire, from below; the night, from above */
        vec3 Lf = normalize(vec3(-0.2, -0.82, 0.52)), La = normalize(vec3(0.32, 0.78, 0.54));
        float up = clamp((vO.y + 0.26) / 0.6, 0.0, 1.0);                 // foot to head of the 28
        float heat = (1.0 - up) * (0.6 + 0.4 * fbm(vec2(vO.x * 7.0, vO.y * 5.0 - t * 0.3)));
        vec3 fireC = vec3(1.0, 0.5, 0.17) * flick;
        vec3 face = uFace * (0.6 + 0.2 * max(dot(N, La), 0.0));
        face = mix(face, face * vec3(1.0, 0.78, 0.56), heat * 0.6 * uFire);
        face += uFace * fireC * max(dot(N, Lf), 0.0) * (0.16 + 0.62 * bev) * uFire;
        /* a glint along the lower bevels, where the fire is seen in them */
        float sp = pow(max(dot(reflect(-Lf, N), V), 0.0), 18.0) * bev;
        face += vec3(1.0, 0.72, 0.4) * sp * 0.55 * uFire * flick;
        /* a dark line just inside the upper bevels: the stroke stands off the cloth */
        face *= 1.0 - 0.42 * bev * max(dot(N, -La), 0.0);
        /* it is printed on the same cloth as the fire behind it */
        vec2 wv = vP.xy * 86.0;
        face *= 0.97 + 0.045 * sin(wv.x) * sin(wv.y) * clamp(1.0 - fwidth(wv.x) * 0.4, 0.0, 1.0);

        /* the shadow it lays on the cloth, a little below it and to the right */
        float ds = D(vUv + vec2(-1.2, -3.2) * uTexel * 1.5);
        float shadow = smoothstep(-15.0, 1.5, ds) * 0.5;
        /* the heat that stands round it */
        float halo = exp(min(d, 0.0) * 0.085) * (0.5 + 0.5 * heat) * uFire;

        /* flame off the head of every stroke: look down from here for a letter, through air that moves */
        float tongue = 0.0, core = 0.0;
        for (int i = 1; i <= 4; i++) {
          float h = float(i) / 4.0;
          vec2 q = vec2(vO.x * 9.0 + h * 2.7, vO.y * 4.0 - t * 1.25);
          float sway = (fbm(q * 0.5) - 0.5) * 46.0 * h;
          float reach = 96.0 * h;                                         // pixels of the field
          float dd = D(vUv + vec2(sway, reach) * uTexel);
          float n = fbm(vec2(vO.x * 15.0 - h * 4.0, vO.y * 6.5 - t * 2.1));
          float lane = fbm(vec2(vO.x * 21.0, t * 0.35 + h));                    // where along a stroke it is burning now
          float k = smoothstep(-3.0, 3.0, dd + (n - 0.6) * 44.0 - (0.62 - lane) * 60.0 * h) * (1.0 - h * 0.8);
          tongue = max(tongue, k);
          core = max(core, k * (1.0 - h));
        }
        tongue *= (1.0 - body) * uFire * flick;
        vec3 tongueC = burning(0.3 + core * 0.75 + tongue * 0.25) * (0.75 + 0.6 * core);

        /* and where the fire of the page has reached it */
        vec3 c = mix(face, vec3(0.012, 0.008, 0.005), smoothstep(0.6, 0.08, bf) * 0.93 * lit0);
        float edge = smoothstep(0.14, 0.0, bf) * lit0;
        c += vec3(1.0, 0.38, 0.05) * edge * edge * 2.4;

        float fade = smoothstep(0.0, 0.3, bf);
        float a = body + (1.0 - body) * max(shadow * (1.0 - tongue), tongue * 0.85);
        vec3 outc = c * body + (1.0 - body) * (tongueC * tongue * 0.85 + vec3(1.0, 0.4, 0.08) * halo * 0.07);
        outc *= fade; a *= fade;
        if (a < 0.003 && dot(outc, vec3(1.0)) < 0.003) discard;
        gl_FragColor = vec4(outc, a);
      }
    `,
  });
}

/* A plate is laid on as light on light, and leaves no depth behind it: the lens would look straight
   through it and focus on whatever is behind. So each plate has a second sheet, never seen, that
   only says how far away the drawing is, wherever the drawing is solid. */
function depthSheet(geometry, uniforms, vertex, solid) {
  const mesh = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    colorWrite: false, depthWrite: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2,     // a hair behind the plate itself
    uniforms,
    vertexShader: vertex,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vB; varying vec2 vUv;
      uniform float uUseBurn, uShow;
      ${GLSL_NOISE}
      ${BURN}
      ${PLATE}
      ${solid}
      void main() {
        if (uUseBurn > 0.5 && burnFront(vB) < 0.0) discard;
        if (uShow < 0.6 || !solid(vUv)) discard;
        gl_FragColor = vec4(0.0);
      }
    `,
  }));
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  return mesh;
}

/* ── the whole mark ────────────────────────────────────────── */
export function buildMark({ burn = null, fire = 1, tex, look = 'print', relief = 1.5 } = {}) {
  const group = new THREE.Group();
  group.name = 'The mark: a candle, and an arm in its flame';
  const S = {
    burn: burn || { value: 0 }, useBurn: { value: burn ? 1 : 0 }, toBook: { value: new THREE.Matrix4() },
    show: { value: 1 }, fire: { value: fire }, relief: { value: relief }, flick: { value: 1 },
  };

  /* the sheet the drawing is printed on: wider than the drawing, so the flame has room to move */
  const X0 = -3.0, X1 = 3.2, Y0 = -0.5, Y2 = 12.9;
  const sheet = new THREE.PlaneGeometry(X1 - X0, Y2 - Y0, Math.round((X1 - X0) / 0.08), Math.round((Y2 - Y0) / 0.08));
  sheet.translate((X0 + X1) / 2, (Y0 + Y2) / 2, 0);
  const plate = new THREE.Mesh(sheet, plateMaterial(S, tex, look));
  plate.frustumCulled = false; plate.renderOrder = 2;
  group.add(plate);
  const pu = plate.material.uniforms;
  group.add(depthSheet(sheet, { ...world, uM: pu.uM, uB: pu.uB, uBurn: S.burn, uDelay: pu.uDelay, uUseBurn: S.useBurn, uToBook: S.toBook, uShow: S.show, uRelief: S.relief }, /* glsl */ `
    uniform sampler2D uB; uniform mat4 uToBook; uniform float uRelief;
    varying vec2 vB; varying vec2 vUv;
    ${PLATE}
    void main() {
      vUv = plateUv(position.xy);
      vec3 p = position + vec3(0.0, 0.0, textureLod(uB, vUv, 0.0).g * ${RELIEF.toFixed(2)} * uRelief);
      vB = (uToBook * vec4(p, 1.0)).xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `, 'uniform sampler2D uM; bool solid(vec2 uv) { return dist(texture2D(uM, uv)).y > 0.0; }'));

  /* sparks that leave the flame */
  const SP = 46;
  const sg = new THREE.BufferGeometry();
  const seeds = new Float32Array(SP * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SP * 3), 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...world, uFire: S.fire, uShow: S.show, uBurn: S.burn },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime, uPx, uDpr, uFire, uShow, uBurn; varying float vA;
      void main() {
        float life = fract(uTime * (0.1 + aSeed.w * 0.12) + aSeed.x * 9.0);
        vec3 p = vec3(0.3 + (aSeed.x - 0.5) * 1.6 + sin(life * 6.0 + aSeed.y * 20.0) * 0.5 * life, 4.0 + aSeed.z * 5.0 + life * 5.5, 0.6 + (aSeed.y - 0.5) * 0.8);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vA = (1.0 - life) * smoothstep(0.0, 0.15, life) * uFire * step(0.999, uShow) * (1.0 - smoothstep(0.1, 0.5, uBurn));
        gl_PointSize = (0.05 + aSeed.w * 0.07) * length(modelMatrix[0].xyz) * uDpr / (uPx * max(-mv.z, 0.1));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: 'precision highp float; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vec3(1.0, 0.55, 0.14) * 2.2, a); }',
  }));
  sparks.frustumCulled = false; sparks.renderOrder = 4;
  group.add(sparks);

  return {
    group, S, plate,
    /* tell every part where it is on the cover, so one fire takes them all. m: this group's place in the cover. */
    place(m) { S.toBook.value.copy(m); },
    show(v) { S.show.value = v; group.visible = v > 0.002; },
    set fire(v) { S.fire.value = v; },
  };
}

/* ── the logo entire: the words, and the mark to their right ───
   Laid out as it is printed: the words end just short of the flame, and
   stand on a line a little above the rim of the candle. */
export function buildLockup({ burn = null, fire = 1, face = [0.94, 0.92, 0.86], self = 0.72, heat = 1, tex, look = 'print', relief = 1.5, alone = false } = {}) {
  const group = new THREE.Group();
  const mark = buildMark({ burn, fire, tex, look, relief });
  group.add(mark.group);
  const b = logoBlock();                                   // where the words sit, in the logo's own units
  const k = 4.1 / (b.x1 - b.x0);
  const wordsTo = { value: new THREE.Matrix4() };
  let mat, words;
  if (look === 'cover') {
    const F = logoField();
    const fb = F.box;
    mat = wordsMaterial(mark.S, F, face);
    mat.uniforms.uToBook = wordsTo;
    words = new THREE.Mesh(new THREE.PlaneGeometry(fb.x1 - fb.x0, fb.y1 - fb.y0).translate((fb.x0 + fb.x1) / 2, (fb.y0 + fb.y1) / 2, 0), mat);
    words.renderOrder = 2;
    words.add(depthSheet(words.geometry, { ...world, uField: mat.uniforms.uField, uBurn: mark.S.burn, uDelay: mat.uniforms.uDelay, uUseBurn: mark.S.useBurn, uToBook: wordsTo, uShow: mark.S.show }, /* glsl */ `
      uniform mat4 uToBook;
      varying vec2 vB; varying vec2 vUv;
      void main() {
        vUv = vec2(uv.x, 1.0 - uv.y);
        vB = (uToBook * vec4(position, 1.0)).xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `, 'uniform sampler2D uField; bool solid(vec2 uv) { return texture2D(uField, uv).r > 0.0; }'));
  } else {
    mat = logoMaterial({ burn, delay: 0.2, self, heat, face });
    words = new THREE.Mesh(logoGeometry({ line: false }), mat);
  }
  words.scale.setScalar(k);
  words.position.set(-1.51 - b.x1 * k, 2.65 - b.y0 * k, look === 'cover' ? 0.02 : -0.1);
  words.frustumCulled = false;
  if (!alone) group.add(words);
  group.traverse((o) => { o.frustumCulled = false; });
  const x0 = -1.51 - (b.x1 - b.x0) * k;
  return {
    group, mark, words, mat,
    /* where the whole of it reaches, in its own units: for placing it */
    box: { x0, x1: 1.75, y0: 0, y1: Y1, cx: (x0 + 1.75) / 2 },
    /* m: the matrix that takes this group's coordinates to the cover's. */
    place(m) {
      mark.place(m);
      words.updateMatrix();
      /* the plate shares the mark's own fire; the solid letters carry theirs */
      if (look === 'cover') wordsTo.value.copy(m).multiply(words.matrix); else mat.uniforms.uToBook.value.copy(m).multiply(words.matrix);
    },
    show(v) { mark.show(v); if (mat.uniforms.uShow) mat.uniforms.uShow.value = v; words.visible = v > 0.002 && !alone; },
    set fire(v) { mark.fire = v; },
  };
}
