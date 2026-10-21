/* ============================================================
   The sun's shadows.

   The street is drawn once more from where the sun is, keeping
   only how far away each thing is. Every surface then asks that
   picture whether something stands between it and the sun. It is
   what puts one side of the street in shade and lays the shadow
   of a house, a bridge or a person across the cobbles.

   The world does not move, so the picture is only redrawn when
   the walker has gone a few metres or the hour has changed.
   ============================================================ */

import * as THREE from 'three';
import { world } from './common.js';

const SIZE = 2048;      // texels across the picture
const R = 62;           // metres from its middle to its edge

export function buildShadow(renderer, scene) {
  const depth = new THREE.DepthTexture(SIZE, SIZE, THREE.UnsignedIntType);
  depth.minFilter = depth.magFilter = THREE.NearestFilter;
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE, { depthTexture: depth });
  const cam = new THREE.OrthographicCamera(-R, R, R, -R, 1, 320);
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
  world.uShadowMap.value = depth;

  const last = { c: new THREE.Vector3(1e9, 0, 0), d: new THREE.Vector3() };
  const centre = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
  const texel = (2 * R) / SIZE;
  let skip = null;

  /* what cannot throw a shadow: light, smoke, glass, the sky */
  function collect() {
    skip = [];
    scene.traverse((o) => {
      if (!o.isMesh && !o.isPoints) return;
      const m = o.material;
      let inGroup = false, p = o;
      while (p) { if (p.userData.noShadow) inGroup = true; p = p.parent; }
      if (o.isPoints || inGroup || m.transparent || m.depthWrite === false || m.depthTest === false || m.blending === THREE.AdditiveBlending) skip.push(o);
    });
  }

  return {
    target,
    /* camPos, lookDir: where the walker is and is facing. strength: 0 no sun, 1 full sun. */
    update(camPos, lookDir, sunDir, strength, force = false) {
      world.uShadowOn.value = strength;
      if (strength < 0.01) return false;
      centre.set(camPos.x + lookDir.x * 26, 6, camPos.z + lookDir.z * 26);
      if (!force && centre.distanceTo(last.c) < 3 && sunDir.distanceTo(last.d) < 0.003) return false;

      /* line the picture up on a fixed grid, so shadows do not crawl as it moves */
      fwd.copy(sunDir).negate();
      right.crossVectors(Math.abs(sunDir.y) > 0.98 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0), fwd).normalize();
      up.crossVectors(fwd, right).normalize();
      const a = centre.dot(right), b = centre.dot(up);
      centre.addScaledVector(right, Math.round(a / texel) * texel - a).addScaledVector(up, Math.round(b / texel) * texel - b);
      last.c.copy(centre); last.d.copy(sunDir);

      cam.position.copy(centre).addScaledVector(sunDir, 160);
      cam.up.copy(up);
      cam.lookAt(centre);
      cam.updateMatrixWorld();
      world.uShadowMat.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

      if (!skip) collect();
      for (const o of skip) { o.userData.wasVisible = o.visible; o.visible = false; }
      const prev = renderer.getRenderTarget();
      scene.overrideMaterial = mat;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, cam);
      scene.overrideMaterial = null;
      renderer.setRenderTarget(prev);
      for (const o of skip) o.visible = o.userData.wasVisible;
      return true;
    },
  };
}
