import type { Profile } from '../types';
import { BADGES } from '../data/badges';

export function BadgeShelf({
  profile,
  accent = '#e0925c',
  onBack,
}: {
  profile: Profile;
  accent?: string;
  onBack: () => void;
}) {
  const earned = new Set(profile.earnedBadges ?? []);
  const earnedCount = BADGES.filter((b) => earned.has(b.id)).length;

  return (
    <div className="center">
      <div className="row between" style={{ marginBottom: 12 }}>
        <h1 className="anime-title" style={{ fontSize: '1.7rem' }}>
          🏆 {profile.name}'s Trophy Shelf
        </h1>
        <button className="btn ghost" type="button" onClick={onBack}>
          ← Back
        </button>
      </div>
      <p className="muted">
        You have earned {earnedCount} of {BADGES.length} trophies. Keep going —
        you're doing amazing! 🌟
      </p>

      <div className="grid cols-4" style={{ marginTop: 18 }}>
        {BADGES.map((b) => {
          const got = earned.has(b.id);
          return (
            <div
              key={b.id}
              className="card avatar-tile"
              style={{
                opacity: got ? 1 : 0.45,
                borderColor: got ? accent : 'var(--border)',
              }}
            >
              <div
                className="avatar-glyph"
                style={{ background: got ? `${accent}33` : 'var(--bg-raised)', filter: got ? 'none' : 'grayscale(1)' }}
              >
                {got ? b.emoji : '🔒'}
              </div>
              <div className="avatar-name">{b.name}</div>
              <div className="avatar-personality">{b.description}</div>
              {got && (
                <span className="pill" style={{ background: `${accent}22`, color: accent }}>
                  Earned!
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
