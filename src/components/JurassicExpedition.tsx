import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playEffect } from '../engine/soundEffects';

const MISSIONS = [
  {title:'Power the rescue gate',q:'We have 6 power cells and find 4 more. How many?',choices:['10','8','12'],answer:'10'},
  {title:'Read the trail sign',q:'Which word rhymes with cat?',choices:['hat','dog','sun'],answer:'hat'},
  {title:'Care for the dinosaurs',q:'What does a living animal need?',choices:['Water','Plastic','A phone'],answer:'Water'},
  {title:'Find the safe route',q:'A map helps us find…',choices:['Places','Flavors','Songs'],answer:'Places'},
];
export function JurassicExpedition({onBack,onReward,zombies,quiet}:{onBack:()=>void;onReward:()=>void;zombies:boolean;quiet:boolean}) {
  const host=useRef<HTMLDivElement>(null);const keys=useRef(new Set<string>());
  const [error,setError]=useState('');const [mission,setMission]=useState(0);const [feedback,setFeedback]=useState('');
  useEffect(()=>{
    if(!host.current)return;
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError('This device cannot start 3D graphics. Your lessons and mission questions still work.');return;}
    const container=host.current;container.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#8aa39b');scene.fog=new THREE.FogExp2('#8aa39b',.024);
    const camera=new THREE.PerspectiveCamera(60,1,.1,180);camera.position.set(0,2,14);
    scene.add(new THREE.HemisphereLight('#e5f2df','#263b28',2));
    const sun=new THREE.DirectionalLight('#ffdaa3',3);sun.position.set(15,30,10);sun.castShadow=true;scene.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:'#405842',roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.85});
    const add=(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=scene)=>{const mesh=new THREE.Mesh(geo,material(color));mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;};
    for(let i=0;i<90;i++){const x=Math.sin(i*7.3)*65,z=Math.cos(i*3.7)*65;if(Math.abs(x)<6&&z>-25&&z<20)continue;add(new THREE.CylinderGeometry(.2,.4,7,7),'#695542',x,3.5,z);add(new THREE.ConeGeometry(3.5,8,8),'#244c3f',x,9,z);}
    for(let i=0;i<25;i++)add(new THREE.DodecahedronGeometry(.5+i%3),'#68756c',Math.sin(i*3)*40,.4,Math.cos(i*4)*40);
    const dinos:THREE.Group[]=[];
    for(let i=0;i<5;i++){
      const d=new THREE.Group();d.position.set((i-2)*9,0,-10-i*6);scene.add(d);dinos.push(d);
      const body=add(new THREE.SphereGeometry(1,18,12),i%2?'#707b50':'#66816a',0,2,0,d);body.scale.set(1.1,1.2,2.2);
      add(new THREE.CylinderGeometry(.35,.6,2,10),'#738760',0,3,-1.5,d).rotation.x=-.55;
      const head=add(new THREE.SphereGeometry(.8,14,10),'#738760',0,4,-2,d);head.scale.set(1,1,1.4);
      add(new THREE.SphereGeometry(.09,8,6),'#e9d59a',.6,4.2,-2.4,d);add(new THREE.SphereGeometry(.09,8,6),'#e9d59a',-.6,4.2,-2.4,d);
      const tail=add(new THREE.ConeGeometry(.7,4,12),'#66816a',0,2,3,d);tail.rotation.x=Math.PI/2;
      for(const x of [-.7,.7])for(const z of [-.8,.8])add(new THREE.CylinderGeometry(.24,.4,1.7,8),'#607958',x,.85,z,d);
    }
    // Cartoon robot-zombies patrol far from the player's safe path, without gore.
    if(zombies)for(let i=0;i<4;i++){const z=new THREE.Group();z.position.set(10+i*4,0,-8-i*5);scene.add(z);add(new THREE.BoxGeometry(.9,1.5,.5),'#637a6c',0,1.5,0,z);add(new THREE.BoxGeometry(.65,.65,.65),'#93ad7b',0,2.6,0,z);for(const x of [-.3,.3])add(new THREE.BoxGeometry(.25,1,.3),'#455960',x,.5,0,z);}
    for(const x of [-4,4])add(new THREE.BoxGeometry(1.2,7,1.5),'#495955',x,3.5,-24);
    add(new THREE.BoxGeometry(10,1.3,1.7),'#b7a273',0,7,-24);
    const beacon=add(new THREE.SphereGeometry(.7,16,12),'#efc568',0,3,-22);(beacon.material as THREE.MeshStandardMaterial).emissive=new THREE.Color('#ab7423');
    let frame=0,last=performance.now(),elapsed=0;
    const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const down=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){if(document.activeElement===renderer.domElement){e.preventDefault();keys.current.add(e.key);}}};const up=(e:KeyboardEvent)=>keys.current.delete(e.key);
    renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Dinosaur island. Use arrow keys or WASD to explore.');
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);const blur=()=>keys.current.clear();window.addEventListener('blur',blur);
    const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;const k=keys.current;camera.position.z+=((k.has('s')||k.has('ArrowDown')?1:0)-(k.has('w')||k.has('ArrowUp')?1:0))*dt*5;camera.position.x+=((k.has('d')||k.has('ArrowRight')?1:0)-(k.has('a')||k.has('ArrowLeft')?1:0))*dt*5;camera.position.x=THREE.MathUtils.clamp(camera.position.x,-12,12);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-20,22);if(!quiet){dinos.forEach((d,i)=>{d.rotation.y=Math.sin(elapsed*.25+i)*.25;d.position.y=Math.sin(elapsed*1.5+i)*.08;});}renderer.render(scene,camera);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);keys.current.clear();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();};
  },[zombies,quiet]);
  const task=MISSIONS[mission%MISSIONS.length];
  return <div className="expedition-shell"><div className="row between"><h1>🦖 Mandela’s rescue expedition</h1><button className="btn" onClick={onBack}>Return to base</button></div>
    <p>Click the world, then use WASD or arrow keys. Explore at your pace. No timer, no losing lives.</p>
    <div ref={host} className="expedition-viewport"/>{error&&<p role="alert">{error}</p>}
    <div className="row">{[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label,key])=><button className="btn" key={key} aria-label={`Move ${label}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)}>{label}</button>)}</div>
    <div className="card"><strong>Mission {mission+1}: {task.title}</strong><p>{task.q}</p><div className="row">{task.choices.map(c=><button className="btn" key={c} onClick={()=>{if(c===task.answer){onReward();void playEffect('reward');setMission(m=>m+1);setFeedback('Mission complete! Rescue supplies earned.');}else setFeedback('Take your time. Try another answer.');}}>{c}</button>)}</div><p role="status">{feedback}</p></div>
  </div>;
}
