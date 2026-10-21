/* ============================================================
   Over the wall.

   The ghetto could not live on its ration. Most of what it ate
   was smuggled in, and much of that was carried by children, who
   were small and quick: over the wall, through holes in it, past
   the guards. Henryka Łazowertówna wrote a poem about them, and a
   photograph of it being done stands a little further up the
   street.

   Here three boys come over, one after another. Each runs up to a
   ladder leaned against the wall outside, climbs it hand over hand,
   goes over the top on his belly, hangs by his hands, lets go,
   lands with his knees giving under him, and runs on into the
   ghetto with a sack on his back. They have weight: the drop is a
   real fall, and the landing takes it.

   Sources: United States Holocaust Memorial Museum, "Smuggling";
   Yad Vashem, The Warsaw Ghetto: daily life.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { washMaterial, lineMaterial, QUALITY } from './ink.js';
import { woodMaterial } from './materials.js';
import { noStar } from './star.js';
import { reach, setBone } from './body.js';
import { box, at, merge } from './geo.js';
import { PLAN } from './plan.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const THIGH = 0.31, SHIN = 0.3, UPPER = 0.2, FORE = 0.19, HIPS = 0.62, CHEST = 0.36;
const LX = -3.4, BASE = -58.5, LEAN = -0.4, TOP = 3.26, WALL = PLAN.wallZ;
const PERIOD = 17, G = 9.8;

const tube = (r0, r1, len) => new THREE.CylinderGeometry(r0, r1, len, 6, 1, true).translate(0, -len / 2, 0);
const ball = (r, s = [1, 1, 1], p = [0, 0, 0]) => new THREE.SphereGeometry(r, 7, 5).scale(s[0], s[1], s[2]).translate(p[0], p[1], p[2]);
function part(list) {
  return mergeGeometries(list.map(([g, tone]) => {
    const c = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
    const n = c.attributes.position.count;
    c.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(n).fill(tone), 1));
    c.setAttribute('aEdge', new THREE.BufferAttribute(new Float32Array(n).fill(0.9), 1));
    return noStar(c);
  }), false);
}
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

export function buildClimbers(scene) {
  /* their ladder: rougher than the other, and further along the wall */
  const wood = [];
  const run = TOP + 0.3, back = -run * LEAN, len = Math.hypot(run, back), tilt = -Math.atan2(back, run);
  for (const s of [-1, 1]) wood.push(at(box(0.045, len, 0.06), LX + s * 0.19, run / 2, BASE - back / 2, 0, tilt));
  for (let y = 0.28; y < run - 0.1; y += 0.3) wood.push(at(box(0.38, 0.03, 0.04), LX, y, BASE + LEAN * y, 0, tilt));
  const ladder = new THREE.Mesh(merge(wood), woodMaterial());
  ladder.frustumCulled = false;
  scene.add(ladder);

  const geo = {
    torso: part([[tube(0.115, 0.1, CHEST), 0], [ball(0.12, [1, 0.5, 0.75]), 0], [ball(0.105, [1, 0.7, 0.8], [0, -CHEST, 0]), 0],
      [ball(0.16, [0.95, 1.2, 0.8], [0, -0.14, 0.15]), 0]]),                               // the sack on his back
    head: part([[ball(0.085, [0.85, 1.1, 0.95], [0, 0.12, 0]), 1], [tube(0.04, 0.04, 0.06).translate(0, 0.05, 0), 1],
      [ball(0.09, [1.02, 0.5, 1.1], [0, 0.18, 0.005]), 0], [ball(0.06, [1, 0.25, 1.1], [0, 0.165, -0.085]), 0]]),   // a cap, and its peak
    upper: part([[tube(0.042, 0.035, UPPER), 0], [ball(0.045), 0]]),
    fore: part([[tube(0.035, 0.028, FORE), 0], [ball(0.03, [0.8, 1.2, 0.6], [0, -FORE - 0.03, 0]), 1]]),
    thigh: part([[tube(0.062, 0.048, THIGH), 0]]),
    shin: part([[tube(0.045, 0.035, SHIN), 0], [ball(0.05), 0], [ball(0.05, [0.75, 0.6, 1.9], [0, -SHIN - 0.02, -0.04]), 0]]),
  };
  const boys = [0, 1, 2].map((i) => {
    const mat = washMaterial({ who: 0.2 + i * 0.27 });
    mat.uniforms.uStill.value = 1;
    const line = QUALITY.pen ? lineMaterial(mat) : null;
    const g = new THREE.Group();
    g.position.x = LX;
    const mk = (ge) => {
      const o = new THREE.Group();
      o.matrixAutoUpdate = false;
      const a = new THREE.Mesh(ge, mat); a.userData.noShadow = true; o.add(a);
      if (line) { const b = new THREE.Mesh(ge, line); b.userData.noShadow = true; o.add(b); }
      g.add(o);
      return o;
    };
    const P = { torso: mk(geo.torso), head: mk(geo.head), limbs: [-1, 1].flatMap((s) => [{ arm: true, s, a: mk(geo.upper), b: mk(geo.fore) }, { arm: false, s, a: mk(geo.thigh), b: mk(geo.shin) }]) };
    g.traverse((o) => { o.frustumCulled = false; o.userData.free = true; });
    scene.add(g);
    return { g, P, mat, off: i * PERIOD / 3, landed: -1 };
  });

  const hips = V(), sh = V(), root = V(), tg = V(), mid = V(), end = V(), pole = V(), front = V(0, 0, -1), up = V();
  const m = new THREE.Matrix4(), e = new THREE.Euler();
  const thuds = [];
  /* a rung for a hand or a foot: as in body.js */
  const rung = (y0, upR, down, odd, out, side) => {
    const c = 0.28 + (odd ? 0.3 : 0), k = Math.floor((y0 + upR - c) / 0.6);
    let y = c + 0.6 * k, lift = 0;
    const f = 1 - (y - y0 + down) / (upR + down);
    if (f > 0.74) { const t = smooth((f - 0.74) / 0.26); y += 0.6 * t; lift = Math.sin(t * Math.PI); }
    const yy = Math.min(y, TOP);
    return out.set(side * (y > TOP ? 0.2 : 0.13), yy, y > TOP ? WALL + 0.2 : BASE + LEAN * yy + lift * 0.1);
  };

  return {
    /* t: the hour. on: is the wall near enough to be seen. Returns the landings that happen now: [{ z }] */
    update(t, on) {
      thuds.length = 0;
      ladder.visible = on;
      for (const b of boys) {
        b.g.visible = on;
        if (!on) continue;
        const cyc = Math.floor((t + b.off) / PERIOD), u = (t + b.off) - cyc * PERIOD;
        /* where his hips are, how he leans, and what he is doing */
        let z, y = HIPS, lean = 0.12, gone = 0, mode = 'run', dist = 0, crouch = 0;
        if (u < 2.4) { z = mix(-49.5, BASE + 0.42, u / 2.4); dist = u * 3.7; gone = 1 - smooth(u / 0.7); lean = 0.22; }
        else if (u < 6.6) { const k = (u - 2.4) / 4.2; y = mix(HIPS + 0.1, 2.75, k); z = BASE + LEAN * (y + 0.2) + 0.2; mode = 'climb'; lean = 0.3; }
        else if (u < 7.7) { const k = smooth((u - 6.6) / 1.1); y = mix(2.75, 3.42, Math.sin(k * Math.PI * 0.62) / Math.sin(Math.PI * 0.62)) - k * 0.95; z = mix(BASE + LEAN * 2.95 + 0.2, WALL - 0.42, k); mode = 'over'; lean = mix(0.9, -0.1, k); }
        else if (u < 8.3) { const k = (u - 7.7) / 0.6; y = 2.47; z = WALL - 0.42; mode = 'hang'; lean = -0.05 + 0.05 * Math.sin(k * 6); }
        else {
          /* he lets go: nothing but his own weight until the ground has him */
          const tf = u - 8.3, fall = 2.47 - 0.5 * G * tf * tf, tl = Math.sqrt(2 * (2.47 - 0.38) / G);
          z = WALL - 0.45;
          if (tf < tl) { y = fall; mode = 'fall'; lean = 0.1; }
          else {
            if (b.landed !== cyc) { b.landed = cyc; thuds.push({ z }); }
            const k = tf - tl;
            crouch = Math.exp(-k * 5) * Math.cos(k * 6);                      // the knees take it, and give it back
            if (k < 0.55) { y = HIPS - 0.24 * Math.max(crouch, -0.2) - 0.24 * (1 - smooth(k / 0.3)) * 0 ; y = mix(0.38, HIPS, smooth(k / 0.5)); mode = 'land'; lean = mix(0.7, 0.2, smooth(k / 0.5)); }
            else { const r = k - 0.55; dist = r * 3.9; z = WALL - 0.45 - dist; lean = 0.22; gone = smooth((r - 4.2) / 1.2); if (r > 5.6) gone = 1; }
          }
        }
        b.mat.uniforms.uGone.value = gone;
        if (gone > 0.995) { b.g.visible = false; continue; }
        const ph = dist / 1.0, tau = Math.PI * 2;
        const running = mode === 'run';
        hips.set(0, y - (running ? 0.02 * Math.abs(Math.sin(tau * ph)) : 0), z);
        /* the trunk: from the hips up, tipped forward by its lean */
        e.set(-lean, 0, 0);
        m.makeRotationFromEuler(e);
        up.set(0, CHEST, 0).applyMatrix4(m);
        sh.copy(hips).add(up);
        b.P.torso.matrix.copy(m).setPosition(sh);
        e.set(mode === 'climb' || mode === 'hang' ? 0.5 : mode === 'fall' ? -0.3 : -lean * 0.3, 0, 0);
        b.P.head.matrix.makeRotationFromEuler(e).setPosition(sh);
        for (const L of b.P.limbs) {
          const s = L.s, R = s > 0;
          if (L.arm) {
            root.set(s * 0.13, sh.y - 0.03, sh.z);
            const sw = (R ? 1 : -1) * Math.cos(tau * ph);
            tg.set(s * 0.17, root.y - 0.24 + 0.08 * Math.max(sw, 0), root.z + 0.02 - 0.2 * sw);              // running: they pump
            pole.set(s * 0.3, -0.3, 1);
            if (mode === 'climb') { rung(sh.y + 0.12, 0.26, 0.3, R, tg, s); pole.set(s, -1, 0.4); }
            else if (mode === 'over') { tg.set(s * 0.2, TOP + 0.02, WALL + 0.12 - (R ? 0.1 : 0)); pole.set(s, 0.2, 0.6); }
            else if (mode === 'hang') { tg.set(s * 0.17, TOP + 0.02, WALL - 0.26); pole.set(s, -0.3, -0.5); }
            else if (mode === 'fall') { tg.set(s * 0.3, root.y + 0.25 + 0.05 * Math.sin(t * 13 + s), root.z - 0.05); pole.set(s, -0.5, 0.3); }
            else if (mode === 'land') { tg.set(s * 0.2, 0.06, root.z - 0.26); pole.set(s, 0.3, 0.6); }
            reach(root, tg, UPPER, FORE, pole, mid, end);
          } else {
            root.set(s * 0.07, hips.y, hips.z);
            const f = ((ph + (R ? 0.5 : 0)) % 1 + 1) % 1, A = running ? 0.27 : 0;
            let fz, fy;
            if (f < 0.5) { fz = mix(-A, A, f * 2); fy = 0; } else { const k = (f - 0.5) * 2; fz = mix(A, -A, smooth(k)); fy = Math.sin(k * Math.PI) * 0.16; }
            tg.set(s * 0.075, 0.05 + (running ? fy : 0), hips.z + fz);
            pole.set(s * 0.15, 0.1, -1);
            if (mode === 'climb') { rung(hips.y - 0.42, 0.3, 0.3, !R, tg, s); tg.y += 0.05; tg.z += 0.03; pole.set(s * 0.8, 0.2, -0.5); }
            else if (mode === 'over') { tg.set(s * 0.1, hips.y - 0.25 - (R ? 0.2 : 0), hips.z + (R ? 0.42 : 0.3)); pole.set(s, 0.5, -0.3); }
            else if (mode === 'hang' || mode === 'fall') { tg.set(s * 0.09, hips.y - 0.55 + 0.04 * Math.sin(t * 9 + s), hips.z + 0.08 + (mode === 'fall' ? -0.14 : 0)); pole.set(s * 0.2, 0, -1); }
            reach(root, tg, THIGH, SHIN, pole, mid, end);
          }
          setBone(L.a, root, mid, front);
          setBone(L.b, mid, end, front);
        }
      }
      return thuds;
    },
  };
}
