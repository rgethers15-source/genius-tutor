import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { academyMissions } from '../data/academyCurriculum';
import { islandSound } from '../engine/jurassicAudio';
import { playEffect } from '../engine/soundEffects';
import { getSpeech, type VoiceConfig } from '../engine/speech';
import type { Subject } from '../types';
import type { AnimeTutor } from '../data/animeTutors';

const STATIONS = [[0,4],[-6,-4],[6,-12],[-6,-20],[6,-28],[0,-36]];
export function AcademyQuest({onBack,onAnswer,onJourney,journeys,quiet,tutors,imageFor}:{onBack:()=>void;onAnswer:(correct:boolean,subject:Subject)=>void;onJourney:()=>void;journeys:number;quiet:boolean;tutors:AnimeTutor[];imageFor:(id:string)=>string}) {
 const host=useRef<HTMLDivElement>(null),keys=useRef(new Set<string>()),checkpoint=useRef(0),carriage=useRef(false);
 const [mission,setMission]=useState(0),[near,setNear]=useState(false),[distance,setDistance]=useState(10);
 const [error,setError]=useState(''),[solved,setSolved]=useState(false),[feedback,setFeedback]=useState(''),[finished,setFinished]=useState(false);
 const answerLocked=useRef(false),journeyClaimed=useRef(false);
 const initialJourney=useRef(journeys);const task=academyMissions(initialJourney.current)[mission];
 const voice:VoiceConfig=tutors.find(t=>t.subject===task.subject)?.voice??tutors[0].voice;
 useEffect(()=>{checkpoint.current=mission;answerLocked.current=false;setSolved(false);setFeedback('');setNear(false);},[mission]);
 useEffect(()=>()=>getSpeech().stop(),[]);
 useEffect(()=>{
  if(!host.current)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('3D graphics cannot start here. Every academy learning challenge is still available below.');return;}
  const container=host.current;container.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#504d68');scene.fog=new THREE.Fog('#504d68',45,145);
  const camera=new THREE.PerspectiveCamera(62,1,.1,220);camera.position.set(0,1.7,14);let yaw=0;
  scene.add(new THREE.HemisphereLight('#fff1dd','#3e475f',2.3));
  const sun=new THREE.DirectionalLight('#ffdfac',3.4);sun.position.set(-25,40,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-35;scene.add(sun);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const material=(color:string,metal=0)=>{const key=color+metal;let m=materials.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:metal?.35:.72});materials.set(key,m);}return m;};
  const make=(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=scene,metal=0)=>{const m=new THREE.Mesh(geo,material(color,metal));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const obstacles:{x:number;z:number;r:number}[]=[];
  const textures:THREE.Texture[]=[];let disposed=false;
  const texture=(path:string,apply:(t:THREE.Texture)=>void)=>new THREE.TextureLoader().load(path,t=>{if(disposed){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;textures.push(t);apply(t);});
  make(new THREE.BoxGeometry(33,1,72),'#65707e',0,-.6,-16);
  const base=make(new THREE.ConeGeometry(26,25,7),'#504d66',0,-13,-16);base.rotation.z=Math.PI;
  const road=make(new THREE.PlaneGeometry(16,66),'#baa68d',0,.01,-15);road.rotation.x=-Math.PI/2;
  for(const x of [-8.3,8.3]){make(new THREE.BoxGeometry(.14,.1,65),'#e8ce85',x,.12,-15);for(let z=16;z>-47;z-=5){make(new THREE.CylinderGeometry(.1,.1,1.1,8),'#ccae72',x,.55,z);make(new THREE.SphereGeometry(.19,10,10),'#fff0bf',x,1.2,z);}}
  const colors=['#71bcb4','#c4b287','#bdabd6','#dcb29f','#abc09c','#b0b6d6'];
  const floating:THREE.Mesh[]=[];
  for(let i=0;i<6;i++){
   const [x,z]=STATIONS[i],side=x<=0?-1:1,bx=side*13;
   make(new THREE.CylinderGeometry(4,4.5,.5,24),'#96877c',bx,.25,z);
   make(new THREE.CylinderGeometry(2.7,3,4,12),colors[i],bx,2.5,z);
   const dome=make(new THREE.SphereGeometry(2.8,24,16,0,Math.PI*2,0,Math.PI/2),'#71839a',bx,4.5,z);
   dome.material=new THREE.MeshStandardMaterial({color:'#a9c4c4',transparent:true,opacity:.6,metalness:.3,roughness:.15});
   make(new THREE.TorusGeometry(3,.09,8,48),'#d8bc7f',bx,4.5,z).rotation.x=Math.PI/2;
   for(let j=0;j<4;j++){const angle=j*Math.PI/2;make(new THREE.CylinderGeometry(.13,.13,4,8),'#e1cdaa',bx+Math.cos(angle)*2.5,2.5,z+Math.sin(angle)*2.5);}
   make(new THREE.BoxGeometry(5,.2,2),'#889b9f',side*9.5,.1,z);
   const portrait=make(new THREE.PlaneGeometry(1.7,1.7),'#ffffff',x,2.8,z-.6);
   const tutor=tutors.find(t=>t.subject===academyMissions(0)[i].subject)!;
   texture(imageFor(tutor.id),t=>{(portrait.material as THREE.MeshStandardMaterial).map=t;portrait.material.needsUpdate=true;});
   make(new THREE.BoxGeometry(2,.16,.18),'#d4b677',x,1.89,z-.6);make(new THREE.CylinderGeometry(.08,.12,1.6,8),'#ab9468',x,.85,z-.6);
   const orb=make(new THREE.IcosahedronGeometry(.35,1),'#f3d991',bx,7.6,z);floating.push(orb);
  }
  for(let i=0;i<28;i++){const x=(i%2?-1:1)*(20+i%4*5),z=18-i*2.8;
   make(new THREE.CylinderGeometry(.17,.26,2.6,8),'#94836c',x,1.2,z);make(new THREE.SphereGeometry(1.7,12,10),['#879d85','#b69d99','#a0ac94'][i%3],x,3,z);
   const island=make(new THREE.CylinderGeometry(3.5,2.4,1.2,7),'#67777a',x,-.6,z);island.rotation.y=i;
  }
  const gate=make(new THREE.TorusGeometry(5,.35,12,72),'#d4b77d',0,5,-46);make(new THREE.BoxGeometry(.3,9,.3),'#9c8c74',-5,4,-46);make(new THREE.BoxGeometry(.3,9,.3),'#9c8c74',5,4,-46);
  const planet=make(new THREE.SphereGeometry(12,32,24),'#a9a0b9',22,34,-75);const ring=make(new THREE.TorusGeometry(17,.35,8,80),'#dec796',22,34,-75);ring.rotation.x=1.2;ring.rotation.y=.3;
  const painting=make(new THREE.PlaneGeometry(160,107),'#ffffff',0,36,-105);texture('./madeline/academy.webp',t=>{(painting.material as THREE.MeshStandardMaterial).map=t;painting.material.needsUpdate=true;});
  for(let i=0;i<18;i++){const cloud=make(new THREE.SphereGeometry(4+i%3,12,8),'#c7c0c2',(i%2?-1:1)*(24+i*2),-4-i%4,25-i*6);cloud.scale.set(2,.35,1);}
  const beacon=new THREE.Group();scene.add(beacon);make(new THREE.TorusGeometry(1.1,.1,8,40),'#ffe2a3',0,.13,0,beacon).rotation.x=Math.PI/2;
  const gem=make(new THREE.OctahedronGeometry(.5),'#ffd46a',0,1.4,0,beacon);
  let frame=0,last=performance.now(),elapsed=0,hud=0;
  const resize=()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&document.activeElement===renderer.domElement){e.preventDefault();keys.current.add(k);}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const blur=()=>keys.current.clear();
  let pointer:number|null=null,px=0;const pdown=(e:PointerEvent)=>{pointer=e.pointerId;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();};
  const pmove=(e:PointerEvent)=>{if(pointer===e.pointerId){yaw-=(e.clientX-px)*.005;px=e.clientX;}};const pup=()=>{pointer=null;};
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Explore the celestial academy. WASD or arrows move. Q and E turn. Drag to look.');renderer.domElement.style.touchAction='none';
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);renderer.domElement.addEventListener('pointerdown',pdown);renderer.domElement.addEventListener('pointermove',pmove);renderer.domElement.addEventListener('pointerup',pup);renderer.domElement.addEventListener('pointercancel',pup);
  const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;const k=keys.current;
   yaw+=((k.has('q')?1:0)-(k.has('e')?1:0))*dt*1.5;camera.rotation.y=yaw;
   const forward=(k.has('w')||k.has('arrowup')?1:0)-(k.has('s')||k.has('arrowdown')?1:0),side=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);
   const speed=dt*5/Math.max(1,Math.hypot(forward,side));const x=THREE.MathUtils.clamp(camera.position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,-12,12),z=THREE.MathUtils.clamp(camera.position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed,-43,22);
   if(!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.6)){camera.position.x=x;camera.position.z=z;}
   if(forward||side)void islandSound('footstep');
   const [bx,bz]=STATIONS[checkpoint.current];beacon.position.set(bx,0,bz);
   if(carriage.current){camera.position.set(bx,1.7,bz+1.5);yaw=0;keys.current.clear();carriage.current=false;}
   if(!quiet){gem.rotation.y=elapsed*.6;gem.position.y=1.4+Math.sin(elapsed*1.7)*.15;floating.forEach((orb,i)=>{orb.position.y=7.6+Math.sin(elapsed+i)*.18;});gate.rotation.z=elapsed*.02;planet.rotation.y=elapsed*.01;}
   if(elapsed-hud>.2){const dist=Math.hypot(camera.position.x-bx,camera.position.z-bz);setDistance(Math.round(dist));setNear(dist<3);hud=elapsed;}
   renderer.render(scene,camera);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  return()=>{disposed=true;textures.forEach(t=>t.dispose());cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);keys.current.clear();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[quiet]);
 function answer(choice:string){if(answerLocked.current)return;const correct=choice===task.answer;onAnswer(correct,task.subject);if(correct){answerLocked.current=true;setSolved(true);setFeedback('Learning light earned. You used a strategy!');void playEffect('reward');}else setFeedback(task.hint);}
 const move=(label:string,key:string)=><button className="btn" key={key} aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onLostPointerCapture={()=>keys.current.delete(key)}>{label}</button>;
 return <div className="academy-quest"><div className="row between"><h1>🌌 Celestial Academy Journey</h1><button className="btn" onClick={onBack}>Return to academy</button></div>
 <div className="royal-guide card"><img src={imageFor(tutors.find(t=>t.subject===task.subject)!.id)} alt="Your academy guide"/><div><strong>{tutors.find(t=>t.subject===task.subject)!.name} · {task.title}</strong><p>Explore the sky bridges. Collect six learning lights, one idea at a time. Hints and examples are always welcome.</p></div></div>
 <div className="expedition-hud"><strong>Learning lights {mission+(solved?1:0)} / 6</strong><span>Next stop {distance} m away</span><span>Journeys completed: {journeys}</span></div>
 <p>Click the academy. WASD or arrows move, Q/E turns, and dragging looks around. You can also use the buttons or portal. No timer or lost lives.</p>
 <div ref={host} className="expedition-viewport"/>{error&&<p role="alert">{error}</p>}
 <div className="row expedition-controls">{move('Forward','w')}{move('Left','a')}{move('Back','s')}{move('Right','d')}{move('Turn left','q')}{move('Turn right','e')}<button className="btn ghost" disabled={finished} onClick={()=>{carriage.current=true;void playEffect('welcome');}}>Portal to next learning stop</button></div>
 {finished?<div className="expedition-complete"><h2>All six learning lights collected!</h2><p>You explored six subjects and practiced new strategies. Your journey is saved.</p><button className="btn" onClick={onBack}>Return to academy</button></div>:<div className="card academy-mission"><h2>Learning stop {mission+1}: {task.title}</h2><p className="faint">{task.standard}</p>{!near&&!error?<p>Move to the golden marker or use the portal to unlock this challenge.</p>:<><details className="academy-example"><summary>Teach me first · worked example</summary><p>{task.example}</p></details><p className="dyslexia">{task.q}</p><button className="btn ghost" onClick={()=>getSpeech().speak(task.q,{voice,purpose:'reading',allowSystemFallback:true})}>Read learning challenge</button><button className="btn ghost" onClick={()=>setFeedback(task.hint)}>Show a hint</button><div className="row royal-choices">{task.choices.map(c=><button className="btn" key={c} disabled={solved} onClick={()=>answer(c)}>{c}</button>)}</div></>}
 <p role="status">{feedback}</p>{solved&&<button className="btn" onClick={()=>{getSpeech().stop();if(mission===5){if(!journeyClaimed.current){journeyClaimed.current=true;onJourney();}setFinished(true);}else setMission(m=>m+1);}}>{mission===5?'Save my journey':'Next learning stop →'}</button>}</div>}
 </div>;
}
