/* ============================================================
   The one you walk as.

   You see the ghetto through his eyes, and so what you see of him
   is what anyone sees of themselves: hands, sleeves, the front of
   a coat and the feet below it when you look down. He has weight.
   His arms swing as he walks, his knees take a landing, his hands
   go to the rungs of a ladder one after the other, and come up in
   front of his face when something explodes.

   At the wall he is a man of the ghetto in a long coat, the white
   band with its star on the right sleeve. In the cellar, when the
   undergrounds are formed, the band is gone and the coat is a short
   jacket. His hands stay empty. He carries no weapon and fires none:
   the visitor is a witness here.

   He is drawn as everyone here is drawn. He has no face.

   The rig stands on the ground under the eye and faces the way he
   walks: x to his right, y up, and he looks along -z. Arms and
   legs are two bones each, bent to reach where the hand or foot
   has to be.
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { washMaterial, lineMaterial, QUALITY } from './ink.js';
import { starOnBand, noStar } from './star.js';
import { clamp, lerp, smooth } from './common.js';
import { animatedHandGeometry } from './hands.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const EYE = 1.7;                     // the eye above the ground he stands on
const UPPER = 0.29, FORE = 0.27, THIGH = 0.45, SHIN = 0.44;
const STRIDE = 1.56;                        // two steps
const SHOULDER = V(0.2, 1.44, 0.09), HIP = V(0.1, 0.94, 0.1);

/* ── the parts ─────────────────────────────────────────────── */
const tube = (r0, r1, len, seg = 8) => new THREE.CylinderGeometry(r0, r1, len, seg, 2, false).translate(0, -len / 2, 0);
const ball = (r, s = [1, 1, 1], p = [0, 0, 0]) => new THREE.SphereGeometry(r, 8, 5).scale(s[0], s[1], s[2]).translate(p[0], p[1], p[2]);
const slab = (w, h, d, p = [0, 0, 0]) => new THREE.BoxGeometry(w, h, d).translate(p[0], p[1], p[2]);
/* list: [geometry, tone, how heavy the pen is]. cloth 0, a collar or band 0.3, skin 1, iron 2 */
function part(list) {
  return mergeGeometries(list.map(([g, tone, edge = 1]) => {
    const c = g.index ? g.toNonIndexed() : g;
    c.computeVertexNormals();
    for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv', 'aStar'].includes(k)) c.deleteAttribute(k);
    const n = c.attributes.position.count;
    c.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(n).fill(tone), 1));
    c.setAttribute('aEdge', new THREE.BufferAttribute(new Float32Array(n).fill(edge), 1));
    if (!c.attributes.aStar) noStar(c);
    return c;
  }), false);
}

/* a bone hangs from its joint down -y, and its front is +z */
function forearm(side) {
  const y = -FORE;
  return part([
    [tube(0.054, 0.041, FORE), 0], [ball(0.056), 0],
    [tube(0.045, 0.043, 0.022).translate(0, y + 0.012, 0), 0.3, 0.6],                       // the cuff of a shirt
    [tube(.057,.05,.048).translate(0,y+.048,0),0], // layered coat cuff
    [slab(.013,.017,.008,[side*.038,y+.03,.037]),2,.4],
  ]);
}
function shin() {
  return part([
    [tube(0.066, 0.05, SHIN), 0], [ball(0.074), 0],
    [ball(0.072, [0.74, 0.6, 1.95], [0, -SHIN - 0.03, 0.062]), 0],                          // the shoe
  ]);
}
function band() {
  const g = tube(0.074, 0.069, 0.1, 16).translate(0, -0.105, 0).toNonIndexed();
  /* on him the star is where his own eye can find it: on the front of the sleeve */
  starOnBand(g, V(0, -0.155, 0), V(0, 1, 0), V(0, 0, 1), 0.071);
  return part([[g, 0.3, 0.8]]);
}
const squash = (g, z, y, dz) => g.scale(1, 1, z).translate(0, y, dz);

