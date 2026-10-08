import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { TutorStage } from './TutorStage';
import { type AvatarMood } from './AnimatedAvatar';
import { getSpeech } from '../engine/speech';
import { effectiveVoice, type AnimeTutor } from '../data/animeTutors';
import { activeImageFor } from '../data/gallery';
import { isListeningSupported, listenOnce, stopListening, spokenMatches } from '../engine/listen';
import { pickCheer, pickGentle } from '../engine/tutorBrain';
import {
  LETTER_SOUNDS, BLEND_WORDS, SIGHT_WORDS, EASY_SENTENCES,
} from '../data/learnToRead';

export type KidMode = 'learnRead' | 'phonics' | 'montessori' | 'games';

export function KidActivities({
  mode,
  tutor,
  profile,
  onEarnStar,
  onBack,
}: {
  mode: KidMode;
  tutor: AnimeTutor;
  profile: Profile;
  onEarnStar: () => void;
  onBack: () => void;
}) {
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [bubble, setBubble] = useState('');

  const speak = useCallback(
    (text: string, m: AvatarMood = 'speaking') => {
      setBubble(text);
      getSpeech().stop();
      if (profile.autoSpeak === false) { setMood(m === 'speaking' ? 'idle' : m); return; }
      getSpeech().speak(text, {
        voice: effectiveVoice(tutor, profile.tutorVoices?.[tutor.id]),
        onStart: () => setMood(m),
        onEnd: () => setMood((c) => (c === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak, profile.tutorVoices, tutor]
  );

  useEffect(() => () => { getSpeech().stop(); stopListening(); }, []);

  const img = activeImageFor(profile, tutor.id);
  const title =
    mode === 'learnRead' ? '📖 Learn to Read'
    : mode === 'phonics' ? '🗣️ Phonics & Sounds'
    : mode === 'montessori' ? '🧩 Montessori Play'
    : '🎮 Learning Games';

  return (
    <div className="center">
      <div className="row between" style={{ marginBottom: 12 }}>
        <h1 className="princess-title" style={{ fontSize: '1.7rem' }}>{title}</h1>
        <button className="btn ghost" type="button" onClick={() => { getSpeech().stop(); stopListening(); onBack(); }}>← Back</button>
      </div>

      <div className="lesson-stage">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <TutorStage tutor={tutor} imageSrc={img} mood={mood} line={bubble} size={320}
            videoEnabled={!!profile.didKey && !!profile.videoMode} />
          <strong style={{ color: tutor.accent }}>{tutor.name}</strong>
        </div>
        <div>
          <div className="tutor-speech dyslexia">{bubble || '…'}</div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="read-btn" type="button" onClick={() => bubble && speak(bubble)}>🔊 Say it again</button>
          </div>
          <div style={{ marginTop: 18 }}>
            {mode === 'learnRead' && <LearnToRead speak={speak} onEarnStar={onEarnStar} accent={tutor.accent} />}
            {mode === 'phonics' && <Phonics speak={speak} onEarnStar={onEarnStar} accent={tutor.accent} />}
            {mode === 'montessori' && <Montessori speak={speak} onEarnStar={onEarnStar} accent={tutor.accent} />}
            {mode === 'games' && <Games speak={speak} onEarnStar={onEarnStar} accent={tutor.accent} />}
          </div>
        </div>
      </div>
    </div>
  );
}

type SubProps = { speak: (t: string, m?: AvatarMood) => void; onEarnStar: () => void; accent: string };

// ---------------- Learn to Read ----------------
function LearnToRead({ speak, onEarnStar, accent }: SubProps) {
  const [step, setStep] = useState<'letters' | 'blend' | 'sight' | 'sentences'>('letters');
  const [i, setI] = useState(0);

  useEffect(() => { speak("Let's learn to read! Tap a letter to hear its sound."); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['letters', 'blend', 'sight', 'sentences'] as const).map((s) => (
          <button key={s} className={`chip ${step === s ? 'on' : ''}`} onClick={() => { setStep(s); setI(0); }}>
            {s === 'letters' ? 'Letter Sounds' : s === 'blend' ? 'Blend Words' : s === 'sight' ? 'Sight Words' : 'Sentences'}
          </button>
        ))}
      </div>

      {step === 'letters' && (
        <div className="grid cols-4" style={{ gap: 10 }}>
          {LETTER_SOUNDS.map((ls) => (
            <button key={ls.letter} className="kid-btn big-letter" style={{ background: accent }}
              onClick={() => speak(`${ls.letter} says ${ls.sound}, like ${ls.example}. ${ls.emoji}`)}>
              {ls.letter}
            </button>
          ))}
        </div>
      )}

      {step === 'blend' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem' }}>{BLEND_WORDS[i].emoji}</div>
          <div className="row" style={{ justifyContent: 'center', gap: 10, margin: '12px 0' }}>
            {BLEND_WORDS[i].parts.map((p, idx) => (
              <button key={idx} className="kid-btn" style={{ background: accent }} onClick={() => speak(p)}>{p}</button>
            ))}
          </div>
          <button className="btn big-btn" style={{ background: accent }} onClick={() => { speak(`Blend it: ${BLEND_WORDS[i].word}! Great job!`, 'cheer'); onEarnStar(); }}>
            🔊 Say the whole word
          </button>
          <div style={{ marginTop: 10 }}>
            <button className="btn ghost" onClick={() => setI((i + 1) % BLEND_WORDS.length)}>Next word →</button>
          </div>
        </div>
      )}

      {step === 'sight' && (
        <div className="grid cols-3" style={{ gap: 10 }}>
          {SIGHT_WORDS.map((w) => (
            <button key={w} className="kid-btn" style={{ background: accent }} onClick={() => speak(w)}>{w}</button>
          ))}
        </div>
      )}

      {step === 'sentences' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>{EASY_SENTENCES[i].emoji}</div>
          <div className="tutor-speech dyslexia" style={{ fontSize: '1.8rem', margin: '12px 0' }}>{EASY_SENTENCES[i].text}</div>
          <button className="btn big-btn" style={{ background: accent }} onClick={() => { speak(EASY_SENTENCES[i].text, 'happy'); onEarnStar(); }}>🔊 Read it to me</button>
          <div style={{ marginTop: 10 }}>
            <button className="btn ghost" onClick={() => setI((i + 1) % EASY_SENTENCES.length)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Phonics with mic ----------------
function Phonics({ speak, onEarnStar, accent }: SubProps) {
  const supported = isListeningSupported();
  const [i, setI] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const target = LETTER_SOUNDS[i];

  useEffect(() => { speak("Let's practice sounds! Tap the letter to hear it, then say it into the mic."); /* eslint-disable-next-line */ }, []);

  function listen() {
    if (!supported) return;
    setHeard(''); setListening(true);
    listenOnce({
      maxMs: 10000,
      onResult: (r) => {
        setHeard(r.transcript);
        if (r.confidence === 0) return;
        // Accept if they said the sound OR the example word OR the letter.
        if (spokenMatches(target.sound, r.transcript) || spokenMatches(target.example, r.transcript) || spokenMatches(target.letter, r.transcript)) {
          onEarnStar(); speak(pickCheer(), 'cheer');
        } else {
          speak(`${pickGentle()} ${target.letter} says ${target.sound}. Try again!`, 'thinking');
        }
      },
      onError: () => speak("I didn't hear it. Tap the mic and try again!"),
      onEnd: () => setListening(false),
    });
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button className="kid-btn big-letter" style={{ background: accent, marginBottom: 12 }}
        onClick={() => speak(`${target.letter} says ${target.sound}, like ${target.example}.`)}>
        {target.letter} {target.emoji}
      </button>
      <div>
        {supported ? (
          <button className="btn big-btn" style={{ background: accent, opacity: listening ? 0.7 : 1 }} disabled={listening} onClick={listen}>
            {listening ? '🎤 Listening… say it!' : '🎤 Tap and say the sound'}
          </button>
        ) : (
          <p className="faint">Mic not available here — tap the letter to hear the sound and say it back.</p>
        )}
      </div>
      {listening && <div className="listening-bar" style={{ justifyContent: 'center', marginTop: 10 }}><span /><span /><span /><span /><span /></div>}
      {heard && <p className="faint" style={{ marginTop: 8 }}>I heard: "{heard}"</p>}
      <div style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => { setI((i + 1) % LETTER_SOUNDS.length); setHeard(''); }}>Next sound →</button>
      </div>
    </div>
  );
}

// ---------------- Montessori (sorting/counting) ----------------
function Montessori({ speak, onEarnStar, accent }: SubProps) {
  const [activity, setActivity] = useState<'count' | 'sort' | null>(null);
  const [count, setCount] = useState(0);
  const target = 5;

  useEffect(() => { speak('Welcome to Montessori play! Pick an activity to do with your hands.'); /* eslint-disable-next-line */ }, []);

  if (!activity) {
    return (
      <div className="grid cols-2" style={{ gap: 12 }}>
        <div className="kid-tile" onClick={() => { setActivity('count'); setCount(0); speak(`Tap the gems until you have ${target}!`); }}>
          <span className="kid-emoji">💎</span><span className="kid-label">Count the Gems</span>
        </div>
        <div className="kid-tile" onClick={() => { setActivity('sort'); speak('Tap each fruit and say its color out loud!'); }}>
          <span className="kid-emoji">🍎</span><span className="kid-label">Sort by Color</span>
        </div>
      </div>
    );
  }

  if (activity === 'count') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p className="dyslexia" style={{ fontSize: '1.4rem' }}>Tap to add gems — get to {target}!</p>
        <div className="tray">
          {Array.from({ length: count }).map((_, idx) => <span key={idx} className="tray-item">💎</span>)}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
          <button className="kid-btn" style={{ background: accent }} onClick={() => {
            const n = count + 1; setCount(n); speak(String(n));
            if (n === target) { speak(`You counted ${target} gems! Royal job! 💎👑`, 'cheer'); onEarnStar(); }
          }}>➕ Add a gem</button>
          <button className="btn ghost" onClick={() => setActivity(null)}>Done</button>
        </div>
      </div>
    );
  }

  // sort
  const fruits = [{ e: '🍎', c: 'red' }, { e: '🍌', c: 'yellow' }, { e: '🫐', c: 'blue' }, { e: '🍏', c: 'green' }];
  return (
    <div style={{ textAlign: 'center' }}>
      <p className="dyslexia" style={{ fontSize: '1.4rem' }}>Tap a fruit — hear its color!</p>
      <div className="tray">
        {fruits.map((f) => (
          <span key={f.e} className="tray-item" onClick={() => { speak(`${f.e} is ${f.c}!`, 'happy'); onEarnStar(); }}>{f.e}</span>
        ))}
      </div>
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setActivity(null)}>Done</button>
    </div>
  );
}

// ---------------- Leveled games ----------------
function Games({ speak, onEarnStar, accent }: SubProps) {
  const [level, setLevel] = useState<1 | 2 | 3 | null>(null);
  const [q, setQ] = useState<{ prompt: string; choices: string[]; answer: string } | null>(null);

  const make = useCallback((lvl: 1 | 2 | 3) => {
    const a = Math.floor(Math.random() * (lvl === 1 ? 3 : lvl === 2 ? 6 : 10)) + 1;
    const b = Math.floor(Math.random() * (lvl === 1 ? 3 : lvl === 2 ? 6 : 10)) + 1;
    const ans = a + b;
    const opts = new Set<number>([ans]);
    while (opts.size < 3) opts.add(ans + (Math.floor(Math.random() * 5) - 2));
    const choices = Array.from(opts).sort(() => Math.random() - 0.5).map(String);
    const prompt = `What is ${a} + ${b}?`;
    setQ({ prompt, choices, answer: String(ans) });
    speak(prompt);
  }, [speak]);

  if (!level) {
    return (
      <div className="grid cols-3" style={{ gap: 12 }}>
        {([1, 2, 3] as const).map((l) => (
          <div key={l} className="kid-tile" onClick={() => { setLevel(l); make(l); }}>
            <span className="kid-emoji">{l === 1 ? '⭐' : l === 2 ? '🌟' : '💫'}</span>
            <span className="kid-label">Level {l}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="tutor-speech dyslexia" style={{ fontSize: '1.8rem' }}>{q?.prompt}</div>
      <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 14 }}>
        {q?.choices.map((c) => (
          <button key={c} className="kid-btn" style={{ background: accent }} onClick={() => {
            if (c === q.answer) { speak('Yes! You got it! ⭐', 'cheer'); onEarnStar(); setTimeout(() => make(level), 1800); }
            else speak('Good try! Count on your fingers and try again.', 'thinking');
          }}>{c}</button>
        ))}
      </div>
      <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setLevel(null)}>← Levels</button>
    </div>
  );
}
