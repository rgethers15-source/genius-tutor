import { useCallback, useEffect, useRef, useState } from 'react';
import type { Profile } from '../types';
import { ANIME_TUTORS, effectiveVoice, type AnimeTutor } from '../data/animeTutors';
import { SUBJECTS } from '../data/curriculum';
import { type AvatarMood } from './AnimatedAvatar';
import {
  getSpeech,
  warmUpVoices,
  setSpeech,
  openAiSpeechProvider,
  elevenLabsSpeechProvider,
  webSpeechProvider,
} from '../engine/speech';
import {
  nextQuestion,
  checkAnswer,
  type TutorTurn,
} from '../engine/tutorBrain';
import { fileToDataUrl } from '../data/image';
import { STUDY_ROOMS, getRoom } from '../data/rooms';
import { RoomScene } from './RoomScene';
import { TutorStage } from './TutorStage';
import { getCachedVideo } from '../data/videoCache';
import {
  startFocusMusic,
  stopFocusMusic,
  setVolume,
  setCustomTrack,
  nextTrack,
  currentTitle,
  onTrackChange,
} from '../engine/focusMusic';
import { LessonPlayer } from './LessonPlayer';
import { HomeworkHelp } from './HomeworkHelp';
import { TutorGallery } from './TutorGallery';
import { activeImageFor } from '../data/gallery';
import { recordAnswer, recordLessonComplete, recordHomework, recordReading } from '../data/stats';
import { APP_VERSION, RELEASES_URL, checkForUpdate, type UpdateStatus } from '../version';
import { checkNewBadges, type Badge } from '../data/badges';
import { generateQuestions } from '../engine/questionGen';
import { BadgeShelf } from './BadgeShelf';
import { ReadingPractice } from './ReadingPractice';
import {
  setVideoAvatar,
  didVideoProvider,
  offlineVideoProvider,
  getVideoAvatar,
} from '../engine/videoAvatar';
import {
  setHomeworkAi,
  openAiHomeworkProvider,
  offlineHomeworkProvider,
} from '../engine/homeworkAi';