/* ── two bones to a point ──────────────────────────────────── */
const d0 = V(), p0 = V();
export function reach(root, target, a, b, pole, mid, end) {
  d0.subVectors(target, root);
  let L = d0.length();
  if (L < 1e-5) { d0.set(0, -1, 0); L = 1e-5; }
  d0.multiplyScalar(1 / L);
  L = clamp(L, Math.abs(a - b) + 0.02, a + b - 0.003);
  const ca = (a * a + L * L - b * b) / (2 * a * L);
  p0.copy(pole).addScaledVector(d0, -pole.dot(d0));
  if (p0.lengthSq() < 1e-6) p0.set(0, 0, 1).addScaledVector(d0, -d0.z);
  p0.normalize();
  mid.copy(root).addScaledVector(d0, a * ca).addScaledVector(p0, a * Math.sqrt(Math.max(0, 1 - ca * ca)));
  end.copy(root).addScaledVector(d0, L);
}
const bx = V(), by = V(), bz = V();
export function setBone(o, from, to, front) {
  by.subVectors(from, to).normalize();
  bz.copy(front).addScaledVector(by, -front.dot(by));
  if (bz.lengthSq() < 1e-6) bz.set(1, 0, 0).addScaledVector(by, -by.x);
  bz.normalize();
  bx.crossVectors(by, bz);
  o.matrix.makeBasis(bx, by, bz).setPosition(from);
}

