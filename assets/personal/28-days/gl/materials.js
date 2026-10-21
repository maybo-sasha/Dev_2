/* ============================================================
   What things are made of.

   Nothing here is a photograph of a wall. Plaster, brick, cobble
   and wood are drawn by the shader from distances in metres, so a
   tenement can be any width, lose its top floors to fire, or stand
   hollow, without a single extra texture.
   ============================================================ */

import * as THREE from 'three';
import { GLSL_NOISE, GLSL_LIGHT, VERT_STD, worldMaterial } from './common.js';

const BRICK = /* glsl */ `
  vec3 brickCol(vec2 uv, float seed) {
    vec2 b = uv * vec2(1.0 / 0.27, 1.0 / 0.09);
    float row = floor(b.y);
    b.x += mod(row, 2.0) * 0.5;
    vec2 id = floor(b);
    vec2 f = fract(b);
    float mortar = max(step(f.x, 0.05), step(f.y, 0.16));
    float r = hash21(id + seed);
    vec3 c = mix(vec3(0.21, 0.12, 0.085), vec3(0.36, 0.21, 0.14), r);
    c *= 0.8 + 0.4 * nz(uv * 9.0);
    float lod = clamp(1.0 - fwidth(b.y) * 1.4, 0.0, 1.0);
    c = mix(vec3(0.27, 0.18, 0.13), mix(c, vec3(0.34, 0.31, 0.27), mortar), lod);
    return c;
  }
`;

