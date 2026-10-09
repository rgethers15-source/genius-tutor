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

let cancelCurrent: (() => void) | null = null;

export function listenOnce(opts: {
  onResult: (r: ListenResult) => void;
  onError?: (msg: string) => void;
  onEnd?: () => void;
  /** Max time to keep listening (ms). Gives time to say a full sentence. */
  maxMs?: number;
}): void {
  stopListening();
  const w = window as SR;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) {
    opts.onError?.('Speech recognition is not available on this device.');
    opts.onEnd?.();
    return;
  }
  const rec = new Ctor();

  rec.lang = 'en-US';
  rec.interimResults = true; // keep capturing while she speaks
  rec.maxAlternatives = 3;
  rec.continuous = true; // don't cut off at the first pause

  let finalText = '';
  let delivered = false;
  const maxMs = opts.maxMs ?? 12000; // ~12s to say the sentence

  // Hard stop after maxMs so it doesn't listen forever.
  const hardStop = window.setTimeout(() => {
    try {
      rec.stop();
    } catch {
      /* noop */
    }
  }, maxMs);

  cancelCurrent = () => {
    window.clearTimeout(hardStop);
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try { rec.stop(); } catch { /* already stopped */ }
  };

  rec.onresult = (e: any) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    // If we have a solid final chunk, deliver and stop.
    if (finalText.trim().length > 0) {
      // brief grace so she can finish, then stop
      // (handled by hardStop / onend)
    }
    // expose interim via result callback with low confidence for live feel
    if (interim && !finalText) {
      opts.onResult({ transcript: interim, confidence: 0 });
    }
  };
  rec.onerror = (e: any) => {
    if (e?.error !== 'no-speech' && e?.error !== 'aborted') {
      opts.onError?.(e?.error ?? 'mic error');
    }
  };
  rec.onend = () => {
    window.clearTimeout(hardStop);
    cancelCurrent = null;
    if (!delivered) {
      delivered = true;
      const text = finalText.trim();
      if (text) opts.onResult({ transcript: text, confidence: 1 });
      else opts.onError?.('no-speech');
    }
    opts.onEnd?.();
  };
  try {
    rec.start();
  } catch {
    window.clearTimeout(hardStop);
    stopListening();
    opts.onError?.('Could not start the microphone.');
    opts.onEnd?.();
  }
}

export function stopListening(): void {
  const cancel = cancelCurrent;
  cancelCurrent = null;
  cancel?.();
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
  if (!t || !s) return false;
  if (s === t) return true;
  // Accept if the target words all appear, or strong overlap (kind grading).
  if (s.includes(t) || t.includes(s)) return true;
  const tw = new Set(t.split(' '));
  const sw = s.split(' ');
  const hit = sw.filter((w) => tw.has(w)).length;
  return hit >= Math.ceil(tw.size * 0.7);
}
