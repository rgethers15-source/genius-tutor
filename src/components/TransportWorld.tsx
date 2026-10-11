import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { transportMissions } from '../data/curriculumK';
import { islandSound } from '../engine/jurassicAudio';
import { playEffect } from '../engine/soundEffects';
import { getSpeech, type VoiceConfig } from '../engine/speech';
import type { Subject } from '../types';
import type { AnimeTutor } from '../data/animeTutors';

const STATIONS = [[0,4],[-7,-3],[7,-10],[-6,-17],[6,-24],[-7,-31],[7,-38],[-5,-45],[0,-52]];
export function TransportWorld({onBack,onAnswer,onJourney,journeys,quiet,tutors}:{onBack:()=>void;onAnswer:(correct:boolean,subject:Subject)=>void;onJourney:()=>void;journeys:number;quiet:boolean;tutors:AnimeTutor[]}) {
 const host=useRef<HTMLDivElement>(null),keys=useRef(new Set<string>()),checkpoint=useRef(0),carriage=useRef(false);
 const [mission,setMission]=useState(0),[near,setNear]=useState(false),[distance,setDistance]=useState(10);
 const [error,setError]=useState(''),[solved,setSolved]=useState(false),[feedback,setFeedback]=useState(''),[finished,setFinished]=useState(false);
 const answerLocked=useRef(false),journeyClaimed=useRef(false),celebrating=useRef(false);
 const task=transportMissions(journeys)[mission];
 const voice:VoiceConfig=tutors.find(t=>t.subject===task.subject)?.voice??tutors[0].voice;
 useEffect(()=>{checkpoint.current=mission;answerLocked.current=false;setSolved(false);setFeedback('');setNear(false);},[mission]);
 useEffect(()=>()=>getSpeech().stop(),[]);
 useEffect(()=>{
  if(!host.current)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('3D graphics cannot start here. You can still play every vehicle learning challenge.');return;}
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
  const obstacles:{x:number;z:number;r:number}[]=[];
  const ground=make(new THREE.PlaneGeometry(160,180),'#86af70',0,-.04,-20);ground.rotation.x=-Math.PI/2;
  const road=make(new THREE.PlaneGeometry(25,95),'#747a81',0,0,-24);road.rotation.x=-Math.PI/2;
  for(let z=18;z>-66;z-=4)make(new THREE.BoxGeometry(.2,.025,2),'#fff2c5',0,.02,z);
  for(const x of [-18,-16])make(new THREE.BoxGeometry(.15,.12,110),'#777b83',x,.1,-20);
  for(let z=30;z>-75;z-=1.5)make(new THREE.BoxGeometry(3,.1,.25),'#836445',-17,.02,z);
  for(let i=0;i<22;i++){const x=(i%2?-1:1)*(28+i%3*4),z=20-i*4;make(new THREE.CylinderGeometry(.3,.4,3,8),'#8d6747',x,1.5,z);make(new THREE.SphereGeometry(2,12,10),'#579564',x,4,z);}
  const vehicles:THREE.Group[]=[];
  function vehicle(color:string,x:number,z:number,kind:string){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);vehicles.push(g);
   make(new THREE.BoxGeometry(2.3,1.5,3.5),color,0,1.5,0,g);
   make(new THREE.BoxGeometry(2,1.2,1.4),color,0,2.6,1,g);
   for(const dx of [-1.25,1.25])for(const dz of [-1.1,1.1]){const wheel=make(new THREE.CylinderGeometry(.55,.55,.3,16),'#343c49',dx,.55,dz,g);wheel.rotation.z=Math.PI/2;}
   for(const dx of [-.5,.5]){make(new THREE.SphereGeometry(.28,16,12),'#fff7e0',dx,2.7,1.74,g);make(new THREE.SphereGeometry(.13,12,10),'#293946',dx,2.7,1.98,g);}
   const smile=make(new THREE.TorusGeometry(.45,.06,8,20,Math.PI),'#403c3b',0,1.8,1.81,g);smile.rotation.z=Math.PI;
   if(kind==='train'){make(new THREE.CylinderGeometry(.35,.35,1,12),'#353f4b',0,3.2,-.9,g);for(let j=1;j<4;j++)make(new THREE.BoxGeometry(2.4,2,3),'#debd75',0,1.5,-j*4,g);}
   if(kind==='truck'){make(new THREE.BoxGeometry(2.5,1.3,2),'#efb24a',0,2,-1.5,g);}
   if(kind==='plane'){make(new THREE.BoxGeometry(10,.15,1.4),color,0,1.8,0,g);make(new THREE.BoxGeometry(4,.15,1),color,0,2,-3,g);make(new THREE.BoxGeometry(.2,2,1.5),color,0,2.5,-3,g);}
   return g;
  }
  const train=vehicle('#318d85',-17,5,'train');const truck=vehicle('#efaa39',19,-16,'truck');const plane=vehicle('#4eaad3',34,-38,'plane');plane.position.y=9;
  vehicle('#df8268',-26,-30,'truck');vehicle('#9d84c5',-17,-49,'train');
  for(let i=0;i<9;i++){const [x,z]=STATIONS[i];const side=x<=0?-1:1;make(new THREE.BoxGeometry(4,3,4),['#e5bb76','#ed9d78','#9ebfd7'][i%3],x+side*8,1.5,z);make(new THREE.ConeGeometry(3.4,2,4),'#657991',x+side*8,4,z).rotation.y=Math.PI/4;}
  make(new THREE.BoxGeometry(20,9,10),'#e6cca0',0,4.5,-70);make(new THREE.BoxGeometry(5,5,.2),'#4b8394',0,2.5,-64.9);
  make(new THREE.BoxGeometry(.7,20,.7),'#edb84f',-28,10,-12);make(new THREE.BoxGeometry(17,.6,.6),'#edb84f',-22,19,-12);
  make(new THREE.BoxGeometry(.12,10,.12),'#4a535e',-15,14,-12);make(new THREE.BoxGeometry(3,2,3),'#cc956a',-15,8,-12);
  const beacon=new THREE.Group();scene.add(beacon);make(new THREE.TorusGeometry(1.1,.1,8,40),'#ffe2a3',0,.13,0,beacon).rotation.x=Math.PI/2;
  const gem=make(new THREE.OctahedronGeometry(.5),'#ffd46a',0,1.4,0,beacon);
  let frame=0,last=performance.now(),elapsed=0,hud=0;
  const resize=()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const down=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright'].includes(k)&&document.activeElement===renderer.domElement){e.preventDefault();keys.current.add(k);}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const blur=()=>keys.current.clear();
  let pointer:number|null=null,px=0;const pdown=(e:PointerEvent)=>{pointer=e.pointerId;px=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus();};
  const pmove=(e:PointerEvent)=>{if(pointer===e.pointerId){yaw-=(e.clientX-px)*.005;px=e.clientX;}};const pup=()=>{pointer=null;};
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Explore the vehicle town. WASD or arrows move. Q and E turn. Drag to look.');renderer.domElement.style.touchAction='none';
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);renderer.domElement.addEventListener('pointerdown',pdown);renderer.domElement.addEventListener('pointermove',pmove);renderer.domElement.addEventListener('pointerup',pup);renderer.domElement.addEventListener('pointercancel',pup);
  const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;const k=keys.current;
   yaw+=((k.has('q')?1:0)-(k.has('e')?1:0))*dt*1.5;camera.rotation.y=yaw;
   const forward=(k.has('w')||k.has('arrowup')?1:0)-(k.has('s')||k.has('arrowdown')?1:0),side=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);
   const speed=dt*5/Math.max(1,Math.hypot(forward,side));const x=THREE.MathUtils.clamp(camera.position.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,-12,12),z=THREE.MathUtils.clamp(camera.position.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed,-57,22);
   if(!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.6)){camera.position.x=x;camera.position.z=z;}
   if(forward||side)void islandSound('footstep');
   const [bx,bz]=STATIONS[checkpoint.current];beacon.position.set(bx,0,bz);
   if(carriage.current){camera.position.set(bx,1.7,bz+1.5);yaw=0;keys.current.clear();carriage.current=false;}
   if(!quiet){gem.rotation.y=elapsed*.6;gem.position.y=1.4+Math.sin(elapsed*1.7)*.15;train.position.z=18-(elapsed*2%75);truck.position.z=-12+Math.sin(elapsed*.18)*14;plane.position.x=32+Math.sin(elapsed*.12)*15;plane.position.z=-30+Math.cos(elapsed*.12)*20;plane.rotation.y=-elapsed*.12;}
   if(elapsed-hud>.2){const dist=Math.hypot(camera.position.x-bx,camera.position.z-bz);setDistance(Math.round(dist));setNear(dist<3);hud=elapsed;}
   renderer.render(scene,camera);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);keys.current.clear();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
 },[quiet]);
 function answer(choice:string){if(answerLocked.current)return;const correct=choice===task.answer;onAnswer(correct,task.subject);if(correct){answerLocked.current=true;setSolved(true);setFeedback('Delivery star earned!');void playEffect('reward');}else setFeedback(task.hint);}
 const move=(label:string,key:string)=><button className="btn" key={key} aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onLostPointerCapture={()=>keys.current.delete(key)}>{label}</button>;
 return <div className="transport-realm"><div className="row between"><h1>🚂 Vehicle Town Delivery</h1><button className="btn" onClick={onBack}>Return to vehicle academy</button></div>
 <div className="royal-guide card"><img src="./transport/guide-0.webp" alt="Pip, your train guide"/><div><strong>Pip · Delivery guide</strong><p>Welcome to vehicle town! Follow the golden marker. Help our trains, trucks and planes make nine learning deliveries.</p></div></div>
 <div className="expedition-hud"><strong>Delivery stars {mission+(solved?1:0)} / 9</strong><span>Next stop {distance} m away</span><span>Journeys completed: {journeys}</span></div>
 <p>Click the town. WASD or arrows move, Q/E turns, and dragging looks around. You can use the buttons below. No timer or lost lives.</p>
 <div ref={host} className="expedition-viewport"/>{error&&<p role="alert">{error}</p>}
 <div className="row expedition-controls">{move('Forward','w')}{move('Left','a')}{move('Back','s')}{move('Right','d')}{move('Turn left','q')}{move('Turn right','e')}<button className="btn ghost" disabled={finished} onClick={()=>{carriage.current=true;void playEffect('welcome');}}>🚂 Helper ride to next stop</button></div>
 {finished?<div className="expedition-complete"><h2>🌟 All deliveries complete!</h2><p>You learned with nine vehicle friends. Your kindergarten learning trip is saved.</p><button className="btn" onClick={onBack}>Return to town</button></div>:<div className="card"><h2>Quest {mission+1}: {task.title}</h2>{!near&&!error?<p>Move to the golden marker to unlock this learning quest.</p>:<><p className="dyslexia">{task.q}</p><button className="btn ghost" onClick={()=>getSpeech().speak(task.q,{voice,purpose:'reading',allowSystemFallback:true})}>🔊 Read delivery question</button><div className="row royal-choices">{task.choices.map(c=><button className="btn" key={c} disabled={solved} onClick={()=>answer(c)}>{c}</button>)}</div></>}
 <p role="status">{feedback}</p>{solved&&<button className="btn" onClick={()=>{getSpeech().stop();if(mission===8){if(!journeyClaimed.current){journeyClaimed.current=true;celebrating.current=true;onJourney();}setFinished(true);}else setMission(m=>m+1);}}>{mission===8?'Finish the learning trip':'Next delivery →'}</button>}</div>}
 </div>;
}