/* ── brick: the ghetto wall and the cellars ─────────────────── */
export function brickMaterial({ tint = [1, 1, 1], damp = 0, side = THREE.FrontSide, hole = [0, 0, 0, 0] } = {}) {
  return worldMaterial({
    side,
    uniforms: { uTint: { value: new THREE.Vector3(...tint) }, uDamp: { value: damp }, uHole: { value: new THREE.Vector4(...hole) } },   // hole: x, z, radius, above this height
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform vec3 uTint; uniform float uDamp; uniform vec4 uHole;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      ${BRICK}
      void main() {
        if (uHole.z > 0.0 && vP.y > uHole.w && distance(vP.xz, uHole.xy) < uHole.z) discard;
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        vec3 col = brickCol(vUv, 3.0) * uTint;
        float grime = fbm(vUv * 0.45 + 7.0);
        col *= 0.62 + 0.55 * grime;
        col *= mix(1.0, 0.55 + 0.45 * smoothstep(0.0, 1.6, vUv.y), 0.7);
        col = mix(col, col * vec3(0.5, 0.55, 0.5), uDamp * smoothstep(0.5, 0.75, fbm(vUv * 0.8 + 11.0)));
        vec3 c = shade(col, N, vP);
        gl_FragColor = vec4(applyFog(c, vP), 1.0);
      }
    `,
  });
}

/* ── the ground: cobbles, kerbs, rails, yard dirt, rubble ───── */
export function groundMaterial(zones) {
  return worldMaterial({
    uniforms: {
      uCross: { value: new THREE.Vector2(zones.crossZ0, zones.crossZ1) },   // the street the bridge crosses
      uYard: { value: new THREE.Vector4(...zones.yard) },                    // x0, z0, x1, z1 of the loading yard
      uWallZ: { value: zones.wallZ },
      uBurnZ: { value: zones.burnZ },
      uRuinZ: { value: zones.ruinZ },
      uMila: { value: new THREE.Vector2(...zones.mila) },
      uLoop: { value: new THREE.Vector3(...zones.loop) },                    // x, z, radius of the tram loop
    },
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform vec2 uCross; uniform vec2 uMila; uniform vec3 uLoop; uniform vec4 uYard; uniform float uWallZ, uBurnZ, uRuinZ, uWet;
      uniform vec4 uHoles[5];
      ${GLSL_NOISE}
      ${GLSL_LIGHT}

      void main() {
        vec2 p = vP.xz;
        for (int i = 0; i < 5; i++) {
          vec4 h = uHoles[i];
          if (p.x > h.x && p.x < h.z && p.y > h.y && p.y < h.w) discard;
        }

        float inCross = max(step(uCross.x, p.y) * step(p.y, uCross.y), step(uMila.x, p.y) * step(p.y, uMila.y));
        /* the square is open from side to side */
        inCross = max(inCross, step(abs(p.y - uLoop.y), 28.5));
        float ax = abs(p.x);
        float walk = step(4.5, ax) * step(ax, 8.2) * (1.0 - inCross);
        float yard = step(uYard.x, p.x) * step(p.x, uYard.z) * step(uYard.y, p.y) * step(p.y, uYard.w);
        float ruin = smoothstep(uRuinZ + 14.0, uRuinZ - 14.0, p.y);
        float burnt = smoothstep(uBurnZ + 20.0, uBurnZ - 30.0, p.y);

        /* cobbles: staggered rows of rounded stones */
        vec2 c = p * vec2(5.2, 6.6);
        c.x += mod(floor(c.y), 2.0) * 0.5;
        vec2 id = floor(c);
        vec2 f = fract(c) - 0.5;
        float d = length(max(abs(f) - 0.26, 0.0));
        float hgt = smoothstep(0.2, 0.0, d);
        float lod = clamp(1.0 - max(fwidth(c.x), fwidth(c.y)) * 1.25, 0.0, 1.0);
        float sr = hash21(id);
        vec3 stone = mix(vec3(0.09, 0.085, 0.08), vec3(0.2, 0.185, 0.165), sr);
        vec3 col = mix(vec3(0.12, 0.11, 0.1), mix(vec3(0.035, 0.032, 0.03), stone, hgt), lod);
        vec3 N = normalize(vec3(-f.x * 1.6 * lod * (1.0 - hgt * 0.4), 1.0, -f.y * 1.6 * lod * (1.0 - hgt * 0.4)));

        /* pavement slabs and a kerb */
        vec2 s = p * 1.6;
        vec2 sf = fract(s);
        float joint = max(step(sf.x, 0.04), step(sf.y, 0.04));
        vec3 slab = vec3(0.17, 0.16, 0.145) * (0.75 + 0.4 * hash21(floor(s))) * (1.0 - 0.45 * joint * lod);
        col = mix(col, slab, walk);
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), walk));
        float kerb = smoothstep(0.16, 0.0, abs(ax - 4.5)) * (1.0 - inCross);
        col = mix(col, vec3(0.22, 0.21, 0.19), kerb * 0.8);

        /* the dirt of the loading yard */
        vec3 dirt = vec3(0.13, 0.115, 0.095) * (0.6 + 0.7 * fbm(p * 1.7));
        col = mix(col, dirt, yard);
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), yard));

        /* tram rails: up to the wall, and along the street under the bridge */
        float railMain = step(uWallZ, p.y) * (1.0 - smoothstep(0.035, 0.05, abs(ax - 0.72)));
        float cz = abs(p.y - (uCross.x + uCross.y) * 0.5);
        float railCross = inCross * (1.0 - smoothstep(0.035, 0.05, abs(abs(cz - 2.2) - 0.72)));
        /* the loop where the trams turned round, in the square */
        float lr = length(p - uLoop.xy);
        float railLoop = (1.0 - smoothstep(0.035, 0.05, abs(abs(lr - uLoop.z) - 0.72))) * step(abs(p.y - uLoop.y), 28.0);
        float rail = max(max(railMain * (1.0 - step(abs(p.y - uLoop.y), 28.5) * step(lr, uLoop.z + 2.0)), railCross * step(uCross.x - 1.0, p.y)), railLoop);

        /* grime, puddles, and later ash and broken brick */
        float g = fbm(p * 0.35);
        col *= 0.6 + 0.65 * g;
        float debris = smoothstep(0.52, 0.7, fbm(p * 1.3 + 31.0)) * max(burnt, ruin);
        col = mix(col, vec3(0.16, 0.1, 0.075) * (0.5 + nz(p * 14.0)), debris * 0.8);
        col = mix(col, vec3(0.2, 0.19, 0.18) * (0.5 + 0.8 * fbm(p * 2.3 + 5.0)), ruin * 0.75);
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), max(debris, ruin * 0.8)));

        vec3 V = normalize(cameraPosition - vP);
        vec3 R = reflect(-V, N);
        float wet = uWet * (0.35 + 0.65 * smoothstep(0.45, 0.7, g)) * (1.0 - walk * 0.5) * (1.0 - yard) * (1.0 - ruin);
        float fres = pow(1.0 - max(dot(V, N), 0.0), 4.0);

        vec3 lit = shade(col, N, vP);
        /* the sky lying in the wet stones */
        lit += uFogCol * fres * wet * 0.85;
        lit += uSunCol * pow(max(dot(R, uSunDir), 0.0), 60.0) * wet * 0.6;
        /* and the fires */
        for (int i = 0; i < ${8}; i++) {
          vec3 L = uLights[i].xyz - vP;
          float d2 = dot(L, L);
          float sp = pow(max(dot(R, normalize(L)), 0.0), 24.0);
          lit += uLightCols[i] * uLights[i].w * sp * wet * 2.2 / (1.0 + d2 * 0.01);
        }
        vec3 steel = uFogCol * 1.4 + uSkyCol * 0.6;
        lit = mix(lit, steel * (0.45 + fres), rail * 0.9);

        gl_FragColor = vec4(applyFog(lit, vP), 1.0);
      }
    `,
  });
}

