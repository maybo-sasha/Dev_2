/* ============================================================
   The print, and the lens.

   The street is a reconstruction. The passes after it make it a
   film, and print the film the way the book prints its photographs.

   First the lens: what the camera is focused on is sharp and what is
   nearer or further goes soft, as through a real lens; very bright
   things smear sideways into a streak and burn a red halo into the
   film around them, the way they do on film shot through an
   anamorphic lens.

   Then the print: a sepia image with ember light coming in from one
   side and cold from the other, with the dust and the faint upright
   lines of an old print. Fire, and the colours of a flag, and the
   lilac of the people, are the only things let through in colour.

   The same pass holds a real photograph over the scene at the head
   of each chapter, framed, until you step into it; then it burns
   away from where you touched it, and every part of the walk starts
   from the record and steps into the reconstruction.
   ============================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { noiseTex } from './common.js';

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* ── the shade things throw on each other ─────────────────────
   Where two surfaces meet, where a figure stands on the ground, under a balcony, in the corner of
   a room, less of the sky reaches: it is darker there, and it is that darkness which seats a thing
   in its place. It is worked out from the depth of the picture alone: for every point, how much of
   what is near it stands above its own surface. Done at half size, smoothed without crossing an
   edge, then laid over the picture. */
class ShadePass extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
    const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, depthBuffer: false });
    this.rtA = rt(); this.rtB = rt();
    this.size = new THREE.Vector2(1, 1);
    const head = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D tDepth;
      uniform float uNear, uFar;
      float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
    `;
    this.shade = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { tDepth: { value: null }, uNear: { value: 0.1 }, uFar: { value: 600 }, uProj: { value: new THREE.Vector2(1, 1) }, uPx: { value: new THREE.Vector2() }, uRadius: { value: 0.75 } },
      vertexShader: QUAD_VERT,
      fragmentShader: /* glsl */ `
        ${head}
        uniform vec2 uProj, uPx;
        uniform float uRadius;
        vec3 at(vec2 uv) { float z = lin(texture2D(tDepth, uv).r); return vec3((uv * 2.0 - 1.0) * uProj * z, -z); }
        float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          vec3 P = at(vUv);
          float z = -P.z;
          if (z > 170.0) { gl_FragColor = vec4(1.0); return; }
          /* the way the surface faces, from its neighbours: on each axis, the neighbour that is on the same surface */
          vec3 Pr = at(vUv + vec2(uPx.x, 0.0)), Pl = at(vUv - vec2(uPx.x, 0.0)), Pu = at(vUv + vec2(0.0, uPx.y)), Pd = at(vUv - vec2(0.0, uPx.y));
          vec3 dx = abs(Pr.z - P.z) < abs(P.z - Pl.z) ? Pr - P : P - Pl;
          vec3 dy = abs(Pu.z - P.z) < abs(P.z - Pd.z) ? Pu - P : P - Pd;
          vec3 N = normalize(cross(dx, dy));
          vec2 reach = min(uRadius / z / (2.0 * uProj), vec2(0.09));
          float rot = hash(gl_FragCoord.xy) * 6.2832;
          float sum = 0.0;
          const int N_S = 12;
          for (int i = 0; i < N_S; i++) {
            float fi = (float(i) + 0.5) / float(N_S);
            float a = rot + fi * 15.08;
            vec3 v = at(vUv + vec2(cos(a), sin(a)) * sqrt(fi) * reach) - P;
            float d2 = dot(v, v);
            sum += max(dot(v, N) - 0.012 - z * 0.0018, 0.0) / (d2 + 0.012) * max(0.0, 1.0 - d2 / (uRadius * uRadius * 1.7));
          }
          float ao = clamp(1.0 - sum * 0.62 / float(N_S), 0.0, 1.0);
          /* far off it is not seen, and should not be */
          gl_FragColor = vec4(vec3(mix(ao, 1.0, smoothstep(45.0, 150.0, z))), 1.0);
        }
      `,
    });
    this.smooth = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { tDepth: { value: null }, tShade: { value: null }, uNear: { value: 0.1 }, uFar: { value: 600 }, uStep: { value: new THREE.Vector2() } },
      vertexShader: QUAD_VERT,
      fragmentShader: /* glsl */ `
        ${head}
        uniform sampler2D tShade;
        uniform vec2 uStep;
        void main() {
          float z0 = lin(texture2D(tDepth, vUv).r);
          float acc = 0.0, w = 0.0;
          for (int i = -3; i <= 3; i++) {
            vec2 uv = vUv + uStep * float(i);
            float z = lin(texture2D(tDepth, uv).r);
            /* not across an edge: what is at another depth is another thing */
            float k = exp(-float(i * i) / 6.0) * max(0.0, 1.0 - abs(z - z0) / (0.05 * z0 + 0.08));
            acc += texture2D(tShade, uv).r * k; w += k;
          }
          gl_FragColor = vec4(vec3(w > 0.0 ? acc / w : 1.0), 1.0);
        }
      `,
    });
    /* laid over the picture: the picture is multiplied by it */
    this.lay = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
      uniforms: { tShade: { value: null }, uAmount: { value: 1 } },
      vertexShader: QUAD_VERT,
      fragmentShader: 'precision highp float; varying vec2 vUv; uniform sampler2D tShade; uniform float uAmount; void main() { float a = texture2D(tShade, vUv).r; gl_FragColor = vec4(vec3(mix(1.0, a * a * (3.0 - 2.0 * a), uAmount)), 1.0); }',
    });
    this.q1 = new FullScreenQuad(this.shade); this.q2 = new FullScreenQuad(this.smooth); this.q3 = new FullScreenQuad(this.lay);
  }
  setSize(w, h) {
    const hw = Math.max(1, Math.round(w / 2)), hh = Math.max(1, Math.round(h / 2));
    this.rtA.setSize(hw, hh); this.rtB.setSize(hw, hh);
    this.size.set(hw, hh);
  }
  /* cam: the camera the picture was taken with */
  lens(cam) {
    const t = Math.tan(cam.fov * Math.PI / 360);
    this.shade.uniforms.uProj.value.set(t * cam.aspect, t);
    for (const m of [this.shade, this.smooth]) { m.uniforms.uNear.value = cam.near; m.uniforms.uFar.value = cam.far; }
  }
  render(renderer, writeBuffer, readBuffer) {
    const depth = readBuffer.depthTexture;
    this.shade.uniforms.tDepth.value = depth;
    this.shade.uniforms.uPx.value.set(1 / this.size.x, 1 / this.size.y);
    renderer.setRenderTarget(this.rtA); this.q1.render(renderer);
    this.smooth.uniforms.tDepth.value = depth;
    this.smooth.uniforms.tShade.value = this.rtA.texture; this.smooth.uniforms.uStep.value.set(1.4 / this.size.x, 0);
    renderer.setRenderTarget(this.rtB); this.q2.render(renderer);
    this.smooth.uniforms.tShade.value = this.rtB.texture; this.smooth.uniforms.uStep.value.set(0, 1.4 / this.size.y);
    renderer.setRenderTarget(this.rtA); this.q2.render(renderer);
    this.lay.uniforms.tShade.value = this.rtA.texture;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(readBuffer); this.q3.render(renderer);
    renderer.autoClear = auto;
  }
  dispose() { this.rtA.dispose(); this.rtB.dispose(); this.shade.dispose(); this.smooth.dispose(); this.lay.dispose(); }
}

/* ── the lens: depth of field ─────────────────────────────────
   For each pixel, gather from a disc of its neighbours. A neighbour
   counts if its own blur is wide enough to reach this far. One that
   lies behind a sharp thing may not spill over it. */
class FocusPass extends Pass {
  constructor() {
    super();
    this.uniforms = {
      tDiffuse: { value: null }, tDepth: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.1 }, uFar: { value: 600 },
      uFocus: { value: 10 }, uAperture: { value: 0.3 }, uMaxR: { value: 8 },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: QUAD_VERT,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tDiffuse, tDepth;
        uniform vec2 uRes;
        uniform float uNear, uFar, uFocus, uAperture, uMaxR;
        float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
        /* how wide a point at distance z is spread, in pixels */
        /* as a lens does: by how far the point is from the focus, in dioptres */
        float coc(float z) { return min(uMaxR, uAperture * uMaxR * 2.8 * abs(1.0 / max(z, 0.05) - 1.0 / uFocus)) * smoothstep(0.75, 1.7, z); }
        void main() {
          float z0 = lin(texture2D(tDepth, vUv).r);
          float c0 = coc(z0);
          vec3 base = texture2D(tDiffuse, vUv).rgb;
          if (uMaxR * uAperture < 0.35) { gl_FragColor = vec4(base, 1.0); return; }
          vec3 acc = base; float wsum = 1.0;
          vec2 px = 1.0 / uRes;
          const int N = 28;
          for (int i = 0; i < N; i++) {
            float fi = float(i) + 0.5;
            float r = sqrt(fi / float(N)) * uMaxR;
            float a = fi * 2.39996323;
            vec2 uv = vUv + vec2(cos(a), sin(a)) * r * px;
            float zs = lin(texture2D(tDepth, uv).r);
            float cs = coc(zs);
            /* behind this pixel, a neighbour may only spread as far as this pixel is blurred */
            float reach = zs > z0 ? min(cs, c0) : cs;
            float w = smoothstep(r - 1.2, r + 0.4, reach);
            acc += texture2D(tDiffuse, uv).rgb * w;
            wsum += w;
          }
          gl_FragColor = vec4(acc / wsum, 1.0);
        }
      `,
    });
    this.fsQuad = new FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.tDepth.value = readBuffer.depthTexture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.fsQuad.render(renderer);
  }
  dispose() { this.material.dispose(); this.fsQuad.dispose(); }
}

