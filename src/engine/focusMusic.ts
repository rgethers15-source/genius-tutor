// ============================================================
// Focus music — a calm "chill lofi study" ambience.
//
// Generates a soft, looping lofi-style pad + gentle rain-like noise
// using the Web Audio API. This is 100% original, offline, and free
// (no copyrighted tracks). Kept low and mellow so it aids focus for
// ADHD without being distracting. You can also load your own audio
// file to play instead (setCustomTrack).
// ============================================================

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let nodes: AudioNode[] = [];
let playing = false;
let customAudio: HTMLAudioElement | null = null;
let customUrl: string | null = null;

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Soft filtered noise → gentle "rain/vinyl" texture. */
function startNoise(context: AudioContext, out: GainNode) {
  const bufferSize = 2 * context.sampleRate;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const g = context.createGain();
  g.gain.value = 0.04;
  noise.connect(lp).connect(g).connect(out);
  noise.start();
  nodes.push(noise, lp, g);
}

/** Warm chord pad that slowly breathes — the lofi "vibe". */
function startPad(context: AudioContext, out: GainNode) {
  // A gentle minor-7 style chord (calm, cozy).
  const freqs = [174.6, 220.0, 261.6, 329.6]; // F3, A3, C4, E4
  freqs.forEach((f, idx) => {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = context.createGain();
    g.gain.value = 0.06;

    // Slow tremolo so the pad "breathes".
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.06 + idx * 0.01;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain).connect(g.gain);

    osc.connect(g).connect(out);
    osc.start();
    lfo.start();
    nodes.push(osc, g, lfo, lfoGain);
  });
}

export function isPlaying(): boolean {
  return playing;
}

export function startFocusMusic(volume = 0.5): void {
  if (playing) return;
  // Custom uploaded track takes priority.
  if (customUrl) {
    if (!customAudio) {
      customAudio = new Audio(customUrl);
      customAudio.loop = true;
    }
    customAudio.volume = Math.max(0, Math.min(1, volume));
    void customAudio.play().catch(() => {});
    playing = true;
    return;
  }
  const context = ensureCtx();
  void context.resume();
  startPad(context, master!);
  startNoise(context, master!);
  // Fade in gently.
  master!.gain.cancelScheduledValues(context.currentTime);
  master!.gain.setValueAtTime(0.0001, context.currentTime);
  master!.gain.exponentialRampToValueAtTime(
    Math.max(0.02, volume * 0.6),
    context.currentTime + 2.5
  );
  playing = true;
}

export function stopFocusMusic(): void {
  if (customAudio) {
    customAudio.pause();
  }
  if (ctx && master) {
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    window.setTimeout(() => {
      nodes.forEach((n) => {
        try {
          (n as OscillatorNode).stop?.();
        } catch {
          /* noop */
        }
        n.disconnect();
      });
      nodes = [];
    }, 900);
  }
  playing = false;
}

export function setVolume(volume: number): void {
  const v = Math.max(0, Math.min(1, volume));
  if (customAudio) customAudio.volume = v;
  if (ctx && master) master.gain.value = Math.max(0.0001, v * 0.6);
}

/** Load a caregiver-provided audio file (data URL) as the focus track. */
export function setCustomTrack(dataUrl: string | null): void {
  const wasPlaying = playing;
  if (wasPlaying) stopFocusMusic();
  customUrl = dataUrl;
  customAudio = null;
  if (wasPlaying) startFocusMusic();
}
