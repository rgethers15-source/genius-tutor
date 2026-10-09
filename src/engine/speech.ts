import { READING_INSTRUCTIONS, soundInstructions, phonemeMarkup, type PronunciationTarget } from './pronunciation.ts';

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
  /** Reading demonstrations must not silently fall back to robotic speech. */
  purpose?: 'reading';
  pronunciation?: PronunciationTarget;
  /** Ordinary narration may use a system voice when premium audio fails. */
  allowSystemFallback?: boolean;
  onError?: (message: string) => void;
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
    const match = pool.find((v) => hints.some((h) => h === 'male'
      ? /\bmale\b/i.test(v.name)
      : v.name.toLowerCase().includes(h)));
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
      if (opts.purpose === 'reading') opts.onError?.('Natural pronunciation audio needs an ElevenLabs or OpenAI key in Settings.');
      else opts.onStart?.();
      opts.onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    if (opts.purpose === 'reading' && !opts.allowSystemFallback) {
      opts.onError?.('Natural pronunciation audio needs an ElevenLabs or OpenAI key in Settings.');
      opts.onEnd?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(opts.voice);
    if (v) u.voice = v;
    u.rate = opts.voice.rate;
    u.pitch = opts.voice.pitch;
    u.onstart = () => opts.onStart?.();
    u.onend = () => opts.onEnd?.();
    u.onerror = () => opts.onEnd?.();
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
export function voiceFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const service = message.startsWith('ElevenLabs') ? 'ElevenLabs' : message.startsWith('TTS') ? 'OpenAI' : 'Voice service';
  if (/401/.test(message)) return `${service} rejected the API key. Check the key in Princess Settings.`;
  if (/402|403/.test(message)) return `${service} denied voice access. Check API permissions, plan, and credits.`;
  if (/429/.test(message)) return `${service} reached a usage or rate limit. Check credits and try again shortly.`;
  if (/400|404|unavailable/.test(message)) return `${service} could not use this voice or model. Choose another voice in Princess Settings.`;
  if (/NotAllowed/.test(message)) return 'Audio playback was blocked. Tap Hear voice to start playback.';
  return 'Natural voice audio is unavailable. Check your voice key, credits, and connection in Settings, then try again.';
}

/** One owner for pending requests, playback, and object URLs. */
function remoteSpeechProvider(
  apiKey: string,
  load: (text: string, opts: SpeakOptions, signal: AbortSignal) => Promise<Blob>
): SpeechProvider {
  let generation = 0;
  let pending: AbortController | null = null;
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;

  function releaseAudio() {
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  function stop() {
    generation++;
    pending?.abort();
    pending = null;
    releaseAudio();
    // A previous remote request may have fallen back to the system voice.
    webSpeechProvider.stop();
  }

  return {
    isSupported: () => apiKey.trim().length > 10,
    stop,
    async speak(text, opts) {
      stop();
      const request = generation;
      const controller = new AbortController();
      pending = controller;
      // Prevent a stalled service from holding the tutor indefinitely.
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const blob = await load(text, opts, controller.signal);
        if (request !== generation) return;
        clearTimeout(timeout);
        pending = null;
        objectUrl = URL.createObjectURL(blob);
        const player = new Audio(objectUrl);
        audio = player;
        let finished = false;
        const finish = () => {
          if (finished || request !== generation) return;
          finished = true;
          releaseAudio();
          opts.onEnd?.();
        };
        player.onended = finish;
        player.onerror = () => {
          if (request === generation) opts.onError?.('The natural voice audio could not play. Please try again.');
          finish();
        };
        player.ontimeupdate = () => {
          if (request === generation) opts.onBoundary?.();
        };
        await player.play();
        if (request === generation && !finished) opts.onStart?.();
      } catch (error) {
        if (request !== generation) return;
        releaseAudio();
        if (opts.purpose === 'reading' && !opts.allowSystemFallback) {
          opts.onError?.(voiceFailureMessage(error));
          opts.onEnd?.();
        } else {
          opts.onError?.(`${voiceFailureMessage(error)} Using the device voice for this narration.`);
          webSpeechProvider.speak(text, opts);
        }
      } finally {
        clearTimeout(timeout);
        if (request === generation) pending = null;
      }
    },
  };
}

export function openAiSpeechProvider(apiKey: string, direction?: string): SpeechProvider {
  return remoteSpeechProvider(apiKey, async (text, opts, signal) => {
    const cfg = opts.voice;
    const preferred = cfg.preferredVoice?.toLowerCase();
    const voice = preferred && ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'coral'].includes(preferred)
      ? preferred : cfg.gender === 'female' ? 'nova' : 'onyx';
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts', voice, input: text,
        ...(opts.purpose === 'reading' ? { instructions: opts.pronunciation ? soundInstructions(opts.pronunciation) : `${direction ?? ""} ${READING_INSTRUCTIONS}` } : direction ? { instructions: direction } : {}),
        speed: Math.min(4, Math.max(0.25, cfg.rate)),
      }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    return res.blob();
  });
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
  return remoteSpeechProvider(apiKey, async (text, opts, signal) => {
    const cfg = opts.voice;
    const fallbackId = cfg.gender === 'female' ? ELEVEN_FEMALE : ELEVEN_MALE;
    const requested = cfg.preferredVoice && /^[a-zA-Z0-9]{15,}$/.test(cfg.preferredVoice)
      ? cfg.preferredVoice : fallbackId;
    const ids = requested === fallbackId ? [requested] : [requested, fallbackId];
    for (const id of ids) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}`, {
        method: 'POST', signal,
        headers: {
          'xi-api-key': apiKey.trim(), 'Content-Type': 'application/json', Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: opts.pronunciation ? phonemeMarkup(text, opts.pronunciation) : text,
          model_id: opts.pronunciation ? 'eleven_flash_v2' : 'eleven_multilingual_v2',
          voice_settings: {
            stability: opts.purpose === 'reading' ? 0.65 : 0.4, similarity_boost: 0.8,
            style: opts.purpose === 'reading' ? 0 : 0.3,
            speed: Math.min(1.2, Math.max(0.7, cfg.rate)),
          },
        }),
      });
      if (res.ok) return res.blob();
      // Only retry an unavailable voice; auth, billing, and rate limits
      // will not improve by sending a second paid synthesis request.
      if (res.status !== 400 && res.status !== 404) throw new Error(`ElevenLabs ${res.status}`);
    }
    throw new Error('ElevenLabs voice unavailable');
  });
}

let active: SpeechProvider = webSpeechProvider;
function notifySpeech(on: boolean) {
  if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new CustomEvent('gt-speaking', { detail: on }));
}
let speechSession = 0;
const controlledSpeech: SpeechProvider = {
  isSupported: () => active.isSupported(),
  stop() { speechSession++; active.stop(); notifySpeech(false); },
  speak(text, opts) {
    const session = ++speechSession;
    notifySpeech(true);
    active.speak(text, { ...opts,
      onError: message => { if (session !== speechSession) return; notifySpeech(false); opts.onError?.(message); },
      onEnd: () => { if (session !== speechSession) return; notifySpeech(false); opts.onEnd?.(); },
    });
  },
};
export function getSpeech(): SpeechProvider { return controlledSpeech; }
export function setSpeech(p: SpeechProvider) {
  controlledSpeech.stop();
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