/* ── the lens: a streak and a halo from what is very bright ─── */
class LensPass extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
    const rt = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.rtDown = rt(); this.rtTmp = rt(); this.rtStreak = rt(); this.rtHalo = rt();
    this.down = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uPx: { value: new THREE.Vector2() }, uKnee: { value: 1.35 } },
      vertexShader: QUAD_VERT,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uPx; uniform float uKnee;
        void main() {
          vec3 c = texture2D(tDiffuse, vUv + uPx * vec2(-1.0, -1.0)).rgb + texture2D(tDiffuse, vUv + uPx * vec2(1.0, -1.0)).rgb
                 + texture2D(tDiffuse, vUv + uPx * vec2(-1.0, 1.0)).rgb + texture2D(tDiffuse, vUv + uPx * vec2(1.0, 1.0)).rgb;
          c *= 0.25;
          float l = max(c.r, max(c.g, c.b));
          /* only what is brighter than white */
          gl_FragColor = vec4(c * smoothstep(uKnee, uKnee * 2.2, l), 1.0);
        }
      `,
    });
    this.blur = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uStep: { value: new THREE.Vector2() } },
      vertexShader: QUAD_VERT,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uStep;
        void main() {
          vec3 acc = vec3(0.0); float w = 0.0;
          for (int i = -7; i <= 7; i++) {
            float k = exp(-float(i * i) / 22.0);
            acc += texture2D(tDiffuse, vUv + uStep * float(i)).rgb * k;
            w += k;
          }
          gl_FragColor = vec4(acc / w, 1.0);
        }
      `,
    });
    this.fsDown = new FullScreenQuad(this.down);
    this.fsBlur = new FullScreenQuad(this.blur);
    this.size = new THREE.Vector2(1, 1);
  }
  setSize(w, h) {
    const qw = Math.max(1, Math.round(w / 4)), qh = Math.max(1, Math.round(h / 4));
    for (const r of [this.rtDown, this.rtTmp, this.rtStreak, this.rtHalo]) r.setSize(qw, qh);
    this.size.set(qw, qh);
  }
  pass(renderer, src, dst, sx, sy) {
    this.blur.uniforms.tDiffuse.value = src.texture;
    this.blur.uniforms.uStep.value.set(sx / this.size.x, sy / this.size.y);
    renderer.setRenderTarget(dst);
    this.fsBlur.render(renderer);
  }
  render(renderer, writeBuffer, readBuffer) {
    this.down.uniforms.tDiffuse.value = readBuffer.texture;
    this.down.uniforms.uPx.value.set(1 / (this.size.x * 4), 1 / (this.size.y * 4));
    renderer.setRenderTarget(this.rtDown);
    this.fsDown.render(renderer);
    /* the streak: sideways only, wider each time */
    this.pass(renderer, this.rtDown, this.rtTmp, 1.6, 0);
    this.pass(renderer, this.rtTmp, this.rtStreak, 6.0, 0);
    this.pass(renderer, this.rtStreak, this.rtTmp, 18.0, 0);
    this.pass(renderer, this.rtTmp, this.rtStreak, 3.0, 0);
    /* the halo: a little way round, in every direction */
    this.pass(renderer, this.rtDown, this.rtTmp, 1.4, 0);
    this.pass(renderer, this.rtTmp, this.rtHalo, 0, 1.4);
  }
}

