/** Original procedural nature/foley cues, kept behind the profile's audio controls. */
import { effectsAvailable, effectsLevel } from './soundEffects';
let audio:AudioContext|null=null;
let lastStep=0;
export async function islandSound(cue:'footstep'|'scan'|'dinosaur') {
 if(!effectsAvailable())return;
 if(cue==='footstep'&&Date.now()-lastStep<420)return;
 lastStep=Date.now();
 try {
  audio??=new AudioContext();await audio.resume();if(!effectsAvailable())return;
  const duration=cue==='dinosaur'?1.2:cue==='scan'?.5:.12;
  const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);
  const samples=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++){const t=i/audio.sampleRate;samples[i]=(Math.random()*2-1)*Math.exp(-t/(duration*.28));}
  const source=audio.createBufferSource();source.buffer=buffer;
  const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cue==='dinosaur'?180:cue==='footstep'?450:2200;
  const gain=audio.createGain();gain.gain.value=(cue==='dinosaur'?.08:.045)*effectsLevel();
  source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
 }catch{ /* Movement always works if audio is unavailable. */ }
}
