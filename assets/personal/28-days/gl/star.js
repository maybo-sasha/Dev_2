/* ============================================================
   The star, drawn by hand.

   Six strokes of a pen: one triangle, and another over it. No
   stroke is quite straight, the corners do not quite meet, the
   line is heavier where the hand pressed and thin where the ink
   ran out. It is drawn the same way wherever it appears: in blue
   on the white band every Jew in Warsaw was made to wear on the
   right sleeve, and in yellow on the cover.

   (In Warsaw, and in the rest of the General Government, the
   order of 23 November 1939 was for a white armband with a blue
   Star of David. The yellow cloth star was the badge in the Reich
   and in the lands joined to it. Source: United States Holocaust
   Memorial Museum, "Jewish Badge: During the Nazi Era".)
   ============================================================ */

import { BufferAttribute as THREE_BufferAttribute } from 'three';

/* p: the star, with its points on a circle of radius 1. draw: how much of it the hand has drawn
   so far, 0 to 1. seed: whose hand. Returns how much ink is at p. Needs nz() from GLSL_NOISE. */
export const GLSL_STAR = /* glsl */ `
  /* pen: how broad the nib is, where the star is 1 from middle to point */
  float handStarW(vec2 p, float draw, float seed, float pen) {
    /* the paper is not flat under the pen */
    vec2 q = p + (vec2(nz(p * 2.3 + seed), nz(p * 2.3 + seed + 31.7)) - 0.5) * 0.11;
    float ink = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float part = clamp(draw * 6.0 - fi, 0.0, 1.0);
      if (part <= 0.0) continue;
      float tri = step(2.5, fi);
      float k = fi - tri * 3.0;
      float a0 = 1.5708 + tri * 3.14159 + k * 2.0944;
      float a1 = a0 + 2.0944;
      float j = fract(sin(fi * 12.9898 + seed * 3.1) * 43758.5453);
      vec2 A = vec2(cos(a0), sin(a0)) * (1.0 + (j - 0.5) * 0.1);
      vec2 B = vec2(cos(a1), sin(a1)) * (1.0 + (fract(j * 7.3) - 0.5) * 0.1);
      /* a hand runs past the corner before it stops */
      vec2 d = normalize(B - A);
      A -= d * (0.03 + 0.08 * j); B += d * (0.02 + 0.09 * fract(j * 3.7));
      vec2 E = mix(A, B, part);
      vec2 pa = q - A, ba = E - A;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
      float dd = length(pa - ba * h);
      float hh = h * part;
      /* the pen presses, lifts, and presses again */
      float w = pen * (0.62 + 0.7 * nz(vec2(hh * 4.0 + fi * 5.0, seed * 9.0))) * (0.7 + 0.3 * smoothstep(0.0, 0.08, hh));
      float s = smoothstep(w, w * 0.55, dd);
      /* and here and there the ink ran thin */
      s *= 0.68 + 0.32 * smoothstep(0.22, 0.6, nz(q * 9.0 + fi * 3.0 + seed));
      ink = max(ink, s);
    }
    return ink;
  }
  float handStar(vec2 p, float draw, float seed) { return handStarW(p, draw, seed, 0.062); }
`;

/* Where a point of a band round an arm is, measured on the cloth: for drawing the star on it.
   geo: the band, a tube. mid: its middle. axis: along the arm. face: the way the star looks out.
   r: the band's radius. Writes aStar: across the cloth, along it, and how squarely it faces out. */
export function starOnBand(geo, mid, axis, face, r) {
  const P = geo.attributes.position;
  const out = new Float32Array(P.count * 3);
  const ax = axis.clone().normalize();
  const f = face.clone().addScaledVector(ax, -face.dot(ax)).normalize();
  const t = ax.clone().cross(f);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) - mid.x, y = P.getY(i) - mid.y, z = P.getZ(i) - mid.z;
    const along = x * ax.x + y * ax.y + z * ax.z;
    const rx = x - ax.x * along, ry = y - ax.y * along, rz = z - ax.z * along;
    const cf = rx * f.x + ry * f.y + rz * f.z, ct = rx * t.x + ry * t.y + rz * t.z;
    const ang = Math.atan2(ct, cf);
    out[i * 3] = ang * r; out[i * 3 + 1] = along; out[i * 3 + 2] = Math.cos(ang);
  }
  geo.setAttribute('aStar', new THREE_BufferAttribute(out, 3));
  return geo;
}


/* no star here: for every part of a figure that is not the band */
export function noStar(geo) {
  const n = geo.attributes.position.count;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) out[i * 3 + 2] = -2;
  geo.setAttribute('aStar', new THREE_BufferAttribute(out, 3));
  return geo;
}

/* the radius of the star on a band, in metres */
export const BAND_STAR = 0.031;
