import { useEffect, useState, useCallback } from 'react';
import type { AnimeTutor } from '../data/animeTutors';
import type { Lesson, QuizItem } from '../data/curriculum6';
import { allLessonsForSubject, buildTest } from '../data/curriculum6';
import { type AvatarMood } from './AnimatedAvatar';
import { TutorStage } from './TutorStage';
import { getSpeech } from '../engine/speech';
import { pickCheer, pickGentle } from '../engine/tutorBrain';

type Phase = 'menu' | 'teach' | 'quiz' | 'test' | 'result';

export function LessonPlayer({
  tutor,
  imageSrc,
  autoSpeak,
  videoEnabled = false,
  onEarnStar,
  onRecordAnswer,
  onLessonComplete,
  onGenerateQuestions,
  onBack,
}: {
  tutor: AnimeTutor;
  imageSrc?: string;
  autoSpeak: boolean;
  videoEnabled?: boolean;
  onEarnStar: () => void;
  onRecordAnswer?: (correct: boolean, kind: 'quiz' | 'test') => void;
  onLessonComplete?: (lessonId: string, title: string) => void;
  /** When provided, enables unlimited AI-generated practice questions. */
  onGenerateQuestions?: (count: number) => Promise<QuizItem[]>;
  onBack: () => void;
}) {
  const lessons = allLessonsForSubject(tutor.subject);
  const [phase, setPhase] = useState<Phase>('menu');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [bubble, setBubble] = useState('');
  const [locked, setLocked] = useState(false);

  // Test state
  const [testItems, setTestItems] = useState<QuizItem[]>([]);
  const [testIdx, setTestIdx] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');

  async function startAiPractice() {
    if (!onGenerateQuestions) return;
    setAiBusy(true);
    setAiError('');
    try {
      const items = await onGenerateQuestions(5);
      if (items.length === 0) throw new Error('No questions came back.');
      setTestItems(items);
      setTestIdx(0);
      setTestScore(0);
      setLocked(false);
      setPhase('test');
      speak(`New practice made just for you! ${items[0].q}`);
    } catch (e) {
      setAiError(
        e instanceof Error && /fetch|network|openai/i.test(e.message)
          ? 'Could not reach OpenAI. Check the key in Settings and your internet.'
          : 'Could not make new questions. Try the regular lessons for now.'
      );
    }
    setAiBusy(false);
  }

  const speak = useCallback(
    (text: string, nextMood: AvatarMood = 'speaking') => {
      setBubble(text);
      if (!autoSpeak) {
        setMood(nextMood === 'speaking' ? 'idle' : nextMood);
        return;
      }
      getSpeech().speak(text, {
        voice: tutor.voice,
        onStart: () => setMood(nextMood),
        onEnd: () => setMood((m) => (m === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [autoSpeak, tutor.voice]
  );

  useEffect(() => () => getSpeech().stop(), []);

  // ---- Teaching ----
  function startLesson(l: Lesson) {
    setLesson(l);
    setStepIdx(0);
    setPhase('teach');
    speak(l.steps[0].say);
  }
  function nextStep() {
    if (!lesson) return;
    const next = stepIdx + 1;
    if (next < lesson.steps.length) {
      setStepIdx(next);
      speak(lesson.steps[next].say);
    } else {
      // Move to quiz
      setPhase('quiz');
      setQuizIdx(0);
      setLocked(false);
      speak(`Great! Now let's try a question. ${lesson.quiz[0].q}`);
    }
  }

  // ---- Quiz (practice, unlimited tries) ----
  function answerQuiz(choice: string) {
    if (!lesson || locked) return;
    const item = lesson.quiz[quizIdx];
    const correct = choice.trim().toLowerCase() === item.answer.trim().toLowerCase();
    onRecordAnswer?.(correct, 'quiz');
    if (correct) {
      setLocked(true);
      onEarnStar();
      speak(pickCheer(), 'cheer');
      window.setTimeout(() => {
        const next = quizIdx + 1;
        if (next < lesson.quiz.length) {
          setQuizIdx(next);
          setLocked(false);
          speak(lesson.quiz[next].q);
        } else {
          onLessonComplete?.(lesson.id, lesson.title);
          setPhase('menu');
          speak('You finished the lesson! Amazing work. Pick another, or try a test!', 'happy');
        }
      }, 2600);
    } else {
      speak(`${pickGentle()} Hint: ${item.hint}`, 'thinking');
    }
  }

  // ---- Test (scored, gentle) ----
  function startTest() {
    const items = buildTest(tutor.subject, 5);
    setTestItems(items);
    setTestIdx(0);
    setTestScore(0);
    setLocked(false);
    setPhase('test');
    speak(`Test time! No worries — just do your best. ${items[0]?.q ?? ''}`);
  }
  function answerTest(choice: string) {
    if (locked) return;
    const item = testItems[testIdx];
    const correct = choice.trim().toLowerCase() === item.answer.trim().toLowerCase();
    onRecordAnswer?.(correct, 'test');
    setLocked(true);
    if (correct) {
      setTestScore((s) => s + 1);
      onEarnStar();
      speak('Correct! ⭐', 'cheer');
    } else {
      speak(`Good try! The answer was ${item.answer}. You are learning!`, 'thinking');
    }
    window.setTimeout(() => {
      const next = testIdx + 1;
      if (next < testItems.length) {
        setTestIdx(next);
        setLocked(false);
        speak(testItems[next].q);
      } else {
        setPhase('result');
        const finalScore = testScore + (correct ? 1 : 0);
        speak(
          `You got ${finalScore} out of ${testItems.length}! I am so proud of you, superstar! 🌟`,
          'cheer'
        );
      }
    }, 2600);
  }

  const currentChoices =
    phase === 'quiz'
      ? lesson?.quiz[quizIdx]?.choices
      : phase === 'test'
        ? testItems[testIdx]?.choices
        : undefined;
  const onChoice = phase === 'quiz' ? answerQuiz : answerTest;

  return (
    <div className="center">
      <div className="row between" style={{ marginBottom: 16 }}>
        <strong style={{ color: tutor.accent, fontSize: '1.2rem' }}>
          {tutor.name} • Lessons
        </strong>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            getSpeech().stop();
            onBack();
          }}
        >
          ← Back to tutor
        </button>
      </div>

      {phase === 'menu' ? (
        <div>
          <p className="muted" style={{ fontSize: '1.1rem' }}>
            📗 <strong>NC 6th-Grade {tutor.subject === 'socialStudies' ? 'Social Studies' : tutor.subject.charAt(0).toUpperCase() + tutor.subject.slice(1)}</strong> — pick a lesson to learn, or take a fun test!
          </p>
          <div className="grid cols-2" style={{ marginTop: 16 }}>
            {lessons.map((l) => (
              <div key={l.id} className="card clickable" onClick={() => startLesson(l)}>
                <strong style={{ fontSize: '1.15rem' }}>{l.title}</strong>
                <div className="muted">{l.topic}</div>
                <span className="pill" style={{ background: `${tutor.accent}22`, color: tutor.accent }}>
                  {l.standard}
                </span>
              </div>
            ))}
            <div
              className="card clickable"
              style={{ borderColor: tutor.accent }}
              onClick={startTest}
            >
              <strong style={{ fontSize: '1.15rem' }}>📝 Take a Test</strong>
              <div className="muted">5 quick questions. Earn stars!</div>
            </div>
            {onGenerateQuestions && (
              <div
                className="card clickable"
                style={{ borderColor: tutor.accent }}
                onClick={aiBusy ? undefined : startAiPractice}
              >
                <strong style={{ fontSize: '1.15rem' }}>
                  {aiBusy ? '🎲 Making questions…' : '🎲 Endless Practice (AI)'}
                </strong>
                <div className="muted">Brand-new questions every time!</div>
              </div>
            )}
          </div>
          {aiError && <p style={{ color: 'var(--danger)', marginTop: 12 }}>{aiError}</p>}
        </div>
      ) : (
        <div className="lesson-stage">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <TutorStage
              tutor={tutor}
              imageSrc={imageSrc}
              mood={mood}
              line={bubble}
              size={380}
              videoEnabled={videoEnabled}
            />
            {phase === 'test' && (
              <div className="faint">
                Question {Math.min(testIdx + 1, testItems.length)} of {testItems.length}
              </div>
            )}
          </div>

          <div>
            <div className="tutor-speech dyslexia">
              {lesson && phase === 'teach' && lesson.steps[stepIdx].visual && (
                <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>
                  {lesson.steps[stepIdx].visual}
                </div>
              )}
              {bubble || '…'}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button className="read-btn" type="button" onClick={() => speak(bubble)}>
                🔊 Say it again
              </button>
            </div>

            {phase === 'teach' && (
              <button
                className="btn big-btn"
                type="button"
                style={{ marginTop: 18, background: tutor.accent }}
                onClick={nextStep}
              >
                Next →
              </button>
            )}

            {currentChoices && (
              <div className="grid cols-3" style={{ marginTop: 18 }}>
                {currentChoices.map((c) => (
                  <button
                    key={c}
                    className="btn big-btn"
                    type="button"
                    disabled={locked}
                    style={{ background: tutor.accent, opacity: locked ? 0.6 : 1 }}
                    onClick={() => onChoice(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {phase === 'result' && (
              <div style={{ marginTop: 18 }}>
                <div className="stars" style={{ fontSize: '1.6rem' }}>
                  ⭐ {testScore} / {testItems.length}
                </div>
                <button
                  className="btn big-btn"
                  type="button"
                  style={{ marginTop: 14, background: tutor.accent }}
                  onClick={() => setPhase('menu')}
                >
                  Back to lessons
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
