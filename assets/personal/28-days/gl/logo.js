/* ============================================================
   The logo, in three dimensions.

   The outlines traced from the printed cover are pushed back into
   solid letters. The faces stay the white of the print. The sides
   take the fire: hot at the foot, cooling as they rise.

   It is used twice: on the cover, where the fire burns it away
   with the book, and at the end of the walk, where it forms out
   of the dark above the candles.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LOGO, LOGO_ASPECT } from './logo-shape.js';
import { world, GLSL_NOISE, GLSL_LIGHT } from './common.js';

export { LOGO_ASPECT };

/* The fire front that eats the book. Shared by the cover, the pages and the logo.
   < 0 burnt away, small and positive glowing. */
export const BURN = /* glsl */ `
  uniform float uBurn;
  uniform float uDelay;
  float burnFront(vec2 p) {
    float d = length((p - vec2(-0.1, -0.05)) * vec2(1.0, 1.28));
    d += (fbm(p * 1.6 + 4.0) - 0.5) * 0.62 + (nz(p * 11.0) - 0.5) * 0.05;
    return d - (uBurn * 5.0 - 0.7 - uDelay);
  }
`;

const pairs = (flat) => {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push(new THREE.Vector2(flat[i], flat[i + 1]));
  return out;
};

const cached = {};
/* One unit wide, centred, facing +z, its back at z = 0. line: with the small line of
   words that runs under the mark on the cover. */
export function logoGeometry({ line = true, depth = 0.062 } = {}) {
  const key = line + ':' + depth;
  if (cached[key]) return cached[key];
  const shape = (l) => {
    const s = new THREE.Shape(pairs(l.o));
    for (const h of l.h) s.holes.push(new THREE.Path(pairs(h)));
    return s;
  };
  const big = new THREE.ExtrudeGeometry(LOGO.filter((l) => !l.small).map(shape), {
    depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.0028, bevelOffset: -0.0028, bevelSegments: 2, curveSegments: 1,
  });
  let g = big;
  if (line) {
    const small = new THREE.ExtrudeGeometry(LOGO.filter((l) => l.small).map(shape), {
      depth: 0.02, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.001, bevelOffset: -0.001, bevelSegments: 1, curveSegments: 1,
    });
    g = mergeGeometries([big, small], false);
  }
  g.translate(0, 0, 0.006);
  cached[key] = g;
  return g;
}

/* Where "28" and the two words sit, in the logo's own units: the box round them. */
export function logoBlock() {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const l of LOGO) {
    if (l.small) continue;
    for (let i = 0; i < l.o.length; i += 2) { x0 = Math.min(x0, l.o[i]); x1 = Math.max(x1, l.o[i]); y0 = Math.min(y0, l.o[i + 1]); y1 = Math.max(y1, l.o[i + 1]); }
  }
  return { x0, x1, y0, y1 };
}

/* The same outlines as a field of distances: for every point, how far it is from the edge of a
   letter, in pixels of the field, positive inside. A shader can cut that at any size and the edge
   stays clean; and from the same field it can raise a bevel, lay a shadow, and let a flame climb
   off the top of a stroke. Made once, when the page loads. */
let field = null;
export function logoField({ width = 1536, pad = 0.06 } = {}) {
  if (field) return field;
  const b = logoBlock();
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad * 2.2;   // more room above: flames
  const W = width, H = Math.round(W * (y1 - y0) / (x1 - x0)), s = W / (x1 - x0);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.setTransform(s, 0, 0, -s, -x0 * s, y1 * s);
  const path = new Path2D();
  for (const l of LOGO) {
    if (l.small) continue;
    for (const ring of [l.o, ...l.h]) {
      for (let i = 0; i < ring.length; i += 2) { if (i) path.lineTo(ring[i], ring[i + 1]); else path.moveTo(ring[i], ring[i + 1]); }
      path.closePath();
    }
  }
  g.fillStyle = '#fff';
  g.fill(path, 'evenodd');
  const img = g.getImageData(0, 0, W, H).data;

  /* the distance transform of Felzenszwalb and Huttenlocher, seeded so the soft edge of the drawing
     places the true edge between pixels */
  const INF = 1e20, n = W * H;
  const outer = new Float64Array(n), inner = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = img[i * 4 + 3] / 255;
    if (a >= 0.999) { outer[i] = 0; inner[i] = INF; } else if (a <= 0.001) { outer[i] = INF; inner[i] = 0; } else { const d = 0.5 - a; outer[i] = d > 0 ? d * d : 0; inner[i] = d < 0 ? d * d : 0; }
  }
  const size = Math.max(W, H);
  const f = new Float64Array(size), z = new Float64Array(size + 1), v = new Uint16Array(size);
  const edt1 = (grid, off, stride, len) => {
    v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grid[off];
    for (let q = 1, k = 0, sp = 0; q < len; q++) {
      f[q] = grid[off + q * stride];
      const q2 = q * q;
      do { const r = v[k]; sp = (f[q] - f[r] + q2 - r * r) / (q - r) / 2; } while (sp <= z[k] && --k > -1);
      k++; v[k] = q; z[k] = sp; z[k + 1] = INF;
    }
    for (let q = 0, k = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k], qr = q - r;
      grid[off + q * stride] = f[r] + qr * qr;
    }
  };
  for (const grid of [outer, inner]) {
    for (let x = 0; x < W; x++) edt1(grid, x, W, H);
    for (let y = 0; y < H; y++) edt1(grid, y * W, 1, W);
  }
  const data = new Uint16Array(n);
  for (let i = 0; i < n; i++) data[i] = THREE.DataUtils.toHalfFloat(Math.max(-250, Math.min(250, Math.sqrt(inner[i]) - Math.sqrt(outer[i]))));
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  field = { tex, W, H, px: s, box: { x0, x1, y0, y1 } };
  return field;
}

