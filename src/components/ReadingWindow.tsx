import {useEffect,useState} from 'react';
export function ReadingWindow({text,enabled}:{text:string;enabled:boolean}){
 const [line,setLine]=useState(0);const lines=text.split(/(?<=[.!?])\s+/).filter(Boolean);useEffect(()=>setLine(0),[text]);
 if(!enabled||lines.length<2)return <span>{text}</span>;
 const index=Math.min(line,lines.length-1);
 return <div className="academy-reading-window"><p className="faint">Reading window · sentence {index+1} of {lines.length}</p><p className="academy-reading-line">{lines[index]}</p><div className="row"><button className="btn ghost small" disabled={index===0} onClick={()=>setLine(l=>l-1)}>Previous sentence</button><button className="btn ghost small" disabled={index===lines.length-1} onClick={()=>setLine(l=>l+1)}>Next sentence</button></div><details><summary>Show the whole passage</summary><p>{text}</p></details></div>;
}
