import type { AnimeTutor } from './animeTutors';
const roster = [
  ['ranger-jay','Ranger Jay','reading','Explorer & story scout','🧭','#75b5a0'],
  ['hero-kofi','Captain Kofi','math','Shield hero & puzzle expert','🛡️','#dfb16b'],
  ['rex','Professor Rex','science','Tyrannosaurus fossil guide','🦖','#94b667'],
  ['scout-malik','Scout Malik','writing','Explorer & field-journal guide','📓','#cb976e'],
  ['hero-zion','Guardian Zion','socialStudies','Rescue hero & map guide','🗺️','#89a4cb'],
  ['ranger-amari','Ranger Amari','speech','Clear speech & radio guide','🎙️','#baa0d7'],
  ['triceratops','Trix the Triceratops','art','Dinosaur artist','🦕','#b5c184'],
  ['hero-noah','Beat Scout Noah','music','Rhythm hero','🥁','#c6a289'],
  ['explorer-musa','Explorer Musa','africanHeritage','African heritage explorer','🌍','#daa975'],
] as const;
export const JURASSIC_TUTORS: AnimeTutor[] = roster.map(([id,name,subject,tagline,fallbackGlyph,accent]) => ({
  id,name,subject,tagline,fallbackGlyph,accent,scene:'galaxy',
  greeting:`Welcome, Mandela! I’m ${name}. We can solve challenges and keep our dinosaur island safe together.`,
  voice:{gender:'male',rate:0.95,pitch:1,preferredVoice:'TxGEqnHWrfWFTfGW9Xj'}, videoVoiceId:'en-US-DavisNeural',
}));
export function explorerPortrait(index:number):string { return `./mandela/guide-${Math.max(0, Math.min(8,index))}.webp`; }
