// ============================================================
// Study rooms — immersive, animated CYBER-FANTASY worlds.
//
// Each room is a living, moving scene (stars, neon grids, aurora,
// floating orbs) built with CSS animation — exciting and "out of this
// world" to hold attention, while staying warm and low-glare (amber/
// magenta, no harsh cyan strobing). Caregivers can still upload a photo
// backdrop per room to override the animated scene.
// ============================================================

export type SceneKind = 'neon-city' | 'galaxy' | 'aurora' | 'cyber-grid';

export interface StudyRoom {
  id: string;
  name: string;
  emoji: string;
  /** Which animated scene renders behind the lesson. */
  scene: SceneKind;
  /** Base gradient under the animated layers. */
  gradient: string;
  vibe: string;
}

export const STUDY_ROOMS: StudyRoom[] = [
  {
    id: 'room-neon-city',
    name: 'Neon Sky City',
    emoji: '🌆',
    scene: 'neon-city',
    gradient: 'linear-gradient(180deg, #1a0f2e 0%, #2a1030 55%, #3a1526 100%)',
    vibe: 'A glowing future city at night with drifting neon lights and rain.',
  },
  {
    id: 'room-galaxy',
    name: 'Starship Study Deck',
    emoji: '🚀',
    scene: 'galaxy',
    gradient: 'radial-gradient(1200px 700px at 50% 20%, #241a3a, #120b22 70%, #0c0818)',
    vibe: 'Float among stars and planets on a cozy starship deck.',
  },
  {
    id: 'room-aurora',
    name: 'Aurora Dreamscape',
    emoji: '🌌',
    scene: 'aurora',
    gradient: 'linear-gradient(180deg, #14132a 0%, #201a38 60%, #2a1830 100%)',
    vibe: 'Waves of warm aurora light ripple across a magical night sky.',
  },
  {
    id: 'room-cyber-grid',
    name: 'Cyber Fantasy Grid',
    emoji: '🕹️',
    scene: 'cyber-grid',
    gradient: 'linear-gradient(180deg, #1c1030 0%, #2a1230 55%, #3a1526 100%)',
    vibe: 'A retro-future neon grid stretching to a glowing horizon.',
  },
];

export function getRoom(id: string | undefined): StudyRoom {
  return STUDY_ROOMS.find((r) => r.id === id) ?? STUDY_ROOMS[0];
}
