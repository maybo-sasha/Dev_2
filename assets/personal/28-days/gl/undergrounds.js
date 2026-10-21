/* ============================================================
   The two undergrounds, each in its own place.

   The ŻOB is told in the cellar under the street (props.js builds
   the room). Here it is filled with the people who were in it in
   the winter of 1942 and 1943: filling bottles with petrol, cleaning
   the few pistols, learning to aim one, carrying sacks of earth out
   of the tunnel they were digging.

   The ŻZW has a place of its own: the cellars of 7 Muranowska
   Street, on Muranowski Square, where its headquarters was. Its
   arms are on the table and against the wall, and a tunnel runs out
   of the cellar under the street and under the ghetto wall to the
   cellar of number 6, on the other side. Weapons came in by it.
   On 22 April 1943 some of its fighters went out by it.

   It is built well away from the street of the walk, and the film
   cuts to it and back.

   Sources: United States Holocaust Memorial Museum, Holocaust
   Encyclopedia (Warsaw Ghetto Uprising; Jewish Military Union).
   Yad Vashem, Shoah Resource Center. D. Libionka and L. Weinbaum,
   Heroes, Hucksters and Storytellers: on the Jewish Military Union,
   2011, on how little of what was long told about the ŻZW can be
   relied on.
   ============================================================ */

import * as THREE from 'three';
import { brickMaterial, woodMaterial, plainMaterial } from './materials.js';
import { washMaterial } from './ink.js';
import { box, at, merge, room } from './geo.js';
import { tableau } from './figures.js';
import { PLAN } from './plan.js';

const add = (scene, geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m); return m; };
const cyl = (r, h, seg = 8) => new THREE.CylinderGeometry(r, r, h, seg);

/* where the ŻZW cellar is: its middle line, its floor, and where the room, the tunnel and the far cellar end */
export const ZZW = { x: 70.6, floor: -3.4, z0: -371, room: -385, tunnel: -409, end: -415, half: 4, tw: 0.85 };

/* ── the ŻOB cellar: people getting ready ── */
export function buildPreparing(scene) {
  const b = PLAN.bunker1, y = b.floor;
  briefingTable(scene, -6.25, y, -384.4);
  const F = (pose, outfit, x, z, ry, props) => ({ pose, outfit, x, y, z, ry, props });
  return tableau(scene, [
    /* at the table: petrol into bottles, a rag into each neck */
    F('crew', 'fighter', -9.9, -387.15, 0, { bottle: true }),
    F('look', 'fighterW', -10.75, -386.2, Math.PI / 2, { bottle: true }),
    /* on the bunks: a pistol taken down and cleaned */
    F('seated', 'fighterB', -3.75, -378.2, -Math.PI / 2, { pistol: true }),
    F('seated', 'fighter', -3.75, -380.7, -Math.PI / 2 - 0.3),
    /* learning to aim: most of them had never held one */
    F('pistol', 'fighterW', -4.4, -390.6, Math.PI - 0.15, { pistol: true }),
    F('point', 'fighter', -3.5, -389.9, Math.PI + 0.5),
    /* earth out of the tunnel, a sack at a time */
    F('sack', 'fighter', -8.6, -394.6, 0.2, { sack: true }),
    F('carry', 'fighterB', -4.9, -396.2, 0.1, { case: true }),
    /* and someone at the foot of the stairs, listening */
    F('watch', 'fighter', -3.3, -373.6, 2.4),
    /* in the tunnel itself */
    F('stoop', 'fighterB', -7.35, -421, Math.PI),
    F('duck', 'fighter', -5.65, -431.5, Math.PI),
  ], washMaterial());
}

