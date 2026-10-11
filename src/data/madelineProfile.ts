import type {Profile} from '../types';
/** One-time upgrade of Madeline only. Saved identity, work, media and keys survive. */
export function upgradeMadelineProfile(profile:Profile):Profile {
 if(profile.name.trim().toLowerCase()!=='madeline'||profile.animeAcademyVersion===1)return profile;
 return {...profile,animeAcademyVersion:1,animeEnvironment:true,princessEnvironment:false,jurassicEnvironment:false,transportEnvironment:false,
  plan:{...profile.plan,gradeLevel:'6',subjects:Array.from(new Set([...profile.plan.subjects,'reading','math','science','writing','socialStudies','music']))},
  support:{...profile.support,dyslexiaSupport:true,extraTime:true,reducedDistraction:true,readAloud:true},
  reasoningLevel:profile.reasoningLevel??'3',animeFocusMode:true,animeReadingWindow:true,animeUseNewPortraits:true,
  videoMode:profile.videoMode??true,humanVoice:profile.humanVoice??true,autoSpeak:profile.autoSpeak??true,princessVoiceProvider:profile.princessVoiceProvider??'auto',princessVoiceRate:profile.princessVoiceRate??.9,
  soundEffects:profile.soundEffects??true,effectsVolume:profile.effectsVolume??.2,focusMusic:profile.focusMusic??true,musicVolume:profile.musicVolume??.15};
}
