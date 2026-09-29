import type { AppData, Profile } from '../types';
import { MAX_PROFILES } from '../types';
import { getAvatar } from '../data/avatars';
import { GRADE_LEVELS } from '../data/curriculum';

export function ProfilePicker({
  data,
  onOpen,
  onAdd,
  onDelete,
}: {
  data: AppData;
  onOpen: (p: Profile) => void;
  onAdd: () => void;
  onDelete: (p: Profile) => void;
}) {
  const canAdd = data.profiles.length < MAX_PROFILES;

  return (
    <div className="center">
      <h1>Who is learning today? 👋</h1>
      <p className="muted">Up to {MAX_PROFILES} learner profiles. Pick yours to begin.</p>

      <div className="grid cols-4" style={{ marginTop: 24 }}>
        {data.profiles.map((p) => {
          const av = getAvatar(p.avatarId);
          const grade = GRADE_LEVELS.find((g) => g.value === p.plan.gradeLevel);
          return (
            <div key={p.id} className="card clickable avatar-tile" onClick={() => onOpen(p)}>
              <div className="avatar-glyph" style={{ background: `${av?.accent ?? '#e0925c'}33` }}>
                {av?.glyph ?? '🙂'}
              </div>
              <div className="avatar-name">{p.name}</div>
              <div className="muted">{grade?.label ?? `Grade ${p.plan.gradeLevel}`}</div>
              <div className="stars">⭐ {p.starsEarned}</div>
              <button
                className="btn ghost small danger"
                style={{ marginTop: 10 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(p);
                }}
              >
                Remove
              </button>
            </div>
          );
        })}

        {canAdd && (
          <div className="card clickable avatar-tile" onClick={onAdd}>
            <div className="avatar-glyph">➕</div>
            <div className="avatar-name">Add Learner</div>
            <div className="muted">First-time setup</div>
          </div>
        )}
      </div>

      {!canAdd && (
        <p className="faint" style={{ marginTop: 16 }}>
          You've reached the maximum of {MAX_PROFILES} profiles. Remove one to add another.
        </p>
      )}
    </div>
  );
}
