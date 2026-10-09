/** Sound targets, separate from letter names and the text shown to learners. */
export interface PronunciationTarget {
  ipa: string;
  example: string;
  cue: string;
}

export const LETTER_PRONUNCIATION: Record<string, PronunciationTarget> = {
  s: { ipa: 's', example: 'sun', cue: 'Let air hiss through your teeth.' },
  a: { ipa: 'æ', example: 'apple', cue: 'Open your mouth for the short vowel in apple.' },
  t: { ipa: 't', example: 'top', cue: 'Touch your tongue behind your top teeth, then release it briefly.' },
  p: { ipa: 'p', example: 'pig', cue: 'Close your lips, then release a short puff of air.' },
  m: { ipa: 'm', example: 'mom', cue: 'Close your lips and hum.' },
  c: { ipa: 'k', example: 'cat', cue: 'Lift the back of your tongue, then release it briefly.' },
  b: { ipa: 'b', example: 'ball', cue: 'Close your lips, then release a short voiced sound.' },
  d: { ipa: 'd', example: 'dog', cue: 'Touch your tongue behind your top teeth, then release a short voiced sound.' },
  f: { ipa: 'f', example: 'fish', cue: 'Touch your top teeth to your lower lip and let air flow.' },
  r: { ipa: 'ɹ', example: 'rain', cue: 'Lift your tongue without touching the roof of your mouth.' },
  u: { ipa: 'ʌ', example: 'sun', cue: 'Use the short vowel in sun.' },
  n: { ipa: 'n', example: 'net', cue: 'Touch your tongue behind your top teeth and hum through your nose.' },
  o: { ipa: 'ɔ', example: 'dog', cue: 'Use the vowel in dog in your tutor’s American English voice.' },
  g: { ipa: 'ɡ', example: 'go', cue: 'Lift the back of your tongue, then release a short voiced sound.' },
  i: { ipa: 'ɪ', example: 'pig', cue: 'Use the short vowel in pig.' },
  e: { ipa: 'ɛ', example: 'bed', cue: 'Use the short vowel in bed.' },
};

export function soundForLetter(letter: string): PronunciationTarget | undefined {
  return LETTER_PRONUNCIATION[letter.toLowerCase()];
}

export const READING_INSTRUCTIONS =
  'Speak as a warm, natural human reading tutor in American English. Use clear, accurate articulation, ' +
  'gentle expression and short natural pauses. Keep vowels and consonants distinct without exaggerating ' +
  'or sounding robotic. Read only the supplied text; do not add commentary or pronounce punctuation.';

export function soundInstructions(target: PronunciationTarget): string {
  return `${READING_INSTRUCTIONS} Demonstrate ONLY the isolated phoneme /${target.ipa}/, as in ${target.example}. ` +
    'Do not say the letter name, example word, slash marks, or any explanation. ' +
    'Keep stop consonants brief. Do not add an uh or any extra vowel after a consonant. ' +
    'Sustain continuous consonants gently for about half a second. Preserve the exact vowel quality.';
}

export function phonemeMarkup(text: string, target: PronunciationTarget): string {
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
  return `<phoneme alphabet="ipa" ph="${target.ipa}">${escaped}</phoneme>`;
}
