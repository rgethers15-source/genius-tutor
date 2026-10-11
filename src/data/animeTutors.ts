import type { Subject } from '../types';
import type { VoiceConfig } from '../engine/speech';
import type { SceneKind } from './rooms';

// ============================================================
// Madeline's anime tutor roster.
//
// Six original anime-realism academy guides, with bundled portraits.
// Optional caregiver uploads and generated images are retained; each image
// (a data URL) is stored per-tutor in the profile. Each tutor teaches a
// subject with a gentle personality and a distinct voice.
// ============================================================

export interface AnimeTutor {
  id: string;
  name: string;
  subject: Subject;
  /** Short, kid-facing description of who they are. */
  tagline: string;
  /** How the tutor greets Madeline (kept very simple, warm, 3rd-grade level). */
  greeting: string;
  /** Distinct synthesized voice settings. */
  voice: VoiceConfig;
  /** Accent color for this tutor's environment glow. */
  accent: string;
  /** Emoji fallback shown until an image is uploaded. */
  fallbackGlyph: string;
  /** This tutor's own themed background scene shown during teaching. */
  scene: SceneKind;
  /** D-ID video voice (Microsoft Neural) — distinct, natural young-male. */
  videoVoiceId: string;
}

// Natural male guide voices can be previewed and changed per tutor.
export const ANIME_TUTORS: AnimeTutor[] = [
  {
    id: 'tutor-kaito',
    name: 'Kaito',
    subject: 'reading',
    tagline: 'Your calm star-library guide',
    greeting: "Hi Madeline! I'm Kaito. Let's read together. I will help you with every word. You've got this!",
    // Warm, deep male (default: deep male premade voice)
    voice: { rate: 0.92, pitch: 1.0, gender: 'male', preferredVoice: 'nPczCjzI2devNBz1zQrb' },
    accent: '#e8a04b',
    fallbackGlyph: '📖',
    scene: 'aurora',
    videoVoiceId: 'en-US-AndrewMultilingualNeural',
  },
  {
    id: 'tutor-ren',
    name: 'Ren',
    subject: 'math',
    tagline: 'Your patient constellation strategist',
    greeting: "Hey Madeline! I'm Ren. Math is like a puzzle, and we solve it one small step at a time. Ready?",
    // Warm, confident male
    voice: { rate: 0.95, pitch: 1.0, gender: 'male', preferredVoice: 'cjVigY5qzO86Huf0OWal' },
    accent: '#d98a5a',
    fallbackGlyph: '🔢',
    scene: 'cyber-grid',
    videoVoiceId: 'en-US-BrandonMultilingualNeural',
  },
  {
    id: 'tutor-sora',
    name: 'Sora',
    subject: 'science',
    tagline: 'Your observatory science explorer',
    greeting: "Hello Madeline! I'm Sora. Science is full of cool surprises. Let's discover something amazing!",
    // Smooth, friendly male
    voice: { rate: 0.97, pitch: 1.0, gender: 'male', preferredVoice: 'bIHbv24MWmeRgasZH58o' },
    accent: '#e39a6f',
    fallbackGlyph: '🔬',
    scene: 'galaxy',
    videoVoiceId: 'en-US-BrianMultilingualNeural',
  },
  {
    id: 'tutor-akira',
    name: 'Akira',
    subject: 'writing',
    tagline: 'Your story-studio writing coach',
    greeting: "Hi Madeline! I'm Akira. Your ideas are wonderful. Let's turn them into words, one at a time.",
    // Warm, gentle male
    voice: { rate: 0.92, pitch: 1.0, gender: 'male', preferredVoice: 'iP95p4xoKVk53GoZ742B' },
    accent: '#cf8752',
    fallbackGlyph: '✏️',
    scene: 'neon-city',
    videoVoiceId: 'en-US-TonyNeural',
  },
  {
    id: 'tutor-haru',
    name: 'Haru',
    subject: 'socialStudies',
    tagline: 'Your sky-garden history guide',
    greeting: "Hey Madeline! I'm Haru. History is full of great stories. Let me tell you one and we'll explore it!",
    // Relaxed, storytelling male
    voice: { rate: 0.93, pitch: 1.0, gender: 'male', preferredVoice: 'onwK4e9ZLuTAKqWW03F9' },
    accent: '#e0925c',
    fallbackGlyph: '🌍',
    scene: 'galaxy',
    videoVoiceId: 'en-US-JasonNeural',
  },
  {id:'tutor-noah',name:'Noah',subject:'music',tagline:'Your rhythm and focus guide',greeting:"Hey Madeline, I’m Noah. Your pace matters. Let’s find a steady rhythm and take one small step.",voice:{rate:.9,pitch:1,gender:'male',preferredVoice:'iP95p4xoKVk53GoZ742B'},accent:'#c6b2e3',fallbackGlyph:'🎧',scene:'aurora',videoVoiceId:'en-US-AndrewMultilingualNeural'},
];

export function getAnimeTutor(id: string | undefined): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.id === id);
}

/** Voice config for a tutor, applying any per-tutor override from the profile. */
export function effectiveVoice(tutor: AnimeTutor, override?: string): VoiceConfig {
  if (override && (override.trim().length >= 15 || ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral', 'ash', 'ballad', 'verse', 'cedar'].includes(override.trim().toLowerCase()))) {
    return { ...tutor.voice, preferredVoice: override.trim() };
  }
  return tutor.voice;
}

export function tutorForSubject(subject: Subject): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.subject === subject);
}

export const ACADEMY_DIRECTION='An original fictional teen male anime guide with a youthful, light, natural voice. Contemporary urban American conversational delivery: relaxed, friendly, confident, expressive and easygoing, like a supportive classmate. Avoid a deep adult announcer voice or an exaggerated accent. Read the supplied words exactly; do not add slang or change grammar. Encourage without condescension. Keep a comfortable pace and brief pauses between ideas. No flirting, romance, baby talk, shouting, singing or artificial pitch shifting. During reading, prioritize accurate consonants and vowel sounds over character style.';
export const ACADEMY_VOICES: Record<string, {voice:string; personality:string}> = {
 'tutor-kaito':{voice:'ash',personality:'Soft, thoughtful and reassuring; light youthful resonance, unhurried clear phrasing.'},
 'tutor-ren':{voice:'verse',personality:'Easygoing, confident and upbeat; friendly conversational rhythm, never booming.'},
 'tutor-sora':{voice:'echo',personality:'Curious and animated; bright youthful energy, never rushed.'},
 'tutor-akira':{voice:'ballad',personality:'Expressive, warm and creative; gentle emphasis on interesting words.'},
 'tutor-haru':{voice:'ash',personality:'Relaxed storyteller; lively natural inflection and inviting curiosity.'},
 'tutor-noah':{voice:'verse',personality:'Chill and steady; mellow youthful speaking voice, not singing or rapping.'},
};
export const academyVoiceFor=(id:string)=>ACADEMY_VOICES[id]?.voice??'ash';
export const academyDeliveryFor=(id:string)=>ACADEMY_VOICES[id]?.personality??'';
export const academyPortrait=(id:string)=>`./madeline/guide-${Math.max(0,ANIME_TUTORS.findIndex(t=>t.id===id))}.webp`;
