import * as THREE from 'three';
import { person } from '../../../assets/personal/28-days/gl/figures.js';
import { dogParts } from '../../../assets/personal/28-days/gl/dogs.js';
import { Tenements } from '../../../assets/personal/28-days/gl/tenement.js';
import { world } from '../../../assets/personal/28-days/gl/common.js';
import type { Chapter } from '../narrative/content.ts';

type View = { eye:[number,number,number]; target:[number,number,number] };
const streetViews:View[]=[{eye:[-1,2,16],target:[1,2,-10]},{eye:[-2,2,9],target:[1,4,-11]},{eye:[0,2,5],target:[1,3,-12]},{eye:[-3,1.7,2],target:[1,2,-10]},{eye:[2,2,-4],target:[4,3,-27]},{eye:[0,2,1],target:[0,2,-12]}];
const squareViews:View[]=[{eye:[-5,2,15],target:[2,4,-7]},{eye:[-8,7,6],target:[2,3,-8]},{eye:[7,12,3],target:[-3,3,-8]}];
export class ExperienceRuntime {
 private renderer:THREE.WebGLRenderer;
 private scene=new THREE.Scene();
 private camera=new THREE.PerspectiveCamera(52,1,.1,160);
 private root=new THREE.Group();
 private frame=0; private last=0; private stopped=false;
 private paused=false; private comfort=false; private chapter:Chapter|null=null;
 private destination=new THREE.Vector3(); private look=new THREE.Vector3(); private targetLook=new THREE.Vector3();
 private gate:THREE.Group|null=null; private observer:ResizeObserver;
 private materials=new Map<number,THREE.MeshStandardMaterial>();
 private quality='auto'; private sample:number[]=[]; private ratio=Math.min(devicePixelRatio,1.5);
 private onLost=(e:Event)=>{e.preventDefault();this.fail('The 3D view was interrupted. Your place is preserved in reading mode.');};
 constructor(private canvas:HTMLCanvasElement,private fail:(message:string)=>void){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(this.ratio);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene.background=new THREE.Color('#b9a087');this.scene.fog=new THREE.Fog('#b9a087',35,100);
  this.scene.add(new THREE.HemisphereLight(0xd7d6cc,0x514333,2));
  const sun=new THREE.DirectionalLight(0xffd6a0,3);sun.position.set(-12,24,-18);this.scene.add(sun);
  this.scene.add(this.root);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
  canvas.addEventListener('webglcontextlost',this.onLost);
  this.frame=requestAnimationFrame(this.tick);
 }
 private resize(){const {width,height}=this.canvas.getBoundingClientRect();this.renderer.setSize(Math.max(1,width),Math.max(1,height),false);this.camera.aspect=width/Math.max(1,height);this.camera.updateProjectionMatrix();}
 private material(color:number){if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.95,flatShading:true}));return this.materials.get(color)!;}
 private box(w:number,h:number,d:number,x:number,y:number,z:number,color=0x81776a,parent:THREE.Object3D=this.root){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.material(color));m.position.set(x,y,z);parent.add(m);return m;}
 private figure(x:number,z:number,index:number,soldier=false){
  const outfits=['man','woman','manHat','child','woman','man'];
  const geo=(person as (...args:unknown[])=>THREE.BufferGeometry)(soldier?'stand':'carry',soldier?'soldier':outfits[index%outfits.length],soldier?{}:{case:index%2===0});
  const tone=geo.getAttribute('aTone');const colors=new Float32Array(tone.count*3);
  const palette=(soldier?[0x777867,0x4e534a,0x252923,0x584431]:[0x9e8164,0x6c5847,0x342e28,0x876447]).map(c=>new THREE.Color(c));
  for(let i=0;i<tone.count;i++){const c=palette[Math.min(3,Math.max(0,Math.round(tone.getX(i))))];c.toArray(colors,i*3);}
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1});
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,0,z);mesh.rotation.y=Math.PI;this.root.add(mesh);
 }
 private dog(x:number,z:number){
  const parts=dogParts() as Record<string,THREE.BufferGeometry>;const group=new THREE.Group();group.position.set(x,.55,z);group.rotation.y=Math.PI;this.root.add(group);
  for(const key of ['body','head','jaw','tail']){const mesh=new THREE.Mesh(parts[key],this.material(key==='body'?0x39352e:0x94724b));if(key==='head')mesh.position.set(0,0,.58);if(key==='jaw')mesh.position.set(0,.15,.82);if(key==='tail')mesh.position.set(0,0,-.15);group.add(mesh);}
  for(const x of [-.14,.14])for(const z of [.03,.56]){const leg=new THREE.Mesh(parts.upper.clone(),this.material(0x72563e));leg.position.set(x,-.05,z);group.add(leg);const lower=new THREE.Mesh(parts.lower.clone(),this.material(0x72563e));lower.position.set(x,-.27,z);group.add(lower);}
  for(const [key,g] of Object.entries(parts))if(!['body','head','jaw','tail'].includes(key))g.dispose();
 }
 private clear(){const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>();this.root.traverse(o=>{if(o instanceof THREE.Mesh){gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){ms.add(m);if(m instanceof THREE.ShaderMaterial)for(const u of Object.values(m.uniforms))if(u.value instanceof THREE.Texture&&u.value!==world.uNoise.value)ts.add(u.value);}}});this.root.clear();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());this.materials.clear();this.gate=null;}
 setChapter(c:Chapter){this.clear();this.chapter=c;const outside=['street','square','station','passage'].includes(c.scene);const dark=['night','blocked','mila'].includes(c.variant)||!outside;
  this.scene.background=new THREE.Color(dark?'#2e302d':c.variant==='ruined'||c.variant==='burned'?'#81786b':'#b9a087');(this.scene.fog as THREE.Fog).color.copy(this.scene.background);
  world.uSunCol.value.setRGB(.9,.7,.46);world.uSkyCol.value.setRGB(.44,.46,.45);
  this.box(120,.2,140,0,-.15,-20,0x776b59);
  if(outside){
   const buildings=new Tenements();const gap=c.scene==='square'?15:10;
   for(const side of [-1,1])buildings.row({from:-55,to:28,line:gap*side,side:side<0?Math.PI/2:-Math.PI/2,seed:side+8,hMin:13,hMax:21,D:12,force:{burn:9999,ruin:9999}});
   buildings.meshes().forEach((mesh:THREE.Mesh)=>this.root.add(mesh));
   // Instanced paving keeps the shared street recognizable across its four states.
   const paving=new THREE.InstancedMesh(new THREE.BoxGeometry(.85,.1,.65),this.material(0x8c806e),1600);const matrix=new THREE.Matrix4();let n=0;
   for(let z=-35;z<25;z+=.85)for(let x=-8;x<8;x+=1.05){matrix.makeTranslation(x+(Math.round(z/.85)%2)*.4,-.015,z);paving.setMatrixAt(n++,matrix);}paving.count=n;this.root.add(paving);
   for(const side of [-1,1])this.box(2,.18,80,side*9,0,-12,0xafa08c);
   if(c.order===1){
    this.box(20,5,.7,-13,2.5,-12,0x786957);this.box(20,5,.7,13,2.5,-12,0x786957);
    for(const x of [-3.4,3.4]){this.box(.8,6,1,x,3,-12,0x8a7460);this.box(1.1,.35,1.3,x,6.1,-12,0xb59a7c);}
    for(let y=1;y<5;y+=.5){this.box(20,.035,.75,-13,y,-12,0x51473d);this.box(20,.035,.75,13,y,-12,0x51473d);}
    this.gate=new THREE.Group();this.root.add(this.gate);for(const x of [-1.5,1.5])this.box(2.9,4.6,.2,x,2.3,-12,0x3f3b32,this.gate);
    this.figure(4,-10,1,true);this.figure(-4,-11,2,true);this.dog(5,-9);
   }
   if(c.order<=2||c.scene==='passage'){for(let i=0;i<(c.order===2?18:7);i++)this.figure((i%3-1)*1.7,10-Math.floor(i/3)*3-i%2,i);}
   if(c.scene==='station'){for(let z=-25;z<8;z+=12){this.box(5,3.5,10,4,2,z,0x54463a);for(let y=1;y<4;y+=.3)this.box(5.03,.045,10.03,4,y,z,0x302c25);for(const x of [2,6])for(const dz of [-3,3]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.3,12),this.material(0x292c28));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.55,z+dz);this.root.add(wheel);}}for(const x of [2.8,5.2])this.box(.12,.15,90,x,0,-20,0x3b3b34);this.box(.65,.5,.3,-1,.25,4,0x584635);}
   if(c.variant==='ruined'||c.variant==='burned'){for(let i=0;i<90;i++){const a=i*2.399;const r=3+(i%9);const m=this.box(.7+(i%3)*.4,.4+(i%4)*.3,.8,Math.cos(a)*r,.2,Math.sin(a)*17-8,0x66594d);m.rotation.set(i*.12,i*.73,i*.24);}this.box(1.7,8,.6,-7,4,-5,0x34332f);}
  }else if(c.scene==='sewer'){
   for(let z=-27;z<20;z+=3){const arch=new THREE.Mesh(new THREE.TorusGeometry(2.3,.22,5,16,Math.PI),this.material(0x655c4e));arch.position.set(0,1,z);this.root.add(arch);}
   this.box(.4,1.5,50,-2.3,.6,-5,0x5f584c);this.box(.4,1.5,50,2.3,.6,-5,0x5f584c);this.box(2,.02,48,0,.01,-4,0x364443);
   for(let i=0;i<3;i++)this.figure((i%2-.5)*.8,-3-i*3,i);
   for(const x of [-.4,.4])this.box(.08,5,.1,x,2.5,-20,0x8b795a);for(let y=.3;y<5;y+=.4)this.box(.8,.06,.1,0,y,-20,0x8b795a);
  }else{
   this.box(.5,4.5,18,-6,2,-3,0x635b4e);this.box(.5,4.5,18,6,2,-3,0x635b4e);this.box(12,4.5,.4,0,2,-12,0x776b58);
   for(let x=-5;x<=5;x+=2){this.box(.2,.25,18,x,4,-3,0x483b2f);this.box(.2,4,.3,x,2,-11.7,0x483b2f);}
   if(c.scene==='shelter'){for(let x=-4;x<=4;x+=4){this.box(1.7,.4,2.3,x,.4,-6,0x4f4234);this.box(1.6,.14,2.2,x,.7,-6,0x9d8f74);}for(let i=0;i<4;i++){this.figure(-3+i*2,-3,i);this.box(.5,.7,.5,3+i*.55,.35,-9,0x7b745c);}this.box(1.4,2.4,.08,4,1.2,-11.7,c.variant==='blocked'?0x2f302a:0x393f34);this.box(.7,.5,.4,-4,3.2,-11.7,0x272c27);}
   else {for(const x of c.order===5?[-2.7,2.7]:[0]){this.box(3,.15,1.8,x,1,-5,0x6c5037);for(const dx of [-1.2,1.2])for(const z of [-5.7,-4.3])this.box(.12,1,.12,x+dx,.5,z,0x4a392b);this.box(.7,.025,.5,x,1.1,-5,0xd5c7a9);}this.figure(-3,-7,1);this.figure(2,-7,2);}
   const lamp=new THREE.PointLight(0xffd1a0,18,15,2);lamp.position.set(0,3,-4);this.root.add(lamp);
  }
  this.setBeat(0,true);this.renderer.compile(this.scene,this.camera);
 }
 setBeat(index:number,instant=false){if(!this.chapter)return;const c=this.chapter;let v:View;
  if(c.scene==='square')v=squareViews[Math.min(index,2)];
  else if(c.scene==='sewer')v={eye:[0,1.6,8-Math.min(index,4)*4],target:[0,1.5,-20]};
  else if(['room','shelter','archive'].includes(c.scene))v={eye:[index%2===0?-1:2,1.8,5-Math.min(index,4)],target:[c.order===5?(index===2?2.7:-2.7):0,1.4,-5]};
  else if(c.order===11||c.order===7)v={eye:[-7,6,10-Math.min(index,3)*3],target:[0,1,-12]};
  else v=streetViews[Math.min(index,streetViews.length-1)];
  this.destination.set(...v.eye);this.targetLook.set(...v.target);if(instant||this.comfort){this.camera.position.copy(this.destination);this.look.copy(this.targetLook);this.camera.lookAt(this.look);}
  if(this.gate){this.gate.scale.x=index>=5?1:.08;}
 }
 setPaused(value:boolean){this.paused=value;}
 setComfort(value:boolean){this.comfort=value;if(value){this.camera.position.copy(this.destination);this.look.copy(this.targetLook);}}
 setQuality(value:string){this.quality=value;this.ratio=value==='low'?1:value==='high'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.5);this.renderer.setPixelRatio(this.ratio);this.resize();}
 private tick=(now:number)=>{if(this.stopped)return;this.frame=requestAnimationFrame(this.tick);const dt=Math.min((now-this.last)/1000,.05);this.last=now;if(this.paused||document.hidden)return;
  this.camera.position.lerp(this.destination,this.comfort?1:1-Math.exp(-dt*2));this.look.lerp(this.targetLook,this.comfort?1:1-Math.exp(-dt*2));this.camera.lookAt(this.look);this.renderer.render(this.scene,this.camera);
  if(this.quality==='auto'&&dt>0){this.sample.push(dt);if(this.sample.length===180){const avg=this.sample.reduce((a,b)=>a+b,0)/180;if(avg>.033&&this.ratio>1){this.ratio=Math.max(1,this.ratio-.25);this.renderer.setPixelRatio(this.ratio);this.resize();}this.sample=[];}}
 };
 dispose(){this.stopped=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.canvas.removeEventListener('webglcontextlost',this.onLost);this.clear();this.renderer.dispose();}
}