type Screen = 'roster' | 'activity' | 'lessons' | 'homework' | 'settings' | 'gallery' | 'reading' | 'badges';
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

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [didKeyInput, setDidKeyInput] = useState('');
  const [elevenKeyInput, setElevenKeyInput] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);

  // Wrap updates so newly-earned badges are recorded + celebrated.
  function update_(next: Profile) {
    const { newly, all } = checkNewBadges(next);
    const withBadges = { ...next, earnedBadges: all };
    onUpdate(withBadges);
    if (newly.length > 0) {
      setBadgeToast(newly[0]);
      window.setTimeout(() => setBadgeToast(null), 4000);
    }
  }

  const room = getRoom(profile.activeRoomId);
  const roomImage = profile.roomImages?.[room.id];

  useEffect(() => {
    warmUpVoices();
    return () => getSpeech().stop();
  }, []);

  // Smart Homework Help uses OpenAI when its key is present.
  useEffect(() => {
    if (profile.openAiKey && profile.openAiKey.trim().length > 10) {
      setHomeworkAi(openAiHomeworkProvider(profile.openAiKey.trim()));
    } else {
      setHomeworkAi(offlineHomeworkProvider);
    }
  }, [profile.openAiKey]);

  // Voice priority: ElevenLabs (most natural) > OpenAI TTS > built-in.
  useEffect(() => {
    const useHuman = profile.humanVoice !== false;
    const eleven = profile.elevenLabsKey?.trim();
    const openai = profile.openAiKey?.trim();
    if (useHuman && eleven && eleven.length > 10) {
      setSpeech(elevenLabsSpeechProvider(eleven));
    } else if (useHuman && openai && openai.length > 10) {
      setSpeech(openAiSpeechProvider(openai));
    } else {
      setSpeech(webSpeechProvider);
    }
  }, [profile.elevenLabsKey, profile.openAiKey, profile.humanVoice]);

  // Activate talking-head video avatars when a D-ID key is present.
  useEffect(() => {
    if (profile.didKey && profile.didKey.trim().length > 10) {
      setVideoAvatar(didVideoProvider(profile.didKey.trim()));
    } else {
      setVideoAvatar(offlineVideoProvider);
    }
  }, [profile.didKey]);

  const [nowPlaying, setNowPlaying] = useState(currentTitle());

  // Focus music lifecycle — starts/stops with the profile preference.
  useEffect(() => {
    onTrackChange(() => setNowPlaying(currentTitle()));
    if (profile.customMusic) setCustomTrack(profile.customMusic);
    if (profile.focusMusic) {
      startFocusMusic(profile.musicVolume ?? 0.5);
    } else {
      stopFocusMusic();
    }
    return () => {
      stopFocusMusic();
      onTrackChange(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.focusMusic, profile.customMusic]);

  useEffect(() => {
    setVolume(profile.musicVolume ?? 0.5);
  }, [profile.musicVolume]);

  const speak = useCallback(
    (text: string, tutor: AnimeTutor, nextMood: AvatarMood = 'speaking') => {
      setBubble(text);
      // Stop any TTS already playing so voices never overlap.
      getSpeech().stop();
      if (profile.autoSpeak === false) {
        setMood(nextMood === 'speaking' ? 'idle' : nextMood);
        return;
      }
      // If a talking-head VIDEO will play for this exact line, the video
      // carries its own audio — so DON'T also speak via TTS (prevents the
      // double-voice bug). Only speak via TTS when there's no cached video.
      const videoOn = !!profile.didKey && !!profile.videoMode;
      if (videoOn) {
        getCachedVideo(tutor.id, text).then((url) => {
          if (url) {
            // Video (with its own voice) will play; stay silent on TTS.
            setMood(nextMood);
            return;
          }
          getSpeech().speak(text, {
            voice: effectiveVoice(tutor, profile.tutorVoices?.[tutor.id]),
            onStart: () => setMood(nextMood),
            onEnd: () => setMood((m) => (m === 'cheer' ? 'happy' : 'idle')),
          });
        });
        return;
      }
      getSpeech().speak(text, {
        voice: effectiveVoice(tutor, profile.tutorVoices?.[tutor.id]),
        onStart: () => setMood(nextMood),
        onEnd: () => setMood((m) => (m === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak, profile.didKey, profile.videoMode, profile.tutorVoices]
  );

  function openTutor(tutor: AnimeTutor) {
    setActiveTutor(tutor);
    setScreen('activity');
    setLocked(false);
    setTurn(null);
    speak(tutor.greeting, tutor, 'speaking');
  }

  function startQuickPractice() {
    if (!activeTutor) return;
    setTurn(null);
    const q = nextQuestion(activeTutor.subject);
    setTurn(q);
    speak(q.say, activeTutor, 'speaking');
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

  const [videoError, setVideoError] = useState('');
  const [videoDebug, setVideoDebug] = useState<string[]>([]);

  async function speakOnVideo(textOverride?: string) {
    if (!activeTutor) return;
    const line = textOverride ?? bubble;
    if (!line) return;
    const img = imageFor(activeTutor.id);
    if (!img) {
      setVideoError('Pick or generate a realistic face avatar first (not the emoji).');
      return;
    }
    getSpeech().stop(); // ensure TTS isn't also playing — video has its own audio
    setVideoBusy(true);
    setVideoError('');
    setVideoDebug([]);
    setVideoUrl(null);
    const res = await getVideoAvatar().speakVideo(img, line);
    setVideoDebug(res.debug ?? []);
    if (res.ok && res.videoUrl) {
      setVideoUrl(res.videoUrl);
    } else {
      setVideoError(res.error ?? 'Could not make the video.');
    }
    setVideoBusy(false);
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

  const imageFor = (id: string) => activeImageFor(profile, id);

  return (
    <div
      className="anime-env room-backdrop"
      style={{
        background: roomImage
          ? `linear-gradient(rgba(20,15,18,0.55), rgba(20,15,18,0.75)), url(${roomImage}) center/cover no-repeat`
          : room.gradient,
      }}
    >
      {/* Animated scene: use the active tutor's own scene while teaching,
          else the selected room's scene. Hidden if a custom room photo is set. */}
      {!roomImage && (
        <RoomScene
          scene={
            activeTutor && screen !== 'roster' && screen !== 'settings'
              ? activeTutor.scene
              : room.scene
          }
        />
      )}

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
          {profile.focusMusic && (
            <>
              <span className="faint" style={{ fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ♪ {nowPlaying}
              </span>
              <button
                type="button"
                className="chip small"
                title="Next track"
                onClick={() => nextTrack()}
              >
                ⏭️
              </button>
            </>
          )}
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

      {badgeToast && (
        <div className="badge-toast">
          <span className="badge-toast-emoji">{badgeToast.emoji}</span>
          <div>
            <strong>New Trophy! {badgeToast.name}</strong>
            <div className="faint">{badgeToast.description}</div>
          </div>
        </div>
      )}

      <div className="content">
        {screen === 'roster' && (
          <div className="center">
            <div className="row between">
              <h1 className="anime-title">
                <span className="sparkle">✨</span> {profile.name}'s Anime Academy
              </h1>
              <div className="row">
                <button className="btn small" type="button" onClick={() => setScreen('settings')}>
                  ⚙️ Settings
                </button>
                <button className="btn ghost" type="button" onClick={onExit}>
                  ← Back
                </button>
              </div>
            </div>

            {!profile.openAiKey && (
              <div className="card" style={{ borderColor: 'var(--accent)', marginTop: 8 }}>
                <div className="row between">
                  <span>
                    🧠 <strong>Turn on Smart Homework Help</strong> — add your OpenAI key in Settings.
                  </span>
                  <button className="btn small" type="button" onClick={() => setScreen('settings')}>
                    Open Settings
                  </button>
                </div>
              </div>
            )}
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
                      onClick={() => {
                        setActiveTutor(t);
                        setScreen('gallery');
                      }}
                    >
                      🖼️ {img ? 'Gallery' : 'Add / Generate'}
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

        {/* Tutor hub: choose Lessons, Quick Practice, or Homework Help */}
        {screen === 'activity' && activeTutor && (
          <div className="center">
            <div className="row between" style={{ marginBottom: 16 }}>
              <span className="stars">⭐ {profile.starsEarned}</span>
              <div className="row">
                <button className="btn ghost small" type="button" onClick={() => setScreen('settings')}>
                  ⚙️ Settings
                </button>
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
            </div>

            <div className="lesson-stage">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    autoPlay
                    controls
                    playsInline
                    onEnded={() => setVideoUrl(null)}
                    onError={() =>
                      setVideoError('The video was created but failed to play. Tap the link below to open it.')
                    }
                    style={{ width: 400, borderRadius: 24, border: `3px solid ${activeTutor.accent}` }}
                  />
                ) : (
                  <TutorStage
                    tutor={activeTutor}
                    imageSrc={imageFor(activeTutor.id)}
                    mood={videoBusy ? 'thinking' : mood}
                    line={bubble}
                    size={400}
                    videoEnabled={!!profile.didKey && !!profile.videoMode}
                  />
                )}
                <strong style={{ fontSize: '1.3rem', color: activeTutor.accent }}>
                  {activeTutor.name}
                  {videoBusy && <span className="faint"> — making video…</span>}
                </strong>
                {videoUrl && (
                  <a className="read-btn" href={videoUrl} target="_blank" rel="noreferrer">
                    ▶️ Open video
                  </a>
                )}
                {videoError && (
                  <span className="faint" style={{ color: 'var(--danger)', maxWidth: 380, textAlign: 'center' }}>
                    {videoError}
                  </span>
                )}
                {videoDebug.length > 0 && (
                  <details style={{ maxWidth: 380, fontSize: '0.78rem' }}>
                    <summary className="faint" style={{ cursor: 'pointer' }}>Video details (for troubleshooting)</summary>
                    <ul style={{ margin: '6px 0', paddingLeft: 18 }}>
                      {videoDebug.map((d, i) => (
                        <li key={i} className="faint">{d}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div>
                {profile.didKey && !imageFor(activeTutor.id) && (
                  <div className="card" style={{ marginBottom: 12, borderColor: 'var(--accent)' }}>
                    🎬 <strong>Video is On</strong> — but {activeTutor.name} has no face yet.
                    Tap <em>🖼️ Change Avatar</em> and Generate/Upload a realistic photo to see the talking video.
                  </div>
                )}
                <div className="tutor-speech dyslexia">{bubble || '…'}</div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="read-btn" type="button" onClick={repeat}>
                    🔊 Say it again
                  </button>
                  {profile.didKey && (
                    <button
                      className="read-btn"
                      type="button"
                      disabled={videoBusy}
                      onClick={() => {
                        if (!imageFor(activeTutor.id)) {
                          setVideoError(
                            `${activeTutor.name} needs a face picture first. Tap "🖼️ Change Avatar" below, then Generate or Upload a realistic photo.`
                          );
                          return;
                        }
                        speakOnVideo();
                      }}
                    >
                      {videoBusy ? '🎬 Making video…' : '🎬 Speak on video'}
                    </button>
                  )}
                </div>
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', borderRadius: 14, marginTop: 12, border: '1px solid var(--border)' }}
                  />
                )}

                {turn?.choices ? (
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
                ) : (
                  <div className="grid cols-2" style={{ marginTop: 20 }}>
                    <button
                      className="btn big-btn"
                      type="button"
                      style={{ background: activeTutor.accent }}
                      onClick={() => {
                        getSpeech().stop();
                        setScreen('lessons');
                      }}
                    >
                      📚 Lessons & Tests
                    </button>
                    <button
                      className="btn big-btn"
                      type="button"
                      style={{ background: activeTutor.accent }}
                      onClick={() => {
                        getSpeech().stop();
                        setScreen('homework');
                      }}
                    >
                      📝 Homework Help
                    </button>
                    <button
                      className="btn big-btn ghost"
                      type="button"
                      onClick={startQuickPractice}
                    >
                      ⚡ Quick Practice
                    </button>
                    <button
                      className="btn big-btn"
                      type="button"
                      style={{ background: activeTutor.accent }}
                      onClick={() => {
                        getSpeech().stop();
                        setScreen('reading');
                      }}
                    >
                      🎤 Read Out Loud
                    </button>
                    <button
                      className="btn big-btn ghost"
                      type="button"
                      onClick={() => setScreen('badges')}
                    >
                      🏆 My Trophies
                    </button>
                    <button
                      className="btn big-btn ghost"
                      type="button"
                      onClick={() => {
                        getSpeech().stop();
                        setScreen('gallery');
                      }}
                    >
                      🖼️ Change Avatar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lessons + quizzes + tests */}
        {screen === 'lessons' && activeTutor && (
          <LessonPlayer
            tutor={activeTutor}
            imageSrc={imageFor(activeTutor.id)}
            autoSpeak={profile.autoSpeak !== false}
            videoEnabled={!!profile.didKey && !!profile.videoMode}
            voiceOverride={profile.tutorVoices?.[activeTutor.id]}
            onEarnStar={() => { /* stars handled in onRecordAnswer to avoid double state writes */ }}
            onRecordAnswer={(correct, kind) => {
              let next = recordAnswer(profile, activeTutor.subject, correct, kind);
              if (correct) {
                next = {
                  ...next,
                  starsEarned: next.starsEarned + 1,
                  progress: {
                    ...next.progress,
                    [activeTutor.subject]: (next.progress[activeTutor.subject] ?? 0) + 1,
                  },
                };
              }
              update_(next);
            }}
            onLessonComplete={(id, title) =>
              update_(recordLessonComplete(profile, activeTutor.subject, id, title))
            }
            onGenerateQuestions={
              profile.openAiKey && profile.openAiKey.trim().length > 10
                ? (count) =>
                    generateQuestions(
                      profile.openAiKey!,
                      activeTutor.subject,
                      profile.reasoningLevel ?? '3',
                      count
                    )
                : undefined
            }
            onBack={() => setScreen('activity')}
          />
        )}

        {/* Homework help (smart with API key) */}
        {screen === 'homework' && activeTutor && (
          <HomeworkHelp
            tutor={activeTutor}
            profile={profile}
            onBack={() => setScreen('activity')}
            onUsed={() => update_(recordHomework(profile, activeTutor.subject))}
          />
        )}

        {/* Avatar gallery: upload + AI-generate + pick active */}
        {screen === 'gallery' && activeTutor && (
          <TutorGallery
            tutor={activeTutor}
            profile={profile}
            onUpdate={onUpdate}
            onBack={() => setScreen(activeTutor ? 'roster' : 'activity')}
          />
        )}

        {/* Reading out loud (microphone practice) */}
        {screen === 'reading' && activeTutor && (
          <ReadingPractice
            tutor={activeTutor}
            profile={profile}
            onEarnStar={() => {
              const recorded = recordReading(profile, activeTutor.subject);
              update_({ ...recorded, starsEarned: recorded.starsEarned + 1 });
            }}
            onBack={() => setScreen('activity')}
          />
        )}

        {/* Trophy shelf / badges */}
        {screen === 'badges' && (
          <BadgeShelf
            profile={profile}
            accent={activeTutor?.accent}
            onBack={() => setScreen(activeTutor ? 'activity' : 'roster')}
          />
        )}

        {/* Settings: OpenAI key for smart mode */}
        {screen === 'settings' && (
          <div className="center">
            <div className="row between" style={{ marginBottom: 16 }}>
              <h1 className="anime-title">⚙️ Settings</h1>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setScreen(activeTutor ? 'activity' : 'roster')}
              >
                ← Back
              </button>
            </div>

            <div className="card">
              <h2>🧠 Smart Homework Help (OpenAI)</h2>
              <p className="muted">
                Paste your OpenAI API key to let the tutor actually read uploaded
                homework and explain it in simple steps at {profile.name}'s level.
                The key is stored locally on this device only.
              </p>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="key">OpenAI API Key</label>
                <input
                  id="key"
                  type="password"
                  placeholder={profile.openAiKey ? '•••••• (saved)' : 'sk-...'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
              </div>
              <div className="row">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    onUpdate({ ...profile, openAiKey: apiKeyInput.trim() });
                    setApiKeyInput('');
                  }}
                >
                  Save key
                </button>
                {profile.openAiKey && (
                  <button
                    className="btn ghost danger"
                    type="button"
                    onClick={() => onUpdate({ ...profile, openAiKey: undefined })}
                  >
                    Remove key
                  </button>
                )}
                <span className={`pill`} style={{ marginLeft: 8 }}>
                  {profile.openAiKey ? '🧠 Smart mode ON' : 'Coaching mode (no key)'}
                </span>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2>🎬 Talking-Head Video Avatars (D-ID)</h2>
              <p className="muted">
                Optional: paste a D-ID API key to make the tutor's face speak like a
                real video (lifelike lip movement). This is a paid service with a
                per-video cost. Without it, the tutor still talks with the free
                animated portrait. Key stored locally only.
              </p>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="didkey">D-ID API Key</label>
                <input
                  id="didkey"
                  type="password"
                  placeholder={profile.didKey ? '•••••• (saved)' : 'base64 key from D-ID'}
                  value={didKeyInput}
                  onChange={(e) => setDidKeyInput(e.target.value)}
                />
              </div>
              <div className="row">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    onUpdate({ ...profile, didKey: didKeyInput.trim() });
                    setDidKeyInput('');
                  }}
                >
                  Save key
                </button>
                {profile.didKey && (
                  <button
                    className="btn ghost danger"
                    type="button"
                    onClick={() => onUpdate({ ...profile, didKey: undefined })}
                  >
                    Remove key
                  </button>
                )}
                <span className="pill" style={{ marginLeft: 8 }}>
                  {profile.didKey ? '🎬 Key saved' : 'Animated portrait (free)'}
                </span>
              </div>
              {profile.didKey && (
                <div className="toggle-row" style={{ marginTop: 12 }}>
                  <span>
                    Talking-head VIDEO when speaking (realistic mouth)
                    <span className="faint"> — needs a PAID D-ID API plan; lessons still work with the voice + avatar if off</span>
                  </span>
                  <button
                    type="button"
                    className={`chip ${profile.videoMode ? 'on' : ''}`}
                    onClick={() => onUpdate({ ...profile, videoMode: !profile.videoMode })}
                  >
                    {profile.videoMode ? 'On' : 'Off'}
                  </button>
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2>🗣️ Best Voices (ElevenLabs)</h2>
              <p className="muted">
                Optional: paste your ElevenLabs API key for the most natural,
                human-sounding tutor voices. If set, it's used first (before OpenAI).
                Key stored locally only.
              </p>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="elevenkey">ElevenLabs API Key</label>
                <input
                  id="elevenkey"
                  type="password"
                  placeholder={profile.elevenLabsKey ? '•••••• (saved)' : 'your ElevenLabs key'}
                  value={elevenKeyInput}
                  onChange={(e) => setElevenKeyInput(e.target.value)}
                />
              </div>
              <div className="row">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    onUpdate({ ...profile, elevenLabsKey: elevenKeyInput.trim() });
                    setElevenKeyInput('');
                  }}
                >
                  Save key
                </button>
                {profile.elevenLabsKey && (
                  <button
                    className="btn ghost danger"
                    type="button"
                    onClick={() => onUpdate({ ...profile, elevenLabsKey: undefined })}
                  >
                    Remove key
                  </button>
                )}
                <span className="pill" style={{ marginLeft: 8 }}>
                  {profile.elevenLabsKey
                    ? '🗣️ ElevenLabs voices ON'
                    : profile.openAiKey
                      ? 'Using OpenAI voice'
                      : 'Using built-in voice'}
                </span>
              </div>

              {/* Per-tutor voice override */}
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <strong>🎚️ Each tutor's voice (optional)</strong>
                <p className="faint" style={{ margin: '4px 0 10px' }}>
                  The tutors use warm African American male voices by default. To use a
                  specific voice, add it to your ElevenLabs account, copy its Voice ID,
                  and paste it here. Tap ▶️ to hear it.
                </p>
                {ANIME_TUTORS.map((t) => (
                  <div key={t.id} className="row" style={{ marginBottom: 8, gap: 8 }}>
                    <span style={{ width: 70, color: t.accent, fontWeight: 700 }}>{t.name}</span>
                    <input
                      type="text"
                      placeholder={`ElevenLabs voice ID (default set)`}
                      defaultValue={profile.tutorVoices?.[t.id] ?? ''}
                      onBlur={(e) =>
                        onUpdate({
                          ...profile,
                          tutorVoices: { ...(profile.tutorVoices ?? {}), [t.id]: e.target.value.trim() },
                        })
                      }
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn ghost small"
                      type="button"
                      onClick={() =>
                        getSpeech().speak(`Hi Madeline, I'm ${t.name}. This is my voice.`, {
                          voice: effectiveVoice(t, profile.tutorVoices?.[t.id]),
                        })
                      }
                    >
                      ▶️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2>🔊 Read aloud</h2>
              <div className="toggle-row">
                <span>Tutors talk out loud</span>
                <button
                  type="button"
                  className={`chip ${profile.autoSpeak !== false ? 'on' : ''}`}
                  onClick={() => onUpdate({ ...profile, autoSpeak: !(profile.autoSpeak !== false) })}
                >
                  {profile.autoSpeak !== false ? 'On' : 'Off'}
                </button>
              </div>
              {(() => {
                const hasVoiceKey = !!(profile.elevenLabsKey || profile.openAiKey);
                return (
                  <>
                    <div className="toggle-row">
                      <span>
                        Natural human voice
                        {!hasVoiceKey && <span className="faint"> — needs ElevenLabs or OpenAI key</span>}
                      </span>
                      <button
                        type="button"
                        className={`chip ${profile.humanVoice !== false && hasVoiceKey ? 'on' : ''}`}
                        disabled={!hasVoiceKey}
                        onClick={() => onUpdate({ ...profile, humanVoice: !(profile.humanVoice !== false) })}
                      >
                        {profile.humanVoice !== false ? 'On' : 'Off'}
                      </button>
                    </div>
                    <p className="faint" style={{ marginTop: 8 }}>
                      Voice quality order: ElevenLabs (best) → OpenAI → built-in (robotic).
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h2>⬆️ App Version & Updates</h2>
              <p className="muted">
                You are running <strong>Genius Tutor v{APP_VERSION}</strong>.
                Updates are installed by downloading the newest file from the
                releases page (your profiles and progress are kept).
              </p>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  type="button"
                  disabled={checking}
                  onClick={async () => {
                    setChecking(true);
                    setUpdate(await checkForUpdate());
                    setChecking(false);
                  }}
                >
                  {checking ? 'Checking…' : 'Check for updates'}
                </button>
                <a className="btn ghost" href={RELEASES_URL} target="_blank" rel="noreferrer">
                  Open downloads page ↗
                </a>
              </div>
              {update && (
                <p className="muted" style={{ marginTop: 10 }}>
                  {update.error
                    ? `Could not check: ${update.error}`
                    : update.upToDate
                      ? '✅ You are on the latest version!'
                      : `🎉 A newer version (v${update.latest}) is available — open the downloads page to get it.`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
