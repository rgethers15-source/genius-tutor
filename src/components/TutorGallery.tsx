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

  const hasKey = !!profile.openAiKey && profile.openAiKey.trim().length > 10;

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
