/* ============================================================
   1948.

   Five years after the ghetto was burnt, almost to the day, a
   state was declared. The last place in the walk is not Warsaw:
   a bare hill above the sea in the Western Galilee, where some of
   those who came out of the sewers founded a kibbutz and named it
   for the ghetto fighters. People stand on it at sunrise and watch
   a flag go up: the blue and white that had flown from a roof on
   Muranowski Square.

   It stands a long way beyond the end of the street, so that
   nothing of the ruins can be seen from it.
   ============================================================ */

import * as THREE from 'three';
import { world, GLSL_NOISE, GLSL_LIGHT, rng } from './common.js';
import { plainMaterial, flagMaterial } from './materials.js';
import { at, merge } from './geo.js';
import { crowd } from './figures.js';

export const HILL = { x: 0, z: -1412, rx: 80, ry: 18.5, rz: 70, base: 0.3 };
const CAP = Math.cos(0.9);
/* how high the hill stands at a place */
export const hillY = (x, z) => HILL.ry * (Math.sqrt(Math.max(0, 1 - ((x - HILL.x) / HILL.rx) ** 2 - ((z - HILL.z) / HILL.rz) ** 2)) - CAP) + HILL.base;

/* dry grass over stony ground, as the hills are there in May */
function landMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { ...world },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vN;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP; varying vec3 vN;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        vec3 N = normalize(vN);
        float a = fbm(vP.xz * 0.045), b = fbm(vP.xz * 0.31 + 9.0), c = nz(vP.xz * 5.0);
        vec3 grass = mix(vec3(0.2, 0.19, 0.09), vec3(0.33, 0.3, 0.14), a);
        vec3 stone = vec3(0.3, 0.27, 0.22);
        vec3 col = mix(grass, stone, smoothstep(0.55, 0.75, b)) * (0.8 + 0.4 * c);
        gl_FragColor = vec4(applyFog(shade(col, N, vP), vP), 1.0);
      }
    `,
  });
}

/* the sea: the sky lying in it, a slow swell, and the sun where it looks back */
function seaMaterial(sky) {
  return new THREE.ShaderMaterial({
    uniforms: { ...world, uSkyTop: sky.uSkyTop },
    vertexShader: /* glsl */ `
      varying vec3 vP;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vP;
      uniform vec3 uSkyTop;
      ${GLSL_NOISE}
      ${GLSL_LIGHT}
      void main() {
        float t = uTime;
        vec2 q = vP.xz * 0.06;
        float h1 = fbm(q + vec2(t * 0.012, t * 0.02)), h2 = fbm(q * 3.1 + vec2(-t * 0.03, t * 0.016));
        vec3 N = normalize(vec3((h1 - 0.5) * 0.35 + (h2 - 0.5) * 0.2, 1.0, (fbm(q * 2.0 + 5.0 + t * 0.015) - 0.5) * 0.4));
        vec3 V = normalize(cameraPosition - vP);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 deep = vec3(0.012, 0.05, 0.1);
        vec3 skyc = mix(uFogCol, uSkyTop, 0.55);
        vec3 c = mix(deep, skyc, 0.18 + 0.75 * fres);
        vec3 R = reflect(-V, N);
        c += uSunCol * pow(max(dot(R, uSunDir), 0.0), 220.0) * 2.5;
        gl_FragColor = vec4(applyFog(c, vP), 1.0);
      }
    `,
  });
}

/* sky: the uniforms of the sky, whose colour the sea takes */
export function buildIsrael(scene, sky) {
  const H = HILL;
  const group = new THREE.Group();
  group.name = 'A hill above the sea, 1948';
  const R = rng(1948);

  /* the hill, the country inland of it, and the hills on the skyline to the east */
  const cap = () => new THREE.SphereGeometry(1, 64, 14, 0, Math.PI * 2, 0, 0.9).translate(0, -CAP, 0);
  const land = [at(cap(), H.x, H.base, H.z, 0, 0, 0, H.rx, H.ry, H.rz)];
  land.push(new THREE.PlaneGeometry(2400, 760, 1, 1).rotateX(-Math.PI / 2).translate(0, 0.42, H.z - 20 - 380));
  for (let i = 0; i < 9; i++) {
    const r = 120 + R() * 190;
    land.push(at(cap(), -720 + i * 180 + (R() - 0.5) * 90, 0.3, H.z - 330 - R() * 190, 0, 0, 0, r, 70 + R() * 150, r * (0.6 + R() * 0.5)));
  }
  const ground = new THREE.Mesh(merge(land), landMaterial());
  group.add(ground);
  /* the sea, to the west */
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 900, 1, 1).rotateX(-Math.PI / 2), seaMaterial(sky));
  sea.position.set(0, 0.36, H.z + 430);
  group.add(sea);

  /* what grows on it: a few cypresses, dark and upright, and thorn */
  const trees = [], shrubs = [];
  for (const [x, z, h] of [[-13, -1420, 7.5], [-16.5, -1417, 6.2], [15, -1423, 8.2], [18.5, -1419, 6.6], [22, -1407, 5.4], [-24, -1404, 5.8], [11, -1436, 7]]) {
    trees.push(at(new THREE.ConeGeometry(h * 0.16, h, 9, 4), x, hillY(x, z) + h * 0.5 + 0.3, z), at(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 6), x, hillY(x, z) + 0.2, z));
  }
  for (let i = 0; i < 70; i++) {
    const a = R() * 6.28, d = 6 + Math.sqrt(R()) * 46;
    const x = Math.cos(a) * d, z = H.z + Math.sin(a) * d * 0.8;
    const s = 0.25 + R() * 0.5;
    shrubs.push(at(new THREE.IcosahedronGeometry(1, 0), x, hillY(x, z) + s * 0.4, z, R() * 6, 0, 0, s * (1 + R()), s * 0.7, s * (1 + R())));
  }
  group.add(new THREE.Mesh(merge(trees), plainMaterial({ color: [0.035, 0.06, 0.035], rough: 0.7 })));
  group.add(new THREE.Mesh(merge(shrubs), plainMaterial({ color: [0.09, 0.1, 0.05], rough: 0.7 })));

  /* the pole, on the crown of the hill, and the flag */
  const top = hillY(0, H.z);
  const POLE = 13.5;
  group.add(new THREE.Mesh(merge([
    at(new THREE.CylinderGeometry(0.055, 0.08, POLE, 8), 0, top + POLE / 2, H.z),
    at(new THREE.SphereGeometry(0.11, 8, 6), 0, top + POLE + 0.05, H.z),
    at(new THREE.CylinderGeometry(0.5, 0.62, 0.4, 10), 0, top + 0.1, H.z),
  ]), plainMaterial({ color: [0.2, 0.19, 0.17], rough: 0.4 })));
  const FW = 4.9, FH = 3.5;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH, 26, 12).translate(FW / 2, 0, 0), flagMaterial(1));
  flag.position.set(0.08, top + 2.4, H.z);
  group.add(flag);

  group.traverse((o) => { o.frustumCulled = false; o.userData.free = true; });
  group.visible = false;
  scene.add(group);

  /* those who watch it go up: they stand below the pole on the side of the sea, looking up at it */
  const kinds = ['man', 'woman3', 'hat2', 'woman', 'man2', 'girl', 'woman3', 'man', 'child', 'hat2', 'woman', 'watcher', 'man', 'woman3'];
  const people = [];
  kinds.forEach((kind, i) => {
    const a = (i / kinds.length - 0.5) * 2.5 + (R() - 0.5) * 0.25, d = 5.2 + (i % 3) * 1.5 + R() * 0.8;
    const x = Math.sin(a) * d, z = H.z + Math.cos(a) * d;
    people.push({ kind, x, y: hillY(x, z), z, ry: Math.atan2(-x, H.z - z) + (R() - 0.5) * 0.3, s: 0.95 + R() * 0.1 });
  });
  const watchers = crowd(scene, people);
  for (const x of watchers.meshes) { x.userData.free = true; x.visible = false; }

  return {
    group, flag, top,
    show(on) { group.visible = on; for (const x of watchers.meshes) x.visible = on; },
    /* k: 0 the flag at the foot of the pole, 1 at its head */
    raise(k) { flag.position.y = top + 2.4 + (POLE - 4.5) * k; },
  };
}
