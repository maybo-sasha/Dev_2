import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Local wrist at the origin, fingers down -y, palm facing +z.
// Identical topology at every grip weight also supports the first-person shader.
export function handGeometry(side = 1, grip = 0) {
  const parts = [];
  const palm = new THREE.SphereGeometry(.047, 8, 5).scale(.94,1.12,.48).translate(0,-.045,0);
  parts.push(palm, new THREE.CylinderGeometry(.034,.036,.025,8).scale(1,1,.65).translate(0,-.008,0));
  const lengths = [.061,.073,.068,.053];
  for (let digit=0;digit<5;digit++) {
    const thumb=digit===4;
    const origin=new THREE.Vector3(thumb ? -side*.041 : side*(digit-1.5)*.021,thumb ? -.035 : -.079,thumb ? .005 : 0);
    const orientation=new THREE.Quaternion().setFromEuler(new THREE.Euler(thumb ? -.25 : -.10,0,thumb ? -side*.65 : side*(digit-1.5)*.035));
    const length=thumb ? .056 : lengths[digit];
    for(let joint=0;joint<3;joint++) {
      const len=length*[.44,.33,.23][joint];
      const bend=(thumb ? .45 : .85)*grip+(joint ? .12 : 0);
      orientation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-bend));
      const radius=(thumb ? .012 : .0095)*(1-joint*.13);
      const segment=new THREE.CylinderGeometry(radius,radius*.86,len,6,1,false).translate(0,-len/2,0);
      segment.applyQuaternion(orientation);segment.translate(...origin.toArray());parts.push(segment);
      const knuckle=new THREE.SphereGeometry(radius,6,3);knuckle.translate(...origin.toArray());parts.push(knuckle);
      origin.add(new THREE.Vector3(0,-len,0).applyQuaternion(orientation));
    }
  }
  const geometry=mergeGeometries(parts.map(g=>{const flat=g.toNonIndexed();flat.computeVertexNormals();g.dispose();return flat;}));
  const n=geometry.attributes.position.count;
  geometry.setAttribute('aTone',new THREE.Float32BufferAttribute(new Float32Array(n).fill(1),1));
  geometry.setAttribute('aEdge',new THREE.Float32BufferAttribute(new Float32Array(n).fill(.45),1));
  const star=new Float32Array(n*3);for(let i=0;i<n;i++)star[i*3+2]=-2;
  geometry.setAttribute('aStar',new THREE.Float32BufferAttribute(star,3));
  return geometry;
}

export function animatedHandGeometry(side) {
  const open=handGeometry(side),closed=handGeometry(side,1);
  open.setAttribute('aGripPosition',closed.attributes.position);
  open.setAttribute('aGripNormal',closed.attributes.normal);
  closed.dispose();
  return open;
}
