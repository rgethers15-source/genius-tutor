import { useState } from 'react';
import type { Profile } from '../types';
import { currentTitle, nextTrack, PLAYLIST } from '../engine/focusMusic';
export function AudioControls({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle());
  return <div className="audio-controls">
    <button className="btn ghost small" onClick={() => { setOpen(!open); setTitle(currentTitle()); }} aria-expanded={open}>🎧 Sound & music</button>
    {open && <div className="card audio-panel">
      <strong>Chill-hop study lounge</strong><p className="faint">{title} · {PLAYLIST.length} bundled instrumental tracks</p>
      <label><input type="checkbox" checked={!!profile.focusMusic} onChange={e => onUpdate({ ...profile, focusMusic: e.target.checked })} /> Play instrumentals</label>
      <label>Music volume<input aria-label="Music volume" type="range" min="0" max="1" step="0.05" value={profile.musicVolume ?? 0.18} onChange={e => onUpdate({ ...profile, musicVolume: Number(e.target.value) })} /></label>
      <button className="btn ghost" onClick={() => { nextTrack(); setTitle(currentTitle()); }}>Next instrumental</button>
      <label><input type="checkbox" checked={profile.soundEffects !== false} onChange={e => onUpdate({ ...profile, soundEffects: e.target.checked })} /> Gentle button & reward sounds</label>
      <label>Effects volume<input aria-label="Effects volume" type="range" min="0" max="1" step="0.05" value={profile.effectsVolume ?? 0.25} onChange={e => onUpdate({ ...profile, effectsVolume: Number(e.target.value) })} /></label>
      <p className="faint">Music softens while tutors talk or the microphone listens. Effects pause during those moments.</p>
    </div>}
  </div>;
}
