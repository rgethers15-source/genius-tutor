import { useEffect, useState } from 'react';
import type { AppData, Profile } from './types';
import { loadData, saveData, upsertProfile, removeProfile } from './data/store';
import { ProfilePicker } from './components/ProfilePicker';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { AnimeEnvironment } from './components/AnimeEnvironment';
import { PrincessEnvironment } from './components/PrincessEnvironment';
import { ParentDashboard } from './components/ParentDashboard';

type View = 'loading' | 'picker' | 'setup' | 'dashboard' | 'anime' | 'princess' | 'parent';

export function App() {
  const [data, setData] = useState<AppData>({ profiles: [], version: 1 });
  const [view, setView] = useState<View>('loading');
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = data.profiles.find((p) => p.id === activeId) ?? null;

  // Load persisted data on startup.
  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setView(d.profiles.length === 0 ? 'setup' : 'picker');
    });
  }, []);

  // Apply accessibility + theme to <html> based on the active profile.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dyslexia', !!active?.support.dyslexiaSupport);
    root.classList.toggle('large-text', !!active?.support.largerText);
    root.classList.toggle('night', !!active?.nightMode);
  }, [active?.support.dyslexiaSupport, active?.support.largerText, active?.nightMode]);

  async function persist(next: AppData) {
    setData(next);
    await saveData(next);
  }

  function handleComplete(profile: Profile) {
    const next = upsertProfile(data, profile);
    persist(next);
    setActiveId(profile.id);
    setView('dashboard');
  }

  function handleUpdate(profile: Profile) {
    persist(upsertProfile(data, profile));
  }

  function handleDelete(profile: Profile) {
    const next = removeProfile(data, profile.id);
    persist(next);
    if (next.profiles.length === 0) setView('setup');
  }

  function openProfile(p: Profile) {
    setActiveId(p.id);
    // Route to the right immersive environment.
    setView(p.princessEnvironment ? 'princess' : p.animeEnvironment ? 'anime' : 'dashboard');
  }

  function toggleNight() {
    if (!active) return;
    handleUpdate({ ...active, nightMode: !active.nightMode });
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">🎓</span> Genius Tutor
        </div>
        <div className="row">
          {active && view !== 'parent' && (
            <button className="btn ghost small" type="button" onClick={() => setView('parent')}>
              📊 Parent
            </button>
          )}
          {active && (
            <button className="btn ghost small" type="button" onClick={toggleNight}>
              {active.nightMode ? '☀️ Day mode' : '🌙 Night mode'}
            </button>
          )}
        </div>
      </div>

      {view !== 'anime' && view !== 'princess' && (
      <div className="content">
        {view === 'loading' && <div className="center muted">Loading…</div>}

        {view === 'picker' && (
          <ProfilePicker
            data={data}
            onOpen={openProfile}
            onAdd={() => setView('setup')}
            onDelete={handleDelete}
          />
        )}

        {view === 'setup' && (
          <SetupWizard
            onComplete={handleComplete}
            onCancel={() => setView(data.profiles.length > 0 ? 'picker' : 'setup')}
          />
        )}

        {view === 'dashboard' && active && (
          <Dashboard
            profile={active}
            onExit={() => setView('picker')}
            onUpdate={handleUpdate}
            onEnterAnime={() => {
              handleUpdate({ ...active, animeEnvironment: true });
              setView('anime');
            }}
            onEnterPrincess={() => {
              handleUpdate({ ...active, princessEnvironment: true });
              setView('princess');
            }}
          />
        )}

        {view === 'parent' && active && (
          <ParentDashboard
            profile={active}
            onUpdate={handleUpdate}
            onExit={() => setView(active.princessEnvironment ? 'princess' : active.animeEnvironment ? 'anime' : 'dashboard')}
          />
        )}
      </div>
      )}

      {view === 'anime' && active && (
        <AnimeEnvironment
          profile={active}
          onExit={() => setView('picker')}
          onUpdate={handleUpdate}
        />
      )}

      {view === 'princess' && active && (
        <PrincessEnvironment
          profile={active}
          onExit={() => setView('picker')}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
