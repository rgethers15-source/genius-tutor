import { useEffect, useState } from 'react';
import type { Profile } from '../types';
import { PRINCESS_TUTORS } from '../data/princessTutors';
import { elevenKeyFor, openAiKeyFor, syncKeysToDevice } from '../data/keys';
import { elevenLabsSpeechProvider, openAiSpeechProvider, webSpeechProvider } from '../engine/speech';

export const PRINCESS_DIRECTION = 'A bright, youthful adult storybook princess voice: warm, playful, melodious and kind. Speak naturally with clear American English diction. Gentle energy, no baby talk, no exaggerated pitch, no singing. Use an original voice.';

export function PrincessSettings({ profile, onUpdate, onBack }: { profile: Profile; onUpdate: (p: Profile) => void; onBack: () => void }) {
  const [draft, setDraft] = useState(profile);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof openAiSpeechProvider> | null>(null);
  useEffect(() => () => preview?.stop(), [preview]);
  const provider = draft.princessVoiceProvider ?? 'auto';
  const eleven = elevenKeyFor(draft);
  const openai = openAiKeyFor(draft);
  const usesEleven = provider === 'elevenlabs' || (provider === 'auto' && !!eleven);
  async function testSpeakers() {
    const context = new AudioContext();
    try {
      await context.resume();
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.frequency.value = 440;
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
      tone.connect(gain); gain.connect(context.destination);
      tone.onended = () => { void context.close(); };
      tone.start(); tone.stop(context.currentTime + 0.5);
      setStatus('A short chime should play. If you hear it, your output works; test a voice next.');
    } catch {
      void context.close();
      setStatus('Speaker test could not start. Check your device audio output and volume.');
    }
  }
  function hear(id: string) {
    preview?.stop(); webSpeechProvider.stop();
    const key = usesEleven ? eleven : openai;
    if (!key || key.length < 10) { setStatus('Add the selected service’s API key to hear a natural voice.'); return; }
    const player = usesEleven ? elevenLabsSpeechProvider(key) : openAiSpeechProvider(key, PRINCESS_DIRECTION);
    setPreview(player); setStatus('Preparing voice…');
    player.speak(`Hello ${profile.name}! Welcome to our enchanted academy. Let’s discover something wonderful together.`, {
      voice: { gender: 'female', rate: draft.princessVoiceRate ?? 0.95, pitch: 1,
        preferredVoice: usesEleven ? draft.tutorVoices?.[id] : draft.princessOpenAiVoices?.[id] ?? 'shimmer' },
      purpose: 'reading', onStart: () => setStatus('Playing your voice preview'),
      onEnd: () => setStatus(s => s === 'Playing your voice preview' || s === 'Preparing voice…' ? '' : s), onError: setStatus,
    });
  }
  return <div className="center princess-settings card">
    <h1>👑 Princess settings</h1>
    <p>Choose her voice, hear it first, then save. Voices are AI generated.</p>
    <button className="btn ghost" onClick={testSpeakers}>🔈 Test speakers (short chime)</button>
    <label>Natural voice service<select value={provider} onChange={e => setDraft({ ...draft, princessVoiceProvider: e.target.value as Profile['princessVoiceProvider'] })}>
      <option value="auto">Automatic: ElevenLabs, then OpenAI</option><option value="openai">OpenAI storybook voice</option><option value="elevenlabs">ElevenLabs selected voice</option>
    </select></label>
    <div className="grid cols-2">
      <label>OpenAI API key<input type="password" autoComplete="off" value={draft.openAiKey ?? ''} placeholder={openAiKeyFor(profile) ? 'Shared device key available' : 'Paste key'} onChange={e => setDraft({ ...draft, openAiKey: e.target.value })} /></label>
      <label>ElevenLabs API key<input type="password" autoComplete="off" value={draft.elevenLabsKey ?? ''} placeholder={elevenKeyFor(profile) ? 'Shared device key available' : 'Paste key'} onChange={e => setDraft({ ...draft, elevenLabsKey: e.target.value })} /></label>
    </div>
    <label>Speaking pace: {(draft.princessVoiceRate ?? 0.95).toFixed(2)}<input type="range" min="0.8" max="1.1" step="0.05" value={draft.princessVoiceRate ?? 0.95} onChange={e => setDraft({ ...draft, princessVoiceRate: Number(e.target.value) })} /></label>
    {PRINCESS_TUTORS.map(t => <div className="row between" key={t.id} style={{ margin: '12px 0' }}>
      <strong>{t.name}</strong>
      {usesEleven ? <input aria-label={`${t.name} ElevenLabs voice ID`} placeholder="Your chosen ElevenLabs voice ID" value={draft.tutorVoices?.[t.id] ?? t.voice.preferredVoice ?? ''} onChange={e => setDraft({ ...draft, tutorVoices: { ...draft.tutorVoices, [t.id]: e.target.value } })} /> :
        <select aria-label={`${t.name} OpenAI voice`} value={draft.princessOpenAiVoices?.[t.id] ?? 'shimmer'} onChange={e => setDraft({ ...draft, princessOpenAiVoices: { ...draft.princessOpenAiVoices, [t.id]: e.target.value } })}>
          <option value="shimmer">Shimmer · bright</option><option value="nova">Nova · lively</option><option value="coral">Coral · warm</option><option value="alloy">Alloy · balanced</option>
        </select>}
      <button className="btn" onClick={() => hear(t.id)}>▶ Hear voice</button>
    </div>)}
    <label><input type="checkbox" checked={draft.princessReducedMotion ?? false} onChange={e => setDraft({ ...draft, princessReducedMotion: e.target.checked })} /> Quiet scenery · less motion</label>
    <label><input type="checkbox" checked={draft.autoSpeak !== false} onChange={e => setDraft({ ...draft, autoSpeak: e.target.checked })} /> Tutors speak automatically</label>
    {status && <p role="status">{status}</p>}
    <div className="row"><button className="btn" onClick={() => { preview?.stop(); syncKeysToDevice(draft); onUpdate({ ...draft, humanVoice: true }); onBack(); }}>Save settings</button><button className="btn ghost" onClick={() => { preview?.stop(); onBack(); }}>Cancel</button></div>
    <p className="faint">Natural audio requires service credits. ElevenLabs uses the voice you choose; preview it before saving.</p>
  </div>;
}