/* ── the ŻZW: 7 Muranowska ── */
export function buildZzw(scene, lights) {
  const Z = ZZW, x0 = Z.x - Z.half, x1 = Z.x + Z.half, y0 = Z.floor, y1 = -0.9, ty = -1.5;
  briefingTable(scene, Z.x + .7, y0, -379.6);
  const tx0 = Z.x - Z.tw, tx1 = Z.x + Z.tw;
  const brick = [], earth = [], wood = [], iron = [];

  /* the cellar */
  brick.push(room(x0, x1, y0, y1, Z.room, Z.z0, { north: false }));
  /* its far wall, and the way into the tunnel through it */
  brick.push(at(box(tx0 - x0, y1 - y0, 0.4), (x0 + tx0) / 2, (y0 + y1) / 2, Z.room - 0.2));
  brick.push(at(box(x1 - tx1, y1 - y0, 0.4), (tx1 + x1) / 2, (y0 + y1) / 2, Z.room - 0.2));
  brick.push(at(box(tx1 - tx0, y1 - ty, 0.4), Z.x, (ty + y1) / 2, Z.room - 0.2));
  for (let z = Z.z0 - 1.4; z > Z.room; z -= 2.3) wood.push(at(box(x1 - x0, 0.2, 0.24), Z.x, y1 - 0.1, z));
  /* the tunnel: earth, held up with timber every stride and a half */
  earth.push(room(tx0, tx1, y0, ty, Z.tunnel, Z.room - 0.4, { north: false, south: false }));
  for (let z = Z.room - 1.2; z > Z.tunnel + 0.5; z -= 1.55) {
    wood.push(at(box(tx1 - tx0, 0.14, 0.16), Z.x, ty - 0.07, z));
    for (const x of [tx0 + 0.08, tx1 - 0.08]) wood.push(at(box(0.14, ty - y0, 0.16), x, (y0 + ty) / 2, z));
  }
  for (let z = Z.room - 2; z > Z.tunnel; z -= 0.42) wood.push(at(box(tx1 - tx0 - 0.3, 0.04, 0.36), Z.x, y0 + 0.02, z));   // boards underfoot
  /* the cellar of number 6, on the other side of the wall */
  const fx0 = Z.x - 2.8, fx1 = Z.x + 2.8;
  brick.push(room(fx0, fx1, y0, y1, Z.end, Z.tunnel, { south: false }));
  brick.push(at(box(tx0 - fx0, y1 - y0, 0.4), (fx0 + tx0) / 2, (y0 + y1) / 2, Z.tunnel + 0.2));
  brick.push(at(box(fx1 - tx1, y1 - y0, 0.4), (tx1 + fx1) / 2, (y0 + y1) / 2, Z.tunnel + 0.2));
  brick.push(at(box(tx1 - tx0, y1 - ty, 0.4), Z.x, (ty + y1) / 2, Z.tunnel + 0.2));

  /* what was in it: a table, a machine gun on the table, rifles against the wall, boxes */
  const tX = x0 + 1.5, tZ = -378;
  wood.push(at(box(0.95, 0.07, 2.1), tX, y0 + 0.8, tZ));
  for (const dx of [-0.4, 0.4]) for (const dz of [-0.95, 0.95]) wood.push(at(box(0.07, 0.8, 0.07), tX + dx, y0 + 0.4, tZ + dz));
  const gy = y0 + 0.95;
  iron.push(at(box(0.09, 0.11, 0.62), tX, gy, tZ));                                   // the body of the gun
  iron.push(at(cyl(0.022, 0.6).rotateX(Math.PI / 2), tX, gy + 0.01, tZ - 0.6));       // its barrel
  iron.push(at(box(0.05, 0.13, 0.26), tX, gy - 0.03, tZ + 0.42));                     // the butt
  iron.push(at(cyl(0.012, 0.3), tX - 0.09, gy - 0.1, tZ - 0.55, 0, 0, 0.5), at(cyl(0.012, 0.3), tX + 0.09, gy - 0.1, tZ - 0.55, 0, 0, -0.5));
  iron.push(at(box(0.2, 0.03, 0.16), tX + 0.02, y0 + 0.86, tZ + 0.75));               // a belt of rounds, in its tin
  wood.push(at(box(0.08, 1.0, 2.9), x0 + 0.1, y0 + 0.75, -382.3));                    // the rack
  for (let i = 0; i < 7; i++) {
    const z = -381.1 - i * 0.38;
    iron.push(at(box(0.045, 1.18, 0.06), x0 + 0.3, y0 + 0.6, z, 0, 0, 0.16));
    wood.push(at(box(0.05, 0.42, 0.09), x0 + 0.37, y0 + 0.22, z, 0, 0, 0.16));
  }
  const crates = [[x1 - 0.7, -373.2, 0.1], [x1 - 0.75, -374.3, -0.15], [x0 + 0.8, -373.6, 0.3], [x1 - 0.7, -383.6, 0.2], [Z.x + 1.9, -410.6, 0.2], [Z.x + 1.8, -411.8, -0.1], [Z.x - 1.9, -413.6, 0.3], [Z.x - 1.7, -412.4, 0]];
  for (const [cx, cz, r] of crates) {
    wood.push(at(box(0.85, 0.42, 0.5), cx, y0 + 0.21, cz, r));
    if (r > 0.05) wood.push(at(box(0.8, 0.38, 0.46), cx, y0 + 0.61, cz, r * 1.6));
  }
  /* the way up to the yard of number 6: a ladder, and daylight round a trap door */
  for (const s of [-1, 1]) wood.push(at(box(0.06, 2.7, 0.07), Z.x + s * 0.24, y0 + 1.3, Z.end + 0.45, 0, 0.2));
  for (let y = y0 + 0.3; y < y1 - 0.1; y += 0.3) wood.push(at(box(0.5, 0.035, 0.045), Z.x, y, Z.end + 0.7 - (y - y0) * 0.2));

  add(scene, merge(brick), brickMaterial({ tint: [0.78, 0.74, 0.7], damp: 1, side: THREE.DoubleSide }));
  add(scene, merge(earth), plainMaterial({ color: [0.085, 0.066, 0.048], rough: 0.9, side: THREE.DoubleSide }));
  add(scene, merge(wood), woodMaterial({ tint: [0.15, 0.1, 0.065], plank: 0.2, vertical: 0, side: THREE.DoubleSide }));
  add(scene, merge(iron), plainMaterial({ color: [0.03, 0.03, 0.032], rough: 0.25 }));

  /* lamps */
  const lampGeo = merge([at(cyl(0.06, 0.12), 0, 0.06, 0), at(new THREE.SphereGeometry(0.055, 8, 6), 0, 0.2, 0, 0, 0, 0, 1, 1.5, 1)]);
  const lampMat = plainMaterial({ color: [0.3, 0.2, 0.1], emissive: [2.2, 1.2, 0.4] });
  add(scene, merge([at(lampGeo.clone(), tX + 0.2, y0 + 0.835, tZ + 0.2), at(lampGeo.clone(), tx1 - 0.14, ty - 0.5, -396.5)]), lampMat);
  lights.add({ pos: new THREE.Vector3(tX + 0.3, y0 + 1.3, tZ + 0.2), color: new THREE.Color(1.0, 0.6, 0.26), base: 2.6, group: 'bunker1', flicker: 0.18 });
  lights.add({ pos: new THREE.Vector3(Z.x + 2.2, y0 + 1.7, -381.5), color: new THREE.Color(1.0, 0.58, 0.24), base: 1.5, group: 'bunker1', flicker: 0.2 });
  lights.add({ pos: new THREE.Vector3(Z.x + 0.5, ty - 0.45, -396.5), color: new THREE.Color(1.0, 0.58, 0.24), base: 1.5, group: 'bunker1', flicker: 0.25 });
  lights.add({ pos: new THREE.Vector3(Z.x, y1 - 0.3, Z.end + 0.9), color: new THREE.Color(0.75, 0.82, 0.95), base: 2.4, group: 'bunker1', flicker: 0 });

  /* the people of the ŻZW */
  const F = (pose, outfit, x, z, ry, props) => ({ pose, outfit, x, y: y0, z, ry, props });
  const people = tableau(scene, [
    F('crew', 'fighter', tX + 0.85, tZ - 0.2, -Math.PI / 2),                          // over the gun, stripping it
    F('pistolDn', 'fighterB', tX + 0.9, tZ + 1.3, -2.2, { pistol: true }),
    F('stand', 'fighter', x0 + 1.15, -382.4, -Math.PI / 2, { rifle: 'hands' }),       // a rifle taken from the rack
    F('kneel', 'fighterB', x1 - 1.55, -373.8, Math.PI / 2),                           // at the boxes
    F('seated', 'fighterW', x1 - 0.7, -376.4, -Math.PI / 2),
    F('watch', 'fighter', tx1 + 0.7, Z.room + 0.8, 0.6, { rifle: 'slung' }),          // at the mouth of the tunnel
    /* coming through with what was bought on the other side */
    F('carry', 'fighter', tx0 + 0.32, -393.4, 0, { case: true }),
    F('sack', 'fighterB', tx0 + 0.34, -403.2, 0, { sack: true }),
    F('look', 'fighter', Z.x + 1.5, -412.9, 2.2),
  ], washMaterial());
  return { people };
}

