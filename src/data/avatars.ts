import type { Avatar } from '../types';

// Avatar catalog. `glyph` is an illustrated stand-in; the `renderKind`-ready
// structure lets you swap in real animated avatars (e.g. Ready Player Me,
// Pixar-style rigs) later without changing the selection UI.
export const AVATARS: Avatar[] = [
  // --- Pixar-style friendly characters ---
  {
    id: 'pixar-luna',
    name: 'Luna',
    category: 'pixar',
    glyph: '🦉',
    accent: '#e8a04b',
    personality: 'A wise, gentle owl who loves bedtime stories and big questions.',
  },
  {
    id: 'pixar-bolt',
    name: 'Bolt',
    category: 'pixar',
    glyph: '🐢',
    accent: '#d98a5a',
    personality: 'A calm, encouraging turtle who says "slow and steady wins!"',
  },
  {
    id: 'pixar-pip',
    name: 'Pip',
    category: 'pixar',
    glyph: '🐿️',
    accent: '#c9743d',
    personality: 'A playful, curious squirrel who makes counting an adventure.',
  },

  // --- Human mentor avatars ---
  {
    id: 'human-maya',
    name: 'Ms. Maya',
    category: 'human',
    glyph: '👩🏽\u200d🏫',
    accent: '#d98a5a',
    personality: 'A warm, patient teacher who celebrates every small win.',
  },
  {
    id: 'human-sam',
    name: 'Coach Sam',
    category: 'human',
    glyph: '🧑🏾\u200d🔬',
    accent: '#e0925c',
    personality: 'An upbeat science coach who turns lessons into experiments.',
  },
  {
    id: 'human-grace',
    name: 'Grandma Grace',
    category: 'human',
    glyph: '👵🏼',
    accent: '#cf8752',
    personality: 'A kind storyteller who makes reading feel like a warm hug.',
  },

  // --- Anime-style avatars (great for older kids/teens) ---
  {
    id: 'anime-sakura',
    name: 'Sakura',
    category: 'anime',
    glyph: '🌸',
    accent: '#e39a6f',
    personality: 'A bright, stylish anime guide who keeps studying fun and cool.',
  },
  {
    id: 'anime-kai',
    name: 'Kai',
    category: 'anime',
    glyph: '⚡',
    accent: '#d98a5a',
    personality: 'A determined anime hero who cheers you toward every goal.',
  },
  {
    id: 'anime-hoshi',
    name: 'Hoshi',
    category: 'anime',
    glyph: '🌟',
    accent: '#e8a04b',
    personality: 'A dreamy, artistic anime star who loves creativity and writing.',
  },
];

export function getAvatar(id: string | undefined): Avatar | undefined {
  return AVATARS.find((a) => a.id === id);
}

export function avatarsByCategory(category: Avatar['category']): Avatar[] {
  return AVATARS.filter((a) => a.category === category);
}
