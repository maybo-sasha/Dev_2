/* ============================================================
   The hand that drew the book.

   The book's own drawings set the language for everyone in the
   walk: a figure is a few flat washes (bare paper where the light
   falls, a lilac grey, a darker grey, and deep shadow), the edge
   of each wash left broken by the brush, and over it a pen line
   that swells, thins, and in places lifts off the paper.

   Two materials make one drawn thing. The wash fills it. The line
   is the same form drawn again a little larger and inside out, so
   that only its rim shows.
   ============================================================ */

import * as THREE from 'three';
import { GLSL_STAR, BAND_STAR } from './star.js';
import { world, GLSL_NOISE, GLSL_LIGHT, toScene } from './common.js';

/* Lightest to darkest: bare paper, the wash, its shadow, deep shadow. Then the pen.
   Given as they should look on the screen. */
export const DRESS = {
  /* Keep the established key for callers; colours follow the sepia concept lineup. */
  lilac: { tones: [[0.84, 0.72, 0.53], [0.52, 0.41, 0.29], [0.3, 0.232, 0.162], [0.125, 0.096, 0.07]], pen: [0.055, 0.043, 0.03] },
  /* the men sent to clear it: field grey, colder and darker, so the two are never confused */
  grey: { tones: [[0.5, 0.5, 0.42], [0.31, 0.32, 0.27], [0.18, 0.19, 0.16], [0.075, 0.082, 0.07]], pen: [0.025, 0.03, 0.03] },
  shepherd: { tones: [[.72,.55,.32],[.51,.36,.20],[.30,.21,.12],[.12,.09,.06]], pen: [.025,.022,.018] },
};
const scene3 = (rgb) => new THREE.Vector3(...rgb.map(toScene));

/* On a small screen a crowd is drawn in wash alone: the line would be a second crowd to draw,
     and too fine to see. Set before the world is built. */
export const QUALITY = { pen: true };

/* A walker (see walk.js): the figure is read from a texture that holds it at sixteen moments
   of one stride, and it moves on along its path by one stride for every stride it takes. */
export const WALK_HEAD = /* glsl */ `
  #ifdef WALK
    uniform sampler2D uWalkTex; uniform vec4 uWalkInfo; uniform float uWalkT, uWalkStay;
    attribute vec4 aWalk;      // where in its stride it starts, strides a second, the stride, the length of its path
    vec3 walkFetch(int frame, int which) {
      int tw = int(uWalkInfo.z), rows = int(uWalkInfo.y), id = gl_VertexID;
      int row = id / tw;
      return texelFetch(uWalkTex, ivec2(id - row * tw, (which * int(uWalkInfo.x) + frame) * rows + row), 0).xyz;
    }
  #endif
`;
export const WALK_BODY = /* glsl */ `
  #ifdef WALK
    float cyc = uWalkT * aWalk.y + aWalk.x;
    float fr = fract(cyc) * uWalkInfo.x;
    int f0 = int(fr);
    int f1 = f0 + 1 >= int(uWalkInfo.x) ? 0 : f0 + 1;
    float ft = fr - float(f0);
    P0 = mix(walkFetch(f0, 0), walkFetch(f1, 0), ft);
    N0 = normalize(mix(walkFetch(f0, 1), walkFetch(f1, 1), ft));
    float walkLen = max(aWalk.w, 0.001);
    walkAlong = (mod(cyc * aWalk.z, walkLen) - walkLen * 0.5) * (1.0 - uWalkStay);
    /* near either end of its path a walker comes and goes like the rest: a dot at a time */
    walkEnd = smoothstep(walkLen * 0.4, walkLen * 0.5, abs(walkAlong)) * (1.0 - uWalkStay);
    walking = 1.0;
  #endif
`;

