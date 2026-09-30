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
}

// Note: voice rates are kept a touch slower than default for easier
// listening (helps dyslexia/ADHD). All male voices per the chosen art.
// Distinct ElevenLabs voice IDs per tutor — warm, natural young-male voices
// (not "nerdy"). preferredVoice holds the ElevenLabs voice ID; the ElevenLabs
// provider uses it directly. OpenAI/Web fall back to gender heuristics.
// IDs are ElevenLabs public/pre-made voices.
export const ANIME_TUTORS: AnimeTutor[] = [
  {
    id: 'tutor-kaito',
    name: 'Kaito',
    subject: 'reading',
    tagline: 'Your calm reading guide',
    greeting: "Hi Madeline! I'm Kaito. Let's read together. I will help you with every word. You've got this!",
    // "Liam" — warm, youthful, articulate male
    voice: { rate: 0.92, pitch: 1.0, gender: 'male', preferredVoice: 'TX3LPaxmHKxFdv7VOQHJ' },
    accent: '#e8a04b',
    fallbackGlyph: '📖',
    scene: 'aurora',
  },
  {
    id: 'tutor-ren',
    name: 'Ren',
    subject: 'math',
    tagline: 'Your friendly math buddy',
    greeting: "Hey Madeline! I'm Ren. Math is like a puzzle, and we solve it one small step at a time. Ready?",
    // "Josh" — deep, warm, confident young male (cool, not nerdy)
    voice: { rate: 0.95, pitch: 1.0, gender: 'male', preferredVoice: 'TxGEqnHWrfWFTfGW9XjX' },
    accent: '#d98a5a',
    fallbackGlyph: '🔢',
    scene: 'cyber-grid',
  },
  {
    id: 'tutor-sora',
    name: 'Sora',
    subject: 'science',
    tagline: 'Your curious science explorer',
    greeting: "Hello Madeline! I'm Sora. Science is full of cool surprises. Let's discover something amazing!",
    // "Adam" — smooth, deep, friendly male
    voice: { rate: 0.97, pitch: 1.0, gender: 'male', preferredVoice: 'pNInz6obpgDQGcFmaJgB' },
    accent: '#e39a6f',
    fallbackGlyph: '🔬',
    scene: 'galaxy',
  },
  {
    id: 'tutor-akira',
    name: 'Akira',
    subject: 'writing',
    tagline: 'Your gentle writing coach',
    greeting: "Hi Madeline! I'm Akira. Your ideas are wonderful. Let's turn them into words, one at a time.",
    // "Antoni" — warm, well-rounded young male
    voice: { rate: 0.92, pitch: 1.0, gender: 'male', preferredVoice: 'ErXwobaYiN019PkySvjV' },
    accent: '#cf8752',
    fallbackGlyph: '✏️',
    scene: 'neon-city',
  },
  {
    id: 'tutor-haru',
    name: 'Haru',
    subject: 'socialStudies',
    tagline: 'Your storytelling history friend',
    greeting: "Hey Madeline! I'm Haru. History is full of great stories. Let me tell you one and we'll explore it!",
    // "Sam" — relaxed, natural young male
    voice: { rate: 0.93, pitch: 1.0, gender: 'male', preferredVoice: 'yoZ06aMxZJJ28mfd3POQ' },
    accent: '#e0925c',
    fallbackGlyph: '🌍',
    scene: 'galaxy',
  },
];

export function getAnimeTutor(id: string | undefined): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.id === id);
}

export function tutorForSubject(subject: Subject): AnimeTutor | undefined {
  return ANIME_TUTORS.find((t) => t.subject === subject);
}
