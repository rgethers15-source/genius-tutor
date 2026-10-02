import { useRef, useState } from 'react';
import type { Profile } from '../types';
import type { AnimeTutor } from '../data/animeTutors';
import {
  galleryFor,
  activeImageFor,
  addToGallery,
  setActiveImage,
  removeFromGallery,
} from '../data/gallery';
import { fileToDataUrl } from '../data/image';
import { generateAvatar, STYLE_PRESETS } from '../engine/imageGen';
import { prerecordTutor, collectTutorLines, type PrerecordProgress } from '../engine/prerecord';
import { cacheAvailable } from '../data/videoCache';
import { APP_VERSION } from '../version';

export function TutorGallery({
  tutor,
  profile,
  onUpdate,
  onBack,
}: {
  tutor: AnimeTutor;
  profile: Profile;
  onUpdate: (p: Profile) => void;
  onBack: () => void;
}) {
  const images = galleryFor(profile, tutor.id);
  const active = activeImageFor(profile, tutor.id);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [prompt, setPrompt] = useState(STYLE_PRESETS[0].prompt);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Pre-record state
  const [preBusy, setPreBusy] = useState(false);
  const [preProgress, setPreProgress] = useState<PrerecordProgress | null>(null);
  const [preDone, setPreDone] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const hasKey = !!profile.openAiKey && profile.openAiKey.trim().length > 10;
  const hasDid = !!profile.didKey && profile.didKey.trim().length > 10;
  const totalLines = collectTutorLines(tutor).length;

  async function startPrerecord() {
    const img = active;
    if (!img) {
      setPreDone('Pick a face picture first (tap one above).');
      return;
    }
    if (!cacheAvailable()) {
      setPreDone('Video caching only works in the installed desktop app.');
      return;
    }
    cancelRef.current = false;
    setPreBusy(true);
    setPreDone(null);
    const result = await prerecordTutor(
      tutor,
      img,
      { provider: 'microsoft', voiceId: tutor.videoVoiceId },
      (p) => setPreProgress({ ...p }),
      () => cancelRef.current
    );
    setPreBusy(false);
    setPreProgress(null);
    if (result.error) {
      setPreDone(`Stopped: ${result.error}`);
    } else {
      setPreDone(
        `Done! ${result.done} lines ready (${result.skipped} already saved${
          result.failed ? `, ${result.failed} failed` : ''
        }). Lessons will now play instantly as video. 🎬`
      );
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await fileToDataUrl(file, 640);
    onUpdate(addToGallery(profile, tutor.id, dataUrl));
    setStatus('Added your picture to the gallery! ✅');
  }

  async function onGenerate() {
    if (!hasKey) {
      setStatus('Add your OpenAI key in Settings to generate avatars.');
      return;
    }
    setBusy(true);
    setStatus('Creating an anime avatar… this can take ~15 seconds. 🎨');
    const res = await generateAvatar(profile.openAiKey!, prompt);
    if (res.ok && res.dataUrl) {
      onUpdate(addToGallery(profile, tutor.id, res.dataUrl));
      setStatus('New avatar created and added to the gallery! 🌟');
    } else {
      setStatus(`Could not generate: ${res.error ?? 'unknown error'}`);
    }
    setBusy(false);
  }

  return (
    <div className="center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onUpload}
      />

      <div className="row between" style={{ marginBottom: 12 }}>
        <h1 className="anime-title" style={{ fontSize: '1.6rem' }}>
          {tutor.name}'s Avatar Gallery
        </h1>
        <button className="btn ghost" type="button" onClick={onBack}>
          ← Back
        </button>
      </div>
      <p className="muted">
        Tap a picture to make it {tutor.name}'s face. Uploaded and AI-made avatars
        all live here — pick the one that helps {profile.name} best.
      </p>

      {/* The gallery */}
      <div className="grid cols-4" style={{ marginTop: 18 }}>
        {images.length === 0 && (
          <div className="faint">No pictures yet. Generate one or upload below!</div>
        )}
        {images.map((img) => (
          <div
            key={img}
            className={`card avatar-tile clickable ${active === img ? 'selected' : ''}`}
            onClick={() => onUpdate(setActiveImage(profile, tutor.id, img))}
          >
            <img className="mini-avatar" src={img} alt="tutor avatar" style={{ width: '100%', height: 120 }} />
            {active === img ? (
              <span className="pill" style={{ background: `${tutor.accent}22`, color: tutor.accent }}>
                ✓ Active
              </span>
            ) : (
              <span className="faint">Tap to use</span>
            )}
            <button
              className="btn ghost small danger"
              type="button"
              style={{ marginTop: 8 }}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(removeFromGallery(profile, tutor.id, img));
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Pre-record lessons as video */}
      {hasDid && (
        <div className="card" style={{ marginTop: 22, borderColor: tutor.accent }}>
          <h2>🎬 Pre-record {tutor.name}'s lessons as video</h2>
          <p className="muted">
            Generate talking-head videos for all of {tutor.name}'s lesson lines, questions,
            and responses once. After that, lessons play <strong>instantly as realistic video</strong> —
            like real-time — with no waiting or extra cost. (~{totalLines} short clips; uses D-ID credits once.)
          </p>
          {!active && (
            <p className="faint">Pick or generate a realistic face picture above first.</p>
          )}
          {!cacheAvailable() && (
            <p style={{ color: 'var(--danger)' }}>
              ⚠️ Video saving isn't available in this build. Make sure you're on v0.12.0+
              (⚙️ Settings shows the version). If you are, let me know and I'll fix it.
            </p>
          )}
          {preProgress ? (
            <div style={{ marginTop: 10 }}>
              <div className="muted">
                Recording {preProgress.done} / {preProgress.total}…
              </div>
              <div style={{ height: 12, borderRadius: 999, background: 'var(--bg-raised)', overflow: 'hidden', marginTop: 6 }}>
                <div
                  style={{
                    width: `${Math.round((preProgress.done / Math.max(1, preProgress.total)) * 100)}%`,
                    height: '100%',
                    background: tutor.accent,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div className="faint" style={{ marginTop: 6, fontSize: '0.8rem' }}>
                “{preProgress.current.slice(0, 50)}…”
              </div>
              <button className="btn ghost small" type="button" style={{ marginTop: 10 }} onClick={() => (cancelRef.current = true)}>
                Stop
              </button>
            </div>
          ) : (
            <div className="row" style={{ marginTop: 10 }}>
              <button
                className="btn"
                type="button"
                disabled={preBusy || !active}
                style={{ background: tutor.accent, opacity: preBusy || !active ? 0.6 : 1 }}
                onClick={startPrerecord}
              >
                {preBusy ? 'Recording…' : `🎬 Pre-record all lessons`}
              </button>
            </div>
          )}
          {preDone && <p className="muted" style={{ marginTop: 10 }}>{preDone}</p>}
          <p className="faint" style={{ marginTop: 8, fontSize: '0.75rem' }}>
            v{APP_VERSION} · video saving: {cacheAvailable() ? '✅ ready' : '❌ unavailable'}
          </p>
        </div>
      )}

      {/* Create / upload controls */}
      <div className="card" style={{ marginTop: 22 }}>
        <h2>🎨 Make a new anime avatar</h2>
        {!hasKey && (
          <p className="muted">
            To generate avatars with AI, add your OpenAI key in <strong>⚙️ Settings</strong> first.
            You can still upload your own pictures below.
          </p>
        )}

        <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip small"
              onClick={() => setPrompt(p.prompt)}
              title={p.prompt}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="prompt">Describe the look</label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. anime tutor, silver hair, kind eyes"
          />
        </div>

        <div className="row">
          <button
            className="btn"
            type="button"
            disabled={busy || !hasKey}
            style={{ background: tutor.accent, opacity: busy || !hasKey ? 0.6 : 1 }}
            onClick={onGenerate}
          >
            {busy ? 'Creating…' : '✨ Generate avatar'}
          </button>
          <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()}>
            ⬆️ Upload a picture
          </button>
        </div>

        {status && (
          <p className="muted" style={{ marginTop: 12 }}>
            {status}
          </p>
        )}
        {hasKey && (
          <p className="faint" style={{ marginTop: 8 }}>
            Note: AI creates original anime-style art from your description. Each image
            costs a few cents on your OpenAI account.
          </p>
        )}
      </div>
    </div>
  );
}
