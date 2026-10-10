import { version as appVersion } from '../package.json';
import { JurassicEnvironment } from './components/JurassicEnvironment';
import { mandelaProfile, upgradeMandelaProfile } from './data/mandelaProfile';
import { AudioControls } from './components/AudioControls';
import { configureEffects, playEffect, quietEffects } from './engine/soundEffects';
import { startFocusMusic, stopFocusMusic, setVolume, duckMusic, setCustomTrack } from './engine/focusMusic';
import { useEffect, useState } from 'react';
import type { AppData, Profile } from './types';
import { loadData, saveData, upsertProfile, removeProfile } from './data/store';
import { syncKeysToDevice } from './data/keys';
import { ProfilePicker } from './components/ProfilePicker';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { AnimeEnvironment } from './components/AnimeEnvironment';
import { PrincessEnvironment } from './components/PrincessEnvironment';
import { ParentDashboard } from './components/ParentDashboard';

type View = 'loading' | 'picker' | 'setup' | 'dashboard' | 'anime' | 'princess' | 'parent' | 'jurassic';

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

  useEffect(() => { configureEffects(active?.soundEffects !== false, active?.effectsVolume ?? 0.25); }, [active?.soundEffects, active?.effectsVolume, active?.princessEnvironment, active?.jurassicEnvironment]);
  useEffect(() => {
    if (active?.princessEnvironment && !active?.jurassicEnvironment) return;
    setCustomTrack(active?.customMusic ?? null);
    if (active?.focusMusic) startFocusMusic(active.musicVolume ?? 0.18); else stopFocusMusic();
    return stopFocusMusic;
  }, [active?.id, active?.focusMusic, active?.customMusic]);
  useEffect(() => { if (active?.princessEnvironment && !active?.jurassicEnvironment) return; setVolume(active?.musicVolume ?? 0.18); }, [active?.musicVolume, active?.princessEnvironment, active?.jurassicEnvironment]);
  useEffect(() => {
    const activity = { speaking: false, listening: false };
    const sync = () => { const busy = activity.speaking || activity.listening; duckMusic(busy); quietEffects(busy); };
    const speech = (e: Event) => { activity.speaking = !!(e as CustomEvent).detail; sync(); };
    const listening = (e: Event) => { activity.listening = !!(e as CustomEvent).detail; sync(); };
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, [role="button"], .clickable, .kid-tile, select')) void playEffect('tap');
    };
    document.addEventListener('click', click);
    window.addEventListener('gt-speaking', speech); window.addEventListener('gt-listening', listening);
    return () => {
      document.removeEventListener('click', click);
      window.removeEventListener('gt-speaking', speech); window.removeEventListener('gt-listening', listening);
      duckMusic(false); quietEffects(false);
    };
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
    profile = upgradeMandelaProfile(profile);
    const next = upsertProfile(data, profile);
    persist(next);
    setActiveId(profile.id);
    setView(profile.jurassicEnvironment ? 'jurassic' : 'dashboard');
  }

  function handleUpdate(profile: Profile) {
    if (profile.starsEarned > (active?.starsEarned ?? 0)) void playEffect('reward');
    syncKeysToDevice(profile); // share API keys across all profiles (device-level)
    persist(upsertProfile(data, profile));
  }

  function handleDelete(profile: Profile) {
    const next = removeProfile(data, profile.id);
    persist(next);
    if (next.profiles.length === 0) setView('setup');
  }

  function openProfile(p: Profile) {
    const upgraded = upgradeMandelaProfile(p);
    if (upgraded !== p) void persist(upsertProfile(data, upgraded));
    p = upgraded;
    void playEffect('welcome');
    setActiveId(p.id);
    // Route to the right immersive environment.
    setView(p.jurassicEnvironment ? 'jurassic' : p.princessEnvironment ? 'princess' : p.animeEnvironment ? 'anime' : 'dashboard');
  }

  function toggleNight() {
    if (!active) return;
    handleUpdate({ ...active, nightMode: !active.nightMode });
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">🎓</span> Genius Tutor <small className="muted" style={{ fontSize: 14 }}>v{appVersion}</small>
        </div>
        <div className="row">
          {active && <AudioControls profile={active} onUpdate={handleUpdate} />}
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

      {view !== 'anime' && view !== 'princess' && view !== 'jurassic' && (
      <div className="content">
        {view === 'loading' && <div className="center muted">Loading…</div>}

        {view === 'picker' && (
          <ProfilePicker
            data={data}
            onOpen={openProfile}
            onAdd={() => setView('setup')}
            onAddMandela={() => { const p = mandelaProfile(); handleComplete(p); setView('jurassic'); }}
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
            onExit={() => setView(active.jurassicEnvironment ? 'jurassic' : active.princessEnvironment ? 'princess' : active.animeEnvironment ? 'anime' : 'dashboard')}
          />
        )}
      </div>
      )}

      {view === 'jurassic' && active && <JurassicEnvironment onParent={() => setView('parent')} profile={active} onUpdate={handleUpdate} onExit={() => setView('picker')} />}
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
