import { DEFAULT_SUPPORT, type Profile } from '../types.ts';
export function mandeciesProfile(): Profile {
  return {id:'mandecies-'+Date.now().toString(36),name:'Mandecies',age:5,avatarId:'pixar-boy',
    plan:{gradeLevel:'K',subjects:['math','reading','writing','science','socialStudies','art','music','speech','africanHeritage'],primaryLearningStyle:'kinetic',pacing:2,goals:['Read confidently','Solve kindergarten problems','Explore and create']},
    support:{...DEFAULT_SUPPORT},nightMode:false,setupComplete:true,createdAt:new Date().toISOString(),progress:{},starsEarned:0,transportEnvironment:true,
    autoSpeak:true,humanVoice:true,princessVoiceProvider:'auto',princessVoiceRate:0.95,jurassicZombies:false,focusMusic:true,musicVolume:0.18,soundEffects:true,effectsVolume:0.25};
}

/** Upgrade only Mandecies's legacy profile, keeping its identity, progress and settings. */
export function upgradeMandeciesProfile(profile: Profile): Profile {
  if (profile.name.trim().toLowerCase() !== 'mandecies' || profile.transportEnvironment) return profile;
  const defaults = mandeciesProfile();
  return { ...defaults, ...profile, transportEnvironment: true, jurassicEnvironment: false, princessEnvironment: false, animeEnvironment: false,
    plan: { ...profile.plan, gradeLevel: 'K', subjects: defaults.plan.subjects } };
}
