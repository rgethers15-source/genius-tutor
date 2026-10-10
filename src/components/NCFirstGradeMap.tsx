import { useEffect, useState } from 'react';
import standards from '../data/ncGrade1Standards.json';
import { activityFor } from '../data/mandelaActivities';
import type { Profile } from '../types';
import { getSpeech } from '../engine/speech';
import { JURASSIC_TUTORS } from '../data/jurassicTutors';
export function NCFirstGradeMap({profile,onUpdate,onBack}:{profile:Profile;onUpdate:(p:Profile)=>void;onBack:()=>void}) {
 const [area,setArea]=useState('Mathematics');const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<(typeof standards)[number]|null>(null);
 const id=selected?selected.area+':'+selected.code:'';
 const [response,setResponse]=useState(''); const [step,setStep]=useState(0);const [saved,setSaved]=useState(false);
 useEffect(()=>()=>getSpeech().stop(),[]);
 const areas=[...new Set(standards.map(s=>s.area))];
 const activity=selected?activityFor(selected.area,selected.code,selected.objective):null;
 const completed=Object.values(profile.jurassicFieldwork??{}).filter(s=>s.done).length;
 const save=(done:boolean)=>{onUpdate({...profile,jurassicFieldwork:{...profile.jurassicFieldwork,[id]:{response:response.slice(0,4000),done,at:new Date().toISOString()}}});setSaved(true);};
 return <div className="center card field-map"><div className="row between"><h1>🧭 First-grade field academy</h1><button className="btn" onClick={()=>{getSpeech().stop();onBack();}}>Return to base</button></div>
 <p>{completed} of {standards.length} goals explored · Your work stays on this device.</p>
 {selected&&activity?<section><button className="btn ghost" onClick={()=>{getSpeech().stop();setSelected(null);}}>← All missions</button><h2>{activity.title}</h2><span className="pill">{selected.area} · {selected.code}</span>
 <details><summary>Grown-up learning goal</summary><p>{selected.objective}</p></details>
 <p className="dyslexia">{activity.teach}</p><p><strong>Bring:</strong> {activity.materials}</p>
 <p>Step {step+1} of {activity.steps.length}</p><h3 className="dyslexia">{activity.steps[step]}</h3>
 <div className="row"><button className="btn" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous step</button><button className="btn" disabled={step===activity.steps.length-1} onClick={()=>setStep(s=>s+1)}>Next step</button>
 <button className="btn" onClick={()=>getSpeech().speak(activity.teach+' '+activity.steps[step],{voice:JURASSIC_TUTORS.find(t=>t.subject===activity.subject)?.voice ?? JURASSIC_TUTORS[0].voice,allowSystemFallback:true})}>🔊 Hear this step</button></div>
 <p><strong>Show what you learned:</strong> {activity.check}</p><label>Your field notes — type, or describe your drawing to a grown-up<textarea value={response} maxLength={4000} rows={5} onChange={e=>{setResponse(e.target.value);setSaved(false);}}/></label>
 <div className="row"><button className="btn ghost" onClick={()=>save(false)}>Save notes</button><button className="btn" onClick={()=>save(true)}>I tried this activity</button></div>{saved&&<p role="status">Fieldwork saved. Practicing a goal is a step toward learning it.</p>}
 <p className="faint">Have a grown-up check the goal with your work. This records practice, not a mastery score. Some goals need several sessions or a classroom partner.</p></section>:
 <><p>Choose a learning area, then open a field mission. Lessons and projects work offline. Read-aloud uses your selected voice service or device voice.</p><div className="row"><label>Learning area<select value={area} onChange={e=>setArea(e.target.value)}>{areas.map(a=><option key={a}>{a}</option>)}</select></label><label>Find a goal<input value={query} placeholder="Search words or code" onChange={e=>setQuery(e.target.value)}/></label></div>
 <div className="grid cols-2">{standards.filter(s=>s.area===area&&(!query||(s.code+' '+s.objective).toLowerCase().includes(query.toLowerCase()))).map(s=>{const key=s.area+':'+s.code;const a=activityFor(s.area,s.code,s.objective);return <button className="card field-goal" key={key} onClick={()=>{setSelected(s);setStep(0);setSaved(false);setResponse(profile.jurassicFieldwork?.[key]?.response??'');}}><strong>{s.code} · {a.title}</strong><p>{s.objective}</p><span>{profile.jurassicFieldwork?.[key]?.done?'✓ Practiced':'Open activity →'}</span></button>;})}</div>
 <details><summary>Curriculum reference and coverage</summary><p>Targets follow NC DPI’s 2025 Grade 1 Quick Reference Guide, including integrated K–2 computer science and all-grade digital learning/student-success goals. This academy pairs every listed target with an introductory project. It does not replace a school’s full instructional sequence or certify mastery. ELA changes in 2027–28.</p><a href="https://www.dpi.nc.gov/documents/publications/catalog/is184-quick-reference-guide-1st/open" target="_blank" rel="noreferrer">Open the official NC reference</a></details></>}
 </div>;
}
