import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {upgradeMadelineProfile} from '../src/data/madelineProfile.ts';
import {mandeciesProfile} from '../src/data/mandeciesProfile.ts';
import {ACADEMY_LESSONS,academyMissions} from '../src/data/academyCurriculum.ts';
import {academyVideoId,collectAcademyLines,prepareAcademyVideos,ACADEMY_CHEER,ACADEMY_FINISHED} from '../src/engine/academyVideo.ts';
import {parseAcademyQuestions} from '../src/engine/academyQuestions.ts';
const tutor={id:'tutor-ren',subject:'math',greeting:'Hello. Let’s solve this together.'};
let disk,calls,saves;
beforeEach(()=>{disk=new Map();calls=[];saves=[];globalThis.window={geniusTutor:{getVideo:async key=>disk.get(key)||null,saveVideo:async(key,bytes)=>{saves.push({key,bytes});disk.set(key,'gtvideo://'+key);return disk.get(key);}}};});
const opts=()=>({provider:{speakVideo:async(image,text,voice)=>{calls.push({image,text,voice});return {ok:true,smart:true,blob:new Blob(['real-test-bytes'])};}},cacheId:'ren-face-a',image:'face-a.png',voice:{provider:'microsoft',voiceId:'voice-a'},lines:['First idea.','Second idea.'],onProgress:()=>{},cancelled:()=>false});
test('Madeline upgrade preserves saved work and uploads, leaves other profiles unchanged and runs once',()=>{
 const old={...mandeciesProfile(),name:' Madeline ',id:'keep',starsEarned:19,progress:{reading:7},tutorImages:{'tutor-ren':'old-upload'},stats:{custom:'retained'}};
 const next=upgradeMadelineProfile(old);assert.equal(next.id,'keep');assert.equal(next.starsEarned,19);assert.deepEqual(next.progress,old.progress);assert.equal(next.tutorImages,old.tutorImages);assert.equal(next.stats,old.stats);assert.equal(next.plan.gradeLevel,'6');assert.equal(next.animeEnvironment,true);assert.equal(next.support.extraTime,true);
 assert.equal(upgradeMadelineProfile({...next,animeReadingWindow:false}).animeReadingWindow,false);
 for(const name of ['McKenzie','Mandela','Mandecies']){const other={...old,name};assert.equal(upgradeMadelineProfile(other),other);}
});
test('33 original scaffolded lessons have distinct IDs, valid three-choice questions and rotating six-subject journeys',()=>{
 assert.equal(ACADEMY_LESSONS.length,33);assert.equal(new Set(ACADEMY_LESSONS.map(l=>l.id)).size,33);
 for(const l of ACADEMY_LESSONS){assert.equal(l.steps.length,3);assert.ok(l.steps[1].say.startsWith('Example:'));for(const q of l.quiz){assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));assert.ok(q.hint);}}
 for(let i=0;i<3;i++){assert.equal(new Set(academyMissions(i).map(q=>q.subject)).size,6);}
 assert.notEqual(academyMissions(0)[0].q,academyMissions(1)[0].q);
 assert.equal(ACADEMY_LESSONS.find(l=>l.topic==='Crystal ratios').quiz[0].answer,'3 to 2');
});
test('Recording set matches exact lesson narration and face/voice changes use separate caches',()=>{
 const lines=collectAcademyLines(tutor,ACADEMY_LESSONS,'starter'),lesson=ACADEMY_LESSONS.find(l=>l.subject==='math');
 assert.deepEqual(lines,[tutor.greeting,...lesson.steps.map(s=>s.say),lesson.quiz[0].q,ACADEMY_CHEER,ACADEMY_FINISHED]);assert.equal(lines.length,7);
 const key=academyVideoId(tutor.id,'face-a','voice-a');assert.equal(key,academyVideoId(tutor.id,'face-a','voice-a'));assert.notEqual(key,academyVideoId(tutor.id,'face-b','voice-a'));assert.notEqual(key,academyVideoId(tutor.id,'face-a','voice-b'));assert.notEqual(key,tutor.id);
});
test('Preparation saves real bytes sequentially and a second run skips paid regeneration',async()=>{
 const progress=[];const o={...opts(),onProgress:p=>progress.push(p)};assert.equal((await prepareAcademyVideos(o)).ready,2);assert.equal(calls.length,2);assert.equal(saves.length,2);assert.ok(saves.every(s=>s.bytes.byteLength>0));assert.equal(progress.at(-1).ready,2);
 const result=await prepareAcademyVideos(o);assert.equal(result.skipped,2);assert.equal(calls.length,2);
});
test('Preparation rejects unavailable storage before spending credits and never labels failed save ready',async()=>{
 delete window.geniusTutor;await assert.rejects(prepareAcademyVideos(opts()),/installed desktop/);assert.equal(calls.length,0);
 window.geniusTutor={saveVideo:async()=>null,getVideo:async()=>null};const progress=[];await assert.rejects(prepareAcademyVideos({...opts(),onProgress:p=>progress.push(p)}),/saving failed/);assert.equal(progress.at(-1).ready,0);assert.equal(calls.length,1);
});
test('Stop keeps the current saved clip; service errors halt further requests and empty results are rejected',async()=>{
 let stop=false;let o=opts();const provider=o.provider;o.provider={speakVideo:async(...args)=>{const result=await provider.speakVideo(...args);stop=true;return result;}};o.cancelled=()=>stop;assert.equal((await prepareAcademyVideos(o)).ready,1);assert.equal(calls.length,1);
 await assert.rejects(prepareAcademyVideos({...opts(),cacheId:'other',provider:{speakVideo:async()=>({ok:false,error:'D-ID 401',smart:true})}}),/401/);
 await assert.rejects(prepareAcademyVideos({...opts(),cacheId:'empty',provider:{speakVideo:async()=>({ok:true,blob:new Blob([]),smart:true})}}),/empty clip/);
});
test('AI questions reject duplicates, wrong answers and malformed content',()=>{
 const valid=ACADEMY_LESSONS[0].quiz[0];assert.equal(parseAcademyQuestions(JSON.stringify({questions:[valid]})).length,1);
 assert.equal(parseAcademyQuestions(JSON.stringify({questions:[{...valid,answer:'wrong'},{...valid,choices:['a','a','b']}]})).length,0);assert.deepEqual(parseAcademyQuestions('bad'),[]);
});
