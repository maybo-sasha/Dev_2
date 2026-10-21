/* ============================================================
   The monument at the end of the walk.

   The raised arm with its closed fist, bound in barbed wire,
   in the shape of a flame, standing on a stone in the fire: the
   artist's painting of it ("Flamebound Monument on Parchment"),
   lifted off its parchment (img/monument.webp) and stood on the
   mound at 18 Miła Street. It is the painting itself, at the
   quality it was painted, and not a model made after it.

   It is not flat. The sheet it is printed on is raised into a
   relief, thickest through the middle of the figure, so that as
   the eye moves it turns as a thing does. It keeps its own
   colours through the film's grade, the fire in it breathes, and
   it comes out of the air a grain at a time, from the foot up.
   ============================================================ */

import * as THREE from 'three';
import { world } from './common.js';

/* map: the painting, cut out. z: where on the street it stands. foot: the ground it stands on. */
export function buildMonument(scene, map, { x = 0, foot = 1.75, z = 0, height = 9 } = {}) {
  const W = height * map.image.width / map.image.height, H = height;
  const geo = new THREE.PlaneGeometry(W, H, 48, 64).translate(0, H / 2, 0);
  const U = { uMap: { value: map }, uShow: { value: 0 }, uGlow: { value: 0 }, uRelief: { value: 0.8 }, uTime: world.uTime };
  const vertexShader = /* glsl */ `
    uniform sampler2D uMap; uniform float uRelief;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      /* how far it stands off its page: read from a soft copy of its own outline */
      float h = textureLod(uMap, uv, 5.0).a;
      vec3 p = position + vec3(0.0, 0.0, smoothstep(0.2, 0.95, h) * uRelief);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const COMING = /* glsl */ `
    uniform sampler2D uMap; uniform float uShow;
    varying vec2 vUv;
    float coming(float a) {
      float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      return a * smoothstep(0.0, 0.3, uShow * 1.4 - vUv.y * 0.4 - n * 0.3);
    }
  `;
  const plate = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: U, vertexShader,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${COMING}
      uniform float uGlow, uTime;
      /* what must be drawn for the film's grade to print a given colour: its curve, walked back (toScene, in common.js) */
      vec3 unfilm(vec3 d) {
        vec3 y = pow(min(d, vec3(0.972)), vec3(2.2));
        vec3 a = 2.51 - 2.43 * y, b = 0.03 - 0.59 * y, c = -0.14 * y;
        return (-b + sqrt(b * b - 4.0 * a * c)) / (2.0 * a) / 1.05;
      }
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float a = coming(t.a);
        if (a < 0.02) discard;
        /* a little under its full strength: the lens adds its own glow to anything this bright */
        vec3 c = unfilm(t.rgb) * 0.88;
        /* the fire in it is alive: its light comes and goes */
        float fire = smoothstep(0.22, 0.6, t.r - t.b);
        c *= 1.0 + fire * uGlow * (0.14 + 0.1 * sin(uTime * 3.1 + vUv.y * 9.0) + 0.06 * sin(uTime * 7.3 + vUv.x * 13.0));
        gl_FragColor = vec4(c * a, a);
      }
    `,
  }));
  plate.renderOrder = 3;
  /* the same sheet, unseen, written into the depth of the picture: so the lens holds it in focus,
     and the fire behind it is behind it */
  const depth = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    colorWrite: false,
    uniforms: U, vertexShader,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${COMING}
      void main() { if (coming(texture2D(uMap, vUv).a) < 0.55) discard; gl_FragColor = vec4(0.0); }
    `,
  }));
  const group = new THREE.Group();
  group.name = 'The monument';
  group.position.set(x, foot, z);
  group.add(depth, plate);
  group.userData.noShadow = true;
  group.traverse((o) => { o.frustumCulled = false; o.userData.free = true; });
  group.visible = false;
  scene.add(group);
  return {
    group,
    top: foot + H * 0.985,                       // how high the tip of the flame reaches
    show(v) { U.uShow.value = v; group.visible = v > 0.002; },
    set glow(v) { U.uGlow.value = v; },
  };
}
