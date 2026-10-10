import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { mandelaProfile } from '../src/data/mandelaProfile.ts';
import { ROYAL_MISSIONS } from '../src/data/royalMissions.ts';
mkdirSync('screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__music=[];const Base=window.Audio;window.Audio=function(...args){const audio=new Base(...args);window.__music.push(audio);return audio;};window.Audio.prototype=Base.prototype;});
await page.goto('http://localhost:5173');
const mckenzie={...mandelaProfile(),id:'mckenzie-existing',name:'McKenzie',princessEnvironment:true,jurassicEnvironment:false,autoSpeak:false,focusMusic:false,soundEffects:false,musicVolume:.2,starsEarned:12};
const mandela={...mandelaProfile(),id:'mandela-existing',autoSpeak:false};
await page.evaluate(profiles=>localStorage.setItem('genius-tutor-data',JSON.stringify({version:1,profiles})),[mckenzie,mandela]);
await page.reload();await page.getByText('McKenzie',{exact:true}).click();
await page.waitForFunction(()=>[...document.querySelectorAll('.princess-portal img')].length===8&&[...document.querySelectorAll('.princess-portal img')].every(i=>i.complete&&i.naturalWidth>0));
await page.screenshot({path:'screenshots/royal-academy.png',fullPage:true});
await page.getByRole('button',{name:/Princess Amara/}).click();
await page.getByRole('button',{name:/Play Princess Amara.*theme/}).click();
await page.waitForFunction(()=>window.__music.length===1&&window.__music[0].src.endsWith('/princess-amara.mp3')&&window.__music[0].currentTime>0&&!window.__music[0].paused);
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('gt-speaking',{detail:true})));
await page.waitForFunction(()=>Math.abs(window.__music[0].volume-.04)<.001);
await page.evaluate(()=>{window.dispatchEvent(new CustomEvent('gt-listening',{detail:true}));window.dispatchEvent(new CustomEvent('gt-speaking',{detail:false}));});
await page.waitForFunction(()=>Math.abs(window.__music[0].volume-.04)<.001);
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('gt-listening',{detail:false})));
await page.waitForFunction(()=>Math.abs(window.__music[0].volume-.2)<.001);
await page.getByRole('button',{name:'Music On',exact:false}).click();await page.waitForFunction(()=>window.__music[0].paused);
await page.getByRole('button',{name:'Princesses',exact:false}).click();
await page.getByRole('button',{name:/Enter the 3D royal realm/}).click();
await page.locator('canvas').waitFor();await page.waitForTimeout(1500);
await page.screenshot({path:'screenshots/royal-garden.png',fullPage:true});
for(let i=0;i<9;i++){
 if(i===0){await page.locator('canvas').focus();await page.keyboard.down('w');await page.getByRole('button',{name:'Read royal question',exact:false}).waitFor({timeout:30000});await page.keyboard.up('w');}
 else{await page.getByRole('button',{name:'Royal carriage to next gem',exact:false}).click();await page.getByRole('button',{name:'Read royal question',exact:false}).waitFor({timeout:10000});}
 if(i===0){await page.getByRole('button',{name:'4',exact:true}).click();}
 await page.getByRole('button',{name:ROYAL_MISSIONS[i].answer,exact:true}).click();
 await page.getByText('Royal gem earned!',{exact:true}).waitFor();
 if(i===0)await page.screenshot({path:'screenshots/royal-gem.png',fullPage:true});
 await page.getByRole('button',{name:i===8?'Light the royal palace':'Next royal gem →',exact:true}).click();
}
await page.getByText('The palace is shining!',{exact:false}).waitFor();await page.screenshot({path:'screenshots/royal-complete.png',fullPage:true});
const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('genius-tutor-data')));
const saved=data.profiles.find(p=>p.id==='mckenzie-existing');
if(errors.length||saved.starsEarned!==21||saved.royalJourneys!==1||saved.stats.bySubject.math.attempts!==2||JSON.stringify(data.profiles[1])!==JSON.stringify(mandela))throw Error(JSON.stringify({errors,saved,mandela:data.profiles[1]}));
console.log('Royal realm: nine quests, saved journey, audio playback/ducking/mute, existing progress and Mandela isolation passed.');
await browser.close();
