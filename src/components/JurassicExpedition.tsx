import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playEffect } from '../engine/soundEffects';
import { islandSound } from '../engine/jurassicAudio';
import { EXPEDITION_LESSONS } from '../data/expeditionCurriculum';
import { getSpeech } from '../engine/speech';
import type { Subject } from '../types';
import { JURASSIC_TUTORS } from '../data/jurassicTutors';
const MISSIONS=EXPEDITION_LESSONS.flatMap(l=>l.quiz.map(q=>({...q,title:l.title,subject:l.subject})));
const STATIONS=[new THREE.Vector3(0,0,4),new THREE.Vector3(-7,0,-3),new THREE.Vector3(8,0,-9),new THREE.Vector3(-6,0,-16),new THREE.Vector3(4,0,-23),new THREE.Vector3(0,0,-30)];
export function JurassicExpedition({onBack,onAnswer,onRescue,zombies,quiet,rescues}:{onBack:()=>void;onAnswer:(correct:boolean,subject:Subject)=>void;onRescue:()=>void;zombies:boolean;quiet:boolean;rescues:number}) {
 const host=useRef<HTMLDivElement>(null);const keys=useRef(new Set<string>());const checkpoint=useRef(0);const shield=useRef(0);
 const [error,setError]=useState('');const [mission,setMission]=useState(0);const [near,setNear]=useState(false);const [distance,setDistance]=useState(10);
 const [feedback,setFeedback]=useState('');const [solved,setSolved]=useState(false);const [finished,setFinished]=useState(false);
 const [shieldReady,setShieldReady]=useState(true);const shieldTimer=useRef<ReturnType<typeof setTimeout>>();
 const task=MISSIONS[(rescues*6+mission)%MISSIONS.length];
 useEffect(()=>()=>{getSpeech().stop();clearTimeout(shieldTimer.current);},[]);
 useEffect(()=>{checkpoint.current=mission;setSolved(false);setFeedback('');},[mission]);
 useEffect(()=>{
  if(!host.current)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('3D graphics are unavailable here. You can still complete the rescue questions.');setNear(true);return;}
  const container=host.current;container.appendChild(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#bec7a8');scene.fog=new THREE.FogExp2('#b3bdac',.017);
  const camera=new THREE.PerspectiveCamera(65,1,.1,200);camera.position.set(0,1.85,14);let yaw=0;
  scene.add(new THREE.HemisphereLight('#faeacd','#2d4e37',2.2));const sun=new THREE.DirectionalLight('#ffdaa3',3.8);sun.position.set(-20,35,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
  const make=(geometry:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=scene)=>{const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const texture=(kind:'grass'|'dirt'|'skin'|'sky')=>{const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d')!;
   if(kind==='sky'){const gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#728c9a');gradient.addColorStop(.6,'#c6c7aa');gradient.addColorStop(1,'#f3d59a');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,512);for(let n=0;n<12;n++){ctx.fillStyle='#fcebd82b';ctx.beginPath();ctx.ellipse((n*73)%512,60+(n*29)%180,80,13,0,0,Math.PI*2);ctx.fill();}}
   else{ctx.fillStyle=kind==='grass'?'#65734b':kind==='dirt'?'#b2a077':'#749177';ctx.fillRect(0,0,512,512);for(let n=0;n<9000;n++){const x=Math.random()*512,y=Math.random()*512;ctx.fillStyle=kind==='skin'?(n%2?'#294e3c45':'#d4c38930'):kind==='grass'?(n%2?'#34513388':'#a4b97c66'):(n%2?'#74634555':'#f2d8a755');ctx.beginPath();ctx.ellipse(x,y,kind==='skin'?2+Math.random()*5:1+Math.random()*2,kind==='grass'?5:2,Math.random()*Math.PI,0,Math.PI*2);ctx.fill();}}
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(kind!=='sky'){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='skin'?2:24,kind==='skin'?2:24);}return t;};
  const grass=texture('grass'),dirt=texture('dirt'),skin=texture('skin'),sky=texture('sky');scene.background=sky;
  const ground=make(new THREE.PlaneGeometry(180,180),'#54704a',0,0,0);ground.rotation.x=-Math.PI/2;(ground.material as THREE.MeshStandardMaterial).map=grass;(ground.material as THREE.MeshStandardMaterial).bumpMap=grass;(ground.material as THREE.MeshStandardMaterial).bumpScale=.08;
  const trail=make(new THREE.PlaneGeometry(9,65),'#8e8260',0,.015,-11);trail.rotation.x=-Math.PI/2;(trail.material as THREE.MeshStandardMaterial).map=dirt;
  const river=make(new THREE.PlaneGeometry(14,130),'#5f9c99',-28,.05,-10);river.rotation.x=-Math.PI/2;(river.material as THREE.MeshStandardMaterial).metalness=.45;(river.material as THREE.MeshStandardMaterial).roughness=.18;
  const obstacles:{x:number;z:number;r:number}[]=[];
  const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(1,2,0,5);leafShape.quadraticCurveTo(-1,2,0,0);
  const leafGeometry=new THREE.ShapeGeometry(leafShape,8);const leafMaterial=new THREE.MeshStandardMaterial({color:'#3c754e',side:THREE.DoubleSide,roughness:.9});
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,110*8);leaves.castShadow=true;scene.add(leaves);const dummy=new THREE.Object3D();dummy.rotation.order='YXZ';let leafCount=0;
  for(let i=0;i<110;i++){const x=Math.sin(i*7.3)*65,z=Math.cos(i*3.7)*65;if(Math.abs(x)<15&&z>-45&&z<25)continue;const height=7+i%4;obstacles.push({x,z,r:.8});make(new THREE.CylinderGeometry(.25,.6,height,10),'#695542',x,height/2,z);
   for(let j=0;j<8;j++){dummy.position.set(x,height,z);dummy.rotation.set(-1.0,j*Math.PI/4+i*.1,0);dummy.scale.set(1,1,1);dummy.updateMatrix();leaves.setMatrixAt(leafCount++,dummy.matrix);}}
  leaves.count=leafCount;leaves.instanceMatrix.needsUpdate=true;
  for(let i=0;i<35;i++){const x=Math.sin(i*3)*50,z=Math.cos(i*4)*50;if(Math.abs(x)<13&&z>-40)continue;make(new THREE.DodecahedronGeometry(1+i%3),'#718174',x,.5,z);}
  for(let i=0;i<8;i++){const peak=make(new THREE.ConeGeometry(15,25+i*2,7),'#718475',Math.sin(i*2)*80,10,-65-Math.abs(Math.cos(i)*20));peak.rotation.y=i;}
  const dinos:THREE.Group[]=[];
  for(let i=0;i<6;i++){
   const d=new THREE.Group();d.position.set(i%2?-19:20,0,8-i*9);scene.add(d);dinos.push(d);const color=i%2?'#8c9670':'#689079';
   const body=make(new THREE.SphereGeometry(1,24,16),color,0,2,0,d);body.scale.set(1.25,1.15,2.3);
   if(i%3===0){const neck=make(new THREE.CapsuleGeometry(.42,4,8,16),color,0,4.5,-1.4,d);neck.rotation.x=-.32;make(new THREE.SphereGeometry(.65,16,12),color,0,6.8,-2.15,d);}
   else{const head=make(new THREE.SphereGeometry(.9,20,14),color,0,2.8,-2,d);head.scale.set(1.1,.9,1.3);for(const x of [-.65,.65]){make(new THREE.SphereGeometry(.14,12,8),'#efd997',x,3,-2.5,d);make(new THREE.SphereGeometry(.065,8,6),'#18251c',x*1.1,3,-2.58,d);}
    if(i%3===1){const frill=make(new THREE.CylinderGeometry(1.4,1.4,.2,12),color,0,3.1,-1.5,d);frill.rotation.x=Math.PI/2;for(const x of [-.5,.5]){const horn=make(new THREE.ConeGeometry(.16,1.4,10),'#d8d3b3',x,3.4,-2.65,d);horn.rotation.x=-.65;}}
   }
   for(const x of [-.8,.8])for(const z of [-.9,.8])make(new THREE.CapsuleGeometry(.28,1.35,6,10),color,x,.9,z,d);
   d.traverse(o=>{if(o instanceof THREE.Mesh && (o.material as THREE.MeshStandardMaterial).color.getHexString()===new THREE.Color(color).getHexString()){(o.material as THREE.MeshStandardMaterial).map=skin;(o.material as THREE.MeshStandardMaterial).bumpMap=skin;(o.material as THREE.MeshStandardMaterial).bumpScale=.07;}});
   for(let j=0;j<6;j++){const tail=make(new THREE.SphereGeometry(.65-j*.09,12,8),color,Math.sin(j*.3)*.4,1.9-j*.13,2+j*.5,d);tail.scale.z=1.5;}
  }
  const bots:THREE.Group[]=[];if(zombies)for(let i=0;i<3;i++){const b=new THREE.Group();b.position.set(14,0,-4-i*10);scene.add(b);bots.push(b);make(new THREE.BoxGeometry(.85,1.2,.55),'#778c69',0,1.4,0,b);make(new THREE.BoxGeometry(.65,.65,.6),'#acc18c',0,2.3,0,b);for(const x of [-.3,.3]){make(new THREE.BoxGeometry(.25,.7,.3),'#455f5c',x,.5,0,b);make(new THREE.SphereGeometry(.065,8,6),'#f1bd65',x*.7,2.4,-.33,b);}}
  for(const x of [-4,4])make(new THREE.BoxGeometry(1.3,7,2),'#556861',x,3.5,-34);make(new THREE.BoxGeometry(10,1.4,2),'#c5ae76',0,7,-34);
  const beacon=new THREE.Group();const ring=make(new THREE.TorusGeometry(1.1,.1,8,32),'#f3d484',0,.2,0,beacon);ring.rotation.x=Math.PI/2;const light=make(new THREE.OctahedronGeometry(.45),'#f7d87d',0,1.5,0,beacon);(light.material as THREE.MeshStandardMaterial).emissive=new THREE.Color('#b69135');scene.add(beacon);
  let frame=0,last=performance.now(),elapsed=0,hud=0,roar=0;
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight||300;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','e'].includes(k)&&document.activeElement===renderer.domElement){e.preventDefault();keys.current.add(k);}};const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const blur=()=>keys.current.clear();
  let pointer:number|null=null,px=0;const pdown=(e:PointerEvent)=>{pointer=e.pointerId;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();};const pmove=(e:PointerEvent)=>{if(e.pointerId===pointer){yaw-=(e.clientX-px)*.005;px=e.clientX;}};const pup=()=>{pointer=null;};
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Explore dinosaur island. WASD or arrows move; Q and E turn. Drag to look around.');renderer.domElement.style.touchAction='none';
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);renderer.domElement.addEventListener('pointerdown',pdown);renderer.domElement.addEventListener('pointermove',pmove);renderer.domElement.addEventListener('pointerup',pup);renderer.domElement.addEventListener('pointercancel',pup);
  const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;const k=keys.current;
   yaw+=((k.has('q')?1:0)-(k.has('e')?1:0))*dt*1.5;camera.rotation.y=yaw;
   const f=(k.has('w')||k.has('arrowup')?1:0)-(k.has('s')||k.has('arrowdown')?1:0);const side=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);
   const speed=dt*5/Math.max(1,Math.hypot(f,side));const nx=THREE.MathUtils.clamp(camera.position.x+(-Math.sin(yaw)*f+Math.cos(yaw)*side)*speed,-13,13);const nz=THREE.MathUtils.clamp(camera.position.z+(-Math.cos(yaw)*f-Math.sin(yaw)*side)*speed,-32,22);
   if(!obstacles.some(o=>Math.hypot(nx-o.x,nz-o.z)<o.r+.5)){camera.position.x=nx;camera.position.z=nz;}if(f||side)void islandSound('footstep');
   if(!quiet){camera.position.y=1.85+(f||side?Math.sin(elapsed*9)*.035:0);dinos.forEach((d,i)=>{d.rotation.y=Math.sin(elapsed*.18+i)*.4+(i%2?Math.PI/2:-Math.PI/2);d.position.y=Math.sin(elapsed*1.3+i)*.035;});bots.forEach((b,i)=>{b.position.z=-4-i*10+Math.sin(elapsed*.5+i)*2;b.rotation.y=Math.sin(elapsed*.5)*.5;});light.rotation.y=elapsed;}
   bots.forEach(b=>{b.visible=now>shield.current;});beacon.position.copy(STATIONS[Math.min(checkpoint.current,5)]);
   if(elapsed-hud>.25){const dist=Math.hypot(camera.position.x-beacon.position.x,camera.position.z-beacon.position.z);setDistance(Math.round(dist));setNear(dist<3);hud=elapsed;}
   if(elapsed-roar>18){void islandSound('dinosaur');roar=elapsed;}
   renderer.render(scene,camera);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);keys.current.clear();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});grass.dispose();dirt.dispose();skin.dispose();sky.dispose();renderer.dispose();renderer.domElement.remove();};
 },[zombies,quiet]);
 const move=(label:string,key:string)=><button className="btn" key={key} aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onLostPointerCapture={()=>keys.current.delete(key)}>{label}</button>;
 return <div className="expedition-shell"><div className="row between"><h1>🦖 Rescue expedition</h1><button className="btn" onClick={onBack}>Return to base</button></div>
 <div className="expedition-hud"><strong>Supplies {mission+(solved?1:0)} / 6</strong><span>Beacon {distance} m away</span><span>Expeditions rescued: {rescues}</span>{zombies&&<button className="btn" disabled={!shieldReady} onClick={()=>{shield.current=performance.now()+10000;setShieldReady(false);void islandSound('scan');shieldTimer.current=setTimeout(()=>setShieldReady(true),10000);}}>🛡️ {shieldReady?'Activate rescue shield':'Shield active'}</button>}</div>
 <p>Click the island. Move with WASD or arrows. Drag to look, or turn with Q/E. Follow the glowing beacon. No timer or lost lives.</p><div ref={host} className="expedition-viewport"/>{error&&<p role="alert">{error}</p>}
 <div className="row expedition-controls">{move('Forward','w')}{move('Left','a')}{move('Back','s')}{move('Right','d')}{move('Turn left','q')}{move('Turn right','e')}</div>
 {finished?<div className="expedition-complete"><h2>🏆 Rescue successful!</h2><p>You gathered six supply packs and opened the rescue gate. The dinosaurs can return to their safe habitat.</p><button className="btn" onClick={onBack}>Bring the trophy to base</button></div>:
 <div className="card"><h2>Mission {mission+1}: {task.title}</h2>{!near&&!error?<p>Walk to the gold beacon to open this supply station. The on-screen controls work with a mouse or touch.</p>:<><p className="dyslexia">{task.q}</p><button className="btn ghost" onClick={()=>getSpeech().speak(task.q,{voice:JURASSIC_TUTORS.find(t=>t.subject===task.subject)?.voice??JURASSIC_TUTORS[0].voice,allowSystemFallback:true})}>🔊 Read question</button><div className="row">{task.choices.map(c=><button className="btn" key={c} disabled={solved} onClick={()=>{const correct=c===task.answer;onAnswer(correct,task.subject);if(correct){setSolved(true);setFeedback('Supply pack earned! Head to the next beacon.');void playEffect('reward');}else setFeedback(task.hint);}}>{c}</button>)}</div></>}
 <p role="status">{feedback}</p>{solved&&<button className="btn" onClick={()=>{getSpeech().stop();if(mission===5){setFinished(true);onRescue();}else setMission(m=>m+1);}}>{mission===5?'Open the rescue gate':'Next supply station →'}</button>}</div>}
 </div>;
}