// A deliberately schematic preparation map, never a claimed historical document.
function briefingTable(scene, x, y, z) {
  const timber=[at(box(1.35,.08,1.9),x,y+.8,z)];
  for(const dx of [-.55,.55]) for(const dz of [-.8,.8]) timber.push(at(box(.09,.8,.09),x+dx,y+.4,z+dz));
  for(const dz of [-.65,.65]) timber.push(at(box(1.1,.08,.09),x,y+.25,z+dz));
  add(scene,merge(timber),woodMaterial({tint:[.23,.15,.085],plank:.18,vertical:0}));
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c4b38c';ctx.fillRect(0,0,512,768);
  ctx.strokeStyle='#62523c';ctx.lineWidth=3;
  for(let j=0;j<7;j++)for(let i=0;i<4;i++){ctx.strokeRect(34+i*119,35+j*106,83,72);ctx.fillStyle=(i+j)%3?'#9d8c6940':'#77674740';ctx.fillRect(38+i*119,39+j*106,75,64);}
  ctx.strokeStyle='#803f2b';ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(140,50);ctx.lineTo(140,430);ctx.lineTo(378,430);ctx.lineTo(378,685);ctx.stroke();ctx.setLineDash([]);
  for(const [px,pz] of [[140,170],[260,430],[378,620]]){ctx.beginPath();ctx.arc(px,pz,18,0,Math.PI*2);ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(.94,1.42),new THREE.MeshBasicMaterial({map:texture,color:0xc4b18d,side:THREE.DoubleSide}));paper.rotation.x=-Math.PI/2;paper.rotation.z=.08;paper.position.set(x,y+.846,z);scene.add(paper);
  const objects=[];
  for(let i=0;i<3;i++)objects.push(at(box(.18,.008,.26),x+.43,y+.851+i*.008,z+.5-i*.025,.16));
  add(scene,merge(objects),plainMaterial({color:[.55,.46,.31],rough:.9}));
  add(scene,at(new THREE.CylinderGeometry(.014,.014,.25,8).rotateZ(Math.PI/2),x-.35,y+.865,z+.55),plainMaterial({color:[.13,.085,.045],rough:.8}));
  const mug=at(new THREE.CylinderGeometry(.058,.048,.12,12,1,true),x+.49,y+.91,z-.66);
  add(scene,mug,plainMaterial({color:[.18,.19,.16],rough:.45,side:THREE.DoubleSide}));
}
