/* ============================================================
   The guards at the Umschlagplatz, and their dogs.

   Men in field grey along the lines of people going to the
   wagons, each with a dog on a short leash. A dog on a leash is
   never still. It leans into the collar with its forefeet braced,
   its head follows whoever is passing, it pants, and then it goes
   up on its hind legs at the end of the leash and barks, three or
   four times, and the man holding it is pulled forward a step and
   hauls it back.

   Each dog is built of parts that move: a body, a head, a jaw, a
   tail, and four legs of two bones each that find the ground for
   themselves. Drawn as everyone here is drawn: flat washes and a
   pen line.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { person } from './figures.js';
import { washMaterial, lineMaterial, QUALITY } from './ink.js';
import { reach, setBone } from './body.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const q = new THREE.Quaternion();

function limb(p0, p1, r0, r1, seg = 6) {
  const d = p1.clone().sub(p0), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, Math.min(seg,6), 1, false);
  g.applyQuaternion(q.setFromUnitVectors(UP, d.normalize()));
  g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  return g;
}
function ball(p, r, s = [1, 1, 1], w = 7, h = 4) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.scale(s[0], s[1], s[2]);
  g.translate(p.x, p.y, p.z);
  return g;
}
function cone(p, r, h, rx = 0, rz = 0) {
  const g = new THREE.ConeGeometry(r, h, 6);
  g.rotateX(rx); g.rotateZ(rz);
  g.translate(p.x, p.y, p.z);
  return g;
}
/* list: [geometry, tone]. 2 is the dark of a shepherd's back and mask, 0 the tan of its legs and jaw */
function part(list) {
  return mergeGeometries(list.map(([g, tone]) => {
    const c = g.index ? g.toNonIndexed() : g;
    c.computeVertexNormals();
    for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
    const n = c.attributes.position.count;
    c.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(n).fill(tone), 1));
    c.setAttribute('aEdge', new THREE.BufferAttribute(new Float32Array(n).fill(0.8), 1));
    return c;
  }), false);
}

/* The parts of a shepherd dog. It faces +z. The body's own middle is between its hips; a leg bone
   hangs down -y from its joint with its front to +z (see setBone in body.js). */
const UPPER = 0.27, LOWER = 0.3;
const SHOULDER = V(0.085, -0.04, 0.5), HIP = V(0.095, -0.03, 0.0), NECK = V(0, 0.09, 0.58), TAIL = V(0, 0.05, -0.14);
export function dogParts() {
  const harness = (z) => {
    const g = new THREE.CylinderGeometry(.19,.19,.045,6,1,true);
    g.scale(1,.95,1.14); g.rotateX(Math.PI/2); g.translate(0,-.005,z);
    return g;
  };
  return {
    body: part([
      [ball(V(0, 0, 0.28), 0.2, [0.8, 0.9, 2.15]), 2],                 // the barrel
      [ball(V(0, -0.03, 0.5), 0.2, [0.88, 1.1, 1.05]), 0],             // tan chest beneath the saddle
      [ball(V(0, -0.02, 0.03), 0.18, [0.88, 0.98, 1.15]), 2],          // the haunch
      [ball(V(0, -0.11, 0.3), 0.14, [0.8, 0.6, 1.9]), 0],              // the belly, lighter
      [harness(.36),3], [harness(.02),3],
      [limb(V(-.17,.055,.02),V(-.17,.055,.4),.022,.022,4),3],
      [limb(V(.17,.055,.02),V(.17,.055,.4),.022,.022,4),3],
      [ball(V(-.19,.065,.35),.032,[.35,1,1]),.3],
      [ball(V(.19,.065,.35),.032,[.35,1,1]),.3],
    ]),
    head: part([
      [limb(V(0, -0.03, -0.06), V(0, 0.2, 0.15), 0.115, 0.085, 6), 0],         // tan neck
      [limb(V(0, 0.01, 0.0), V(0, 0.04, 0.035), 0.123, 0.123, 6), 3],         // leather collar
      [ball(V(0, 0.25, 0.2), 0.115, [0.92, 0.95, 1.12]), 0],                   // tan cheek planes
      [limb(V(0, 0.245, 0.27), V(0, 0.215, 0.49), 0.062, 0.04, 9), 0],         // the muzzle
      [ball(V(0, 0.278, 0.295), 0.072, [1, 0.65, 1.8]), 2],                    // dark mask
      [ball(V(0, 0.218, 0.5), 0.03), 2],                                       // the nose
      [cone(V(-0.065, 0.40, 0.15), 0.049, 0.22, -0.2, 0.12), 2], [cone(V(0.065, 0.40, 0.15), 0.049, 0.22, -0.2, -0.12), 2],
    ]),
    /* the lower jaw: it hangs from its hinge, and its front is +z */
    jaw: part([[limb(V(0, 0, 0), V(0, -0.02, 0.2), 0.036, 0.022, 8), 0], [ball(V(0, 0.004, 0.1), 0.02, [0.9, 0.4, 3.2]), 2]]),
    tail: part([[limb(V(0, 0, 0), V(0, -0.2, 0), 0.046, 0.034, 8), 2], [limb(V(0, -0.2, 0), V(0, -0.4, 0.03), 0.034, 0.016, 8), 2]]),
    upper: part([[limb(V(0, 0, 0), V(0, -UPPER, 0), 0.056, 0.036, 9), 0], [ball(V(0, 0, 0), 0.06), 2]]),
    lower: part([[limb(V(0, 0, 0), V(0, -LOWER, 0), 0.036, 0.028, 9), 0], [ball(V(0, -LOWER - 0.006, 0.03), 0.042, [0.9, 0.6, 1.5]), 0]]),
    thigh: part([[limb(V(0, 0, 0), V(0, -UPPER, 0), 0.085, 0.045, 9), 2]]),
  };
}

