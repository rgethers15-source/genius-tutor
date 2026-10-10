import { DEFAULT_SUPPORT, type Profile } from '../types.ts';
export function mandelaProfile(): Profile {
  return {id:'mandela-'+Date.now().toString(36),name:'Mandela',age:7,school:'Palisades Park Elementary, Charlotte, NC',avatarId:'pixar-boy',
    plan:{gradeLevel:'1',subjects:['math','reading','writing','science','socialStudies','art','music','speech','africanHeritage'],primaryLearningStyle:'kinetic',pacing:2,goals:['Read confidently','Solve first-grade problems','Explore and create']},
    support:{...DEFAULT_SUPPORT},nightMode:false,setupComplete:true,createdAt:new Date().toISOString(),progress:{},starsEarned:0,jurassicEnvironment:true,
    autoSpeak:true,humanVoice:true,princessVoiceProvider:'auto',princessVoiceRate:0.95,jurassicZombies:false,focusMusic:true,musicVolume:0.18,soundEffects:true,effectsVolume:0.25};
}

/** Upgrade only Mandela's legacy profile, keeping its identity, progress and settings. */
export function upgradeMandelaProfile(profile: Profile): Profile {
  if (profile.name.trim().toLowerCase() !== 'mandela' || profile.jurassicEnvironment) return profile;
  const defaults = mandelaProfile();
  return { ...defaults, ...profile, jurassicEnvironment: true, princessEnvironment: false, animeEnvironment: false,
    plan: { ...profile.plan, gradeLevel: '1', subjects: defaults.plan.subjects } };
}
