/* ============================================================
   Fire, smoke, embers, ash, and the bottles in the air.

   The world is a still photograph. These are the only things in
   it that move, apart from you.
   ============================================================ */

import * as THREE from 'three';
import { world, MAX_LIGHTS, GLSL_NOISE, GLSL_LIGHT, rng, clamp } from './common.js';
import { plainMaterial } from './materials.js';

/* ── which fires light the street ──────────────────────────── */
export class Lights {
  constructor() { this.list = []; this.groups = {}; this._tmp = []; }
  add(l) {
    l.level = l.level ?? 1; l.phase = Math.random() * 100; l.flicker = l.flicker ?? 0;
    this.list.push(l);
    return l;
  }
  set(group, v) { this.groups[group] = v; }
  /* a short flash: a shot, a bottle breaking */
  flash(pos, color, power = 6, life = 0.35) {
    this.list.push({ pos: pos.clone(), color, base: power, group: 'flash', level: 1, life, age: 0, phase: 0, flicker: 0 });
  }
  update(cam, t, dt) {
    const out = this._tmp; out.length = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const l = this.list[i];
      let k = l.level * (this.groups[l.group] ?? 1);
      if (l.life) {
        l.age += dt;
        if (l.age > l.life) { this.list.splice(i, 1); continue; }
        k *= 1 - l.age / l.life;
      }
      if (k < 0.004) continue;
      const d = l.pos.distanceTo(cam);
      if (d > 95) continue;
      const f = 1 - l.flicker * (0.5 + 0.5 * Math.sin(t * 9.1 + l.phase) * Math.sin(t * 5.3 + l.phase * 1.7));
      const I = l.base * k * f * (1 - clamp((d - 60) / 35));
      out.push({ l, I, score: I / (1 + d * d * 0.03) });
    }
    out.sort((a, b) => b.score - a.score);
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const o = out[i];
      if (o) {
        world.uLights.value[i].set(o.l.pos.x, o.l.pos.y, o.l.pos.z, o.I);
        world.uLightCols.value[i].copy(o.l.color);
      } else {
        world.uLights.value[i].set(0, -999, 0, 0);
      }
    }
  }
}

/* ── flame ─────────────────────────────────────────────────── */
/* One flame on a card: the card's foot is the fuel, and the fire climbs it in
   tongues that lean and split. uv: x across, y up. Needs fbm(). calm: a candle. */
export const GLSL_FLAME = /* glsl */ `
  vec4 flame(vec2 uv, float seed, float t, float calm) {
    float turb = mix(1.0, 0.22, calm);
    t *= mix(1.0, 0.35, calm);
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    /* the higher it climbs the more it wanders */
    float w1 = fbm(vec2(p.x * 0.9 + seed * 7.0, p.y * 0.8 - t * 0.55));
    float w2 = fbm(vec2(p.x * 2.1 - seed * 3.0, p.y * 1.7 - t * 1.0));
    p.x += ((w1 - 0.5) * 0.85 + (w2 - 0.5) * 0.3) * p.y * turb;
    float width = 0.62 * (1.0 - pow(p.y, 1.35)) + 0.03;
    float body = 1.0 - abs(p.x) / width;
    float n = fbm(vec2(p.x * 1.4 + seed * 11.0, p.y * 1.5 - t * 1.25));
    float n2 = fbm(vec2(p.x * 3.4 + 5.0, p.y * 3.0 - t * 2.0));
    float f = body * 0.85 + ((n - 0.5) * 1.25 + (n2 - 0.5) * 0.5) * turb - p.y * 0.42 + 0.12;
    float a = smoothstep(0.02, 0.22, f) * smoothstep(0.0, 0.05, uv.y) * (1.0 - smoothstep(0.86, 1.0, uv.y));
    /* dark red at the edge, orange, yellow, and nearly white where it is hottest */
    vec3 c = mix(vec3(0.55, 0.035, 0.0), vec3(1.0, 0.3, 0.02), smoothstep(0.0, 0.3, f));
    c = mix(c, vec3(1.0, 0.66, 0.14), smoothstep(0.25, 0.62, f));
    c = mix(c, vec3(1.0, 0.94, 0.7), smoothstep(0.62, 1.05, f) * (1.0 - p.y * 0.6));
    return vec4(c * (0.75 + 1.5 * smoothstep(0.1, 0.9, f)), a);
  }
`;
const FIRE_COL = new THREE.Color(1.0, 0.42, 0.12);

