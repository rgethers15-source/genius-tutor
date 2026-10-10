import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ROYAL_MISSIONS } from '../data/royalMissions';
import { islandSound } from '../engine/jurassicAudio';
import { playEffect } from '../engine/soundEffects';
import { getSpeech, type VoiceConfig } from '../engine/speech';
import type { Subject } from '../types';
import type { AnimeTutor } from '../data/animeTutors';

const STATIONS = [[0,4],[-7,-3],[7,-10],[-6,-17],[6,-24],[-7,-31],[7,-38],[-5,-45],[0,-52]];
export function RoyalRealm({onBack,onAnswer,onJourney,journeys,quiet,tutors}:{onBack:()=>void;onAnswer:(correct:boolean,subject:Subject)=>void;onJourney:()=>void;journeys:number;quiet:boolean;tutors:AnimeTutor[]}) {
 const host=useRef<HTMLDivElement>(null),keys=useRef(new Set<string>()),checkpoint=useRef(0);
 const [mission,setMission]=useState(0),[near,setNear]=useState(false),[distance,setDistance]=useState(10);
 const [error,setError]=useState(''),[solved,setSolved]=useState(false),[feedback,setFeedback]=useState(''),[finished,setFinished]=useState(false);
 const answerLocked=useRef(false),journeyClaimed=useRef(false),celebrating=useRef(false);
 const task=ROYAL_MISSIONS[mission];
 const voice:VoiceConfig=tutors.find(t=>t.subject===task.subject)?.voice??tutors[0].voice;
 useEffect(()=>{checkpoint.current=mission;answerLocked.current=false;setSolved(false);setFeedback('');setNear(false);},[mission]);
 useEffect(()=>()=>getSpeech().stop(),[]);
 useEffect(()=>{
  if(!host.current)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('3D graphics cannot start here. You can still play every royal learning quest.');return;}
  const container=host.current;container.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d9bfdc');scene.fog=new THREE.Fog('#d9bfdc',45,145);
  const camera=new THREE.PerspectiveCamera(62,1,.1,220);camera.position.set(0,1.7,14);let yaw=0;
  scene.add(new THREE.HemisphereLight('#fff1dd','#75576e',2.3));
  const sun=new THREE.DirectionalLight('#ffdfac',3.4);sun.position.set(-25,40,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-35;scene.add(sun);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const material=(color:string,metal=0)=>{const key=color+metal;let m=materials.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:metal?.35:.72});materials.set(key,m);}return m;};
  const make=(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=scene,metal=0)=>{const m=new THREE.Mesh(geo,material(color,metal));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  // Warm patterned paving and garden grass: original procedural textures.
  const tile=document.createElement('canvas');tile.width=256;tile.height=256;const ctx=tile.getContext('2d')!;ctx.fillStyle='#eadcc4';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#c6ac88';ctx.lineWidth=3;
  for(let y=0;y<256;y+=64)for(let x=0;x<256;x+=64){ctx.strokeRect(x,y,64,64);ctx.fillStyle='#c5aa6b';ctx.beginPath();ctx.moveTo(x+32,y+20);ctx.lineTo(x+44,y+32);ctx.lineTo(x+32,y+44);ctx.lineTo(x+20,y+32);ctx.closePath();ctx.fill();}
  const paving=new THREE.CanvasTexture(tile);paving.colorSpace=THREE.SRGBColorSpace;paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(3,18);
  const ground=make(new THREE.PlaneGeometry(160,180),'#729b7b',0,-.04,-20);ground.rotation.x=-Math.PI/2;
  const path=make(new THREE.PlaneGeometry(25,95),'#fff5df',0,0,-24);path.rotation.x=-Math.PI/2;const pm=material('#fff5df').clone();pm.map=paving;path.material=pm;
  const pools:THREE.Mesh[]=[];for(const x of [-21,21]){const p=make(new THREE.PlaneGeometry(8,82),'#76c8c4',x,.08,-22);p.rotation.x=-Math.PI/2;const m=material('#76c8c4',.3);m.transparent=true;m.opacity=.82;p.material=m;pools.push(p);}
  const obstacles:{x:number;z:number;r:number}[]=[];
  const flowers:THREE.Group[]=[];
  for(let i=0;i<30;i++){
   const x=(i%2?-1:1)*(15+(i%3)*7),z=18-Math.floor(i/2)*6;
   make(new THREE.CylinderGeometry(.22,.4,4,10),'#876750',x,2,z);
   const crown=new THREE.Group();crown.position.set(x,4.9,z);scene.add(crown);flowers.push(crown);
   for(let j=0;j<5;j++){const f=make(new THREE.IcosahedronGeometry(1.4,1),['#b591d6','#e0a6cb','#9abda1'][i%3],Math.sin(j*2)*1.1,j%2*.6,Math.cos(j*2)*1.1,crown);f.scale.set(1,1.1,1);}
   obstacles.push({x,z,r:1});
  }
  for(let i=0;i<80;i++){const x=(i%2?-1:1)*(12+Math.random()*9),z=20-Math.random()*88;make(new THREE.SphereGeometry(.22,8,6),['#edb0cf','#d5bdee','#eac66e'][i%3],x,.3,z);}
  // Emerald-domed royal palace with gold geometric details and a central entrance.
  const palace=new THREE.Group();palace.position.set(0,0,-68);scene.add(palace);
  make(new THREE.BoxGeometry(22,12,12),'#e8ceb1',0,6,0,palace);
  make(new THREE.BoxGeometry(6,8,.2),'#54405d',0,4,6.15,palace);
  for(const x of [-12,-7,7,12]){
   make(new THREE.CylinderGeometry(2.1,2.3,15,24),'#efdbc0',x,7.5,0,palace);
   const dome=make(new THREE.SphereGeometry(2.6,24,16,0,Math.PI*2,0,Math.PI/2),'#3f8f84',x,15,0,palace,.25);
   dome.scale.y=1.35;make(new THREE.ConeGeometry(.22,2,10),'#ebc676',x,19,0,palace,.65);
   for(let y=3;y<14;y+=4){make(new THREE.TorusGeometry(2.16,.1,6,24),'#dfb76c',x,y,0,palace,.6).rotation.x=Math.PI/2;}
  }
  make(new THREE.BoxGeometry(24,.4,12.5),'#d4a761',0,11.8,0,palace,.45);
  for(const x of [-8,-4,4,8])for(const y of [4,8]){
   make(new THREE.BoxGeometry(1.2,2,.12),'#547886',x,y,6.1,palace,.4);
   make(new THREE.TorusGeometry(.8,.12,8,20,Math.PI),'#deb773',x,y+1,6.2,palace,.55);
  }
  const banner=make(new THREE.PlaneGeometry(3,5),'#71558e',0,12,6.3,palace);banner.material=new THREE.MeshStandardMaterial({color:'#71558e',side:THREE.DoubleSide});
  const emblem=make(new THREE.OctahedronGeometry(.75),'#efd17c',0,12,6.5,palace,.75);emblem.scale.y=1.25;
  const royalGlow=new THREE.PointLight('#ffd497',0,55);royalGlow.position.set(0,9,-58);scene.add(royalGlow);
  // Nine quest pavilions: patterns are original fantasy ornament.
  STATIONS.forEach(([x,z],i)=>{
   const side=x<=0?-1:1;const px=x+side*6;
   for(const dx of [-1.8,1.8])make(new THREE.CylinderGeometry(.22,.3,4,12),'#e4cda9',px+dx,2,z);
   make(new THREE.ConeGeometry(3.1,2.2,8),['#ab79b1','#578d8b','#d2a669'][i%3],px,5,z);
   const medallion=make(new THREE.TorusGeometry(.75,.12,8,24),'#ebca83',px,2.9,z+.2);medallion.rotation.y=0;
  });
  // A reflecting fountain and animated crystal crown.
  const fountain=new THREE.Group();fountain.position.set(0,0,-56);scene.add(fountain);
  make(new THREE.CylinderGeometry(3.5,3.8,.5,40),'#cdb58b',0,.25,0,fountain);
  make(new THREE.CylinderGeometry(3.1,3.1,.15,40),'#84ced1',0,.58,0,fountain,.3);
  make(new THREE.CylinderGeometry(.4,.9,2,20),'#d4b16c',0,1.5,0,fountain,.55);
  const fountainCrystal=make(new THREE.OctahedronGeometry(1.1),'#c8b8ec',0,3,0,fountain,.5);
  const floats:THREE.Group[]=[];
  for(let i=0;i<5;i++){const island=new THREE.Group();island.position.set((i%2?-1:1)*(30+i*3),13+i*2,-18-i*13);scene.add(island);floats.push(island);
   make(new THREE.ConeGeometry(4.5,6,7),'#998399',0,-3,0,island).rotation.z=Math.PI;
   make(new THREE.CylinderGeometry(4.5,4.5,.5,24),'#87a981',0,.2,0,island);
   make(new THREE.OctahedronGeometry(1.2),'#d9bdea',0,2.5,0,island,.3);
  }
  // Friendly animated royal figures modeled in the playable scene.
  const figures:THREE.Group[]=[];
  for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(i===0?4:i===1?-10:10,0,i===0?7:i===1?-22:-43);scene.add(g);figures.push(g);
   make(new THREE.SphereGeometry(.42,20,16),'#835039',0,2.05,0,g);
   const hair=make(new THREE.SphereGeometry(.44,20,12),'#27212b',0,2.23,.04,g);hair.scale.y=.65;
   if(i===0){make(new THREE.CylinderGeometry(.42,.48,.95,12),'#34786b',0,1.25,0,g);for(const x of [-.2,.2])make(new THREE.CapsuleGeometry(.12,.6,4,8),'#e4c687',x,.5,0,g);}
   else make(new THREE.ConeGeometry(.8,1.45,24),i===1?'#bd8fce':'#e1af77',0,.9,0,g);
   for(const x of [-.46,.46]){const arm=make(new THREE.CapsuleGeometry(.11,.55,4,8),'#835039',x,1.4,0,g);arm.rotation.z=x>0?-.3:.3;}
   for(const x of [-.15,.15]){make(new THREE.SphereGeometry(.06,8,6),'#fff4db',x,2.08,.38,g);make(new THREE.SphereGeometry(.027,8,6),'#261c22',x,2.08,.43,g);}
   const crown=make(new THREE.CylinderGeometry(.34,.34,.15,12,1,true),'#e8bd64',0,2.58,0,g,.55);
   crown.material=new THREE.MeshStandardMaterial({color:'#e8bd64',side:THREE.DoubleSide,metalness:.55,roughness:.3});
   for(let j=0;j<5;j++)make(new THREE.ConeGeometry(.08,.2,5),'#e8bd64',Math.sin(j*Math.PI*2/5)*.32,2.74,Math.cos(j*Math.PI*2/5)*.32,g,.55);
  }
  const beacon=new THREE.Group();scene.add(beacon);
  make(new THREE.TorusGeometry(1.1,.1,8,40),'#ffe2a3',0,.13,0,beacon,.6).rotation.x=Math.PI/2;
  const gem=make(new THREE.OctahedronGeometry(.5),'#ecc7ed',0,1.4,0,beacon,.35);const gm=material('#ecc7ed',.35);gm.emissive=new THREE.Color('#81527c');gm.emissiveIntensity=.35;
  const fireflyPositions=new Float32Array(120*3);for(let i=0;i<120;i++){fireflyPositions[i*3]=(Math.random()-.5)*65;fireflyPositions[i*3+1]=1+Math.random()*9;fireflyPositions[i*3+2]=20-Math.random()*100;}
  const particles=new THREE.BufferGeometry();particles.setAttribute('position',new THREE.BufferAttribute(fireflyPositions,3));const particleMaterial=new THREE.PointsMaterial({color:'#fff0b4',size:.12,transparent:true,opacity:.8});const sparkle=new THREE.Points(particles,particleMaterial);scene.add(sparkle);
  let frame=0,last=performance.now(),elapsed=0,hud=0;
  const resize=()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&document.activeElement===renderer.domElement){e.preventDefault();keys.current.add(k);}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const blur=()=>keys.current.clear();
  let pointer:number|null=null,px=0;const pdown=(e:PointerEvent)=>{pointer=e.pointerId;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();};
  const pmove=(e:PointerEvent)=>{if(pointer===e.pointerId){yaw-=(e.clientX-px)*.005;px=e.clientX;}};const pup=()=>{pointer=null;};
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Explore the royal realm. WASD or arrows move. Q and E turn. Drag to look.');renderer.domElement.style.touchAction='none';
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);renderer.domElement.addEventListener('pointerdown',pdown);renderer.domElement.addEventListener('pointermove',pmove);renderer.domElement.addEventListener('pointerup',pup);renderer.domElement.addEventListener('pointercancel',pup);
  const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;const k=keys.current;
   yaw+=((k.has('q')?1:0)-(k.has('e')?1:0))*dt*1.5;camera.rotation.y=yaw;
   const forward=(k.has('w')||k.has('arrowup')?1:0)-(k.has('s')||k.has('arrowdown')?1:0),side=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);
   const speed=dt*5/Math.max(1,Math.hypot(forward,side));const x=THREE.MathUtils.clamp(camera.position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,-12,12),z=THREE.MathUtils.clamp(camera.position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed,-57,22);
   if(!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.6)){camera.position.x=x;camera.position.z=z;}
   if(forward||side)void islandSound('footstep');
   const [bx,bz]=STATIONS[checkpoint.current];beacon.position.set(bx,0,bz);
   if(!quiet){camera.position.y=1.7+(forward||side?Math.sin(elapsed*8)*.025:0);gem.rotation.y=elapsed*.6;gem.position.y=1.4+Math.sin(elapsed*1.7)*.15;fountainCrystal.rotation.y=elapsed*.25;sparkle.rotation.y=Math.sin(elapsed*.04)*.01;floats.forEach((g,i)=>g.position.y=13+i*2+Math.sin(elapsed*.6+i)*.35);figures.forEach((g,i)=>g.rotation.y=Math.sin(elapsed*.8+i)*.12);flowers.forEach((g,i)=>g.rotation.z=Math.sin(elapsed*.4+i)*.025);}
   if(elapsed-hud>.2){const dist=Math.hypot(x-bx,z-bz);setDistance(Math.round(dist));setNear(dist<3);hud=elapsed;}
   royalGlow.intensity=celebrating.current?35:0;
   const entrance=material('#54405d');entrance.emissive.set(celebrating.current?'#c4a15e':'#000000');entrance.emissiveIntensity=celebrating.current?1.4:0;
   renderer.render(scene,camera);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);keys.current.clear();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});particles.dispose();particleMaterial.dispose();paving.dispose();renderer.dispose();renderer.domElement.remove();};
 },[quiet]);
 function answer(choice:string){if(answerLocked.current)return;const correct=choice===task.answer;onAnswer(correct,task.subject);if(correct){answerLocked.current=true;setSolved(true);setFeedback('Royal gem earned!');void playEffect('reward');}else setFeedback(task.hint);}
 const move=(label:string,key:string)=><button className="btn" key={key} aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onLostPointerCapture={()=>keys.current.delete(key)}>{label}</button>;
 return <div className="royal-realm"><div className="row between"><h1>👑 Royal Garden Quest</h1><button className="btn" onClick={onBack}>Return to princess academy</button></div>
 <div className="royal-guide card"><img src="./royal/guide-8.webp" alt="Prince Adisa, your royal garden guide"/><div><strong>Prince Adisa · Garden guide</strong><p>Welcome to our imaginary kingdom! Follow the glowing gem, help our friends, and light the palace with everything you learn.</p></div></div>
 <div className="expedition-hud"><strong>Royal gems {mission+(solved?1:0)} / 9</strong><span>Next gem {distance} m away</span><span>Journeys completed: {journeys}</span></div>
 <p>Click the garden. WASD or arrows move, Q/E turns, and dragging looks around. You can use the buttons below. No timer or lost lives.</p>
 <div ref={host} className="expedition-viewport"/>{error&&<p role="alert">{error}</p>}
 <div className="row expedition-controls">{move('Forward','w')}{move('Left','a')}{move('Back','s')}{move('Right','d')}{move('Turn left','q')}{move('Turn right','e')}</div>
 {finished?<div className="expedition-complete"><h2>✨ The palace is shining!</h2><p>You earned nine royal gems through reading, math, science, writing, kindness, art, music, speech and heritage. Your royal journey is saved.</p><button className="btn" onClick={onBack}>Bring your crown home</button></div>:<div className="card"><h2>Quest {mission+1}: {task.title}</h2>{!near&&!error?<p>Walk to the glowing gem to unlock this learning quest.</p>:<><p className="dyslexia">{task.q}</p><button className="btn ghost" onClick={()=>getSpeech().speak(task.q,{voice,purpose:'reading',allowSystemFallback:true})}>🔊 Read royal question</button><div className="row royal-choices">{task.choices.map(c=><button className="btn" key={c} disabled={solved} onClick={()=>answer(c)}>{c}</button>)}</div></>}
 <p role="status">{feedback}</p>{solved&&<button className="btn" onClick={()=>{getSpeech().stop();if(mission===8){if(!journeyClaimed.current){journeyClaimed.current=true;celebrating.current=true;onJourney();}setFinished(true);}else setMission(m=>m+1);}}>{mission===8?'Light the royal palace':'Next royal gem →'}</button>}</div>}
 </div>;
}
