import {mkdirSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mandeciesProfile} from '../src/data/mandeciesProfile.ts';
import {academyMissions} from '../src/data/academyCurriculum.ts';
mkdirSync('screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const fixture=readFileSync('e2e/fixtures/cached-video.mp4');let talks=0,uploaded=0,denied=false;
await page.route('https://api.d-id.com/**',async route=>{
 const url=route.request().url();if(denied){await route.fulfill({status:401,contentType:'application/json',body:'{"message":"Invalid test key"}'});return;}
 if(url.endsWith('/images')){uploaded++;assert.ok(route.request().postDataBuffer().includes(Buffer.from('image/png')));await route.fulfill({contentType:'application/json',body:'{"url":"https://test.example/portrait.png"}'});}
 else if(url.endsWith('/talks')){talks++;const data=route.request().postDataJSON();assert.equal(data.script.type,'text');assert.equal(data.script.provider.type,'microsoft');await route.fulfill({contentType:'application/json',body:JSON.stringify({id:'test-'+talks})});}
 else await route.fulfill({contentType:'application/json',body:'{"status":"done","result_url":"https://test.example/clip.mp4"}'});
});
await page.route('https://test.example/clip.mp4',route=>route.fulfill({contentType:'video/mp4',body:fixture}));
await page.addInitScript(()=>{
 window.__speechCount=0;window.speechSynthesis.speak=()=>{window.__speechCount++;};
 window.__music=[];const Base=window.Audio;window.Audio=function(...args){const a=new Base(...args);window.__music.push(a);return a;};window.Audio.prototype=Base.prototype;
 window.geniusTutor={loadData:async()=>JSON.parse(localStorage.getItem('genius-tutor-data')||'null'),saveData:async data=>{localStorage.setItem('genius-tutor-data',JSON.stringify(data));return true;},
 saveVideo:async(key,buffer)=>{let binary='';for(const b of new Uint8Array(buffer))binary+=String.fromCharCode(b);localStorage.setItem('test-video-'+key,btoa(binary));return window.geniusTutor.getVideo(key);},
 getVideo:async key=>{const raw=localStorage.getItem('test-video-'+key);return raw?URL.createObjectURL(new Blob([Uint8Array.from(atob(raw),c=>c.charCodeAt(0))],{type:'video/mp4'})):null;},listVideos:async()=>Object.keys(localStorage).filter(k=>k.startsWith('test-video-'))};
});
await page.goto('http://localhost:5173');
const learner={...mandeciesProfile(),id:'madeline-existing',name:'Madeline',transportEnvironment:false,animeEnvironment:false,starsEarned:12,progress:{reading:4},autoSpeak:false,focusMusic:false,soundEffects:false,videoMode:true,tutorImages:{'tutor-kaito':'data:image/png;base64,kept'}};
const others=['McKenzie','Mandela','Mandecies'].map((name,i)=>({...mandeciesProfile(),name,id:'other-'+i,starsEarned:8}));
await page.evaluate(data=>localStorage.setItem('genius-tutor-data',JSON.stringify(data)),{version:1,profiles:[learner,...others]});await page.reload();
await page.getByText('Madeline',{exact:true}).click();
await page.waitForFunction(()=>document.querySelectorAll('.academy-guide-card img').length===6&&[...document.querySelectorAll('.academy-guide-card img')].every(i=>i.complete&&i.naturalWidth>0));
await page.screenshot({path:'screenshots/madeline-academy.png',fullPage:true});
await page.getByRole('button',{name:'Settings',exact:false}).first().click();
await page.getByLabel('D-ID API key',{exact:true}).fill('mock-key-with-paid-plan');
await page.getByRole('button',{name:'Save settings',exact:true}).click();
await page.getByRole('button',{name:'Learn with Ren',exact:true}).click();
await page.getByRole('button',{name:'Lessons & Tests',exact:false}).click();
await page.getByText('Crystal ratios',{exact:true}).first().click();
for(let i=0;i<3;i++)await page.getByRole('button',{name:'Next →',exact:true}).click();
await page.getByRole('button',{name:'2 to 3',exact:true}).click();await page.getByRole('button',{name:'Hide hint',exact:true}).waitFor();
await page.getByRole('button',{name:'3 to 2',exact:true}).click();await page.getByRole('button',{name:'Continue when ready →',exact:true}).waitFor();
await page.waitForTimeout(2900);assert.equal(await page.getByRole('button',{name:'Continue when ready →',exact:true}).count(),1);
await page.screenshot({path:'screenshots/madeline-supported-lesson.png',fullPage:true});
await page.getByRole('button',{name:'Continue when ready →',exact:true}).click();await page.getByRole('button',{name:'Back to tutor',exact:false}).click();
await page.getByRole('button',{name:'Choose another tutor',exact:false}).click();
await page.getByRole('button',{name:'Focus studio & small wins',exact:false}).click();
await page.getByLabel('A small win I want to remember').fill('I used the ratio example and tried again.');await page.getByLabel('What helped me?').fill('A hint and extra time.');await page.getByRole('button',{name:'Save my small win',exact:true}).click();await page.getByText('Your small win is saved.',{exact:true}).waitFor();await page.getByRole('button',{name:'Back to academy',exact:false}).click();
await page.getByRole('button',{name:'Enter the 3D celestial academy',exact:false}).click();await page.locator('canvas').waitFor();await page.waitForTimeout(1200);await page.screenshot({path:'screenshots/madeline-sky-bridges.png',fullPage:true});
for(let i=0;i<6;i++){
 await page.getByRole('button',{name:'Portal to next learning stop',exact:true}).click();await page.getByRole('button',{name:'Read learning challenge',exact:true}).waitFor();
 await page.getByText('Teach me first · worked example',{exact:true}).click();
 await page.getByRole('button',{name:academyMissions(0)[i].answer,exact:true}).click();await page.getByText('Learning light earned. You used a strategy!',{exact:true}).waitFor();
 await page.getByRole('button',{name:i===5?'Save my journey':'Next learning stop →',exact:true}).click();
}
await page.getByText('All six learning lights collected!',{exact:true}).waitFor();await page.getByRole('button',{name:'Return to academy',exact:true}).first().click();
await page.getByRole('button',{name:'Talking tutor studio',exact:false}).click();await page.getByLabel('Tutor',{exact:true}).selectOption('tutor-ren');
await page.getByRole('button',{name:'Prepare and save videos',exact:true}).click();await page.getByText('Ready: 7 of 7 clips saved, including 0 already on disk.',{exact:true}).waitFor({timeout:60000});assert.equal(talks,7);assert.equal(uploaded,7);
await page.getByRole('button',{name:'Prepare and save videos',exact:true}).click();await page.getByText('Ready: 7 of 7 clips saved, including 7 already on disk.',{exact:true}).waitFor();assert.equal(talks,7);
await page.getByRole('button',{name:'Preview saved greeting',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0);await page.getByRole('button',{name:'Close video preview',exact:true}).click();
await page.getByLabel('Video voice',{exact:true}).selectOption({index:0});await page.getByText('0 of 7 clips already saved',{exact:true}).waitFor();await page.getByLabel('Video voice',{exact:true}).selectOption('en-US-BrandonMultilingualNeural');await page.getByText('7 of 7 clips already saved',{exact:true}).waitFor();
await page.screenshot({path:'screenshots/madeline-talking-video-studio.png',fullPage:true});
await page.getByRole('button',{name:'Back to academy',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:false}).first().click();await page.getByLabel('Tutors speak automatically',{exact:true}).check();await page.getByLabel('Chill focus instrumentals',{exact:true}).check();await page.getByRole('button',{name:'Save settings',exact:true}).click();
// Saved video must play its actual MP4 audio, silence TTS and duck music.
const before=await page.evaluate(()=>window.__speechCount);await page.getByRole('button',{name:'Learn with Ren',exact:true}).click();
await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.currentTime>0&&!v.paused;});
assert.equal(await page.evaluate(()=>window.__speechCount),before);
await page.waitForFunction(()=>window.__music.length===1&&window.__music[0].volume<.1);
await page.screenshot({path:'screenshots/madeline-cached-video-playback.png',fullPage:true});
await page.evaluate(()=>document.querySelector('video').pause());await page.waitForFunction(()=>window.__music[0].volume>=.14);
await page.getByRole('button',{name:'Lessons & Tests',exact:false}).click();await page.getByText('Crystal ratios',{exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0);assert.equal(await page.evaluate(()=>window.__speechCount),before);
await page.reload();await page.getByText('Madeline',{exact:true}).click();await page.getByRole('button',{name:'Learn with Ren',exact:true}).click();await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0);assert.equal(talks,7);
await page.getByRole('button',{name:'Choose another tutor',exact:false}).click();await page.getByRole('button',{name:'Talking tutor studio',exact:false}).click();denied=true;await page.getByLabel('Tutor',{exact:true}).selectOption('tutor-sora');await page.getByRole('button',{name:'Prepare and save videos',exact:true}).click();await page.getByText('D-ID rejected the key (401). In the app it must be the full API_USER:API_PASSWORD from the D-ID Studio.',{exact:true}).waitFor();assert.equal(talks,7);
const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('genius-tutor-data')));assert.equal(data.profiles[0].starsEarned,19);assert.equal(data.profiles[0].animeJourneys,1);assert.equal(data.profiles[0].animeWins.length,1);assert.equal(data.profiles[0].tutorImages['tutor-kaito'],learner.tutorImages['tutor-kaito']);assert.deepEqual(data.profiles.slice(1),others);assert.deepEqual(errors,[]);
console.log('Madeline: lifelike portraits, manual supported lesson, notebook, six 3D quests, D-ID PNG upload/preparation/cache playback/voice invalidation/auth errors, music ducking and three-profile isolation passed. D-ID was mocked; no paid API was used.');await browser.close();