/* What both passes do to a vertex: stand it in the world, let it sway, let it go. */
const BODY = /* glsl */ `
  #ifdef USE_INSTANCING
    mat4 m = modelMatrix * instanceMatrix;
  #else
    mat4 m = modelMatrix;
  #endif
  vec3 P0 = position, N0 = normal;
  #ifdef HAND
    P0 = mix(P0, aGripPosition, uGrip);
    N0 = normalize(mix(N0, aGripNormal, uGrip));
  #endif
  float walkAlong = 0.0, walkEnd = 0.0, walking = 0.0;
  ${WALK_BODY}
  vO = P0;
  P0.z += walkAlong;
  vec4 wp = m * vec4(P0, 1.0);
  vec3 origin = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #ifdef USE_INSTANCING
    /* people have room round them, and keep it: whoever the walker comes up against steps aside */
    vec3 foot = (m * vec4(0.0, 0.0, walkAlong, 1.0)).xyz;
    vec2 offW = foot.xz - uWalker.xz;
    float nearW = length(offW);
    float give = smoothstep(1.35, 0.3, nearW) * step(abs(foot.y - uWalker.y), 1.2);
    vec2 avoidance = (nearW > 0.001 ? offW / nearW : vec2(1.0, 0.0)) * give * 0.8;
    // Bound the whole body's displacement, rather than flattening vertices at the wall.
    // The main street has facades at ±8; leave room for shoulders and carried bags.
    bool streetLane = abs(foot.x) < 7.6 && foot.y > -0.2 && foot.y < 1.0;
    bool openCrossing = foot.z > -187.0 && foot.z < -163.0;
    bool openYard = foot.z > -320.0 && foot.z < -250.0;
    bool openSquare = foot.z > -606.0 && foot.z < -549.0;
    if (streetLane && !openCrossing && !openYard && !openSquare && foot.z > -765.0)
      avoidance.x = clamp(foot.x + avoidance.x, -7.35, 7.35) - foot.x;
    wp.xz += avoidance;
  #endif
  #ifdef WALK
    /* a line across a walker's way: past it, it goes, a dot at a time */
    if (uGoneAxis.w > 1.5) walkEnd = max(walkEnd, smoothstep(uGoneAxis.x, uGoneAxis.y, -(m * vec4(0.0, 0.0, walkAlong, 1.0)).z));
  #endif
  /* each one leaves at its own moment */
  float order = fract(sin(dot(origin.xz, vec2(12.9898, 78.233))) * 43758.5453);
  if (uGoneAxis.w > 0.5 && uGoneAxis.w < 1.5) order = mix(order, clamp((origin.z - uGoneAxis.x) / (uGoneAxis.y - uGoneAxis.x), 0.0, 1.0), 0.75);
  vGone = max(clamp(uGone * 1.6 - order * 0.6, 0.0, 1.0), walkEnd);
  /* a breath of sway, so they are standing and not statues */
  wp.x += sin(uTime * 0.7 + origin.x * 3.1 + origin.z * 1.7) * 0.012 * vO.y * (1.0 - uStill) * (1.0 - walking);
  wp.y += vGone * vGone * 0.6 * (1.0 - walking);
  /* a tableau is many people in one mesh: there, who is who goes by where they stand */
  #ifdef USE_INSTANCING
    vWho = fract(sin(dot(origin.xz, vec2(41.3, 17.7))) * 9731.3);
  #else
    vWho = fract(sin(dot(floor(wp.xz * 0.9), vec2(41.3, 17.7))) * 9731.3);
  #endif
  #ifdef FIXED_WHO
    vWho = FIXED_WHO;
  #endif
  vec3 wn = normalize(mat3(m) * N0);
`;

const HEAD = /* glsl */ `
  #ifdef HAND
    attribute vec3 aGripPosition, aGripNormal;
    uniform float uGrip;
  #endif
  uniform float uGone; uniform vec4 uGoneAxis; uniform float uTime; uniform float uStill; uniform vec3 uWalker;
  varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vGone; varying float vWho;
  ${WALK_HEAD}
`;

/* thinned out a dot at a time, the way a print fades */
const FADE = /* glsl */ `
  if (vGone > 0.001) {
    float dot0 = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    if (dot0 < vGone * 1.05) discard;
  }
`;