const Final = {
  uniforms: {
    tDiffuse: { value: null },
    tPlate: { value: null },
    tStreak: { value: null },
    tHalo: { value: null },
    uNoise: { value: noiseTex },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uExposure: { value: 1 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0.8 },
    uHaze: { value: 0 },
    uWash: { value: 0.5 },
    uSepia: { value: 0.7 },
    uSoft: { value: 1 },
    uSharp: { value: 0.45 },
    uFlash: { value: 0 },
    uFlashCol: { value: new THREE.Vector3(1.0, 0.92, 0.78) },
    uFade: { value: 0 },
    uScratch: { value: 0.5 },
    uWeave: { value: new THREE.Vector2(0, 0) },
    uFlicker: { value: 1 },
    uStreak: { value: 0.35 },
    uHalo: { value: 0.3 },
    /* the photograph: where it is framed on the screen, how far it has burnt, from where */
    uPlate: { value: 0 },
    uPlateFade: { value: 0 },
    uPlateDim: { value: 0 },
    uPlateSeed: { value: 0 },
    uPlateRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uPlateOrigin: { value: new THREE.Vector2(0.5, 0.5) },
    uPlateLine: { value: 1 },
    /* a blast: where on the screen, how far its ring has spread, how hard it bends the picture */
    uShock: { value: new THREE.Vector4(0.5, 0.5, 0, 0) },
    /* the sun: where it is on the screen, and how strongly it throws shafts past what stands before it */
    uRays: { value: new THREE.Vector3(0.5, 0.5, 0) },
    uChroma: { value: 0 },
  },
  vertexShader: QUAD_VERT,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tDiffuse, tPlate, tStreak, tHalo, uNoise;
    uniform vec2 uRes, uWeave, uPlateOrigin;
    uniform vec3 uFlashCol;
    uniform vec4 uPlateRect;
    uniform float uTime, uExposure, uGrain, uVignette, uHaze, uWash, uSepia, uSoft, uSharp, uFlash, uFade, uScratch, uFlicker, uStreak, uHalo;
    uniform float uPlate, uPlateFade, uPlateDim, uPlateSeed, uPlateLine, uChroma;
    uniform vec4 uShock;
    uniform vec3 uRays;

    float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    float nz(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return texture2D(uNoise, (i + f + 0.5) / 256.0).r; }

    /* the tones of a sepia print: brown blacks, a warm middle, cream whites */
    vec3 sepia(float l) {
      vec3 c = mix(vec3(0.022, 0.016, 0.013), vec3(0.4, 0.29, 0.2), smoothstep(0.0, 0.46, l));
      return mix(c, vec3(0.98, 0.91, 0.77), smoothstep(0.3, 1.0, l));
    }

    void main() {
      vec2 uv = vUv + uWeave;
      vec2 px = 1.0 / uRes;

      /* heat rising off the fires */
      float hz = texture2D(uNoise, uv * vec2(1.3, 2.6) + vec2(0.0, -uTime * 0.3)).r - 0.5;
      float hz2 = texture2D(uNoise, uv * vec2(3.1, 5.0) + vec2(0.3, -uTime * 0.55)).g - 0.5;
      uv += vec2(hz + hz2 * 0.5, hz2) * 0.003 * uHaze * smoothstep(1.0, 0.15, uv.y);

      /* a blast: the air itself is thrown outward, and the picture bends where the ring of it passes */
      if (uShock.w > 0.0004) {
        vec2 asp = vec2(uRes.x / uRes.y, 1.0);
        vec2 dv = (uv - uShock.xy) * asp;
        float dl = max(length(dv), 1e-4);
        float ring = exp(-pow((dl - uShock.z) / (0.07 + 0.05 * uShock.z), 2.0));
        uv -= dv / dl / asp * ring * uShock.w;
      }

      /* sharp in the middle, soft and drawn outwards at the edges */
      vec2 rc = uv - 0.5;
      float soft = smoothstep(0.1, 0.52, dot(rc, rc) * 1.25) * uSoft * (1.0 - uPlateFade);
      vec3 c = texture2D(tDiffuse, uv).rgb;
      vec3 nb = (texture2D(tDiffuse, uv + vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(px.x, 0.0)).rgb
               + texture2D(tDiffuse, uv + vec2(0.0, px.y)).rgb + texture2D(tDiffuse, uv - vec2(0.0, px.y)).rgb) * 0.25;
      c += clamp(c - nb, -0.3, 0.3) * uSharp * (1.0 - soft);
      // Illustrated scene treatment, before documentary-photo compositing.
      // Relative contrast keeps fog quiet; bounded ink avoids crushed silhouettes.
      vec2 inkStep = px * clamp(uRes.y / 900.0, 1.0, 2.0);
      vec3 inkL = texture2D(tDiffuse, uv - vec2(inkStep.x, 0.0)).rgb;
      vec3 inkR = texture2D(tDiffuse, uv + vec2(inkStep.x, 0.0)).rgb;
      vec3 inkU = texture2D(tDiffuse, uv + vec2(0.0, inkStep.y)).rgb;
      vec3 inkD = texture2D(tDiffuse, uv - vec2(0.0, inkStep.y)).rgb;
      vec3 luminance = vec3(.299,.587,.114);
      float sceneL = max(dot(c,luminance),.025);
      float contour = length(vec2(dot(inkR-inkL,luminance),dot(inkU-inkD,luminance))) / (.14+sceneL);
      float ink = smoothstep(.22,.85,contour);
      c = mix(c,c*vec3(.42,.36,.29),ink*.5);
      // Soft-edged tonal bands retain HDR fire while simplifying painted surfaces.
      float tone = dot(c,luminance);
      float compressed = tone/(1.0+tone);
      float levels = compressed*7.0;
      float band = (floor(levels)+smoothstep(.35,.65,fract(levels)))/7.0;
      float painted = band/max(1.0-band,.05);
      c *= mix(1.0,painted/max(tone,.001),.32*smoothstep(.025,.12,tone));
      if (soft > 0.002) {
        vec3 acc = c;
        for (int i = 1; i <= 5; i++) acc += texture2D(tDiffuse, uv - rc * (float(i) * 0.0048 * soft)).rgb;
        c = acc / 6.0;
        /* the colours part company a little out there */
        c.r = mix(c.r, texture2D(tDiffuse, uv - rc * 0.006 * soft).r, 0.6);
        c.b = mix(c.b, texture2D(tDiffuse, uv + rc * 0.004 * soft).b, 0.6);
      }

      if (uChroma > 0.002) {
        c.r = mix(c.r, texture2D(tDiffuse, uv - rc * 0.022 * uChroma).r, 0.85);
        c.b = mix(c.b, texture2D(tDiffuse, uv + rc * 0.016 * uChroma).b, 0.85);
      }

      /* the sun's shafts: walk from here toward the sun, and gather the light that is not blocked on the way */
      if (uRays.z > 0.003) {
        vec2 stepv = (uRays.xy - uv) / 28.0 * 0.92;
        vec2 q = uv + stepv * hash(vUv * uRes);
        vec3 acc = vec3(0.0);
        float w = 1.0;
        for (int i = 0; i < 28; i++) {
          vec3 s = texture2D(tDiffuse, q).rgb;
          acc += min(max(s - 0.8, 0.0), vec3(2.5)) * w;
          w *= 0.955;
          q += stepv;
        }
        c += acc * uRays.z * 0.03;
      }

      /* what the lens does with what is brighter than white */
      c += texture2D(tStreak, uv).rgb * vec3(1.0, 0.62, 0.34) * uStreak;
      c += texture2D(tHalo, uv).rgb * vec3(1.0, 0.3, 0.1) * uHalo;

      c = aces(c * uExposure * uFlicker);

      /* the record: a photograph framed over the scene, burning away from where you stepped in */
      float keep = 0.0, ember = 0.0;
      if (uPlateFade > 0.001) {
        vec2 pr = (vUv - uPlateRect.xy) / (uPlateRect.zw - uPlateRect.xy);
        float inside = step(0.0, pr.x) * step(pr.x, 1.0) * step(0.0, pr.y) * step(pr.y, 1.0);
        vec3 ph = texture2D(tPlate, clamp(pr, 0.0, 1.0)).rgb;
        float sa = uRes.x / uRes.y;
        vec2 bq = vUv * vec2(sa, 1.0);
        /* how late each part catches: 0 first, 1 last */
        float n = (nz(bq * 3.2 + uPlateSeed) * 0.55 + nz(bq * 11.0 + uPlateSeed * 3.0) * 0.2
                + length((vUv - uPlateOrigin) * vec2(sa, 1.0)) * 0.42) / 1.2;
        float q = uPlate * 1.3 - 0.12;
        float alive = smoothstep(q - 0.01, q + 0.01, n);
        keep = alive * inside * uPlateFade;
        /* a thin bright line where it is burning, as paper burns, and black just behind it */
        ember = (1.0 - smoothstep(0.0, 0.006, abs(n - q))) * step(0.004, uPlate) * step(uPlate, 0.996) * uPlateFade * inside;
        float char = (1.0 - smoothstep(0.0, 0.05, n - q)) * step(0.004, uPlate) * keep;
        ph = mix(ph, ph * 0.06, char * 0.9);
        /* while it is being read, the street waits behind it, dark */
        float l0 = dot(c, vec3(0.3, 0.59, 0.11));
        c = mix(c, vec3(l0) * 0.13, uPlateDim * (1.0 - keep));
        c = mix(c, ph, keep);
        /* a thin rule round the print */
        vec2 o = (vUv - clamp(vUv, uPlateRect.xy, uPlateRect.zw)) * uRes;
        float rule = (1.0 - smoothstep(1.0, 1.8, length(o))) * step(0.5, length(o)) * uPlateLine * uPlateFade * (1.0 - step(0.004, uPlate));
        c = mix(c, vec3(0.55, 0.51, 0.45), rule * 0.8);
      }

      float l = dot(c, vec3(0.299, 0.587, 0.114));

      /* print it in sepia. Flame and the colours of a flag come through. */
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      float chroma = (mx - mn) / max(mx, 0.001);
      /* what keeps its colour: flame, because it is bright, and the blue and the red of a flag */
      float blue = smoothstep(0.0, 0.1, c.b - c.r);
      float red = (1.0 - smoothstep(0.14, 0.3, c.g / max(c.r, 0.001))) * step(c.b, c.r * 0.5);
      float vivid = smoothstep(0.5, 0.86, chroma) * max(smoothstep(0.42, 0.78, mx), max(blue, red) * smoothstep(0.08, 0.25, mx));
      /* and the lilac of the book's drawings: the people are drawn, the city is printed. Lilac is
         a blue with red in it, which no sky and no smoke here is. */
      float lilac = smoothstep(0.015, 0.06, (c.b - c.r) / max(l, 0.02)) * smoothstep(-0.01, 0.035, (c.r - c.g) / max(l, 0.02));
      vivid = max(vivid, lilac * 0.66);
      float amount = mix(uSepia, 1.0, keep);
      c = mix(c, sepia(pow(l, 0.94)), amount * (1.0 - vivid * (1.0 - keep)));

      /* the book's wash: ember light from the lower left, cold from the upper right */
      float gr = smoothstep(0.0, 1.0, dot(vUv - 0.5, vec2(0.52, 0.72)) + 0.5 + (nz(vUv * 2.6 + 9.0) - 0.5) * 0.3);
      vec3 tint = mix(vec3(1.12, 0.66, 0.36), vec3(0.66, 0.76, 0.78), gr);
      c *= mix(vec3(1.0), tint * 1.16, uWash * (1.0 - smoothstep(0.5, 1.0, l)) * (0.75 + 0.25 * keep) * (1.0 - uPlateDim * 0.8));

      /* the print of the reference sheets: deep browns and warm paper, and nothing grey between them.
         A curve that takes the darks down and the lights up, a little more of each colour, and warmth. */
      {
        float punch = 0.78 * (1.0 - keep * 0.7);
        vec3 s3 = clamp(c, 0.0, 1.0);
        c = mix(c, s3 * s3 * (3.0 - 2.0 * s3), punch);
        float lp = dot(c, vec3(0.299, 0.587, 0.114));
        c = max(mix(vec3(lp), c, 1.0 + 0.2 * punch), 0.0);
        c *= mix(vec3(1.0), vec3(1.07, 0.985, 0.88), punch * 0.8);
      }

      /* the burning edge of the photograph */
      c += vec3(1.0, 0.46, 0.1) * ember * 1.1;

      /* what an old print carries: dust that stays put, and faint upright lines */
      vec2 cell = vUv * vec2(9.0, 6.0) * vec2(uRes.x / uRes.y / 1.5, 1.0);
      vec2 id = floor(cell);
      vec2 sp = fract(cell) - (0.25 + 0.5 * vec2(hash(id + 3.1), hash(id + 7.7)));
      float speck = (1.0 - smoothstep(0.0, 1.0, length(sp * uRes.y / 6.0) / (1.0 + 2.6 * hash(id + 1.3)))) * step(0.72, hash(id + 5.5));
      float lines = 0.0;
      for (int i = 0; i < 3; i++) {
        float lx = 0.19 + float(i) * 0.287 + 0.03 * sin(float(i) * 4.1);
        lines += 1.0 - smoothstep(0.0, 1.2, abs(vUv.x - lx) * uRes.x);
      }
      c *= 1.0 - (speck * 0.3 + lines * 0.05) * uScratch;
      /* and on film that is running, a scratch or a speck now and then */
      float tick = floor(uTime * 14.0);
      float sx = hash(vec2(tick, 3.0));
      float scratch = (1.0 - smoothstep(0.0, 1.0, abs(vUv.x - sx) * uRes.x)) * step(0.86, hash(vec2(tick, 9.0)));
      vec2 fs = vec2(hash(vec2(tick, 5.0)), hash(vec2(tick, 7.0)));
      float fleck = (1.0 - smoothstep(0.0, 1.0, length((vUv - fs) * uRes) / 3.0)) * step(0.72, hash(vec2(tick, 11.0)));
      c += (scratch * 0.08 - fleck * 0.3) * uScratch;

      vec2 d = (vUv - 0.5) * vec2(1.0, 0.92);
      c *= 1.0 - uVignette * smoothstep(0.3, 1.0, length(d) * 1.32) * (1.0 - uPlateDim * 0.6);

      c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0));
      c *= 1.0 - clamp(uFade, 0.0, 1.0);
      c = pow(max(c, 0.0), vec3(1.0 / 2.2));
      /* grain: fine, and finer in the lights */
      float g = hash(vUv * uRes + fract(uTime * 7.0) * 311.0) - 0.5;
      c += g * uGrain * (0.5 + 0.5 * (1.0 - l)) * .45;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