/* ── wood: the bridge, the wagons, the bunks ────────────────── */
export function woodMaterial({ tint = [0.2, 0.15, 0.1], plank = 0.16, vertical = 1, side = THREE.FrontSide } = {}) {
  return worldMaterial({
    side,
    uniforms: {
      uTint: { value: new THREE.Vector3(...tint) },
      uPlank: { value: plank },
      uVert: { value: vertical },
    },
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform vec3 uTint; uniform float uPlank, uVert;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        vec2 uv = mix(vUv, vUv.yx, uVert);
        float pl = uv.y / uPlank;
        float id = floor(pl);
        float gap = smoothstep(0.06, 0.0, abs(fract(pl) - 0.5) - 0.44);
        float grain = nz(vec2(uv.x * 2.0 + id * 17.0, uv.y * 60.0));
        vec3 col = uTint * (0.65 + 0.6 * hash11(id + 3.0)) * (0.7 + 0.5 * grain);
        col *= 1.0 - 0.75 * (1.0 - gap);
        col *= 0.75 + 0.4 * fbm(vUv * 0.8);
        gl_FragColor = vec4(applyFog(shade(col, N, vP), vP), 1.0);
      }
    `,
  });
}

/* ── one colour with a little life in it: stone, iron, cloth ── */
export function plainMaterial({ color = [0.2, 0.2, 0.2], rough = 0.35, emissive = [0, 0, 0], side = THREE.FrontSide, collapse = false } = {}) {
  return worldMaterial({
    side,
    uniforms: {
      uColor: { value: new THREE.Vector3(...color) },
      uRough: { value: rough },
      uEmis: { value: new THREE.Vector3(...emissive) },
      uCollapse: { value: 0 },
    },
    vertex: collapse ? /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform float uCollapse;
      uniform float uTime;
      float h3(vec3 p) { return fract(sin(dot(floor(p), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        /* the building comes down in pieces, the top first */
        float r = h3(wp.xyz * 0.35);
        float t = clamp(uCollapse * 2.3 - (1.0 - smoothstep(0.0, 32.0, wp.y)) * 0.7 - r * 0.45, 0.0, 1.0);
        float fall = t * t;
        vec2 sc = vec2(h3(wp.xyz * 0.35 + 3.0), h3(wp.xyz * 0.35 + 9.0)) - 0.5;
        wp.y = mix(wp.y, wp.y * 0.07 + r * 1.3, fall);
        wp.xz += sc * 4.0 * fall;
        wp.xz += (vec2(h3(wp.xyz + uTime * 30.0), h3(wp.zyx + uTime * 30.0)) - 0.5) * 0.25 * step(0.001, uCollapse) * (1.0 - fall);
        vP = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    ` : VERT_STD,
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform vec3 uColor; uniform float uRough; uniform vec3 uEmis;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        vec3 col = uColor * (1.0 - uRough + uRough * 2.0 * fbm(vP.xz * 0.45 + vP.yy * 0.23));
        vec3 c = applyFog(shade(col, N, vP), vP) + uEmis;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
}

/* (the people themselves are drawn in ink.js) */

/* ── the patch of shade a standing body leaves on the ground ── */
export function blobMaterial(gone) {
  return worldMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uGone: gone || { value: 0 } },
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform float uGone;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = 1.0 - smoothstep(0.15, 1.0, r);
        a = a * a * 0.62 * (1.0 - smoothstep(0.0, 0.7, uGone)) * (1.0 - fogAmount(vP));
        gl_FragColor = vec4(vec3(0.0), a);
      }
    `,
  });
}

/* ── a photograph from the record, printed the way the book prints them:
      sepia, warm at one edge and cold at the other, burnt at the border ─ */
export function photoMaterial(texture, { glow = 0.55, seed = 0 } = {}) {
  return worldMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uMap: { value: texture },
      uGlow: { value: glow },
      uSeed: { value: seed },
      uShow: { value: 1 },
    },
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform sampler2D uMap; uniform float uGlow, uSeed, uShow;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 t = texture2D(uMap, vUv).rgb;
        float l = dot(t, vec3(0.299, 0.587, 0.114));
        l = smoothstep(0.02, 0.96, l);
        /* duotone: brown blacks, cream whites */
        vec3 sep = mix(vec3(0.045, 0.028, 0.018), vec3(0.95, 0.86, 0.68), l);
        /* the book's wash: ember orange low, cold grey green high */
        vec3 warm = vec3(1.0, 0.56, 0.26);
        vec3 cold = vec3(0.62, 0.7, 0.66);
        float gr = smoothstep(0.0, 1.0, vUv.y * 0.8 + vUv.x * 0.25 + (nz(vUv * 40.0 + uSeed) - 0.5) * 0.2);
        sep *= mix(warm, cold, gr) * 1.15;
        /* a burnt, uneven border */
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = min(e.x, e.y);
        float n = fbm(vUv * 9.0 + uSeed * 7.0);
        float a = smoothstep(0.0, 0.085, edge - n * 0.06);
        float char = smoothstep(0.16, 0.02, edge - n * 0.08);
        sep = mix(sep, vec3(0.02, 0.012, 0.008), char * 0.85);
        /* scratches and dust from the print */
        float scratch = step(0.992, nz(vec2(vUv.x * 300.0 + uSeed * 50.0, 0.5))) * 0.25;
        sep += scratch * l;
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        vec3 lit = sep * (uSunCol * max(dot(N, uSunDir), 0.0) * sunShadow(vP, N) + mix(uGndCol, uSkyCol, 0.5)) * 0.9 + sep * uGlow;
        float f = fogAmount(vP);
        vec3 c = mix(lit, uFogCol, f * 0.85);
        gl_FragColor = vec4(c, a * uShow * (1.0 - f * 0.6));
      }
    `,
  });
}