export class FireSet {
  /* items: [{ pos: Vector3, w, h, seed? }]. group: the lights group this set feeds. */
  constructor(scene, lights, items, { group, light = 2.2, lightEvery = 1, calm = 0 } = {}) {
    const n = items.length;
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    const pos = new Float32Array(n * 3), size = new Float32Array(n * 2), seed = new Float32Array(n);
    this.level = new Float32Array(n).fill(1);
    items.forEach((it, i) => {
      pos.set([it.pos.x, it.pos.y, it.pos.z], i * 3);
      size.set([it.w, it.h], i * 2);
      seed[i] = it.seed ?? Math.random();
    });
    this.posAttr = new THREE.InstancedBufferAttribute(pos, 3);
    this.levelAttr = new THREE.InstancedBufferAttribute(this.level, 1);
    geo.setAttribute('aPos', this.posAttr);
    geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 2));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    geo.setAttribute('aLevel', this.levelAttr);
    geo.instanceCount = n;
    this.uniforms = { ...world, uAmount: { value: 0 }, uCalm: { value: calm } };
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aPos; attribute vec2 aSize; attribute float aSeed; attribute float aLevel;
        uniform float uAmount;
        varying vec2 vUv; varying float vSeed; varying float vLevel; varying vec3 vP;
        void main() {
          vUv = uv; vSeed = aSeed;
          vLevel = aLevel * uAmount;
          vec2 toCam = normalize(cameraPosition.xz - aPos.xz + 0.0001);
          vec3 right = vec3(toCam.y, 0.0, -toCam.x);
          float k = 0.35 + 0.65 * clamp(vLevel, 0.0, 1.0);
          vec3 p = aPos + right * position.x * aSize.x * k + vec3(0.0, position.y * aSize.y * k, 0.0);
          vP = p;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; varying float vSeed; varying float vLevel; varying vec3 vP;
        uniform float uCalm;
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        ${GLSL_FLAME}
        void main() {
          if (vLevel < 0.004) discard;
          vec4 fl = flame(vUv, vSeed, uTime * (1.4 + vSeed * 0.8), uCalm);
          float f = fogAmount(vP);
          gl_FragColor = vec4(fl.rgb, fl.a * clamp(vLevel, 0.0, 1.0) * (1.0 - f * 0.6));
        }
      `,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    scene.add(this.mesh);

    this.lights = [];
    if (group) {
      items.forEach((it, i) => {
        if (i % lightEvery) return;
        const l = lights.add({ pos: it.pos.clone().add(new THREE.Vector3(0, it.h * 0.35, 0)), color: FIRE_COL, base: light * Math.sqrt(it.w), group, flicker: calm ? 0.12 : 0.45 });
        l.index = i;
        this.lights.push(l);
      });
    }
  }
  set amount(v) { this.uniforms.uAmount.value = v; }
  get amount() { return this.uniforms.uAmount.value; }
  setLevel(i, v) {
    this.level[i] = v; this.levelAttr.needsUpdate = true;
    for (const l of this.lights) if (l.index === i) l.level = v;
  }
  setPos(i, p) { this.posAttr.setXYZ(i, p.x, p.y, p.z); this.posAttr.needsUpdate = true; }
}

/* ── smoke ─────────────────────────────────────────────────── */
export class SmokeSet {
  /* columns: [{ pos, size, rise, n }] */
  constructor(scene, columns, { color = [0.035, 0.03, 0.028], glow = 0.0, speed = 0.05, drift = [0.25, -0.1], seed = 1, opacity = 0.75 } = {}) {
    const R = rng(seed * 101 + 5);
    const items = [];
    for (const c of columns) for (let i = 0; i < (c.n || 8); i++) items.push({ ...c, s: R() });
    const n = items.length;
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    const pos = new Float32Array(n * 3), prm = new Float32Array(n * 3);
    items.forEach((it, i) => {
      pos.set([it.pos.x, it.pos.y, it.pos.z], i * 3);
      prm.set([it.size, it.rise, it.s], i * 3);
    });
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute('aPrm', new THREE.InstancedBufferAttribute(prm, 3));
    geo.instanceCount = n;
    this.uniforms = {
      ...world,
      uAmount: { value: 0 },
      uCol: { value: new THREE.Vector3(...color) },
      uGlowK: { value: glow },
      uSpeed: { value: speed },
      uDrift: { value: new THREE.Vector2(...drift) },
      uOpacity: { value: opacity },
    };
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec3 aPos; attribute vec3 aPrm;
        uniform float uTime, uSpeed, uAmount; uniform vec2 uDrift;
        varying vec2 vUv; varying float vLife; varying float vSeed; varying vec3 vP;
        void main() {
          float seed = aPrm.z;
          float life = fract(uTime * uSpeed * (0.6 + seed * 0.8) + seed * 17.0);
          vLife = life; vSeed = seed; vUv = uv;
          vec3 p = aPos;
          p.y += life * aPrm.y;
          p.xz += uDrift * life * aPrm.y + vec2(sin(seed * 40.0 + life * 5.0), cos(seed * 31.0 + life * 4.0)) * aPrm.x * 0.25;
          float size = aPrm.x * (0.55 + life * 1.9);
          float ang = seed * 6.28 + life * (seed - 0.5) * 2.5;
          vec2 o = position.xy;
          o = vec2(o.x * cos(ang) - o.y * sin(ang), o.x * sin(ang) + o.y * cos(ang)) * size;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          mv.xy += o;
          vP = p;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; varying float vLife; varying float vSeed; varying vec3 vP;
        uniform vec3 uCol; uniform float uGlowK, uAmount, uOpacity;
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        void main() {
          if (uAmount < 0.004) discard;
          vec2 d = vUv - 0.5;
          float r = length(d) * 2.0;
          float n = fbm(vUv * 5.0 + vSeed * 30.0 + vec2(0.0, -uTime * 0.05));
          float a = smoothstep(1.0, 0.25, r + (n - 0.5) * 0.9);
          a *= smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
          /* never let smoke slam into the lens */
          a *= smoothstep(1.5, 9.0, distance(vP, cameraPosition));
          vec3 c = uCol * (0.6 + 0.9 * n) + (uSkyCol + uSunCol * 0.5) * 0.25 * (0.4 + n);
          c += vec3(1.0, 0.33, 0.07) * uGlowK * pow(1.0 - vLife, 2.5) * (0.5 + n);
          c += lampLight(vec3(0.0, 1.0, 0.0), vP) * 0.05;
          float f = fogAmount(vP);
          c = mix(c, uFogCol, f * 0.7);
          gl_FragColor = vec4(c, a * uAmount * uOpacity * (1.0 - f * 0.5));
        }
      `,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    scene.add(this.mesh);
  }
  set amount(v) { this.uniforms.uAmount.value = v; }
}

