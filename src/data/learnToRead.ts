// ============================================================
// Learn-to-Read ladder for a 1st grader (McKenzie).
//
// A gentle, kinetic sequence following structured-phonics order:
//   1) Letter sounds   2) Blending sounds   3) Sight words   4) Sentences
// Each step is spoken by the tutor and uses tap/say interactions.
// ============================================================

export interface LetterSound {
  letter: string;
  sound: string; // how the tutor says it
  example: string;
  emoji: string;
}

export const LETTER_SOUNDS: LetterSound[] = [
  { letter: 'S', sound: 'sss', example: 'sun', emoji: '☀️' },
  { letter: 'A', sound: 'ah', example: 'apple', emoji: '🍎' },
  { letter: 'T', sound: 'tuh', example: 'top', emoji: '🔝' },
  { letter: 'P', sound: 'puh', example: 'pig', emoji: '🐷' },
  { letter: 'M', sound: 'mmm', example: 'mom', emoji: '👩' },
  { letter: 'C', sound: 'kuh', example: 'cat', emoji: '🐱' },
  { letter: 'B', sound: 'buh', example: 'ball', emoji: '⚽' },
  { letter: 'D', sound: 'duh', example: 'dog', emoji: '🐶' },
  { letter: 'F', sound: 'fff', example: 'fish', emoji: '🐟' },
  { letter: 'R', sound: 'rrr', example: 'rain', emoji: '🌧️' },
];

export interface BlendWord {
  word: string;
  parts: string[]; // sounded-out parts
  emoji: string;
}

export const BLEND_WORDS: BlendWord[] = [
  { word: 'cat', parts: ['c', 'a', 't'], emoji: '🐱' },
  { word: 'sun', parts: ['s', 'u', 'n'], emoji: '☀️' },
  { word: 'dog', parts: ['d', 'o', 'g'], emoji: '🐶' },
  { word: 'pig', parts: ['p', 'i', 'g'], emoji: '🐷' },
  { word: 'bed', parts: ['b', 'e', 'd'], emoji: '🛏️' },
  { word: 'map', parts: ['m', 'a', 'p'], emoji: '🗺️' },
];

// Common 1st-grade sight words (recognize on sight, not sounded out).
export const SIGHT_WORDS: string[] = [
  'the', 'and', 'is', 'you', 'to', 'see', 'we', 'like', 'my', 'go', 'he', 'she',
];

export interface ReadSentence {
  text: string;
  emoji: string;
}

export const EASY_SENTENCES: ReadSentence[] = [
  { text: 'I see the cat.', emoji: '🐱' },
  { text: 'We like the sun.', emoji: '☀️' },
  { text: 'My dog can run.', emoji: '🐶' },
  { text: 'She is my friend.', emoji: '🤝' },
  { text: 'You and me go.', emoji: '👭' },
];
