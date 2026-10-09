import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soundForLetter } from '../src/engine/pronunciation.ts';
import { LETTER_SOUNDS, BLEND_WORDS } from '../src/data/learnToRead.ts';
import { spokenMatches } from '../src/engine/listen.ts';

test('every letter and blending tile has an explicit phoneme target', () => {
  for (const letter of [...LETTER_SOUNDS.map(x => x.letter), ...BLEND_WORDS.flatMap(x => x.parts)]) {
    assert.ok(soundForLetter(letter)?.ipa, letter);
  }
  assert.equal(soundForLetter('A').ipa, 'æ');
  for (const letter of ['t', 'p', 'b', 'd', 'c']) {
    assert.doesNotMatch(soundForLetter(letter).ipa, /ə|ʌ/);
  }
});

test('empty or punctuation-only recognition never earns a correct answer', () => {
  assert.equal(spokenMatches('cat', ''), false);
  assert.equal(spokenMatches('cat', '...'), false);
});

test('stopping microphone practice removes pending results and grading callbacks', async () => {
  const { listenOnce, stopListening } = await import('../src/engine/listen.ts');
  let rec; let results = 0;
  globalThis.window = {
    setTimeout, clearTimeout,
    SpeechRecognition: class {
      constructor() { rec = this; }
      start() {}
      stop() { this.onend?.(); }
    },
  };
  listenOnce({ onResult: () => results++, maxMs: 10000 });
  stopListening();
  assert.equal(rec.onresult, null);
  assert.equal(rec.onend, null);
  assert.equal(results, 0);
});
