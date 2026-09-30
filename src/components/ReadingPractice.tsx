import { useCallback, useEffect, useState } from 'react';
import type { AnimeTutor } from '../data/animeTutors';
import type { Profile } from '../types';
import { AnimatedAvatar, type AvatarMood } from './AnimatedAvatar';
import { getSpeech } from '../engine/speech';
import { activeImageFor } from '../data/gallery';
import {
  isListeningSupported,
  listenOnce,
  stopListening,
  spokenMatches,
} from '../engine/listen';
import { pickCheer, pickGentle } from '../engine/tutorBrain';

// Simple, growing word/sentence lists (short + common; dyslexia-friendly).
const WORDS = ['cat', 'dog', 'sun', 'run', 'big', 'red', 'jump', 'play', 'happy', 'book'];
const SENTENCES = [
  'The cat is big.',
  'I like to play.',
  'The sun is hot.',
  'We can run fast.',
  'A dog can jump.',
];

type Mode = 'menu' | 'words' | 'sentences';

export function ReadingPractice({
  tutor,
  profile,
  onEarnStar,
  onBack,
}: {
  tutor: AnimeTutor;
  profile: Profile;
  onEarnStar: () => void;
  onBack: () => void;
}) {
  const supported = isListeningSupported();
  const [mode, setMode] = useState<Mode>('menu');
  const [idx, setIdx] = useState(0);
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [bubble, setBubble] = useState('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');

  const list = mode === 'words' ? WORDS : SENTENCES;
  const target = list[idx] ?? '';

  const speak = useCallback(
    (text: string, m: AvatarMood = 'speaking') => {
      setBubble(text);
      if (profile.autoSpeak === false) {
        setMood(m === 'speaking' ? 'idle' : m);
        return;
      }
      getSpeech().speak(text, {
        voice: tutor.voice,
        onStart: () => setMood(m),
        onEnd: () => setMood((c) => (c === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak, tutor.voice]
  );

  useEffect(() => () => {
    getSpeech().stop();
    stopListening();
  }, []);

  function start(newMode: Mode) {
    setMode(newMode);
    setIdx(0);
    setHeard('');
    speak(
      newMode === 'words'
        ? "Let's read words out loud! Tap the mic, then say the word you see."
        : "Let's read sentences! Tap the mic and read it out loud. Take your time."
    );
  }

  function sayTarget() {
    speak(target, 'speaking');
  }

  function startListening() {
    if (!supported) return;
    setHeard('');
    setListening(true);
    setMood('thinking');
    listenOnce({
      maxMs: 12000,
      onResult: (r) => {
        setHeard(r.transcript);
        // Interim results have confidence 0 — just show them, don't grade yet.
        if (r.confidence === 0) return;
        const ok = spokenMatches(target, r.transcript);
        if (ok) {
          onEarnStar();
          speak(pickCheer(), 'cheer');
          window.setTimeout(() => {
            const next = idx + 1;
            if (next < list.length) {
              setIdx(next);
              setHeard('');
              speak('Next one! You can do it.', 'happy');
            } else {
              setMode('menu');
              speak('You read them all! I am so proud of you! 🌟', 'cheer');
            }
          }, 2400);
        } else {
          speak(`${pickGentle()} The word is "${target}". Listen and try again.`, 'thinking');
        }
      },
      onError: () => speak("I couldn't hear that. Tap the mic and try again!", 'idle'),
      onEnd: () => setListening(false),
    });
  }

  return (
    <div className="center">
      <div className="row between" style={{ marginBottom: 16 }}>
        <strong style={{ color: tutor.accent, fontSize: '1.2rem' }}>
          🎤 Reading Out Loud with {tutor.name}
        </strong>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            getSpeech().stop();
            stopListening();
            onBack();
          }}
        >
          ← Back
        </button>
      </div>

      {!supported && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--accent)' }}>
          <strong>ℹ️ Microphone not available here.</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            This device or build can't use the mic for speech practice. Everything
            else still works — {tutor.name} can read the words aloud for {profile.name}
            to repeat.
          </p>
        </div>
      )}

      {mode === 'menu' ? (
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          <div className="card clickable" style={{ borderColor: tutor.accent }} onClick={() => start('words')}>
            <strong style={{ fontSize: '1.2rem' }}>🔤 Read Words</strong>
            <div className="muted">Say each word out loud.</div>
          </div>
          <div className="card clickable" style={{ borderColor: tutor.accent }} onClick={() => start('sentences')}>
            <strong style={{ fontSize: '1.2rem' }}>📖 Read Sentences</strong>
            <div className="muted">Read a short sentence out loud.</div>
          </div>
        </div>
      ) : (
        <div className="lesson-stage">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <AnimatedAvatar
              imageSrc={activeImageFor(profile, tutor.id)}
              mood={mood}
              accent={tutor.accent}
              size={380}
              fallbackGlyph={tutor.fallbackGlyph}
            />
          </div>
          <div>
            <div className="tutor-speech dyslexia" style={{ textAlign: 'center', fontSize: '2rem' }}>
              {target}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="read-btn" type="button" onClick={sayTarget}>
                🔊 Hear it
              </button>
            </div>

            {supported && (
              <button
                className="btn big-btn"
                type="button"
                disabled={listening}
                style={{ marginTop: 16, background: tutor.accent, opacity: listening ? 0.75 : 1 }}
                onClick={startListening}
              >
                {listening ? '🎤 Listening… take your time' : '🎤 Tap to read it'}
              </button>
            )}

            {listening && (
              <div className="listening-bar" aria-hidden style={{ marginTop: 12 }}>
                <span /><span /><span /><span /><span />
              </div>
            )}
            {heard && <p className="faint" style={{ marginTop: 10 }}>I heard: "{heard}"</p>}
            <div className="tutor-speech dyslexia" style={{ marginTop: 14 }}>
              {bubble || '…'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
