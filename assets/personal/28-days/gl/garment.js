import * as THREE from 'three';

// A closed garment with an asymmetric seam and long, modeled cloth folds.
// Rings: [height, half-width, half-depth, horizontal offset, depth offset].
export function garment(rings, segments = 24, folds = 7) {
  const positions = [], uvs = [], indices = [];
  rings.forEach(([y, width, depth, x = 0, z = 0], row) => {
    const t = row / (rings.length - 1);
    for (let j = 0; j <= segments; j++) {
      const a = j / segments * Math.PI * 2;
      const pleat = 1 + .085 * Math.sin(a * folds + t * 1.4) + .035 * Math.cos(a * 11 - t * 3);
      positions.push(x + Math.cos(a) * width * pleat, y, z + Math.sin(a) * depth * pleat);
      uvs.push(j / segments, t);
      if (row && j) {
        const k = row * (segments + 1) + j;
        indices.push(k - 1, k, k - segments - 2, k, k - segments - 1, k - segments - 2);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function lapel(points, depth = .008) {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