/* ── things in the air: embers, ash, feathers ──────────────── */
export class Motes {
  constructor(scene, { count, box = [44, 22, 44], kind }) {
    const geo = new THREE.BufferGeometry();
    const seed = new Float32Array(count * 4);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.uniforms = {
      ...world,
      uAmount: { value: 0 },
      uBox: { value: new THREE.Vector3(...box) },
      uKind: { value: kind },      // 0 ember, 1 ash, 2 feather
      uScale: { value: 600 },
    };
    this.points = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: kind === 0 ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime, uAmount, uKind, uScale; uniform vec3 uBox;
        varying float vA; varying float vS;
        void main() {
          vec3 p = aSeed.xyz * uBox;
          float s = aSeed.w;
          float t = uTime;
          if (uKind < 0.5) {
            p.y += t * (1.2 + s * 2.6);
            p.x += sin(t * (0.6 + s) + s * 40.0) * 1.4 + t * 0.6;
            p.z += cos(t * (0.5 + s * 0.7) + s * 23.0) * 1.4;
          } else if (uKind < 1.5) {
            p.y -= t * (0.25 + s * 0.45);
            p.x += sin(t * 0.3 + s * 40.0) * 0.8 + t * 0.25;
            p.z += cos(t * 0.27 + s * 23.0) * 0.8;
          } else {
            p.y -= t * (0.12 + s * 0.2) + sin(t * 1.3 + s * 30.0) * 0.25;
            p.x += t * (0.7 + s * 0.6) + sin(t * 0.8 + s * 50.0) * 0.9;
            p.z += cos(t * 0.5 + s * 19.0) * 0.9;
          }
          p = mod(p - cameraPosition, uBox) - uBox * 0.5 + cameraPosition;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          float show = step(fract(s * 7.31), uAmount);
          float near = smoothstep(0.3, 1.6, -mv.z);
          float size = uKind < 0.5 ? 0.035 + s * 0.05 : (uKind < 1.5 ? 0.03 + s * 0.045 : 0.06 + s * 0.07);
          gl_PointSize = show * size * uScale / max(-mv.z, 0.1);
          vS = s;
          vA = show * near * smoothstep(uBox.x * 0.5, uBox.x * 0.3, -mv.z);
          if (uKind < 0.5) vA *= 0.5 + 0.5 * sin(t * (5.0 + s * 9.0) + s * 60.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vA; varying float vS;
        uniform float uKind; uniform vec3 uFogCol; uniform vec3 uSkyCol; uniform vec3 uSunCol;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float r = length(d * vec2(1.0, uKind > 1.5 ? 1.9 : 1.0));
          float a = smoothstep(0.5, uKind < 0.5 ? 0.0 : 0.3, r) * vA;
          if (a < 0.01) discard;
          vec3 c;
          if (uKind < 0.5) c = mix(vec3(1.0, 0.25, 0.03), vec3(1.0, 0.75, 0.3), vS) * 3.2;
          else if (uKind < 1.5) c = mix(vec3(0.05), uFogCol * 1.5 + 0.1, vS) ;
          else c = (uSkyCol + uSunCol * 0.6) * 1.6 + 0.12;
          gl_FragColor = vec4(c, a * (uKind < 0.5 ? 1.0 : 0.8));
        }
      `,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
    scene.add(this.points);
  }
  set amount(v) { this.uniforms.uAmount.value = v; this.points.visible = v > 0.003; }
}

/* ── bottles thrown from the balconies ─────────────────────── */
export class Molotovs {
  constructor(scene, lights, { bottleGeo, from, targets, fires, onBreak }) {
    this.lights = lights; this.from = from; this.targets = targets; this.fires = fires; this.onBreak = onBreak;
    this.pool = [];
    const mat = plainMaterial({ color: [0.12, 0.09, 0.04], emissive: [0.5, 0.2, 0.03] });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(bottleGeo, mat);
      m.visible = false; m.frustumCulled = false; m.userData.free = true;
      m.scale.setScalar(1.25);
      scene.add(m);
      this.pool.push({ mesh: m, t: 0, life: 0, a: new THREE.Vector3(), b: new THREE.Vector3(), target: 0, spin: 0 });
    }
    this.trail = new FireSet(scene, lights, this.pool.map(() => ({ pos: new THREE.Vector3(0, -99, 0), w: 0.35, h: 0.6 })), {});
    this.trail.amount = 1;
    this.wait = 1;
    this.next = 0;
  }
  update(dt, amount) {
    this.wait -= dt * amount;
    if (amount > 0.1 && this.wait <= 0 && this.from.length) {
      const b = this.pool.find((p) => !p.mesh.visible);
      if (b) {
        const f = this.from[Math.floor(Math.random() * this.from.length)];
        this.next = (this.next + 1 + Math.floor(Math.random() * 3)) % this.targets.length;
        b.target = this.next;
        b.a.set(f.x, (f.y || 0) + 1.7, f.z);
        b.b.copy(this.targets[b.target]);
        b.t = 0; b.life = 1.25 + Math.random() * 0.5; b.spin = 6 + Math.random() * 8;
        b.mesh.visible = true;
        this.wait = 0.7 + Math.random() * 1.6;
      }
    }
    this.pool.forEach((b, i) => {
      if (!b.mesh.visible) { this.trail.setLevel(i, 0); return; }
      b.t += dt / b.life;
      const k = Math.min(b.t, 1);
      b.mesh.position.lerpVectors(b.a, b.b, k);
      b.mesh.position.y += Math.sin(k * Math.PI) * (2.4 + b.a.distanceTo(b.b) * 0.08);
      b.mesh.rotation.set(b.t * b.spin, 0, b.t * b.spin * 0.6);
      this.trail.setPos(i, b.mesh.position);
      this.trail.setLevel(i, 1);
      if (b.t >= 1) {
        b.mesh.visible = false;
        this.fires.setLevel(b.target, 1);
        this.lights.flash(b.b.clone().setY(1.2), FIRE_COL, 9, 0.5);
        if (this.onBreak) this.onBreak(b.b);
      }
    });
    /* each fire burns down to a steady glow */
    for (let i = 0; i < this.fires.level.length; i++) {
      const v = this.fires.level[i];
      if (v > 0.5) this.fires.setLevel(i, Math.max(0.5, v - dt * 0.12));
    }
  }
}

/* ── an explosion, held ─────────────────────────────────────────
   A ball of fire and dust, drawn by stepping through it: at each step
   how thick it is there, and how hot. The middle is white, then yellow,
   orange, red, and at the outside it is already dust and brick. When
   time is held it does not move: you can walk round it. */
/* ── the blast along the ground: a ring of dust, spreading and thinning ── */
export class ShockRing {
  constructor(scene) {
    this.u = { uAge: { value: 99 }, uPower: { value: 1 } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { ...world, ...this.u },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vP;
        void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv; varying vec3 vP;
        uniform float uAge, uPower;
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float R = 1.0 - exp(-uAge * 1.5);
          float n = fbm(vUv * 11.0 + uAge * 0.25);
          float ring = exp(-pow((r - R + (n - 0.5) * 0.08) / (0.035 + 0.14 * R), 2.0));
          /* behind the ring, the dust it has raised hangs for a while */
          float wake = smoothstep(R, R * 0.4, r) * 0.35 * smoothstep(0.0, 0.4, uAge);
          float a = (ring + wake) * (0.45 + 0.8 * n) * exp(-uAge * 0.75) * 0.7 * uPower * smoothstep(1.0, 0.86, r);
          vec3 c = mix(vec3(0.42, 0.36, 0.29), uFogCol * 1.4, 0.35) * (0.6 + 0.6 * n);
          gl_FragColor = vec4(applyFog(c, vP), clamp(a, 0.0, 0.9));
        }
      `,
    }));
    this.mesh.frustumCulled = false;
    this.mesh.userData.free = true;
    this.mesh.userData.noShadow = true;
    this.mesh.renderOrder = 3;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }
  fire(pos, size, power = 1) { this.mesh.position.set(pos.x, 0.14, pos.z); this.mesh.scale.setScalar(size); this.u.uPower.value = power; this.u.uAge.value = 0; }
  update(age) { this.u.uAge.value = age; this.mesh.visible = age < 6; }
}

