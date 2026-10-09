import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { openAiSpeechProvider, elevenLabsSpeechProvider, setSpeech, webSpeechProvider } from '../src/engine/speech.ts';

let players, revoked, fallback, requests;
const voice = { gender: 'female', rate: 0.9, pitch: 1 };
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const response = () => ({ ok: true, blob: async () => new Blob(['audio']) });

beforeEach(() => {
  players = []; revoked = []; fallback = []; requests = [];
  globalThis.window = { speechSynthesis: {
    cancel() {}, getVoices: () => [], speak: u => fallback.push(u),
  } };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.Audio = class {
    constructor(url) { this.url = url; players.push(this); }
    async play() { this.played = true; }
    pause() { this.paused = true; }
    removeAttribute() {}
    load() {}
  };
  URL.createObjectURL = () => `blob:${players.length}`;
  URL.revokeObjectURL = url => revoked.push(url);
  globalThis.fetch = (url, options) => {
    const d = deferred();
    requests.push({ url, options, ...d });
    return d.promise;
  };
});

for (const factory of [openAiSpeechProvider, elevenLabsSpeechProvider]) {
  test(`${factory.name}: stop discards a late successful request`, async () => {
    const p = factory('test-key-long-enough');
    let starts = 0;
    p.speak('old line', { voice, onStart: () => starts++ });
    p.stop();
    assert.equal(requests[0].options.signal.aborted, true);
    requests[0].resolve(response());
    await flush();
    assert.equal(players.length, 0);
    assert.equal(starts, 0);
    assert.equal(fallback.length, 0);
  });
  test(`${factory.name}: cancelled errors never trigger system speech`, async () => {
    const p = factory('test-key-long-enough');
    p.speak('old line', { voice }); p.stop();
    requests[0].reject(new Error('aborted'));
    await flush();
    assert.equal(fallback.length, 0);
  });
  test(`${factory.name}: newest line wins when responses arrive backwards`, async () => {
    const p = factory('test-key-long-enough');
    p.speak('old', { voice }); p.speak('new', { voice });
    requests[1].resolve(response()); await flush();
    requests[0].resolve(response()); await flush();
    assert.equal(players.length, 1);
    assert.equal(players[0].played, true);
    p.stop();
    assert.equal(players[0].paused, true);
    assert.equal(revoked.length, 1);
  });
  test(`${factory.name}: completion releases audio and completes once`, async () => {
    const p = factory('test-key-long-enough');
    let ends = 0;
    p.speak('hello', { voice, onEnd: () => ends++ });
    requests[0].resolve(response()); await flush();
    const finish = players[0].onended;
    finish(); finish(); p.stop();
    assert.equal(ends, 1);
    assert.equal(revoked.length, 1);
  });
}

test('switching providers aborts the previous provider', async () => {
  const p = openAiSpeechProvider('test-key-long-enough');
  setSpeech(p); p.speak('old', { voice }); setSpeech(webSpeechProvider);
  requests[0].resolve(response()); await flush();
  assert.equal(players.length, 0);
});

test('ElevenLabs does not retry authentication errors', async () => {
  const p = elevenLabsSpeechProvider('test-key-long-enough');
  p.speak('hello', { voice: { ...voice, preferredVoice: 'customVoiceId123456789' } });
  requests[0].resolve({ ok: false, status: 401 }); await flush();
  assert.equal(requests.length, 1);
  assert.equal(fallback.length, 1);
  p.stop();
});

test('ElevenLabs retries an unavailable custom voice with the default', async () => {
  const p = elevenLabsSpeechProvider('test-key-long-enough');
  p.speak('hello', { voice: { ...voice, preferredVoice: 'customVoiceId123456789' } });
  requests[0].resolve({ ok: false, status: 404 }); await flush();
  assert.equal(requests.length, 2);
  requests[1].resolve(response()); await flush();
  assert.equal(players.length, 1);
  p.stop();
});

test('male voice selection does not match the word female', () => {
  window.speechSynthesis.getVoices = () => [
    { name: 'English Female', lang: 'en-US' }, { name: 'English Male', lang: 'en-US' },
  ];
  webSpeechProvider.speak('hello', { voice: { ...voice, gender: 'male' } });
  assert.equal(fallback[0].voice.name, 'English Male');
});

test('OpenAI reading requests carry articulation instructions and calm pacing', async () => {
  const p = openAiSpeechProvider('test-key-long-enough');
  p.speak('a', { voice: { ...voice, rate: 0.85 }, purpose: 'reading',
    pronunciation: { ipa: 'æ', example: 'apple', cue: '' } });
  const payload = JSON.parse(requests[0].options.body);
  assert.match(payload.instructions, /isolated phoneme \/æ\//);
  assert.match(payload.instructions, /Do not add an uh/);
  assert.equal(payload.speed, 0.85);
  p.stop(); requests[0].resolve(response()); await flush();
});

test('ElevenLabs isolated sounds use a model supporting phoneme markup', async () => {
  const p = elevenLabsSpeechProvider('test-key-long-enough');
  p.speak('t', { voice, purpose: 'reading', pronunciation: { ipa: 't', example: 'top', cue: '' } });
  const payload = JSON.parse(requests[0].options.body);
  assert.equal(payload.model_id, 'eleven_flash_v2');
  assert.equal(payload.text, '<phoneme alphabet="ipa" ph="t">t</phoneme>');
  assert.equal(payload.voice_settings.style, 0);
  p.stop(); requests[0].resolve(response()); await flush();
});

test('reading service failure reports an error instead of robotic fallback', async () => {
  const p = openAiSpeechProvider('test-key-long-enough');
  let error = ''; let ends = 0;
  p.speak('cat', { voice, purpose: 'reading', onError: message => error = message, onEnd: () => ends++ });
  requests[0].resolve({ ok: false, status: 401 }); await flush();
  assert.equal(fallback.length, 0);
  assert.match(error, /Natural voice audio is unavailable/);
  assert.equal(ends, 1);
  p.stop();
});

test('system voice refuses pronunciation demonstrations with clear setup feedback', () => {
  let error = '';
  webSpeechProvider.speak('cat', { voice, purpose: 'reading', onError: message => error = message });
  assert.equal(fallback.length, 0);
  assert.match(error, /key in Settings/);
});