export function buildPost(renderer, scene, camera, { focus = true } = {}) {
  /* four samples a pixel, so roof lines and railings are clean, and the depth kept for the lens */
  const target = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 4 });
  target.depthTexture = new THREE.DepthTexture(256, 256, THREE.UnsignedIntType);
  const composer = new EffectComposer(renderer, target);
  const render = new RenderPass(scene, camera);
  composer.addPass(render);
  const shade = new ShadePass();
  shade.enabled = focus;
  composer.addPass(shade);
  // Depth-reprojected camera motion, capped to a few pixels. No history buffer:
  // stopping is immediately sharp and cuts cannot leave ghost silhouettes.
  const motion = new ShaderPass({
    uniforms: { tDiffuse:{value:null}, tDepth:{value:target.depthTexture}, inverseVP:{value:new THREE.Matrix4()}, previousVP:{value:new THREE.Matrix4()}, strength:{value:0}, pixel:{value:new THREE.Vector2(1/1280,1/720)} },
    vertexShader: QUAD_VERT,
    fragmentShader: `varying vec2 vUv;
      uniform sampler2D tDiffuse, tDepth;
      uniform mat4 inverseVP, previousVP;
      uniform float strength;
      uniform vec2 pixel;
      void main(){
        vec4 base=texture2D(tDiffuse,vUv);
        if(strength==0.0){gl_FragColor=base;return;}
        float depth=texture2D(tDepth,vUv).r;
        vec4 world=inverseVP*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);
        world/=world.w;
        vec4 previous=previousVP*world;
        if(previous.w<=0.0){gl_FragColor=base;return;}
        vec2 velocity=(vUv-(previous.xy/previous.w*.5+.5))*strength;
        float pixels=length(velocity/pixel);
        velocity*=min(1.0,5.0/max(pixels,.001));
        vec4 sum=base; float weight=1.0;
        for(int i=1;i<=6;i++){
          vec2 uv=clamp(vUv+velocity*(float(i)/6.0-.5),pixel,1.0-pixel);
          float other=texture2D(tDepth,uv).r;
          float w=1.0-smoothstep(.0004,.003,abs(other-depth));
          sum+=texture2D(tDiffuse,uv)*w; weight+=w;
        }
        gl_FragColor=sum/weight;
      }`
  });
  const previousVP=new THREE.Matrix4(), vp=new THREE.Matrix4();
  const motionTarget=new THREE.WebGLRenderTarget(256,256,{type:THREE.HalfFloatType,depthBuffer:false});
  const motionCopy=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tDiffuse:{value:motionTarget.texture}},vertexShader:QUAD_VERT,fragmentShader:'varying vec2 vUv; uniform sampler2D tDiffuse; void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'});
  const motionQuad=new FullScreenQuad(motionCopy);
  motion.needsSwap=false;
  motion.setSize=(w,h)=>motionTarget.setSize(w,h);
  motion.render=(renderer,writeBuffer,readBuffer)=>{
    if(motion.uniforms.strength.value===0)return;
    motion.uniforms.tDiffuse.value=readBuffer.texture;
    motion.uniforms.tDepth.value=readBuffer.depthTexture;
    renderer.setRenderTarget(motionTarget);motion.fsQuad.render(renderer);
    // Composite only color, preserving the original scene depth for FocusPass.
    const clear=renderer.autoClear;renderer.autoClear=false;
    renderer.setRenderTarget(readBuffer);motionQuad.render(renderer);renderer.autoClear=clear;
  };
  motion.dispose=()=>{motionTarget.dispose();motionCopy.dispose();motion.material.dispose();motion.fsQuad.dispose();motionQuad.dispose();};
  composer.addPass(motion);
  const previousPosition=new THREE.Vector3(), previousRotation=new THREE.Quaternion();
  let motionReady=false, previousCamera=null;
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.45, 1.0);
  composer.addPass(bloom);
  const dof = new FocusPass();
  dof.enabled = focus;
  composer.addPass(dof);
  const lens = new LensPass();
  composer.addPass(lens);
  const final = new ShaderPass(Final);
  final.uniforms.tStreak.value = lens.rtStreak.texture;
  final.uniforms.tHalo.value = lens.rtHalo.texture;
  composer.addPass(final);
  return {
    composer, bloom, dof, lens, render, shade, u: final.uniforms,
    motionFrame(cam, dt, disabled) {
      cam.updateMatrixWorld();
      vp.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);
      const cut=!motionReady || previousCamera!==cam || previousPosition.distanceTo(cam.position)>2 || previousRotation.angleTo(cam.quaternion)>.35 || dt>.1;
      motion.uniforms.inverseVP.value.copy(vp).invert();
      motion.uniforms.previousVP.value.copy(previousVP);
      motion.uniforms.strength.value=disabled || cut ? 0 : Math.min(1,.012/Math.max(dt,.001));
      // RenderPass writes to the composer's current read buffer (which alternates).
      motion.uniforms.tDepth.value=composer.readBuffer.depthTexture;
      previousVP.copy(vp);previousPosition.copy(cam.position);previousRotation.copy(cam.quaternion);
      motionReady=true;previousCamera=cam;
    },
    /* point the film at another scene, or another camera */
    view(sc, cam) { render.scene = sc; render.camera = cam; },
    size(w, h, dpr) {
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
      motion.uniforms.pixel.value.set(1/(w*dpr),1/(h*dpr));
      motionReady=false;
      final.uniforms.uRes.value.set(w * dpr, h * dpr);
      dof.uniforms.uRes.value.set(w * dpr, h * dpr);
      /* the blur is measured against a picture 1080 high */
      dof.uniforms.uMaxR.value = 9 * (h * dpr) / 1080;
    },
  };
}
