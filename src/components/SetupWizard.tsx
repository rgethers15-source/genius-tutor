import { useState } from 'react';
import type {
  GradeLevel,
  LearningStyle,
  Profile,
  Subject,
  SupportNeeds,
} from '../types';
import { DEFAULT_SUPPORT } from '../types';
import { GRADE_LEVELS, SUBJECTS, suggestGradeFromAge } from '../data/curriculum';
import { AvatarPicker } from './AvatarPicker';
import { newId } from '../data/store';

const LEARNING_STYLES: { value: LearningStyle; label: string; hint: string }[] = [
  { value: 'kinetic', label: 'Kinetic', hint: 'Learns best by moving & doing' },
  { value: 'visual', label: 'Visual', hint: 'Learns best by seeing & drawing' },
  { value: 'auditory', label: 'Auditory', hint: 'Learns best by listening & talking' },
  { value: 'reading', label: 'Reading', hint: 'Learns best by reading & writing' },
];

const STEP_COUNT = 5;

export function SetupWizard({
  onComplete,
  onCancel,
}: {
  onComplete: (profile: Profile) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);

  // Collected answers
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(7);
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(suggestGradeFromAge(7));
  const [subjects, setSubjects] = useState<Subject[]>(['reading', 'writing', 'math']);
  const [style, setStyle] = useState<LearningStyle>('kinetic');
  const [support, setSupport] = useState<SupportNeeds>({ ...DEFAULT_SUPPORT });
  const [avatarId, setAvatarId] = useState<string>('');

  function toggleSubject(s: Subject) {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function setSupportFlag(key: keyof SupportNeeds, value: boolean) {
    setSupport((prev) => ({ ...prev, [key]: value }));
  }

  const canNext = (() => {
    switch (step) {
      case 0:
        return name.trim().length > 0 && age >= 4 && age <= 18;
      case 1:
        return !!grade;
      case 2:
        return subjects.length > 0;
      case 3:
        return true;
      case 4:
        return !!avatarId;
      default:
        return false;
    }
  })();

  function finish() {
    const profile: Profile = {
      id: newId(),
      name: name.trim(),
      age,
      school: school.trim() || undefined,
      avatarId,
      plan: {
        gradeLevel: grade,
        subjects,
        primaryLearningStyle: style,
        pacing: 3,
        goals: [],
      },
      support,
      nightMode: false,
      setupComplete: true,
      createdAt: new Date().toISOString(),
      progress: {},
      starsEarned: 0,
    };
    onComplete(profile);
  }

  return (
    <div className="center">
      <div className="steps">
        {Array.from({ length: STEP_COUNT }).map((_, i) => (
          <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="card">
          <h1>Let's get to know your learner 🌟</h1>
          <p className="muted">This quick setup helps me build a plan just for them.</p>
          <div className="field">
            <label htmlFor="name">Child's first name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya" />
          </div>
          <div className="field">
            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              min={4}
              max={18}
              value={age}
              onChange={(e) => {
                const a = Number(e.target.value);
                setAge(a);
                setGrade(suggestGradeFromAge(a));
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="school">School (optional)</label>
            <input id="school" type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Helps tailor to their curriculum later" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h1>What grade is {name || 'your child'} in?</h1>
          <p className="muted">I suggested one based on age — change it if the school placed them differently.</p>
          <div className="field">
            <label htmlFor="grade">Grade level (K–12)</label>
            <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value as GradeLevel)}>
              {GRADE_LEVELS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h1>Which subjects should we work on?</h1>
          <p className="muted">Pick the classes they take. You can change these anytime.</p>
          <div className="row">
            {SUBJECTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`chip ${subjects.includes(s.value) ? 'on' : ''}`}
                onClick={() => toggleSubject(s.value)}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h1>How does {name || 'your child'} learn best?</h1>
          <p className="muted">We lead with hands-on, kinetic activities — and adapt from here.</p>
          <div className="grid cols-2" style={{ marginBottom: 20 }}>
            {LEARNING_STYLES.map((ls) => (
              <div
                key={ls.value}
                className={`card clickable ${style === ls.value ? 'selected' : ''}`}
                onClick={() => setStyle(ls.value)}
              >
                <strong>{ls.label}</strong>
                <div className="muted">{ls.hint}</div>
              </div>
            ))}
          </div>

          <h2>Learning support</h2>
          <p className="muted">Turn on anything that helps. The tutor adjusts gently — never judging.</p>
          <SupportToggle label="Dyslexia-friendly reading (spacing & font)" on={support.dyslexiaSupport} onChange={(v) => setSupportFlag('dyslexiaSupport', v)} />
          <SupportToggle label="Speech support (answer by pointing/drawing/speaking)" on={support.speechSupport} onChange={(v) => setSupportFlag('speechSupport', v)} />
          <SupportToggle label="Extra time on activities" on={support.extraTime} onChange={(v) => setSupportFlag('extraTime', v)} />
          <SupportToggle label="Reduced distraction (calmer screen)" on={support.reducedDistraction} onChange={(v) => setSupportFlag('reducedDistraction', v)} />
          <SupportToggle label="Larger text" on={support.largerText} onChange={(v) => setSupportFlag('largerText', v)} />
          <SupportToggle label="Read prompts aloud (voice-ready)" on={support.readAloud} onChange={(v) => setSupportFlag('readAloud', v)} />
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h1>Choose {name || 'your child'}'s tutor buddy 🎭</h1>
          <p className="muted">The right avatar keeps them engaged. Animated friends, human mentors, or anime guides.</p>
          <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
        </div>
      )}

      <div className="row between" style={{ marginTop: 24 }}>
        <button
          className="btn ghost"
          type="button"
          onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEP_COUNT - 1 ? (
          <button className="btn" type="button" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button className="btn" type="button" disabled={!canNext} onClick={finish}>
            Create Profile 🎉
          </button>
        )}
      </div>
    </div>
  );
}

function SupportToggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button type="button" className={`chip ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
        {on ? 'On' : 'Off'}
      </button>
    </div>
  );
}
