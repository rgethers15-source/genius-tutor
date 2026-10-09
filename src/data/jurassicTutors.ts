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
  voice:{gender:'male',rate:0.95,pitch:1,preferredVoice:'echo'}, videoVoiceId:'en-US-DavisNeural',
}));
export function explorerPortrait(index:number):string {
  const dinosaur=index===2||index===6;
  const color=JURASSIC_TUTORS[index]?.accent??'#75b5a0';
  const body=dinosaur?`<path d="M75 300q-30-95 55-115 30-100 155-70l75 75-45 40-70-10-25 70 50 50H120z" fill="${color}"/><circle cx="280" cy="170" r="8" fill="#171e20"/><path d="M250 220h55" stroke="#233e31" stroke-width="5"/>`:
  `<path d="M75 410q10-120 90-130h90q85 10 90 130" fill="${color}"/><path d="M177 245h66v65h-66z" fill="#88573c"/><ellipse cx="210" cy="185" rx="72" ry="92" fill="#965f41"/><path d="M134 173q-12-100 79-100 86 0 72 100-38-20-50-54-34 51-101 54" fill="#242124"/><g fill="#171d21"><ellipse cx="181" cy="185" rx="8" ry="6"/><ellipse cx="239" cy="185" rx="8" ry="6"/></g><path d="M193 230q17 14 34 0" fill="none" stroke="#e0a48d" stroke-width="5" stroke-linecap="round"/><path d="m130 114 27-57h108l29 57z" fill="#bca270"/><path d="M122 113h180" stroke="#dcc79a" stroke-width="14"/><path d="m210 324 15 20-15 20-15-20z" fill="#ffe0a5"/>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><rect width="420" height="420" rx="32" fill="#182e2d"/><circle cx="210" cy="200" r="160" fill="#294541"/>${body}</svg>`);
}
