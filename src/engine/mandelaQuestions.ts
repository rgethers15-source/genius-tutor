import type { Subject } from '../types';
import type { QuizItem } from '../data/curriculum6';
import { EXPEDITION_LESSONS } from '../data/expeditionCurriculum.ts';
export function parseMandelaQuestions(content:string):QuizItem[] {
 const obj=JSON.parse(content);const list=Array.isArray(obj)?obj:obj.questions;
 if(!Array.isArray(list))throw new Error('The tutor did not return usable practice. Try again.');
 const valid=list.filter((r:Record<string,unknown>)=>r&&typeof r.q==='string'&&Array.isArray(r.choices)&&r.choices.length===3&&r.choices.every(c=>typeof c==='string'&&c.length>0)&&new Set(r.choices).size===3&&typeof r.answer==='string'&&r.choices.includes(r.answer)&&typeof r.hint==='string');
 if(valid.length===0)throw new Error('The tutor returned no valid questions. Try again.');
 return valid.map(r=>({q:r.q,choices:r.choices,answer:r.answer,hint:r.hint}));
}
export async function mandelaQuestions(key:string,subject:Subject,count:number):Promise<QuizItem[]> {
 const targets=EXPEDITION_LESSONS.filter(l=>l.subject===subject).map(l=>l.standard+' '+l.topic).join('; ');
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key.trim()}`},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},messages:[{role:'system',content:`Create ${Math.min(10,Math.max(1,count))} practice questions for a seven-year-old in North Carolina first grade. Subject: ${subject}. Targets: ${targets || 'age-appropriate foundational skills'}. Use short clear sentences and dinosaur rescue examples. No 6th-grade content, violence or frightening imagery. Return a JSON object with questions: an array. Each question has q, exactly three distinct short choices, answer exactly matching one choice, and hint. Be factually accurate. Do not claim mastery or diagnosis.`},{role:'user',content:'Create fresh practice now.'}]})});
 if(!response.ok)throw new Error(`Practice service error ${response.status}. Check your key and credits in Explorer settings.`);
 const data=await response.json();return parseMandelaQuestions(data?.choices?.[0]?.message?.content??'').slice(0,count);
}
