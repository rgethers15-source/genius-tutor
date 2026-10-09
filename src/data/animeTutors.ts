import type { Subject } from '../types';
import type { VoiceConfig } from '../engine/speech';
import type { SceneKind } from './rooms';

// ============================================================
// Madeline's anime tutor roster.
//
// Five tutors, each matching one of the character portraits provided.
// The caregiver uploads each character's image on first run; the image
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

// Voices: warm, natural African American MALE voices. preferredVoice holds
// an ElevenLabs voice ID (used directly by the ElevenLabs provider). The IDs
// below are warm male voices; for the most authentic African American sound,
// add any of these ElevenLabs library voices to your account and paste the
// ID into Settings → per-tutor voice override:
//   • "Knox"  • "Marcus"  • "Caleb"  • "Jeremiah"  • "Darnell"  • "Theo"
// (Search the ElevenLabs Voice Library for African American male voices,
//  click "Add to my voices", then copy the voice ID.)
// Rates are kept a touch slower for easy listening (dyslexia/ADHD-friendly).
export const ANIME_TUTORS: AnimeTutor[] = [
  {
    id: 'tutor-kaito',
    name: 'Kaito',
    subject: 'reading',
    tagline: 'Your calm reading guide',
    greeting: "Hi Madeline! I'm Kaito. Let's read together. I will help you with every word. You've got this!",
    // Warm, deep African American male (default: deep male premade voice)
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
    tagline: 'Your friendly math buddy',
    greeting: "Hey Madeline! I'm Ren. Math is like a puzzle, and we solve it one small step at a time. Ready?",
    // Warm, confident African American male
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
    tagline: 'Your curious science explorer',
    greeting: "Hello Madeline! I'm Sora. Science is full of cool surprises. Let's discover something amazing!",
    // Smooth, friendly African American male
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
    tagline: 'Your gentle writing coach',
    greeting: "Hi Madeline! I'm Akira. Your ideas are wonderful. Let's turn them into words, one at a time.",
    // Warm, gentle African American male
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
    tagline: 'Your storytelling history friend',
    greeting: "Hey Madeline! I'm Haru. History is full of great stories. Let me tell you one and we'll explore it!",
    // Relaxed, storytelling African American male
    voice: { rate: 0.93, pitch: 1.0, gender: 'male', preferredVoice: 'onwK4e9ZLuTAKqWW03F9' },
    accent: '#e0925c',
    fallbackGlyph: '🌍',
    scene: 'galaxy',
    videoVoiceId: 'en-US-JasonNeural',
  },
];

export function getAnimeTutor(id: string | undefined): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.id === id);
}

/** Voice config for a tutor, applying any per-tutor override from the profile. */
export function effectiveVoice(tutor: AnimeTutor, override?: string): VoiceConfig {
  if (override && (override.trim().length >= 15 || ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral'].includes(override.trim().toLowerCase()))) {
    return { ...tutor.voice, preferredVoice: override.trim() };
  }
  return tutor.voice;
}

export function tutorForSubject(subject: Subject): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.subject === subject);
}