/* The same outlines as a flat drawing, for the page: the small mark in the corner. */
export function logoPath({ small = false } = {}) {
  let d = '';
  for (const l of LOGO) {
    if (l.small && !small) continue;
    for (const ring of [l.o, ...l.h]) {
      for (let i = 0; i < ring.length; i += 2) d += `${i ? 'L' : 'M'}${ring[i].toFixed(4)} ${(-ring[i + 1]).toFixed(4)}`;
      d += 'Z';
    }
  }
  return d;
}

export function logoMaterial({ burn = null, delay = 0.15, self = 0.72, heat = 1, face = [0.9, 0.87, 0.79] } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...world,
      uBurn: burn || { value: 0 },
      uDelay: { value: delay },
      uUseBurn: { value: burn ? 1 : 0 },
      uToBook: { value: new THREE.Matrix4() },
      uSelf: { value: self },
      uHeat: { value: heat },
      uShow: { value: 1 },
      uFace: { value: new THREE.Vector3(...face) },
    },
    vertexShader: /* glsl */ `
      uniform mat4 uToBook;
      varying vec3 vP; varying vec3 vN; varying vec3 vNo; varying vec3 vO; varying vec2 vB;
      void main() {
        vO = position; vNo = normal;
        vB = (uToBook * vec4(position, 1.0)).xy;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec3 vNo; varying vec3 vO; varying vec2 vB;
      uniform float uUseBurn, uSelf, uHeat, uShow; uniform vec3 uFace;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      ${BURN}
      void main() {
        /* forming out of the dark: the letters fill in from scattered sparks */
        float grain = fbm(vO.xy * 9.0 + 3.0) * 0.7 + nz(vO.xy * 70.0) * 0.3;
        float form = uShow * 1.25 - grain;
        if (uShow < 0.999 && form < 0.0) discard;
        float spark = (uShow < 0.999) ? smoothstep(0.12, 0.0, form) : 0.0;

        float bf = 9.0;
        if (uUseBurn > 0.5) { bf = burnFront(vB); if (bf < 0.0) discard; }
        float lit0 = smoothstep(0.0, 0.03, uBurn) * uUseBurn;
        float glowEdge = smoothstep(0.2, 0.0, bf) * lit0;
        float charE = smoothstep(0.65, 0.1, bf) * lit0;

        vec3 N = normalize(vN);
        float front = smoothstep(0.35, 0.9, vNo.z);
        float low = smoothstep(0.34, -0.34, vO.y);
        vec3 lamp = lampLight(N, vP);
        vec3 amb = uSunCol * max(dot(N, uSunDir), 0.0) + mix(uGndCol, uSkyCol, N.y * 0.5 + 0.5);

        vec3 cream = uFace;
        vec3 face = cream * (uSelf + amb * 1.05 + lamp * 0.22);
        /* a breath of the fire on the face, climbing from the foot */
        float lick = fbm(vec2(vO.x * 7.0, vO.y * 5.0 - uTime * 0.25));
        face = mix(face, face * vec3(1.0, 0.72, 0.5), uHeat * low * 0.55 * lick);

        float flick = 0.75 + 0.25 * nz(vec2(vO.x * 26.0 + uTime * 0.7, vO.y * 26.0 - uTime * 1.1));
        vec3 ember = mix(vec3(0.42, 0.045, 0.008), vec3(1.0, 0.42, 0.07), low * low);
        vec3 side = cream * 0.16 * (amb + lamp * 0.9) + ember * uHeat * (0.3 + 1.25 * low) * flick;

        vec3 c = mix(side, face, front);
        c = mix(c, vec3(0.012, 0.008, 0.005), charE * 0.93);
        c += vec3(1.0, 0.38, 0.05) * (glowEdge * glowEdge * 3.0 + spark * 2.4) * (0.6 + 0.4 * nz(vO.xy * 60.0 + uTime * 3.0));
        c = mix(c, uFogCol, fogAmount(vP) * 0.6);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}
