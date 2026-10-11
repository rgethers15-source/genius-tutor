import type {AnimeTutor} from '../data/animeTutors';
import type {Lesson} from '../data/curriculum6';
import {getCachedVideo,saveCachedVideo,cacheAvailable} from '../data/videoCache.ts';
import type {VideoAvatarProvider,VideoVoice} from './videoAvatar';
export const ACADEMY_CHEER='You used the clues and made progress. Keep that strategy.';
export const ACADEMY_FINISHED='Lesson complete. You took it one step at a time.';
/** New faces and selected video voices get their own cache; legacy clips stay untouched. */
export function academyVideoId(tutorId:string,image:string,voiceId:string):string{
 const text='academy-real-v1|'+image+'|'+voiceId;let h=2166136261;
 for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
 return tutorId+'-academy-'+h.toString(36);
}
export function collectAcademyLines(tutor:AnimeTutor,lessons:Lesson[],scope:'starter'|'all'):string[]{
 const bank=lessons.filter(l=>l.subject===tutor.subject);const selected=scope==='starter'?bank.slice(0,1):bank;
 return [...new Set([tutor.greeting,...selected.flatMap(l=>[...l.steps.map(s=>s.say),...l.quiz.map(q=>q.q)]),ACADEMY_CHEER,ACADEMY_FINISHED])];
}
export interface AcademyVideoProgress{total:number;ready:number;skipped:number;current:string}
export async function prepareAcademyVideos({provider,cacheId,image,voice,lines,onProgress,cancelled}:{provider:VideoAvatarProvider;cacheId:string;image:string;voice:VideoVoice;lines:string[];onProgress:(p:AcademyVideoProgress)=>void;cancelled:()=>boolean}):Promise<AcademyVideoProgress>{
 if(!cacheAvailable())throw Error('Saved videos need the installed desktop app.');
 const progress={total:lines.length,ready:0,skipped:0,current:''};
 for(const line of lines){
  if(cancelled())break;progress.current=line;onProgress({...progress});
  if(await getCachedVideo(cacheId,line)){progress.ready++;progress.skipped++;onProgress({...progress});continue;}
  const result=await provider.speakVideo(image,line,voice);
  if(!result.ok)throw Error(result.error||'The video service could not prepare this clip.');
  try{
   let blob=result.blob;
   if(!blob&&result.videoUrl){const response=await fetch(result.videoUrl);if(!response.ok)throw Error('The finished video could not be downloaded.');blob=await response.blob();}
   if(!blob||!blob.size)throw Error('The video service returned an empty clip.');
   const saved=await saveCachedVideo(cacheId,line,blob);
   if(!saved)throw Error('The clip was created, but saving failed. Check available disk space before trying again.');
   progress.ready++;onProgress({...progress});
  }finally{if(result.videoUrl?.startsWith('blob:'))URL.revokeObjectURL(result.videoUrl);}
 }
 return progress;
}