const bump = (x, w) => Math.exp(-(x * x) / (w * w));

/* pairs: [{ x, z, ry }] where each guard stands and the way he faces. gone: the switch that empties the yard. */
export function buildGuardDogs(scene, pairs, gone) {
  const wash = washMaterial({ dress: 'grey' });
  wash.uniforms.uGone = gone;
  wash.uniforms.uStill.value = 1;
  const pen = QUALITY.pen ? lineMaterial(wash) : null;
  const fur = washMaterial({ dress: 'shepherd' });
  fur.uniforms.uGone = gone; fur.uniforms.uStill.value = 1;
  const furPen = QUALITY.pen ? lineMaterial(fur) : null;
  const P = dogParts();
  const guardGeo = person({ legL: [8, 7, 3], legR: [-9, 8, -7], armL: [8, 10, 26, 2], armR: [20, 14, 50, 4], lean: -5, twist: 9, head: [8, -12] }, 'soldier', { rifle: 'slung' });
  const hand = guardGeo.userData.hand;
  const leashGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 5, 1, true).translate(0, -0.5, 0);
  const group = new THREE.Group();
  group.name = 'Guards and their dogs';
  const dogs = [];
  const mesh = (geo, parent, fixed = true, material = fur, outline = furPen) => {
    const g = new THREE.Group();
    g.matrixAutoUpdate = !fixed;
    const a = new THREE.Mesh(geo, material); a.frustumCulled = false; a.userData.noShadow = true; g.add(a);
    if (outline) { const b = new THREE.Mesh(geo, outline); b.frustumCulled = false; b.userData.noShadow = true; g.add(b); }
    parent.add(g);
    return g;
  };
  pairs.forEach((p, i) => {
    const g = new THREE.Group();
    g.position.set(p.x, 0, p.z); g.rotation.y = p.ry;
    const man = mesh(guardGeo, g, false, wash, pen);
    /* the dog, a pace in front of him and to his right */
    const d = new THREE.Group();
    d.position.set(hand.x + 0.12, 0, hand.z + 0.5);
    d.rotation.y = (i % 2 ? -1 : 1) * 0.16;
    g.add(d);
    const parts = { body: mesh(P.body, d), head: mesh(P.head, d), jaw: mesh(P.jaw, d), tail: mesh(P.tail, d), legs: [] };
    for (const [front, side] of [[1, -1], [1, 1], [0, -1], [0, 1]]) parts.legs.push({ front, side, up: mesh(front ? P.upper : P.thigh, d), lo: mesh(P.lower, d) });
    const leash = mesh(part([[leashGeo.clone(), 3]]), g, true, wash, pen);
    group.add(g);
    dogs.push({ g, d, man, parts, leash, every: 2.6 + (i * 0.83) % 2.1, ph: i * 1.37, n: 3 + (i % 3), last: -1, world: V(p.x, 0.6, p.z), s: 0.92 + (i % 3) * 0.05 });
  });
  group.traverse((o) => { o.userData.free = true; });
  scene.add(group);

  const heard = [];
  const m = new THREE.Matrix4(), mb = new THREE.Matrix4(), mt = new THREE.Matrix4(), e = new THREE.Euler(0, 0, 0, 'YXZ');
  const hipC = V(), a = V(), b = V(), c = V(), kn = V(), ft = V(), pole = V(), front = V(), col = V(), hd = V();
  const X = V(), Y = V(), Z = V();
  return {
    group,
    /* t: the hour. live: is the yard there to be heard. Returns the barks that begin now: [{ at, loud }] */
    update(t, live) {
      heard.length = 0;
      for (const dog of dogs) {
        const k = (t + dog.ph) / dog.every, cyc = Math.floor(k), into = (k - cyc) * dog.every;
        /* a burst of barks, then it gets its breath. up: how far it is up on its hind legs. snap: each bark. */
        let snap = 0, bark = -1;
        const ti = into - 0.5;                              // the burst begins half a second into its turn
        for (let n = 0; n < dog.n; n++) {
          snap += bump(ti - 0.16 - n * 0.3, 0.075);
          if (ti >= 0.1 + n * 0.3) bark = cyc * 8 + n;
        }
        snap = Math.min(snap, 1);
        const span = 0.16 + (dog.n - 1) * 0.3;
        const up = ti < 0.1 ? bump(ti - 0.1, 0.16) : (ti < span ? 1 : bump(ti - span, 0.3));
        const calm = 1 - up;
        /* between barks it watches the line go by, pants, shifts its weight, pulls */
        const watch = Math.sin(t * 0.7 + dog.ph * 2.1) * 0.5 + Math.sin(t * 1.9 + dog.ph) * 0.14;
        const pull = 0.5 + 0.5 * Math.sin(t * 0.9 + dog.ph * 1.7);
        const shift = Math.sin(t * 1.3 + dog.ph) * 0.03;
        const pant = 0.5 + 0.5 * Math.sin(t * 21 + dog.ph * 5);

        /* the body: it pivots on its hips */
        const lunge = 0.05 * pull * calm + 0.17 * up + 0.05 * snap;
        hipC.set(shift, 0.55 - 0.03 * pull * calm + 0.035 * up, -0.28 + lunge);
        e.set(-0.5 * up - 0.06 * snap + 0.07 * pull * calm, watch * 0.32 * calm, 0);
        mb.makeRotationFromEuler(e).setPosition(hipC);
        dog.parts.body.matrix.copy(mb);
        /* the head: up and out when it barks, and following the line when it does not */
        hd.copy(NECK).applyMatrix4(mb);
        e.set(-0.5 * up - 0.3 * snap + 0.2 * calm + 0.05 * Math.sin(t * 2.3 + dog.ph), watch * 0.8 * calm, Math.sin(t * 0.5 + dog.ph * 3) * 0.14 * calm);
        m.makeRotationFromEuler(e).setPosition(hd);
        dog.parts.head.matrix.copy(m);
        /* the jaw: wide at each bark, and never quite shut */
        a.set(0, 0.2, 0.27).applyMatrix4(m);
        e.x += 0.1 + 0.62 * snap + 0.1 * pant * calm;
        dog.parts.jaw.matrix.makeRotationFromEuler(e).setPosition(a);
        /* the tail: low and swinging; out stiff behind when it barks */
        a.copy(TAIL).applyMatrix4(mb);
        e.set(0.75 + 0.75 * up - 0.5 * up * 0.2, 0, Math.sin(t * 5.5 + dog.ph) * 0.38 * calm);
        m.makeRotationFromEuler(e).premultiply(mt.copy(mb).setPosition(0, 0, 0)).setPosition(a);
        dog.parts.tail.matrix.copy(m);
        /* the legs: the hind feet stay where they are; the forefeet brace, and leave the ground when it rears */
        for (const leg of dog.parts.legs) {
          a.copy(leg.front ? SHOULDER : HIP); a.x *= leg.side;
          a.applyMatrix4(mb);
          if (leg.front) {
            const paw = Math.max(0, Math.sin((ti - 0.05) * 20.9 + (leg.side > 0 ? 1.6 : 0))) * up;      // the forefeet beat the air
            ft.set(leg.side * 0.1 + shift * 0.4, 0.03 + 0.3 * up + 0.12 * paw, 0.3 + 0.07 * pull * calm + 0.2 * up);
            pole.set(leg.side * 0.1, 0, -1);
          } else {
            ft.set(leg.side * 0.11, 0.03, -0.36 - 0.03 * up);
            pole.set(leg.side * 0.1, 0.4, -1);
          }
          reach(a, ft, UPPER, LOWER, pole, kn, c);
          front.set(0, 0, 1);
          setBone(leg.up, a, kn, front);
          setBone(leg.lo, kn, c, front);
        }
        /* the leash: from his hand to its collar, and it pulls him */
        col.set(0, 0.02, 0.02).applyMatrix4(dog.parts.head.matrix).applyAxisAngle(UP, dog.d.rotation.y).add(dog.d.position);
        dog.man.rotation.x = 0.03 * pull * calm + 0.09 * up;
        dog.man.position.z = 0.04 * up;
        a.copy(hand).applyAxisAngle(X.set(1, 0, 0), dog.man.rotation.x); a.z += dog.man.position.z;
        Y.subVectors(a, col); const len = Y.length(); Y.multiplyScalar(1 / len);
        Z.set(0, 0, 1).addScaledVector(Y, -Y.z).normalize();
        X.crossVectors(Y, Z);
        dog.leash.matrix.makeBasis(X, Y.multiplyScalar(len), Z).setPosition(a);
        if (bark > dog.last) { if (live && dog.last >= 0) heard.push({ at: dog.world, loud: 0.7 + 0.3 * ((bark * 7) % 3) / 2 }); dog.last = bark; }
      }
      return heard;
    },
  };
}
