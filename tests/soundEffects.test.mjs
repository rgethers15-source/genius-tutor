import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configureEffects, quietEffects, playEffect } from '../src/engine/soundEffects.ts';
test('muted and speech-suppressed effects never start the audio device', async () => {
  let created = 0;
  globalThis.AudioContext = class { constructor() { created++; throw new Error('should not create audio'); } };
  configureEffects(false, 0.5); await playEffect('reward');
  configureEffects(true, 0); await playEffect('tap');
  configureEffects(true, 0.5); quietEffects(true); await playEffect('welcome');
  quietEffects(false);
  assert.equal(created, 0);
});
