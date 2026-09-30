// ============================================================
// Listening engine — lets the child speak and checks what they said.
//
// Uses the browser/Electron Web Speech API (SpeechRecognition). It is
// free but availability varies by platform; we degrade gracefully and
// tell the caller when it is not supported so the UI can offer a
// tap-to-answer fallback.
// ============================================================

export interface ListenResult {
  transcript: string;
  confidence: number;
}

type SR = typeof window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
}

export function isListeningSupported(): boolean {
  const w = window as SR;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

let current: SpeechRecognitionLike | null = null;

export function listenOnce(opts: {
  onResult: (r: ListenResult) => void;
  onError?: (msg: string) => void;
  onEnd?: () => void;
}): void {
  const w = window as SR;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    opts.onError?.('Speech recognition is not available on this device.');
    opts.onEnd?.();
    return;
  }
  const rec = new Ctor();
  current = rec;
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.continuous = false;

  rec.onresult = (e: any) => {
    const res = e.results?.[0]?.[0];
    if (res) {
      opts.onResult({ transcript: res.transcript ?? '', confidence: res.confidence ?? 0 });
    }
  };
  rec.onerror = (e: any) => opts.onError?.(e?.error ?? 'mic error');
  rec.onend = () => {
    current = null;
    opts.onEnd?.();
  };
  try {
    rec.start();
  } catch {
    opts.onError?.('Could not start the microphone.');
  }
}

export function stopListening(): void {
  try {
    current?.stop();
  } catch {
    /* noop */
  }
  current = null;
}

/** Normalize for lenient comparison (dyslexia-friendly: ignore case/punct). */
export function normalizeSpoken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Did the child say the target closely enough? Lenient by design. */
export function spokenMatches(target: string, spoken: string): boolean {
  const t = normalizeSpoken(target);
  const s = normalizeSpoken(spoken);
  if (!t) return false;
  if (s === t) return true;
  // Accept if the target words all appear, or strong overlap (kind grading).
  if (s.includes(t) || t.includes(s)) return true;
  const tw = new Set(t.split(' '));
  const sw = s.split(' ');
  const hit = sw.filter((w) => tw.has(w)).length;
  return hit >= Math.ceil(tw.size * 0.7);
}