export class Fireball {
  constructor(scene, { pos, r = 3.2, seed = 1 } = {}) {
    this.uAmount = { value: 0 };
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, premultipliedAlpha: true,
      uniforms: { ...world, uC: { value: pos.clone() }, uR: { value: r }, uAmount: this.uAmount, uSeed: { value: seed } },
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec3 vW;
        uniform vec3 uC; uniform float uR, uAmount, uSeed;
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        /* a rough three-dimensional noise from the flat one: three slices, turned */
        float n3(vec3 p) { return (fbm(p.xy + p.z * 0.71 + uSeed) + fbm(p.yz * 1.13 - p.x * 0.53 + uSeed * 2.0) + fbm(p.zx * 0.91 + p.y * 0.61 - uSeed)) / 3.0; }
        vec3 heat(float h) {
          vec3 c = mix(vec3(0.25, 0.03, 0.0), vec3(0.95, 0.24, 0.02), smoothstep(0.1, 0.4, h));
          c = mix(c, vec3(1.0, 0.6, 0.12), smoothstep(0.38, 0.65, h));
          c = mix(c, vec3(1.0, 0.9, 0.62), smoothstep(0.62, 0.86, h));
          return mix(c, vec3(1.0, 0.98, 0.92), smoothstep(0.86, 1.0, h));
        }
        void main() {
          if (uAmount < 0.004) discard;
          vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
          vec3 oc = ro - uC;
          float b = dot(oc, rd), c = dot(oc, oc) - uR * uR;
          float disc = b * b - c;
          if (disc < 0.0) discard;
          float s = sqrt(disc);
          float t0 = max(-b - s, 0.0), t1 = -b + s;
          const int STEPS = 30;
          float dt = (t1 - t0) / float(STEPS);
          vec3 col = vec3(0.0); float alpha = 0.0;
          for (int i = 0; i < STEPS; i++) {
            float t = t0 + (float(i) + 0.5) * dt;
            vec3 p = ro + rd * t;
            vec3 q = (p - uC) / uR;
            /* flattened at the foot, where it meets the street, and torn at its edge */
            float r = length(q * vec3(1.0, 1.12, 1.0) + vec3(0.0, 0.12, 0.0));
            float n = n3(q * 2.3);
            float n2 = n3(q * 5.1 + 3.0);
            float d = smoothstep(1.0, 0.45, r + (n - 0.5) * 0.75 + (n2 - 0.5) * 0.3);
            d *= step(-0.85, q.y);
            if (d < 0.01) continue;
            float h = clamp(1.1 - r * 1.4 + (n - 0.5) * 1.1 + (n2 - 0.5) * 0.45, 0.0, 1.0);
            /* hot inside: light. Cooler outside: dust and smoke, lit by the fire in it */
            float fire = smoothstep(0.25, 0.55, h);
            vec3 smoke = mix(vec3(0.05, 0.045, 0.04), vec3(0.42, 0.24, 0.12), smoothstep(0.0, 0.3, h));
            vec3 c0 = mix(smoke, heat(h) * (0.55 + 1.6 * smoothstep(0.62, 1.0, h)), fire);
            float a = d * (0.22 + 0.5 * (1.0 - fire)) * dt * 2.4;
            col += c0 * a * (1.0 - alpha);
            alpha += a * (1.0 - alpha);
            if (alpha > 0.98) break;
          }
          col = applyFog(col / max(alpha, 0.001), uC) * alpha * uAmount;
          gl_FragColor = vec4(col, alpha * uAmount);
        }
      `,
    }));
    this.mesh.position.copy(pos);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    this.mesh.userData.free = true;
    scene.add(this.mesh);
  }
  set amount(v) { this.uAmount.value = v; this.mesh.visible = v > 0.004; }
}
