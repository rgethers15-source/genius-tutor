import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimeTutor } from '../data/animeTutors';
import type { Profile } from '../types';
import { AnimatedAvatar, type AvatarMood } from './AnimatedAvatar';
import { getSpeech } from '../engine/speech';
import { fileToDataUrl } from '../data/image';
import { activeImageFor } from '../data/gallery';
import {
  getHomeworkAi,
  resetHomeworkRoutine,
  type HomeworkContext,
} from '../engine/homeworkAi';

export function HomeworkHelp({
  tutor,
  profile,
  onBack,
  onUsed,
}: {
  tutor: AnimeTutor;
  profile: Profile;
  onBack: () => void;
  onUsed?: () => void;
}) {
  const [image, setImage] = useState<string | undefined>();
  const [question, setQuestion] = useState('');
  const [bubble, setBubble] = useState('');
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [busy, setBusy] = useState(false);
  const [smart, setSmart] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const speak = useCallback(
    (text: string, nextMood: AvatarMood = 'speaking') => {
      setBubble(text);
      if (profile.autoSpeak === false) {
        setMood(nextMood === 'speaking' ? 'idle' : nextMood);
        return;
      }
      getSpeech().speak(text, {
        voice: tutor.voice,
        onStart: () => setMood(nextMood),
        onEnd: () => setMood('idle'),
      });
    },
    [profile.autoSpeak, tutor.voice]
  );

  useEffect(() => {
    resetHomeworkRoutine();
    setSmart(getHomeworkAi().isSmart());
    speak(
      `Hi ${profile.name}! Show me your homework. Take a picture or upload it, and I'll help you understand it, one small step at a time!`
    );
    return () => getSpeech().stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await fileToDataUrl(file, 1400);
    setImage(dataUrl);
    speak('I see your homework! Great. Now tap "Help me" and we will start together.', 'happy');
  }

  async function askHelp() {
    setBusy(true);
    setMood('thinking');
    const ctx: HomeworkContext = {
      learnerName: profile.name,
      grade: profile.plan.gradeLevel,
      reasoningLevel: profile.reasoningLevel ?? '3',
      dyslexia: !!profile.support.dyslexiaSupport,
      adhd: true,
    };
    const res = await getHomeworkAi().explain(ctx, question, image);
    setSmart(res.smart);
    speak(res.say);
    setBusy(false);
    onUsed?.();
  }

  return (
    <div className="center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      <div className="row between" style={{ marginBottom: 16 }}>
        <strong style={{ color: tutor.accent, fontSize: '1.2rem' }}>
          📚 Homework Help with {tutor.name}
        </strong>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            getSpeech().stop();
            onBack();
          }}
        >
          ← Back
        </button>
      </div>

      {smart === false && (
        <div className="card" style={{ marginBottom: 16, borderColor: tutor.accent }}>
          <strong>ℹ️ For grown-ups:</strong>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Right now the tutor coaches Madeline through a step-by-step routine but
            can't yet <em>read</em> the homework itself. Add an OpenAI API key in
            Settings to unlock <strong>smart mode</strong> — then the tutor reads the
            uploaded photo and explains it in her own words at her level.
          </p>
        </div>
      )}

      <div className="lesson-stage">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AnimatedAvatar
            imageSrc={activeImageFor(profile, tutor.id)}
            mood={mood}
            accent={tutor.accent}
            size={240}
            fallbackGlyph={tutor.fallbackGlyph}
          />
          {smart && <span className="pill" style={{ background: `${tutor.accent}22`, color: tutor.accent }}>🧠 Smart mode on</span>}
        </div>

        <div>
          <div className="tutor-speech dyslexia">{bubble || '…'}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="read-btn" type="button" onClick={() => speak(bubble)}>
              🔊 Say it again
            </button>
          </div>

          {image ? (
            <img
              src={image}
              alt="Your homework"
              style={{ maxWidth: '100%', borderRadius: 14, marginTop: 16, border: '1px solid var(--border)' }}
            />
          ) : (
            <div className="upload-drop" style={{ marginTop: 16 }} onClick={() => fileRef.current?.click()}>
              📷 Tap to take a picture or upload your homework
            </div>
          )}

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="q">Or type your question (optional)</label>
            <input
              id="q"
              className="big-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are you stuck on?"
            />
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="btn big-btn"
              type="button"
              disabled={busy || (!image && !question.trim())}
              style={{ background: tutor.accent, opacity: busy ? 0.6 : 1 }}
              onClick={askHelp}
            >
              {busy ? 'Thinking…' : '✨ Help me!'}
            </button>
            {image && (
              <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()}>
                🔄 New photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