/* ── two flags on a roof ────────────────────────────────────── */
export function flagMaterial(kind, { hung = false } = {}) {
  return worldMaterial({
    side: THREE.DoubleSide,
    uniforms: { uKind: { value: kind }, uRaise: { value: 1 }, uHung: { value: hung ? 1 : 0 } },
    vertex: /* glsl */ `
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform float uTime; uniform float uRaise; uniform float uHung;
      void main() {
        vUv = uv;
        vec3 p = position;
        /* on a pole the far end flies; pinned to a wall it only sags a little */
        float k = mix(uv.x, (1.0 - uv.y) * 0.07, uHung);
        float w = sin(uv.x * 7.0 - uTime * 4.2 + uv.y * 1.5) * 0.22 + sin(uv.x * 13.0 - uTime * 6.5) * 0.07;
        p.z += w * k;
        p.y += sin(uv.x * 5.0 - uTime * 3.1) * 0.08 * k - k * k * 0.25;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vP = wp.xyz;
        float dw = cos(uv.x * 7.0 - uTime * 4.2 + uv.y * 1.5) * 1.5 * k;
        vN = normalize(mat3(modelMatrix) * normalize(vec3(-dw, 0.0, 1.0)));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform float uKind; uniform float uHung;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      float tri(vec2 p, float r) {
        const float k = 1.7320508;
        p.x = abs(p.x) - r;
        p.y = p.y + r / k;
        if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
        p.x -= clamp(p.x, -2.0 * r, 0.0);
        return -length(p) * sign(p.y);
      }
      void main() {
        vec3 N = normalize(gl_FrontFacing ? vN : -vN);
        vec3 white = vec3(0.86, 0.84, 0.78);
        vec3 col;
        if (uKind < 0.5) {
          /* Poland: white over red */
          col = mix(vec3(0.72, 0.06, 0.07), white, step(0.5, vUv.y));
        } else {
          vec3 blue = vec3(0.05, 0.2, 0.62);
          vec2 q = (vUv - 0.5) * vec2(1.5, 1.0);
          float a = abs(tri(q, 0.2));
          float b = abs(tri(vec2(q.x, -q.y), 0.2));
          float star = 1.0 - smoothstep(0.016, 0.026, min(a, b));
          if (uKind < 1.5) {
            /* white, two blue stripes, a blue star */
            float stripes = step(abs(abs(vUv.y - 0.5) - 0.36), 0.065);
            col = mix(white, blue, max(stripes, star));
          } else {
            /* white over blue; on the ŻOB's, a star that changes colour where it crosses the line */
            float top = step(0.5, vUv.y);
            col = mix(blue, white, top);
            if (uKind > 2.5) col = mix(col, mix(white, blue, top), star);
          }
        }
        col *= 0.82 + 0.25 * nz(vUv * 60.0);
        /* cloth lets light through */
        vec3 c = shade(col, N, vP) * 0.72 + col * (uSunCol + uSkyCol) * 0.17 + col * uHung * 0.06;
        gl_FragColor = vec4(mix(c, uFogCol, fogAmount(vP) * 0.55), 1.0);
      }
    `,
  });
}

