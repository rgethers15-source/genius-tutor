import type { Subject } from '../types';
import type { AnimeTutor } from './animeTutors';

// ============================================================
// McKenzie's PRINCESS tutor roster — Black Girl Magic princesses, one per
// subject. Same shape as AnimeTutor so they reuse the gallery, video, and
// voice systems. Female ElevenLabs voices by default; caregiver can upload
// or AI-generate each princess's Disney/Pixar-style portrait.
// ============================================================

// Warm female ElevenLabs voice IDs (premade). Swap via Settings per tutor.
const V_RACHEL = '21m00Tcm4TlvDq8ikWAM'; // warm female
const V_BELLA = 'EXAVITQu4vr4xnSDxMaL'; // soft female
const V_ELLI = 'MF3mGyEYCl7XYWbV9V6O'; // bright female
const V_DOROTHY = 'ThT5KcBeYPX3keUQqHPh'; // gentle female
const V_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa'; // sweet female

export const PRINCESS_TUTORS: AnimeTutor[] = [
  {
    id: 'princess-amara', name: 'Princess Amara', subject: 'reading',
    tagline: 'Royal reading & learning to read',
    greeting: "Hi McKenzie! I'm Princess Amara. Let's learn to read together, sparkle by sparkle! 👑",
    voice: { rate: 0.9, pitch: 1.05, gender: 'female', preferredVoice: V_RACHEL },
    accent: '#e8a04b', fallbackGlyph: '👑', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-zuri', name: 'Princess Zuri', subject: 'math',
    tagline: 'Diamond math magic',
    greeting: "Hello McKenzie! I'm Princess Zuri. Math is like counting diamonds — let's shine! 💎",
    voice: { rate: 0.92, pitch: 1.0, gender: 'female', preferredVoice: V_BELLA },
    accent: '#d98a5a', fallbackGlyph: '💎', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
  {
    id: 'princess-nia', name: 'Princess Nia', subject: 'science',
    tagline: 'Curious science wonders',
    greeting: "Hi McKenzie! I'm Princess Nia. Let's discover magical science together! 🔬✨",
    voice: { rate: 0.95, pitch: 1.05, gender: 'female', preferredVoice: V_ELLI },
    accent: '#e39a6f', fallbackGlyph: '🔬', scene: 'princess', videoVoiceId: 'en-US-AnaNeural',
  },
  {
    id: 'princess-imani', name: 'Princess Imani', subject: 'art',
    tagline: 'Colorful art & creativity',
    greeting: "Hey McKenzie! I'm Princess Imani. Let's paint a rainbow of magic! 🎨",
    voice: { rate: 0.95, pitch: 1.05, gender: 'female', preferredVoice: V_CHARLOTTE },
    accent: '#cf8752', fallbackGlyph: '🎨', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-ayana', name: 'Princess Ayana', subject: 'music',
    tagline: 'Musical royal rhythms',
    greeting: "Hi McKenzie! I'm Princess Ayana. Let's sing and dance to the beat! 🎵",
    voice: { rate: 0.95, pitch: 1.08, gender: 'female', preferredVoice: V_ELLI },
    accent: '#e0925c', fallbackGlyph: '🎵', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
  {
    id: 'princess-sanaa', name: 'Princess Sanaa', subject: 'speech',
    tagline: 'Sounds & speaking clearly',
    greeting: "Hi McKenzie! I'm Princess Sanaa. Let's make our sounds sparkle clear! 🗣️✨",
    voice: { rate: 0.9, pitch: 1.05, gender: 'female', preferredVoice: V_DOROTHY },
    accent: '#e8a04b', fallbackGlyph: '🗣️', scene: 'princess', videoVoiceId: 'en-US-AnaNeural',
  },
  {
    id: 'princess-kaia', name: 'Princess Kaia', subject: 'socialStudies',
    tagline: 'Family, friends & community',
    greeting: "Hello McKenzie! I'm Princess Kaia. Let's learn about our world and people! 🌍",
    voice: { rate: 0.92, pitch: 1.0, gender: 'female', preferredVoice: V_BELLA },
    accent: '#d98a5a', fallbackGlyph: '🏘️', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-makeda', name: 'Queen Makeda', subject: 'africanHeritage',
    tagline: 'Our royal African heritage',
    greeting: "Hi McKenzie! I'm Queen Makeda. You come from kings and queens — let's learn our story! 👑🌍",
    voice: { rate: 0.9, pitch: 1.0, gender: 'female', preferredVoice: V_DOROTHY },
    accent: '#e39a6f', fallbackGlyph: '👑', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
];

export function princessForSubject(subject: Subject): AnimeTutor | undefined {
  return PRINCESS_TUTORS.find((t) => t.subject === subject);
}

export function getPrincess(id: string | undefined): AnimeTutor | undefined {
  return PRINCESS_TUTORS.find((t) => t.id === id);
}