export function buildBody(scene) {
  const who = 0.37;
  const mAll = washMaterial({ who }), mCit = washMaterial({ who }), mReb = washMaterial({ who });
  const mats = [mAll, mCit, mReb];
  for (const m of mats) m.uniforms.uStill.value = 1;
  /* close to, a pen line a hair wide */
  const lines = QUALITY.pen ? mats.map((m) => lineMaterial(m, { width: 1.5, min: 0.0006, max: 0.02 })) : null;
  const rig = new THREE.Group();
  rig.name = 'The one you walk as';
  const mk = (geo, k = 0) => {
    const g = new THREE.Group();
    g.matrixAutoUpdate = false;
    const a = new THREE.Mesh(geo, mats[k]);
    g.add(a);
    if (lines) { const b = new THREE.Mesh(geo, lines[k]); b.userData.noShadow = true; g.add(b); }
    rig.add(g);
    return g;
  };

  const upper = part([[tube(0.066, 0.054, UPPER), 0], [ball(0.07), 0], [ball(0.056, [1, 1, 1], [0, -UPPER, 0]), 0]]);
  const thigh = part([[tube(0.094, 0.072, THIGH), 0], [ball(0.075, [1, 1, 1], [0, -THIGH, 0]), 0]]);
  const B = {
    upL: mk(upper), upR: mk(upper), foL: mk(forearm(-1)), foR: mk(forearm(1)),
    thL: mk(thigh), thR: mk(thigh), shL: mk(shin()), shR: mk(shin()),
    torso: mk(part([
      [squash(new THREE.CylinderGeometry(0.2, 0.165, 0.5, 8, 1, true), 0.62, 1.2, 0), 0],
      [ball(0.212, [1.1, 0.42, 0.68], [0, 1.45, 0]), 0],
      [ball(0.17, [1.0, 0.72, 0.74], [0, 0.95, 0]), 0],
      [ball(0.012, [1, 1, 0.5], [0.02, 1.3, -0.118]), 2, 0.6], [ball(0.012, [1, 1, 0.5], [0.02, 1.18, -0.106]), 2, 0.6], [ball(0.012, [1, 1, 0.5], [0.02, 1.06, -0.1]), 2, 0.6],
    ])),
    band: mk(band(), 1),
    coat: mk(part([[squash(new THREE.CylinderGeometry(0.17, 0.225, 0.44, 8, 1, true), 0.82, 0.77, 0), 0]]), 1),
    jacket: mk(part([[squash(new THREE.CylinderGeometry(0.17, 0.19, 0.17, 8, 1, true), 0.72, 0.9, 0), 0]]), 2),
    /* the pistol: it points along -z, and the hand is at its grip */
    pistol: mk(part([
      [slab(0.027, 0.03, 0.2, [0, 0.042, -0.075]), 2, 0.5],                                   // the slide
      [slab(0.022, 0.018, 0.17, [0, 0.019, -0.07]), 2, 0.4],                                  // the frame under it
      [new THREE.CylinderGeometry(0.0075, 0.0075, 0.03, 10).rotateX(Math.PI / 2).translate(0, 0.04, -0.187), 2, 0.4],
      [slab(0.026, 0.105, 0.04, [0, -0.035, 0.012]).rotateX(0.24), 2, 0.5],                   // the grip
      [new THREE.TorusGeometry(0.017, 0.0035, 6, 14, Math.PI).rotateZ(Math.PI).rotateY(Math.PI / 2).translate(0, 0.008, -0.035), 2, 0.3],
      [slab(0.006, 0.007, 0.008, [0, 0.06, -0.168]), 2, 0.3], [slab(0.016, 0.007, 0.006, [0, 0.06, 0.018]), 2, 0.3],
      [slab(0.01, 0.014, 0.012, [0, 0.05, 0.03]), 2, 0.3],                                    // the hammer
    ]), 2),
  };
  const hands = [-1,1].map((side) => {
    const grip={value:.18}, material=washMaterial({who,hand:grip});
    material.uniforms.uGone=mAll.uniforms.uGone;material.uniforms.uStill.value=1;
    const geometry=animatedHandGeometry(side),group=new THREE.Group();
    group.name=side<0?'Left articulated hand':'Right articulated hand';
    group.position.y=-FORE;group.add(new THREE.Mesh(geometry,material));
    if(QUALITY.pen) group.add(new THREE.Mesh(geometry,lineMaterial(material,{width:.7,min:.0003,max:.003})));
    (side<0?B.foL:B.foR).add(group);
    return {grip};
  });
  rig.traverse((o) => { o.frustumCulled = false; o.userData.free = true; });
  rig.visible = false;
  scene.add(rig);

  /* what he is doing, each a weight from 0 to 1 */
  const S = {
    yaw: Math.PI, first: true, speed: 0, phase: 0,
    ladder: 0, fall: 0, shield: 0, shieldT: -100, look: 0, lookT: -100, lookKind: 0,
    dip: 0, dipV: 0, now: 0,
  };
  const q = new THREE.Quaternion(), qi = new THREE.Quaternion(), UP = V(0, 1, 0);
  const sh = V(), el = V(), wr = V(), hip = V(), kn = V(), an = V(), tg = V(), pole = V(), front = V(), t1 = V(), t2 = V();
  const m4 = new THREE.Matrix4();
  let cam = null;
  const fromView = (v) => rig.worldToLocal(v.applyMatrix4(cam.matrixWorld));
  const dirFromView = (v) => v.applyQuaternion(cam.quaternion).applyQuaternion(qi);
  const fromWorld = (v) => rig.worldToLocal(v);
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const bell = (t, a, hold, b) => (t < 0 ? 0 : t < a ? smooth(t / a) : t < a + hold ? 1 : 1 - smooth(clamp((t - a - hold) / b)));

  /* a rung for a hand or a foot. y0: the height that wants one (an eye, a hip). up, down: how far above
     and below it a rung is held before the next is reached for. odd: the right hand and the left foot
     take the rungs between. Returns the rung's place in the world, on its way to the next if it is time. */
  function rung(L, y0, up, down, odd, side, out) {
    const c = L.c0 + (odd ? 0.3 : 0);
    const k = Math.floor((y0 + up - c) / 0.6);
    let y = c + 0.6 * k;
    const f = 1 - (y - y0 + down) / (up + down);          // 0 just taken, 1 about to be let go
    let lift = 0;
    if (f > 0.76) { const t = smooth((f - 0.76) / 0.24); y += 0.6 * t; lift = Math.sin(t * Math.PI); }
    const yy = Math.min(y, L.top);
    /* past the last rung there is the top of the wall, or the rim of the manhole */
    out.set(L.x + side * (y > L.top ? 0.3 : 0.15), yy + (y > L.top ? 0.05 : 0), L.z0 + L.lean * yy + (y > L.top ? -0.12 : 0) + lift * 0.13);
    return out;
  }

  return {
    rig, EYE,
    /* how the eye is moved by what happens to him: turned (radians) and lowered (metres) */
    lookYaw: 0, lookPitch: 0, dip: 0, widen: 0,
    /* he looks at his own sleeve. kind 0: the band. 1: the band going, and the pistol in his hand */
    glance(kind = 0) { S.lookT = S.now; S.lookKind = kind; },
    /* something has exploded: the hands come up, and the knees give */
    blast(power = 1, knock = true) { S.shieldT = S.now; if (knock) S.dipV += 2.4 * power; },
    /* he has come down hard: speed is how fast, in metres a second */
    land(speed) { S.dipV += Math.min(speed, 9) * 0.72; },
    /* every frame, before the eye is placed */
    tick(dt, reduce) {
      S.now += dt;
      /* the knees: a spring */
      S.dipV += (-52 * S.dip - 9.5 * S.dipV) * dt;
      S.dip = Math.max(0, S.dip + S.dipV * dt);
      if (S.dip === 0 && S.dipV < 0) S.dipV = 0;
      this.dip = S.dip;
      S.look = bell(S.now - S.lookT, 0.8, S.lookKind ? 1.5 : 1.25, 0.8);
      S.shield = bell(S.now - S.shieldT, 0.1, 0.95, 1.3);
      const k = reduce ? 0 : S.look;
      this.lookYaw = -0.62 * k;
      this.lookPitch = -1.04 * k - (reduce ? 0 : 0.75 * S.fall + 0.5 * clamp(S.dip / 0.3));
    },
    /* every frame, once the eye is where it is.
       s: { camera, eye (Vector3), ground (y under him), heading (the way he walks, as a yaw, or null),
            show, armed, aim, moved (metres this frame), bob (metres walked in all), falling (0..1),
            ladder (null, or { x, z0, lean, c0, top }), ladderK, time } */
    update(s, dt) {
      const on = s.show > 0.004;
      rig.visible = on;
      this.widen = 6 * s.show;
      if (!on) { S.first = true; return; }
      cam = s.camera;
      /* the body faces the way he walks; the head may turn on it, so far */
      if (s.heading !== null) {
        if (S.first) S.yaw = s.heading;
        S.yaw += wrap(s.heading - S.yaw) * (1 - Math.exp(-dt * 5));
      }
      cam.getWorldDirection(t1);
      if (t1.x * t1.x + t1.z * t1.z > 0.04) {
        const view = Math.atan2(-t1.x, -t1.z), off = wrap(view - S.yaw);
        if (Math.abs(off) > 1.25) S.yaw = wrap(view - Math.sign(off) * 1.25);
      }
      S.first = false;
      /* he stands on the ground, or hangs from his own eye while he falls */
      const base = Math.max(s.ground, s.eye.y - EYE);
      const eyeH = clamp(s.eye.y - base, 0.9, EYE);
      rig.position.set(s.eye.x, base, s.eye.z);
      q.setFromAxisAngle(UP, S.yaw);
      rig.quaternion.copy(q);
      qi.copy(q).invert();
      rig.updateMatrixWorld(true);

      S.speed += (Math.min(s.moved / Math.max(dt, 1e-3), 9) - S.speed) * (1 - Math.exp(-dt * 7));
      const k = clamp(S.speed / 1.3);                     // 0 standing, 1 walking
      S.phase = s.bob / STRIDE;
      S.ladder += ((s.ladder ? s.ladderK : 0) - S.ladder) * (1 - Math.exp(-dt * 7));
      S.fall += (s.falling - S.fall) * (1 - Math.exp(-dt * (s.falling > S.fall ? 14 : 5)));
      const L = s.ladder, lad = S.ladder, fall = S.fall, sink = EYE - eyeH;
      const tau = Math.PI * 2;

      /* the body: it leans into a walk, and folds when the knees give */
      const tip = 0.045 * k + sink * 0.28, lean = tip * 1.3;
      m4.makeRotationX(-tip).setPosition(0, -sink * 0.92, HIP.z + 0.1);
      B.torso.matrix.copy(m4);
      B.coat.matrix.copy(m4);
      B.jacket.matrix.copy(m4);

      for (const side of [-1, 1]) {
        const R = side > 0;
        const targetGrip=clamp(.16 + lad*.78 + (R?s.armed*.72:s.armed*s.aim*.5) - Math.max(S.shield,fall)*.5);
        const grip=hands[R?1:0].grip;
        grip.value += (targetGrip-grip.value)*(1-Math.exp(-dt*12));
        /* ── a leg ── */
        const f = ((S.phase + (R ? 0.5 : 0)) % 1 + 1) % 1;
        const A = 0.36 * k;
        let fz, fy;
        if (f < 0.5) { fz = lerp(-A, A, f * 2); fy = 0; } else { const t = (f - 0.5) * 2; fz = lerp(A, -A, smooth(t)); fy = Math.sin(t * Math.PI) * 0.12 * k; }
        hip.set(side * HIP.x, HIP.y - sink * 0.92 - 0.018 * k * Math.abs(Math.sin(tau * S.phase)), HIP.z - lean);
        tg.set(side * 0.105, 0.085 + fy, HIP.z + fz - 0.03);
        /* falling: the legs hang, and feel for the ground */
        if (fall > 0.01) tg.lerp(t1.set(side * 0.14, 0.5 + 0.08 * Math.sin(s.time * 9 + side), -0.4 - side * 0.09 * Math.sin(s.time * 7)), fall);
        pole.set(side * 0.18, 0.1, -1);
        if (lad > 0.01 && L) {
          rung(L, s.eye.y - 1.38, 0.3, 0.3, R, side * 0.9, t1);
          t1.y += 0.09;
          tg.lerp(fromWorld(t1), lad);
          pole.set(side * 0.7, 0.2, -0.6);
        }
        reach(hip, tg, THIGH, SHIN, pole, kn, an);
        front.set(side * 0.12, 0, -1);
        setBone(R ? B.thR : B.thL, hip, kn, front);
        setBone(R ? B.shR : B.shL, kn, an, front);

        /* ── an arm ── */
        sh.set(side * SHOULDER.x, SHOULDER.y - sink, SHOULDER.z - lean - 0.1 * lad);
        const sw = (R ? 1 : -1) * Math.cos(tau * S.phase), fw = Math.max(sw, 0);
        tg.set(sh.x + side * (0.07 - 0.03 * fw * k), sh.y - 0.5 + 0.13 * k * fw, sh.z - 0.03 - 0.25 * k * sw);
        pole.set(side * 0.35, -0.25, 1);
        front.set(side * 0.7, 0, -0.7);                   // the back of the hand, and the band, look outward
        let upFront = front;
        /* in the sewer, and wherever the footing is bad, the arms come out to keep him upright */
        if (s.wade > 0.01) tg.lerp(fromView(t1.set(side * 0.36, -0.3 + 0.03 * Math.sin(tau * S.phase + side), -0.36)), s.wade * 0.85);
        if (R && s.gun > 0.01) {
          /* the pistol: held low, a little across him; raised when the fight is in front of him */
          const sway = Math.sin(tau * S.phase * 2) * 0.008 * k;
          t1.set(lerp(0.2, 0.12, s.aim), lerp(-0.175, -0.125, s.aim) + sway, lerp(-0.42, -0.5, s.aim));
          tg.lerp(fromView(t1), s.armed);
          pole.lerp(dirFromView(t2.set(0.8, -1, 0.5)), s.armed);
        }
        if (!R && s.gun > 0.5 && s.aim > 0.01) tg.lerp(fromView(t1.set(0.07, -0.17, -0.46)), s.aim);
        if (S.look > 0.01 && R) {
          /* the arm brought across him, so that he can see his own sleeve */
          tg.lerp(t1.set(-0.1, sh.y - 0.2, sh.z - 0.33), S.look);
          pole.lerp(t2.set(0.1, 0.5, -1), S.look);
        }
        if (fall > 0.01) {
          tg.lerp(fromView(t1.set(side * 0.37, -0.08 + 0.05 * Math.sin(s.time * 11 + side * 2), -0.36)), fall);
          pole.lerp(dirFromView(t2.set(side, -0.6, 0.4)), fall);
        }
        if (sink > 0.12 && lad < 0.5) tg.lerp(fromView(t1.set(side * 0.27, -0.3, -0.4)), clamp((sink - 0.12) / 0.2));
        if (lad > 0.01 && L) {
          rung(L, s.eye.y, 0.27, 0.33, R, side, t1);
          tg.lerp(fromWorld(t1), lad);
          pole.lerp(t2.set(side * 0.8, -1, 0.5), lad);
        }
        if (S.shield > 0.01) {
          tg.lerp(fromView(R ? t1.set(-0.07, -0.06, -0.3) : t1.set(0.06, 0.01, -0.25)), S.shield);
          pole.lerp(dirFromView(t2.set(side * 1.0, -1, 0.2)), S.shield);
        }
        reach(sh, tg, UPPER, FORE, pole, el, wr);
        if (R && S.look > 0.01) {
          /* the band turns to the eye */
          t1.set(0, eyeH, 0).sub(t2.copy(sh).lerp(el, 0.55));
          upFront = t2.copy(front).lerp(t1.normalize(), S.look);
        }
        setBone(R ? B.upR : B.upL, sh, el, upFront);
        /* a hand on a rung, or in front of a face, turns its fingers to it */
        if (lad > 0.3 || S.shield > 0.3 || fall > 0.3) front.set(0, 0.2, -1);
        setBone(R ? B.foR : B.foL, el, wr, front);
        if (R) {
          B.band.matrix.copy(B.upR.matrix);
          /* the pistol sits in the hand, and points where he looks */
          t1.copy(wr).sub(el).normalize();
          an.copy(wr).addScaledVector(t1, 0.075);
          cam.getWorldDirection(t2).applyQuaternion(qi);
          t2.y = lerp(t2.y - 0.3, t2.y, s.aim); t2.x -= 0.1 * (1 - s.aim);
          t2.normalize();
          bz.copy(t2).negate();
          bx.crossVectors(UP, bz).normalize();
          by.crossVectors(bz, bx);
          B.pistol.matrix.makeBasis(bx, by, bz).setPosition(an);
        }
      }
      rig.updateMatrixWorld(true);
      /* the citizen goes, a dot at a time, and the fighter comes */
      const gone = 1 - s.show;
      mAll.uniforms.uGone.value = gone;
      mCit.uniforms.uGone.value = Math.max(gone, s.armed);
      mReb.uniforms.uGone.value = Math.max(gone, 1 - s.armed);
      B.band.visible = B.coat.visible = s.armed < 0.996;
      B.jacket.visible = s.armed > 0.004;
      B.pistol.visible = false;
    },
  };
}
