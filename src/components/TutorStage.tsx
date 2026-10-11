import {useEffect,useRef,useState} from 'react';
import type {AnimeTutor} from '../data/animeTutors';
import {AnimatedAvatar,type AvatarMood} from './AnimatedAvatar';
import {getCachedVideo} from '../data/videoCache';
import {getSpeech} from '../engine/speech';
let playingVideo:HTMLVideoElement|null=null;
const announce=(on:boolean)=>window.dispatchEvent(new CustomEvent('gt-speaking',{detail:on}));
export function TutorStage({tutor,imageSrc,mood,line,size=400,videoEnabled,videoCacheId,videoUrlOverride,onVideoError}:{tutor:AnimeTutor;imageSrc?:string;mood:AvatarMood;line:string;size?:number;videoEnabled:boolean;videoCacheId?:string;videoUrlOverride?:string;onVideoError?:()=>void}){
 const [videoUrl,setVideoUrl]=useState<string|null>(null),video=useRef<HTMLVideoElement|null>(null);
 const cacheId=videoCacheId??tutor.id;
 const errorHandler=useRef(onVideoError);errorHandler.current=onVideoError;
 useEffect(()=>{let active=true;setVideoUrl(null);if(videoUrlOverride)setVideoUrl(videoUrlOverride);else if(videoEnabled&&line)void getCachedVideo(cacheId,line).then(url=>{if(active)setVideoUrl(url);});return()=>{active=false;};},[cacheId,line,videoEnabled,videoUrlOverride]);
 useEffect(()=>{
  const element=video.current;
  const stop=()=>element?.pause();
  const replay=(event:Event)=>{if((event as CustomEvent).detail!==cacheId)return;if(element){element.currentTime=0;void element.play().catch(()=>errorHandler.current?.());}};
  window.addEventListener('gt-stop-video',stop);window.addEventListener('gt-replay-video',replay);
  return()=>{window.removeEventListener('gt-stop-video',stop);window.removeEventListener('gt-replay-video',replay);element?.pause();if(playingVideo===element){playingVideo=null;announce(false);}};
 },[videoUrl,cacheId]);
 const end=()=>{if(playingVideo===video.current){playingVideo=null;announce(false);}};
 if(videoUrl)return <video ref={video} src={videoUrl} autoPlay playsInline controls aria-label={`${tutor.name} recorded talking lesson`} onPlaying={()=>{if(playingVideo&&playingVideo!==video.current)playingVideo.pause();getSpeech().stop();playingVideo=video.current;announce(true);}} onPause={end} onEnded={end} onError={()=>{end();setVideoUrl(null);onVideoError?.();}} style={{width:size,height:size,maxWidth:'100%',objectFit:'cover',borderRadius:24,border:`3px solid ${tutor.accent}`}}/>;
 return <AnimatedAvatar imageSrc={imageSrc} mood={mood} accent={tutor.accent} size={size} fallbackGlyph={tutor.fallbackGlyph}/>;
}
