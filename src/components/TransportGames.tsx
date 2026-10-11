import {useRef,useState} from 'react';
export function TransportGames({speak,onEarnStar}:{speak:(text:string)=>void;onEarnStar:()=>void}){
 const [level,setLevel]=useState(0),[round,setRound]=useState(0),[solved,setSolved]=useState(false),[feedback,setFeedback]=useState('');const locked=useRef(false);
 const a=round%5+1,b=(round*3)%5+1;
 const answer=level===1?String(a):level===2?String(a+1):(a===b?'Equal':a>b?'First truck':'Second truck');
 const choices=level===1?[String(a),String(a===5?4:a+1),'0']:level===2?[String(a+1),String(a),String(a+2)]:['First truck','Second truck','Equal'];
 const prompt=level===1?`Count the ${a} cargo blocks.`:level===2?`${a} blocks and one more. How many altogether?`:`First truck has ${a} blocks. Second truck has ${b}. Which has more?`;
 if(!level)return <div className="grid cols-3">{['Count cargo','One more block','Compare trucks'].map((title,i)=><button className="kid-btn" key={title} onClick={()=>{setLevel(i+1);setRound(0);locked.current=false;setSolved(false);setFeedback('');}}>{title}</button>)}</div>;
 return <div><h2>{prompt}</h2><p style={{fontSize:'2rem'}}>{'📦'.repeat(a)}{level===2?' + 📦':level===3?' | '+'📦'.repeat(b):''}</p><button className="btn ghost" onClick={()=>speak(prompt)}>Read the cargo challenge</button><div className="row">{choices.map(c=><button className="btn" key={c} disabled={solved} onClick={()=>{if(locked.current)return;if(c===answer){locked.current=true;setSolved(true);setFeedback('Delivery star earned!');onEarnStar();speak('Great counting!');}else{setFeedback('Touch each block and count slowly. Try again.');speak('Count slowly and try again.');}}}>{c}</button>)}</div><p role="status">{feedback}</p>{solved&&<button className="btn" onClick={()=>{locked.current=false;setSolved(false);setFeedback('');setRound(r=>r+1);}}>Next cargo challenge</button>}<button className="btn ghost" onClick={()=>setLevel(0)}>Choose a game</button></div>;
}
