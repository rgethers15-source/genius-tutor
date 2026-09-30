// ============================================================
// Speech engine — gives the tutors a real voice.
//
// Uses the browser/Electron built-in Web Speech API (free, offline,
// no API key). Emits word-boundary events so the avatar's mouth can
// lip-sync while speaking. A cleaner interface (SpeechProvider) lets
// you swap in a premium voice (e.g. ElevenLabs) later without changing
// any UI code.
// ============================================================

export interface VoiceConfig {
  /** Preferred voice name substring to match (e.g. "Google UK English Male"). */
  preferredVoice?: string;
  /** Speaking speed. Lower = slower/calmer (good for dyslexia/ADHD). */
  rate: number;
  /** Voice pitch. */
  pitch: number;
  /** 'male' | 'female' hint used when no named voice matches. */
  gender?: 'male' | 'female';
}

export interface SpeakOptions {
  voice: VoiceConfig;
  /** Fires as each word starts — used to drive mouth lip-sync. */
  onBoundary?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechProvider {
  speak(text: string, opts: SpeakOptions): void;
  stop(): void;
  isSupported(): boolean;
}

function pickVoice(cfg: VoiceConfig): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  if (voices.length === 0) return undefined;

  // 1) exact-ish preferred name match
  if (cfg.preferredVoice) {
    const byName = voices.find((v) =>
      v.name.toLowerCase().includes(cfg.preferredVoice!.toLowerCase())
    );
    if (byName) return byName;
  }
  // 2) English voice matching gender hint by common name heuristics
  const english = voices.filter((v) => v.lang.startsWith('en'));
  const pool = english.length ? english : voices;
  if (cfg.gender) {
    const femaleHints = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'zira', 'susan'];
    const maleHints = ['male', 'daniel', 'alex', 'fred', 'david', 'george', 'oliver', 'thomas'];
    const hints = cfg.gender === 'female' ? femaleHints : maleHints;
    const match = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
    if (match) return match;
  }
  return pool[0];
}

/** Default provider using the built-in speech synthesizer. */
export const webSpeechProvider: SpeechProvider = {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },
  stop() {
    if (this.isSupported()) window.speechSynthesis.cancel();
  },
  speak(text, opts) {
    if (!this.isSupported()) {
      // Gracefully no-op with lifecycle callbacks so UI still advances.
      opts.onStart?.();
      opts.onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(opts.voice);
    if (v) u.voice = v;
    u.rate = opts.voice.rate;
    u.pitch = opts.voice.pitch;
    u.onstart = () => opts.onStart?.();
    u.onend = () => opts.onEnd?.();
    u.onboundary = (e) => {
      if (e.name === 'word' || e.charIndex >= 0) opts.onBoundary?.();
    };
    window.speechSynthesis.speak(u);
  },
};

let active: SpeechProvider = webSpeechProvider;
export function getSpeech(): SpeechProvider {
  return active;
}
export function setSpeech(p: SpeechProvider) {
  active = p;
}

// Some engines load voices asynchronously; warm them up early.
export function warmUpVoices(): void {
  if (webSpeechProvider.isSupported()) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