/* The wash. */
export function washMaterial({ dress = 'lilac', walk = null, who, hand = null } = {}) {
  const d = DRESS[dress];
  return new THREE.ShaderMaterial({
    defines: { ...(hand ? { HAND: '' } : {}), ...(dress === 'shepherd' ? { SHEPHERD: '' } : {}), ...(walk ? { WALK: '' } : {}), ...(who !== undefined ? { FIXED_WHO: who.toFixed(3) } : {}) },
    uniforms: {
      ...world,
      ...(hand ? { uGrip: hand } : {}),
      uTones: { value: d.tones.map(scene3) },
      uStill: { value: 0 }, uGone: { value: 0 }, uGoneAxis: { value: new THREE.Vector4(0, 0, 0, 0) },
      ...(walk ? { uWalkTex: { value: walk.tex }, uWalkInfo: { value: walk.info }, uWalkT: walk.clock, uWalkStay: { value: walk.stay ? 1 : 0 } } : {}),
    },
    userData: { dress, walk },
    vertexShader: /* glsl */ `
      attribute float aTone;
      attribute vec3 aStar;
      ${HEAD}
      varying float vTone; varying vec3 vStar;
      void main() {
        ${BODY}
        vTone = aTone; vStar = aStar;
        vP = wp.xyz; vN = wn;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vGone; varying float vWho; varying float vTone; varying vec3 vStar;
      uniform vec3 uTones[4];
      ${GLSL_NOISE}
      ${GLSL_STAR}
      ${GLSL_LIGHT}
      float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
      void main() {
        ${FADE}
        /* A figure is cut from flat planes, like folded card: the light is taken one plane at a time. */
        vec3 Nf = normalize(cross(dFdx(vP), dFdy(vP)));
        float smoothSkin = step(0.5, vTone) * step(vTone, 1.5);
        vec3 N = normalize(mix(normalize(vN), Nf, 0.55 * (1.0 - smoothSkin)));
        float facet = (fract(sin(dot(floor(Nf * 5.0 + 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453) - 0.5) * (1.0 - smoothSkin);
        /* Which wash goes where is decided by the form, as a draughtsman decides it: the side
           toward the sun, the planes that face the sky, whatever a lamp or a fire picks out. */
        float sunL = lum(uSunCol);
        float key = max(dot(N, uSunDir), 0.0) * sunShadow(vP, N) * smoothstep(0.03, 0.3, sunL);
        float fill = N.y * 0.5 + 0.5;
        /* even under a grey sky the light comes more from one side than the other, and that is what
           gives a figure a lit side and a shaded one; and the edge of a form that turns away catches
           the sky, which lifts it off whatever is behind it */
        float amb = clamp(lum(uSkyCol) * 3.2, 0.0, 1.0);
        float side = max(dot(N, normalize(vec3(-0.62, 0.38, 0.68))), 0.0);
        vec3 Vw = normalize(cameraPosition - vP);
        float rim = pow(1.0 - abs(dot(N, Vw)), 3.0) * smoothstep(-0.2, 0.5, N.y + 0.25);
        vec3 lampC = lampLight(N, vP);
        float lampL = min(lum(lampC), 1.2);
        /* the edge of a wash is where the brush stopped, not where the form says */
        float stroke = fbm(vec2(vO.x * 7.0 + vO.z * 5.6, vO.y * 1.9) + vWho * 9.0) - 0.5;
        /* skin and a collar are left lighter, iron is laid in darker */
        float skin = step(0.5, vTone) * step(vTone, 1.5), iron = step(1.5, vTone), collar = step(0.2, vTone) * (1.0 - step(0.5, vTone));
        /* the foot of a figure is always the darkest of it: the ground gives nothing back */
        float low = smoothstep(0.75, 0.0, vO.y);
        float t = key * 0.9 + fill * 0.3 + (side * 0.36 + rim * 0.08) * amb * (1.0 - key * 0.65) + lampL * 0.9 + stroke * 0.05 + facet * 0.15 + skin * 0.22 + collar * 0.24 - iron * 0.13 - low * 0.05;
        float w = clamp(fwidth(t) * 0.9, 0.018, 0.055);
        /* bare paper only where the light falls full on it: most of a figure is wash and shadow */
        vec3 k = smoothstep(vec3(0.94, 0.58, 0.31) - w, vec3(0.94, 0.58, 0.31) + w, vec3(t));
        vec3 c = mix(mix(mix(uTones[3], uTones[2], k.z), uTones[1], k.y), uTones[0], k.x);
        // Distinct paper skin and brown leather, with no facial features.
        if (skin > 0.5) c = mix(vec3(.12,.083,.045), vec3(.64,.47,.28), clamp(t,0.0,1.0));
        if (vTone > 2.5) c = mix(vec3(.045,.028,.015), vec3(.24,.14,.065), clamp(t,0.0,1.0));
        #ifdef SHEPHERD
          if (iron > 0.5 && vTone < 2.5) c = mix(vec3(.014,.012,.01),vec3(.085,.073,.058),clamp(t,0.0,1.0));
        #endif
        /* the band on the right sleeve: white, and the star drawn on it in blue */
        if (vStar.z > 0.25) {
          c = mix(c, vec3(.78,.75,.68), 0.85);
          float star = handStar(vStar.xy / ${BAND_STAR.toFixed(3)}, 1.0, vWho * 7.0) * smoothstep(0.25, 0.6, vStar.z);
          c = mix(c, c * vec3(0.16, 0.27, 0.78), star);
        }
        /* no two coats are the same grey */
        c *= mix(vec3(1.1, 0.98, 0.84), vec3(0.9, 0.95, 1.0), fract(vWho * 3.7)) * (0.7 + 0.5 * fract(vWho * 7.31));
        /* iron is dark whatever the light: a helmet, a rifle */
        c = mix(c, uTones[3] * 0.6, iron * 0.72);
        /* the drag of a brush that is running dry */
        c *= 0.94 + 0.12 * fbm(vec2(dot(vO.xz, vec2(0.71)) * 13.0 + vWho * 5.0, vO.y * 2.6));
        /* stains and wear, as on old card */
        c *= 1.0 - 0.14 * smoothstep(0.62, 0.86, fbm(vO.xy * 5.5 + vO.z * 3.0 + vWho * 19.0));
        /* and where two planes meet, the fold is a little darker: it is drawn, not lit */
        c *= 1.0 - 0.28 * (1.0-skin) * smoothstep(0.08, 0.7, length(fwidth(Nf)));
        float outline = 1.0-smoothstep(.1,.32,abs(dot(N,Vw)));
        c *= 1.0-outline*.24*(1.0-skin*.8);
        /* how much light there is at all, and a breath of its colour: this is ink */
        vec3 lightC = uSunCol * key + uSkyCol * 0.8 + lampC * 0.75;
        c *= clamp(0.3 + lum(uSkyCol) * 1.9 + sunL * 0.45 + lampL * 0.6, 0.3, 1.05);
        c *= mix(vec3(1.0), lightC / max(lum(lightC), 0.05), 0.2);
        gl_FragColor = vec4(applyFog(c, vP), 1.0);
      }
    `,
  });
}

