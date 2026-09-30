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

// ============================================================
// OpenAI Text-to-Speech provider — natural, human-sounding voices.
// Uses the caregiver's OpenAI key. Falls back to Web Speech on error.
// Voice names: alloy, echo, fable, onyx, nova, shimmer.
// ============================================================
export function openAiSpeechProvider(apiKey: string): SpeechProvider {
  let currentAudio: HTMLAudioElement | null = null;

  function voiceName(cfg: VoiceConfig): string {
    // Map our simple config to pleasant human voices.
    if (cfg.preferredVoice && /alloy|echo|fable|onyx|nova|shimmer/i.test(cfg.preferredVoice)) {
      return cfg.preferredVoice.toLowerCase();
    }
    // Male-leaning: onyx/echo; female-leaning: nova/shimmer.
    return cfg.gender === 'female' ? 'nova' : 'onyx';
  }

  return {
    isSupported() {
      return apiKey.trim().length > 10;
    },
    stop() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    },
    speak(text, opts) {
      this.stop();
      opts.onStart?.();
      fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: voiceName(opts.voice),
          input: text,
          speed: opts.voice.rate, // 0.25–4.0; our rates ~0.9 read calmly
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudio = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            opts.onEnd?.();
          };
          // Approximate lip-sync ticks while the human voice plays.
          audio.ontimeupdate = () => opts.onBoundary?.();
          await audio.play();
        })
        .catch(() => {
          // Fall back to the built-in (robotic) voice so speech still happens.
          webSpeechProvider.speak(text, opts);
        });
    },
  };
}

// ============================================================
// ElevenLabs Text-to-Speech — the most natural human voices.
// Uses the caregiver's ElevenLabs key. Falls back to Web Speech on error.
// ============================================================

// A few good default ElevenLabs public voice IDs (male-leaning for the
// chosen anime tutors). preferredVoice may override with a specific ID.
const ELEVEN_MALE = 'TxGEqnHWrfWFTfGW9XjX'; // "Josh" - warm young male
const ELEVEN_FEMALE = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" - soft female

export function elevenLabsSpeechProvider(apiKey: string): SpeechProvider {
  let currentAudio: HTMLAudioElement | null = null;

  function voiceId(cfg: VoiceConfig): string {
    if (cfg.preferredVoice && cfg.preferredVoice.length >= 15) return cfg.preferredVoice;
    return cfg.gender === 'female' ? ELEVEN_FEMALE : ELEVEN_MALE;
  }

  return {
    isSupported() {
      return apiKey.trim().length > 10;
    },
    stop() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    },
    speak(text, opts) {
      this.stop();
      opts.onStart?.();
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId(opts.voice)}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudio = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            currentAudio = null;
            opts.onEnd?.();
          };
          audio.ontimeupdate = () => opts.onBoundary?.();
          await audio.play();
        })
        .catch(() => {
          // Fall back to the built-in voice so speech still happens.
          webSpeechProvider.speak(text, opts);
        });
    },
  };
}

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
