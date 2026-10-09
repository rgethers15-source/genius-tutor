/** Short original musical cues. No downloaded/licensed effect assets needed. */
export type SoundCue = 'tap' | 'welcome' | 'reward';
let context: AudioContext | null = null;
let enabled = true;
let volume = 0.25;
let busy = false;
let last = 0;
export function configureEffects(on: boolean, level: number) {
  enabled = on; volume = Math.max(0, Math.min(1, level));
}
export function quietEffects(on: boolean) { busy = on; }
export async function playEffect(cue: SoundCue = 'tap') {
  if (!enabled || busy || !volume || Date.now() - last < 150) return;
  last = Date.now();
  try {
    context ??= new AudioContext();
    await context.resume();
    if (!enabled || busy) return;
    const tones = cue === 'reward' ? [523.25, 659.25, 783.99] : cue === 'welcome' ? [392, 523.25] : [440];
    tones.forEach((hz, i) => {
      const tone = context!.createOscillator();
      const gain = context!.createGain();
      const start = context!.currentTime + i * 0.085;
      tone.type = 'sine'; tone.frequency.value = hz;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume * 0.16, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      tone.connect(gain); gain.connect(context!.destination);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
      tone.start(start); tone.stop(start + 0.2);
    });
  } catch { /* Audio effects must never block navigation or learning. */ }
}
