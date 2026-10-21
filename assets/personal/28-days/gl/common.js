/* ============================================================
   What every surface in the world shares.

   One set of uniforms describes the hour: where the light comes
   from, what colour the air is, how thick it is, which fires are
   near. Every material reads the same set, so changing the hour
   changes the whole street at once.
   ============================================================ */

import * as THREE from 'three';

export const MAX_LIGHTS = 8;

/* A small tiled noise texture. Four independent channels, so one fetch
   gives four random values and fbm costs a handful of fetches. */
function makeNoise(size = 256) {
  const data = new Uint8Array(size * size * 4);
  let s = 1234567;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < data.length; i++) data[i] = Math.floor(rnd() * 256);
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

export const noiseTex = makeNoise();

/* The hour. main.js writes into these every frame. */
export const world = {
  uTime: { value: 0 },
  uNoise: { value: noiseTex },
  uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.4).normalize() },
  uSunCol: { value: new THREE.Color(0.6, 0.55, 0.5) },
  uSkyCol: { value: new THREE.Color(0.3, 0.3, 0.32) },
  uGndCol: { value: new THREE.Color(0.08, 0.07, 0.06) },
  uFogCol: { value: new THREE.Color(0.2, 0.2, 0.2) },
  uFogDen: { value: 0.012 },
  uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, -999, 0, 0)) },
  uLightCols: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Color(0, 0, 0)) },
  uLit: { value: 0.2 },        // share of windows with a lamp behind them
  uWet: { value: 0.5 },        // how much the cobbles shine
  uHoles: { value: Array.from({ length: 5 }, () => new THREE.Vector4(0, 0, 0, 0)) }, // x0, z0, x1, z1
  uShadowMap: { value: null },                 // the street as the sun sees it
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowOn: { value: 0 },
  uPx: { value: 0.001 },                       // the size of one pixel, a metre away
  uDpr: { value: 1 },
  uWalker: { value: new THREE.Vector3(0, -999, 0) },   // where the one who walks is standing: people step aside for him
};

/* Shared GLSL. */
export const GLSL_NOISE = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime;
  float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
  /* The texture is plain random texels. Easing the coordinate between texel
     centres turns the card's linear blend into a smooth one, with no diamonds. */
  vec4 nz4(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return texture2D(uNoise, (i + f + 0.5) / 256.0);
  }
  float nz(vec2 p) { return nz4(p).r; }
  float fbm(vec2 p) {
    float a = 0.5 * nz4(p * 4.0).r;
    a += 0.25 * nz4(p * 8.26 + 37.3).g;
    a += 0.125 * nz4(p * 17.07 + 71.7).b;
    a += 0.0625 * nz4(p * 36.57 + 13.1).a;
    return a / 0.9375;
  }
`;

export const GLSL_LIGHT = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform vec3 uSkyCol;
  uniform vec3 uGndCol;
  uniform vec3 uFogCol;
  uniform float uFogDen;
  uniform vec4 uLights[${MAX_LIGHTS}];
  uniform vec3 uLightCols[${MAX_LIGHTS}];
  uniform highp sampler2D uShadowMap;
  uniform mat4 uShadowMat;
  uniform float uShadowOn;

  /* 1 in the sun, 0 in the shadow of a house, a figure, a wall */
  float sunShadow(vec3 P, vec3 N) {
    if (uShadowOn < 0.01) return 1.0;
    vec4 sc = uShadowMat * vec4(P + N * 0.07, 1.0);
    vec3 s = sc.xyz * 0.5 + 0.5;
    if (s.x < 0.002 || s.x > 0.998 || s.y < 0.002 || s.y > 0.998 || s.z > 1.0) return 1.0;
    float r = fract(sin(dot(P.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
    mat2 rot = mat2(cos(r), -sin(r), sin(r), cos(r));
    float lit = 0.0;
    lit += step(s.z - 0.0007, texture2D(uShadowMap, s.xy).r);
    lit += step(s.z - 0.0007, texture2D(uShadowMap, s.xy + rot * vec2(0.00085, 0.0003)).r);
    lit += step(s.z - 0.0007, texture2D(uShadowMap, s.xy + rot * vec2(-0.0006, 0.0007)).r);
    lit += step(s.z - 0.0007, texture2D(uShadowMap, s.xy + rot * vec2(-0.0003, -0.0009)).r);
    lit += step(s.z - 0.0007, texture2D(uShadowMap, s.xy + rot * vec2(0.0007, -0.0006)).r);
    return mix(1.0, lit * 0.2, uShadowOn);
  }

  vec3 lampLight(vec3 N, vec3 P) {
    vec3 sum = vec3(0.0);
    for (int i = 0; i < ${MAX_LIGHTS}; i++) {
      vec3 L = uLights[i].xyz - P;
      float d2 = dot(L, L);
      float att = uLights[i].w / (1.0 + d2 * 0.035);
      float nl = max(dot(N, L * inversesqrt(d2 + 0.0001)), 0.0) * 0.75 + 0.25;
      sum += uLightCols[i] * att * nl;
    }
    return sum;
  }

  vec3 shade(vec3 albedo, vec3 N, vec3 P) {
    float ndl = max(dot(N, uSunDir), 0.0);
    float hemi = N.y * 0.5 + 0.5;
    vec3 light = uSunCol * ndl * sunShadow(P, N) + mix(uGndCol, uSkyCol, hemi);
    return albedo * (light + lampLight(N, P));
  }

  /* Distance fog that thins with height, so roofs stand out of the murk. */
  vec3 applyFog(vec3 c, vec3 P) {
    float d = distance(P, cameraPosition);
    float h = exp(-max(P.y, 0.0) * 0.03);
    float f = 1.0 - exp(-pow(d * uFogDen * (0.55 + 0.45 * h), 1.35));
    return mix(c, uFogCol, clamp(f, 0.0, 1.0));
  }
  float fogAmount(vec3 P) {
    float d = distance(P, cameraPosition);
    float h = exp(-max(P.y, 0.0) * 0.03);
    return clamp(1.0 - exp(-pow(d * uFogDen * (0.55 + 0.45 * h), 1.35)), 0.0, 1.0);
  }
`;

/* A vertex shader most solid things can use: world position, world normal,
   uv, and instancing when the mesh is instanced. */
export const VERT_STD = /* glsl */ `
  varying vec3 vP;
  varying vec3 vN;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    #ifdef USE_INSTANCING
      mat4 m = modelMatrix * instanceMatrix;
    #else
      mat4 m = modelMatrix;
    #endif
    vec4 wp = m * vec4(position, 1.0);
    vP = wp.xyz;
    vN = normalize(mat3(m) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/* Build a ShaderMaterial that shares the hour. */
export function worldMaterial({ vertex = VERT_STD, fragment, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { ...world, ...uniforms },
    ...rest,
  });
}

/* Deterministic random, so the street is the same street every visit. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/* What must be drawn for the grade to print a given tone. The last pass lays a film curve over
   everything, so a colour chosen by eye has to be walked back through it. d: 0 to 1, as on the screen. */
export const toScene = (d) => {
  const y = Math.pow(Math.min(d, 0.972), 2.2);
  const a = 2.51 - 2.43 * y, b = 0.03 - 0.59 * y, c = -0.14 * y;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a) / 1.05;
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (t) => t * t * (3 - 2 * t);
export const sstep = (a, b, v) => smooth(clamp((v - a) / (b - a)));