/* The pen line that goes round a wash. It shares the wash's own switches, so the
   two sway and leave together. width is in pixels of the screen. */
export function lineMaterial(fill, { width = 1.5, lift = 0.18, min = 0.004, max = 0.032 } = {}) {
  const u = fill.uniforms;
  const d = DRESS[fill.userData.dress || 'lilac'];
  const walk = fill.userData.walk;
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    defines: { ...(u.uGrip ? { HAND: '' } : {}), ...(walk ? { WALK: '' } : {}), ...(fill.defines.FIXED_WHO ? { FIXED_WHO: fill.defines.FIXED_WHO } : {}) },
    uniforms: {
      ...world,
      uStill: u.uStill, uGone: u.uGone, uGoneAxis: u.uGoneAxis,
      ...(u.uGrip ? { uGrip: u.uGrip } : {}),
      ...(walk ? { uWalkTex: u.uWalkTex, uWalkInfo: u.uWalkInfo, uWalkT: u.uWalkT, uWalkStay: u.uWalkStay } : {}),
      uLineCol: { value: scene3(d.pen) },
      uLine: { value: new THREE.Vector4(width, lift, min, max) },
    },
    vertexShader: /* glsl */ `
      attribute float aEdge;
      ${HEAD}
      uniform vec4 uLine; uniform float uPx; uniform sampler2D uNoise;
      float vnz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return texture2D(uNoise, (i + f + 0.5) / 256.0).r; }
      void main() {
        ${BODY}
        /* a line so many pixels wide wherever it stands, that swells and thins along the form */
        float dist = distance(wp.xyz, cameraPosition);
        float w = clamp(uPx * dist * uLine.x, uLine.z, uLine.w);
        w *= (0.45 + 1.1 * vnz(vO.xy * 9.0 + vO.z * 5.0 + vWho * 31.0)) * aEdge;
        wp.xyz += wn * w;
        vP = wp.xyz; vN = wn;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec3 vO; varying float vGone; varying float vWho;
      uniform vec3 uLineCol; uniform vec4 uLine;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        ${FADE}
        /* here and there the pen lifts off the paper */
        if (nz(vO.xy * 11.0 + vO.z * 7.0 + vWho * 40.0) < uLine.y) discard;
        gl_FragColor = vec4(applyFog(uLineCol, vP), 1.0);
      }
    `,
  });
}
