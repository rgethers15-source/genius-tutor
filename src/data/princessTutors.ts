import type { Subject } from '../types';
import type { AnimeTutor } from './animeTutors';

// ============================================================
// McKenzie's PRINCESS tutor roster — Black Girl Magic princesses, one per
// subject. Same shape as AnimeTutor so they reuse the gallery, video, and
// voice systems. Female ElevenLabs voices by default; caregiver can upload
// or AI-generate each princess's Disney/Pixar-style portrait.
// ============================================================

// Expressive, warm female ElevenLabs PREMADE voice IDs (ship with every
// account, so they reliably work and sound human — Disney-princess style).
// You can swap any of these per-princess in Settings.
const V_RACHEL = '21m00Tcm4TlvDq8ikWAM'; // Rachel — warm, calm
const V_SARAH = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — soft, youthful
const V_ELLI = 'MF3mGyEYCl7XYWbV9V6O'; // Elli — bright, emotional
const V_DOROTHY = 'ThT5KcBeYPX3keUQqHPh'; // Dorothy — pleasant, storytelling
const V_CHARLOTTE = 'XB0fDUnXU5powFXDhCwa'; // Charlotte — sweet, gentle
const V_MATILDA = 'XrExE9yKIg1WjnnlVkGX'; // Matilda — friendly, warm
const V_JESSIE = 't0jbNlBVZ17f02VDIeMI'; // Jessie — expressive, playful
const V_LILY = 'pFZP5JQG7iQjIQuC4Bku'; // Lily — warm, clear

export const PRINCESS_TUTORS: AnimeTutor[] = [
  {
    id: 'princess-amara', name: 'Princess Amara', subject: 'reading',
    tagline: 'Royal reading & learning to read',
    greeting: "Hi McKenzie! I'm Princess Amara. Let's learn to read together, sparkle by sparkle! 👑",
    voice: { rate: 0.92, pitch: 1.0, gender: 'female', preferredVoice: V_RACHEL },
    accent: '#e8a04b', fallbackGlyph: '👑', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-zuri', name: 'Princess Zuri', subject: 'math',
    tagline: 'Diamond math magic',
    greeting: "Hello McKenzie! I'm Princess Zuri. Math is like counting diamonds — let's shine! 💎",
    voice: { rate: 0.95, pitch: 1.0, gender: 'female', preferredVoice: V_SARAH },
    accent: '#d98a5a', fallbackGlyph: '💎', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
  {
    id: 'princess-nia', name: 'Princess Nia', subject: 'science',
    tagline: 'Curious science wonders',
    greeting: "Hi McKenzie! I'm Princess Nia. Let's discover magical science together! 🔬✨",
    voice: { rate: 0.96, pitch: 1.0, gender: 'female', preferredVoice: V_ELLI },
    accent: '#e39a6f', fallbackGlyph: '🔬', scene: 'princess', videoVoiceId: 'en-US-AnaNeural',
  },
  {
    id: 'princess-imani', name: 'Princess Imani', subject: 'art',
    tagline: 'Colorful art & creativity',
    greeting: "Hey McKenzie! I'm Princess Imani. Let's paint a rainbow of magic! 🎨",
    voice: { rate: 0.95, pitch: 1.0, gender: 'female', preferredVoice: V_CHARLOTTE },
    accent: '#cf8752', fallbackGlyph: '🎨', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-ayana', name: 'Princess Ayana', subject: 'music',
    tagline: 'Musical royal rhythms',
    greeting: "Hi McKenzie! I'm Princess Ayana. Let's sing and dance to the beat! 🎵",
    voice: { rate: 0.96, pitch: 1.0, gender: 'female', preferredVoice: V_JESSIE },
    accent: '#e0925c', fallbackGlyph: '🎵', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
  {
    id: 'princess-sanaa', name: 'Princess Sanaa', subject: 'speech',
    tagline: 'Sounds & speaking clearly',
    greeting: "Hi McKenzie! I'm Princess Sanaa. Let's make our sounds sparkle clear! 🗣️✨",
    voice: { rate: 0.9, pitch: 1.0, gender: 'female', preferredVoice: V_DOROTHY },
    accent: '#e8a04b', fallbackGlyph: '🗣️', scene: 'princess', videoVoiceId: 'en-US-AnaNeural',
  },
  {
    id: 'princess-kaia', name: 'Princess Kaia', subject: 'socialStudies',
    tagline: 'Family, friends & community',
    greeting: "Hello McKenzie! I'm Princess Kaia. Let's learn about our world and people! 🌍",
    voice: { rate: 0.94, pitch: 1.0, gender: 'female', preferredVoice: V_MATILDA },
    accent: '#d98a5a', fallbackGlyph: '🏘️', scene: 'princess', videoVoiceId: 'en-US-AriaNeural',
  },
  {
    id: 'princess-makeda', name: 'Queen Makeda', subject: 'africanHeritage',
    tagline: 'Our royal African heritage',
    greeting: "Hi McKenzie! I'm Queen Makeda. You come from kings and queens — let's learn our story! 👑🌍",
    voice: { rate: 0.9, pitch: 0.98, gender: 'female', preferredVoice: V_LILY },
    accent: '#e39a6f', fallbackGlyph: '👑', scene: 'princess', videoVoiceId: 'en-US-JennyNeural',
  },
];

export function princessForSubject(subject: Subject): AnimeTutor | undefined {
  return PRINCESS_TUTORS.find((t) => t.subject === subject);
}

export function getPrincess(id: string | undefined): AnimeTutor | undefined {
  return PRINCESS_TUTORS.find((t) => t.id === id);
}
