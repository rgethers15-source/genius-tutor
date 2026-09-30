import { useState } from 'react';
import type { Profile } from '../types';
import { SUBJECTS } from '../data/curriculum';
import { getStats, accuracy, rankedSubjects } from '../data/stats';

// Parent-only progress view, gated by a simple PIN. Warm, readable, honest.
export function ParentDashboard({
  profile,
  onUpdate,
  onExit,
}: {
  profile: Profile;
  onUpdate: (p: Profile) => void;
  onExit: () => void;
}) {
  const hasPin = !!profile.parentPin;
  const [unlocked, setUnlocked] = useState(!hasPin);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  const stats = getStats(profile);
  const ranked = rankedSubjects(stats);
  const strengths = ranked.slice(0, 2).filter((r) => r.acc >= 0.6);
  const struggles = [...ranked].reverse().slice(0, 2).filter((r) => r.acc < 0.6);
  const subjLabel = (v: string) => SUBJECTS.find((s) => s.value === v)?.label ?? v;

  // --- PIN gate ---
  if (!unlocked) {
    return (
      <div className="center">
        <div className="row between" style={{ marginBottom: 16 }}>
          <h1>🔒 Grown-Ups Only</h1>
          <button className="btn ghost" type="button" onClick={onExit}>← Back</button>
        </div>
        <div className="card">
          <p className="muted">Enter your parent PIN to see {profile.name}'s progress.</p>
          <div className="field">
            <label htmlFor="pin">Parent PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
            />
          </div>
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (pinInput === profile.parentPin) {
                setUnlocked(true);
                setError('');
              } else {
                setError('That PIN is not right. Try again.');
              }
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="center">
      <div className="row between" style={{ marginBottom: 16 }}>
        <h1>📊 {profile.name}'s Progress</h1>
        <button className="btn ghost" type="button" onClick={onExit}>← Back</button>
      </div>

      {/* Snapshot */}
      <div className="grid cols-4" style={{ marginBottom: 20 }}>
        <div className="card"><div className="faint">Stars earned</div><div className="stars" style={{ fontSize: '1.8rem' }}>⭐ {profile.starsEarned}</div></div>
        <div className="card"><div className="faint">Lessons done</div><div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.completedLessons.length}</div></div>
        <div className="card"><div className="faint">Time learning</div><div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalMinutes} min</div></div>
        <div className="card"><div className="faint">Last active</div><div style={{ fontWeight: 700 }}>{stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : '—'}</div></div>
      </div>

      {/* Per-subject progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>By subject</h2>
        {SUBJECTS.filter((s) => profile.plan.subjects.includes(s.value)).map((s) => {
          const ss = stats.bySubject[s.value];
          const acc = Math.round(accuracy(stats, s.value) * 100);
          const attempts = ss?.attempts ?? 0;
          return (
            <div key={s.value} style={{ marginBottom: 14 }}>
              <div className="row between">
                <strong>{s.icon} {s.label}</strong>
                <span className="faint">
                  {attempts > 0 ? `${acc}% correct • ${attempts} tries • ${ss?.lessonsCompleted ?? 0} lessons` : 'Not started yet'}
                </span>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: 'var(--bg-raised)', overflow: 'hidden', marginTop: 6 }}>
                <div style={{ width: `${acc}%`, height: '100%', background: acc >= 70 ? 'var(--success)' : 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths & struggles */}
      <div className="grid cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h2>💪 Doing great</h2>
          {strengths.length ? (
            <ul>{strengths.map((r) => <li key={r.subject}>{subjLabel(r.subject)} — {Math.round(r.acc * 100)}% correct</li>)}</ul>
          ) : (
            <p className="muted">Keep practicing to see strengths here.</p>
          )}
        </div>
        <div className="card">
          <h2>🤝 Needs help</h2>
          {struggles.length ? (
            <ul>{struggles.map((r) => <li key={r.subject}>{subjLabel(r.subject)} — {Math.round(r.acc * 100)}% correct</li>)}</ul>
          ) : (
            <p className="muted">Nothing struggling yet. 🎉</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Recent activity</h2>
        {stats.recent.length ? (
          <ul>
            {[...stats.recent].reverse().slice(0, 12).map((e, i) => (
              <li key={i}>
                <span className="faint">{new Date(e.at).toLocaleString()} — </span>
                {subjLabel(e.subject)}: {e.detail}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No activity yet.</p>
        )}
      </div>

      {/* PIN management */}
      <div className="card">
        <h2>🔐 Parent PIN</h2>
        <p className="muted">{hasPin ? 'Change the PIN that protects this dashboard.' : 'Set a PIN so only grown-ups can open this dashboard.'}</p>
        <div className="row">
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder={hasPin ? 'New PIN' : 'Set a PIN'}
            style={{ maxWidth: 200 }}
          />
          <button
            className="btn"
            type="button"
            disabled={newPin.trim().length < 3}
            onClick={() => { onUpdate({ ...profile, parentPin: newPin.trim() }); setNewPin(''); }}
          >
            {hasPin ? 'Update PIN' : 'Set PIN'}
          </button>
          {hasPin && (
            <button className="btn ghost danger" type="button" onClick={() => onUpdate({ ...profile, parentPin: undefined })}>
              Remove PIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
