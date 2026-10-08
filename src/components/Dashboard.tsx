import { useEffect, useMemo, useState } from 'react';
import type { Profile, Subject } from '../types';
import { getAvatar } from '../data/avatars';
import { GRADE_LEVELS, SUBJECTS } from '../data/curriculum';
import { getProvider, type Activity, pickCheer } from '../engine/adaptiveEngine';

export function Dashboard({
  profile,
  onExit,
  onUpdate,
  onEnterAnime,
  onEnterPrincess,
}: {
  profile: Profile;
  onExit: () => void;
  onUpdate: (p: Profile) => void;
  onEnterAnime?: () => void;
  onEnterPrincess?: () => void;
}) {
  const avatar = getAvatar(profile.avatarId);
  const grade = GRADE_LEVELS.find((g) => g.value === profile.plan.gradeLevel);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(
      `Hi ${profile.name}! I'm ${avatar?.name ?? 'your tutor'}. ${pickCheer()}`
    );
  }, [profile.name, avatar?.name]);

  const subjectMeta = useMemo(
    () => SUBJECTS.filter((s) => profile.plan.subjects.includes(s.value)),
    [profile.plan.subjects]
  );

  async function startActivity(subject: Subject) {
    const act = await getProvider().suggestActivity(profile, subject);
    setActivity(act);
  }

  function completeActivity() {
    if (!activity) return;
    const updated: Profile = {
      ...profile,
      starsEarned: profile.starsEarned + 1,
      progress: {
        ...profile.progress,
        [activity.subject]: (profile.progress[activity.subject] ?? 0) + 1,
      },
    };
    onUpdate(updated);
    setActivity(null);
    setGreeting(`Fantastic work, ${profile.name}! ${pickCheer()}`);
  }

  return (
    <div className="center">
      <div className="tutor" style={{ marginBottom: 24 }}>
        <div className="avatar-glyph" style={{ background: `${avatar?.accent ?? '#e0925c'}33` }}>
          {avatar?.glyph ?? '🙂'}
        </div>
        <div className="bubble">
          <div className="says">{greeting}</div>
          <div className="faint">
            {grade?.label} • {profile.plan.primaryLearningStyle} learner • ⭐ {profile.starsEarned} stars earned
          </div>
        </div>
        <div className="row">
          {onEnterAnime && (
            <button
              className="btn small"
              type="button"
              onClick={onEnterAnime}
              title="Immersive anime study rooms with talking tutors"
            >
              ✨ Anime Academy
            </button>
          )}
          {onEnterPrincess && (
            <button
              className="btn small"
              type="button"
              onClick={onEnterPrincess}
              title="Black Girl Magic Princess diamond wonderland"
            >
              👑 Princess Academy
            </button>
          )}
          <button className="btn ghost small" type="button" onClick={onExit}>
            Switch Learner
          </button>
        </div>
      </div>

      {activity ? (
        <div className="card">
          <div className="row between">
            <h2>{activity.title}</h2>
            {activity.kinetic && <span className="kinetic-badge">🤸 Hands-on activity</span>}
          </div>
          <p className="activity-prompt">{activity.prompt}</p>
          <div className="tutor" style={{ margin: '16px 0' }}>
            <div className="avatar-glyph" style={{ background: `${avatar?.accent ?? '#e0925c'}33` }}>
              {avatar?.glyph ?? '🙂'}
            </div>
            <div className="bubble says">{activity.encouragement}</div>
          </div>
          <div className="row end">
            <button className="btn ghost" type="button" onClick={() => setActivity(null)}>
              Maybe later
            </button>
            <button className="btn" type="button" onClick={completeActivity}>
              I did it! ⭐
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1>What shall we explore today?</h1>
          <p className="muted">Pick a subject and {avatar?.name ?? 'your tutor'} will guide you.</p>
          <div className="grid cols-3" style={{ marginTop: 20 }}>
            {subjectMeta.map((s) => (
              <div
                key={s.value}
                className="card clickable avatar-tile"
                onClick={() => startActivity(s.value)}
              >
                <div className="avatar-glyph">{s.icon}</div>
                <div className="avatar-name">{s.label}</div>
                <div className="faint">Done {profile.progress[s.value] ?? 0}×</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
