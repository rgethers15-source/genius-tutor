import { useCallback, useEffect, useRef, useState } from 'react';
import type { Profile } from '../types';
import { ANIME_TUTORS, type AnimeTutor } from '../data/animeTutors';
import { SUBJECTS } from '../data/curriculum';
import { AnimatedAvatar, type AvatarMood } from './AnimatedAvatar';
import { getSpeech, warmUpVoices } from '../engine/speech';
import {
  nextQuestion,
  checkAnswer,
  type TutorTurn,
} from '../engine/tutorBrain';
import { fileToDataUrl } from '../data/image';
import { STUDY_ROOMS, getRoom } from '../data/rooms';
import {
  startFocusMusic,
  stopFocusMusic,
  setVolume,
  setCustomTrack,
} from '../engine/focusMusic';

type Screen = 'roster' | 'lesson';
type UploadKind = 'tutor' | 'room' | 'music';

export function AnimeEnvironment({
  profile,
  onExit,
  onUpdate,
}: {
  profile: Profile;
  onExit: () => void;
  onUpdate: (p: Profile) => void;
}) {
  const [screen, setScreen] = useState<Screen>('roster');
  const [activeTutor, setActiveTutor] = useState<AnimeTutor | null>(null);
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [turn, setTurn] = useState<TutorTurn | null>(null);
  const [bubble, setBubble] = useState('');
  const [locked, setLocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const uploadKindRef = useRef<UploadKind>('tutor');
  const musicFileRef = useRef<HTMLInputElement | null>(null);

  const room = getRoom(profile.activeRoomId);
  const roomImage = profile.roomImages?.[room.id];

  useEffect(() => {
    warmUpVoices();
    return () => getSpeech().stop();
  }, []);

  // Focus music lifecycle — starts/stops with the profile preference.
  useEffect(() => {
    if (profile.customMusic) setCustomTrack(profile.customMusic);
    if (profile.focusMusic) {
      startFocusMusic(profile.musicVolume ?? 0.5);
    } else {
      stopFocusMusic();
    }
    return () => stopFocusMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.focusMusic, profile.customMusic]);

  useEffect(() => {
    setVolume(profile.musicVolume ?? 0.5);
  }, [profile.musicVolume]);

  const speak = useCallback(
    (text: string, tutor: AnimeTutor, nextMood: AvatarMood = 'speaking') => {
      setBubble(text);
      if (profile.autoSpeak === false) {
        setMood(nextMood === 'speaking' ? 'idle' : nextMood);
        return;
      }
      getSpeech().speak(text, {
        voice: tutor.voice,
        onStart: () => setMood(nextMood),
        onEnd: () =>
          setMood((m) => (m === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak]
  );

  function openTutor(tutor: AnimeTutor) {
    setActiveTutor(tutor);
    setScreen('lesson');
    setLocked(false);
    setTurn(null);
    // Greeting first, then first question.
    speak(tutor.greeting, tutor, 'speaking');
    window.setTimeout(() => {
      const q = nextQuestion(tutor.subject);
      setTurn(q);
      speak(q.say, tutor, 'speaking');
    }, 2600);
  }

  function handleChoice(choice: string) {
    if (!activeTutor || !turn || locked) return;
    setLocked(true);
    const result = checkAnswer(turn, choice);
    speak(result.say, activeTutor, result.mood === 'cheer' ? 'cheer' : 'thinking');

    const wasCorrect = result.mood === 'cheer';
    if (wasCorrect) {
      const updated: Profile = {
        ...profile,
        starsEarned: profile.starsEarned + 1,
        progress: {
          ...profile.progress,
          [activeTutor.subject]: (profile.progress[activeTutor.subject] ?? 0) + 1,
        },
      };
      onUpdate(updated);
      // Move to a new question after a short celebration.
      window.setTimeout(() => {
        const q = nextQuestion(activeTutor.subject);
        setTurn(q);
        setLocked(false);
        speak(q.say, activeTutor, 'speaking');
      }, 2800);
    } else {
      // Let them try again on the same question.
      window.setTimeout(() => setLocked(false), 1200);
    }
  }

  function repeat() {
    if (activeTutor && bubble) speak(bubble, activeTutor, 'speaking');
  }

  // --- Image upload (tutors + rooms) ---
  function triggerUpload(kind: UploadKind, id: string) {
    uploadKindRef.current = kind;
    uploadTargetRef.current = id;
    fileInputRef.current?.click();
  }
  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadTargetRef.current;
    const kind = uploadKindRef.current;
    e.target.value = '';
    if (!file || !id) return;
    const dataUrl = await fileToDataUrl(file, kind === 'room' ? 1280 : 640);
    if (kind === 'room') {
      onUpdate({
        ...profile,
        roomImages: { ...(profile.roomImages ?? {}), [id]: dataUrl },
      });
    } else {
      onUpdate({
        ...profile,
        tutorImages: { ...(profile.tutorImages ?? {}), [id]: dataUrl },
      });
    }
  }

  // --- Music upload (audio file) ---
  async function onMusicPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ ...profile, customMusic: reader.result as string, focusMusic: true });
    };
    reader.readAsDataURL(file);
  }

  function setRoom(id: string) {
    onUpdate({ ...profile, activeRoomId: id });
  }
  function toggleMusic() {
    onUpdate({ ...profile, focusMusic: !profile.focusMusic });
  }

  const imageFor = (id: string) => profile.tutorImages?.[id];

  return (
    <div
      className="anime-env room-backdrop"
      style={{
        background: roomImage
          ? `linear-gradient(rgba(20,15,18,0.55), rgba(20,15,18,0.75)), url(${roomImage}) center/cover no-repeat`
          : room.gradient,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFilePicked}
      />
      <input
        ref={musicFileRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={onMusicPicked}
      />

      {/* Room + focus-music control bar */}
      <div className="room-bar">
        <span className="room-now">
          {room.emoji} {room.name}
        </span>
        <div className="room-rooms">
          {STUDY_ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`chip small ${r.id === room.id ? 'on' : ''}`}
              title={r.vibe}
              onClick={() => setRoom(r.id)}
            >
              {r.emoji}
            </button>
          ))}
          <button
            type="button"
            className="chip small"
            title="Upload your own room picture"
            onClick={() => triggerUpload('room', room.id)}
          >
            ⬆️ Room
          </button>
        </div>
        <div className="room-music">
          <button
            type="button"
            className={`chip small ${profile.focusMusic ? 'on' : ''}`}
            onClick={toggleMusic}
            title="Chill lofi focus music"
          >
            {profile.focusMusic ? '🎵 Music On' : '🔇 Music Off'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={profile.musicVolume ?? 0.5}
            onChange={(e) => onUpdate({ ...profile, musicVolume: Number(e.target.value) })}
            title="Music volume"
            style={{ width: 90 }}
          />
          <button
            type="button"
            className="chip small"
            title="Upload your own focus track"
            onClick={() => musicFileRef.current?.click()}
          >
            ⬆️ Track
          </button>
        </div>
      </div>

      <div className="content">
        {screen === 'roster' && (
          <div className="center">
            <div className="row between">
              <h1 className="anime-title">
                <span className="sparkle">✨</span> {profile.name}'s Anime Academy
              </h1>
              <button className="btn ghost" type="button" onClick={onExit}>
                ← Back
              </button>
            </div>
            <p className="muted" style={{ fontSize: '1.15rem' }}>
              Pick a tutor to start. Tap a card to learn — they will talk to you! 🎧
            </p>

            <div className="grid cols-3" style={{ marginTop: 24 }}>
              {ANIME_TUTORS.map((t) => {
                const subjectLabel =
                  SUBJECTS.find((s) => s.value === t.subject)?.label ?? t.subject;
                const img = imageFor(t.id);
                return (
                  <div key={t.id} className="card subject-card clickable" style={{ borderColor: `${t.accent}55` }}>
                    <div onClick={() => openTutor(t)}>
                      {img ? (
                        <img className="mini-avatar" src={img} alt={t.name} />
                      ) : (
                        <div className="mini-avatar fallback">{t.fallbackGlyph}</div>
                      )}
                      <div className="avatar-name" style={{ fontSize: '1.2rem' }}>{t.name}</div>
                      <div className="pill" style={{ background: `${t.accent}22`, color: t.accent }}>
                        {subjectLabel}
                      </div>
                      <div className="avatar-personality">{t.tagline}</div>
                    </div>
                    <button
                      className="btn ghost small"
                      type="button"
                      style={{ marginTop: 12 }}
                      onClick={() => triggerUpload('tutor', t.id)}
                    >
                      {img ? '🔄 Change picture' : '⬆️ Add picture'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <strong>💡 Tip for grown-ups:</strong>
              <p className="muted" style={{ margin: '8px 0 0' }}>
                Click <em>Add picture</em> on each tutor to load the anime character
                image you chose — the tutor then appears and talks during lessons.
                Use the top bar to pick a cozy <em>study room</em> (or upload your own
                lofi loft/bedroom photo) and turn on <em>chill focus music</em>.
              </p>
            </div>
          </div>
        )}

        {screen === 'lesson' && activeTutor && (
          <div className="center">
            <div className="row between" style={{ marginBottom: 16 }}>
              <div className="row">
                <span className="stars">⭐ {profile.starsEarned}</span>
              </div>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  getSpeech().stop();
                  setScreen('roster');
                }}
              >
                ← Choose another tutor
              </button>
            </div>

            <div className="lesson-stage">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <AnimatedAvatar
                  imageSrc={imageFor(activeTutor.id)}
                  mood={mood}
                  accent={activeTutor.accent}
                  size={280}
                  fallbackGlyph={activeTutor.fallbackGlyph}
                />
                <strong style={{ fontSize: '1.3rem', color: activeTutor.accent }}>
                  {activeTutor.name}
                </strong>
              </div>

              <div>
                <div className="tutor-speech dyslexia">
                  {bubble || '…'}
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="read-btn" type="button" onClick={repeat}>
                    🔊 Say it again
                  </button>
                </div>

                {turn?.choices && (
                  <div className="grid cols-3" style={{ marginTop: 20 }}>
                    {turn.choices.map((c) => (
                      <button
                        key={c}
                        className="btn big-btn"
                        type="button"
                        disabled={locked}
                        style={{ background: activeTutor.accent, opacity: locked ? 0.6 : 1 }}
                        onClick={() => handleChoice(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
