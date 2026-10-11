import type {QuizItem} from '../data/curriculum6';
import type {Subject} from '../types';
import {ACADEMY_LESSONS} from '../data/academyCurriculum.ts';
export function parseAcademyQuestions(content:string):QuizItem[]{
 try{const raw=JSON.parse(content);return (Array.isArray(raw?.questions)?raw.questions:[]).filter((q:QuizItem)=>typeof q.q==='string'&&q.q.trim()&&Array.isArray(q.choices)&&q.choices.length===3&&q.choices.every(c=>typeof c==='string'&&c.trim())&&new Set(q.choices).size===3&&typeof q.answer==='string'&&q.choices.includes(q.answer)&&typeof q.hint==='string'&&q.hint.trim()).map((q:QuizItem)=>({q:q.q,choices:q.choices,answer:q.answer,hint:q.hint}));}catch{return [];}
}
export async function generateAcademyQuestions(key:string,subject:Subject,count=5):Promise<QuizItem[]>{
 const targets=ACADEMY_LESSONS.filter(l=>l.subject===subject).map(l=>`${l.standard}: ${l.topic}`).join('; ');
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key.trim()}`},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},messages:[{role:'system',content:`Write ${count} original practice questions for a sixth-grade learner. Targets: ${targets}. Keep these academic targets while using concrete examples, short sentences, three concise choices and a worked-example hint. Do not use baby talk, a timer, stereotypes, romance or confidence claims. Return JSON {"questions":[{"q":"...","choices":["...","...","..."],"answer":"one exact choice","hint":"..."}]}. Check every answer.`},{role:'user',content:`Create ${count} fresh supported learning challenges.`}],temperature:.6})});
 if(!response.ok)throw Error(`Practice service returned ${response.status}. Use the offline lessons for now.`);
 const data=await response.json(),items=parseAcademyQuestions(data?.choices?.[0]?.message?.content??'');
 if(!items.length)throw Error('The practice service returned unusable questions. Offline lessons are still available.');return items.slice(0,count);
}