/* ── rubble: broken brick, lumps of plaster, charred wood ───── */
export function rubbleMaterial() {
  return worldMaterial({
    fragment: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 N = normalize(vN);
        /* pieces about a hand across, each its own colour, pushed out of line */
        vec2 p = vP.xz * 3.4 + vP.y * 1.9;
        p += (nz4(p * 0.6).rg - 0.5) * 1.3;
        vec2 id = floor(p);
        vec2 f = fract(p) - 0.5;
        float r = hash21(id);
        vec3 brick = mix(vec3(0.19, 0.105, 0.075), vec3(0.33, 0.19, 0.13), hash21(id + 3.1));
        vec3 mortar = vec3(0.26, 0.25, 0.23) * (0.65 + 0.6 * hash21(id + 7.7));
        vec3 col = r < 0.52 ? brick : (r < 0.86 ? mortar : vec3(0.04, 0.035, 0.03));
        col *= 0.5 + 0.5 * smoothstep(0.5, 0.28, max(abs(f.x), abs(f.y)));
        float lod = clamp(1.0 - fwidth(p.x) * 0.9, 0.0, 1.0);
        float big = 0.55 + 0.7 * fbm(vP.xz * 0.5);
        col = mix(vec3(0.185, 0.155, 0.135), col, lod) * big;
        gl_FragColor = vec4(applyFog(shade(col, N, vP), vP), 1.0);
      }
    `,
  });
}
