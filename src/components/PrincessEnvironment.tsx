import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { PRINCESS_TUTORS } from '../data/princessTutors';
import { effectiveVoice, type AnimeTutor } from '../data/animeTutors';
import { SUBJECTS } from '../data/curriculum';
import { TutorStage } from './TutorStage';
import { RoomScene } from './RoomScene';
import { type AvatarMood } from './AnimatedAvatar';
import { getSpeech, warmUpVoices, setSpeech, elevenLabsSpeechProvider, openAiSpeechProvider, webSpeechProvider } from '../engine/speech';
import { activeImageFor } from '../data/gallery';
import { LessonPlayer } from './LessonPlayer';
import { TutorGallery } from './TutorGallery';
import { KidActivities, type KidMode } from './KidActivities';
import { recordAnswer, recordLessonComplete } from '../data/stats';
import {
  startFocusMusic, stopFocusMusic, setVolume, nextTrack, currentTitle, onTrackChange,
} from '../engine/focusMusic';

type Screen = 'home' | 'tutor' | 'lessons' | 'kid' | 'gallery';

export function PrincessEnvironment({
  profile,
  onExit,
  onUpdate,
}: {
  profile: Profile;
  onExit: () => void;
  onUpdate: (p: Profile) => void;
}) {
  const [screen, setScreen] = useState<Screen>('home');
  const [tutor, setTutor] = useState<AnimeTutor | null>(null);
  const [kidMode, setKidMode] = useState<KidMode>('learnRead');
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [bubble, setBubble] = useState('');
  const [nowPlaying, setNowPlaying] = useState(currentTitle());

  useEffect(() => {
    warmUpVoices();
    return () => getSpeech().stop();
  }, []);

  // Voice provider priority (same as anime env).
  useEffect(() => {
    const useHuman = profile.humanVoice !== false;
    const eleven = profile.elevenLabsKey?.trim();
    const openai = profile.openAiKey?.trim();
    if (useHuman && eleven && eleven.length > 10) setSpeech(elevenLabsSpeechProvider(eleven));
    else if (useHuman && openai && openai.length > 10) setSpeech(openAiSpeechProvider(openai));
    else setSpeech(webSpeechProvider);
  }, [profile.elevenLabsKey, profile.openAiKey, profile.humanVoice]);

  // Focus music.
  useEffect(() => {
    onTrackChange(() => setNowPlaying(currentTitle()));
    if (profile.focusMusic) startFocusMusic(profile.musicVolume ?? 0.5);
    else stopFocusMusic();
    return () => { stopFocusMusic(); onTrackChange(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.focusMusic]);
  useEffect(() => { setVolume(profile.musicVolume ?? 0.5); }, [profile.musicVolume]);

  const speak = useCallback(
    (text: string, t: AnimeTutor, m: AvatarMood = 'speaking') => {
      setBubble(text);
      getSpeech().stop();
      if (profile.autoSpeak === false) { setMood(m === 'speaking' ? 'idle' : m); return; }
      getSpeech().speak(text, {
        voice: effectiveVoice(t, profile.tutorVoices?.[t.id]),
        onStart: () => setMood(m),
        onEnd: () => setMood((c) => (c === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak, profile.tutorVoices]
  );

  function openTutor(t: AnimeTutor) {
    setTutor(t);
    setScreen('tutor');
    speak(t.greeting, t, 'happy');
  }

  const earnStar = (subject: string) =>
    onUpdate({
      ...recordAnswer(profile, subject as never, true, 'quiz'),
      starsEarned: profile.starsEarned + 1,
    });

  const img = (t: AnimeTutor) => activeImageFor(profile, t.id);

  return (
    <div className="anime-env" style={{ position: 'relative', minHeight: '100%' }}>
      <RoomScene scene="princess" />

      {/* Simple top bar */}
      <div className="room-bar">
        <span className="room-now">💎 {profile.name}'s Diamond Wonderland</span>
        <div className="room-music">
          <button type="button" className={`chip small ${profile.focusMusic ? 'on' : ''}`}
            onClick={() => onUpdate({ ...profile, focusMusic: !profile.focusMusic })}>
            {profile.focusMusic ? '🎵 Music On' : '🔇 Music Off'}
          </button>
          {profile.focusMusic && (
            <>
              <span className="faint" style={{ fontSize: '0.8rem' }}>♪ {nowPlaying}</span>
              <button type="button" className="chip small" onClick={() => nextTrack()}>⏭️</button>
            </>
          )}
        </div>
      </div>

      <div className="content">
        {/* ---------------- HOME: pick a princess ---------------- */}
        {screen === 'home' && (
          <div className="center">
            <div className="row between">
              <h1 className="princess-title" style={{ fontSize: '2.2rem' }}>
                ✨👑 {profile.name}'s Princess Academy 👑✨
              </h1>
              <button className="btn ghost" type="button" onClick={onExit}>← Back</button>
            </div>
            <p className="dyslexia" style={{ fontSize: '1.3rem' }}>
              Tap a princess to start learning, beautiful! 💎
            </p>
            <div className="grid cols-4" style={{ marginTop: 20 }}>
              {PRINCESS_TUTORS.map((t) => {
                const label = SUBJECTS.find((s) => s.value === t.subject)?.label ?? t.subject;
                const im = img(t);
                return (
                  <div key={t.id} className="kid-tile" style={{ borderColor: `${t.accent}66` }} onClick={() => openTutor(t)}>
                    {im ? (
                      <img src={im} alt={t.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 14, marginBottom: 8 }} />
                    ) : (
                      <span className="kid-emoji">{t.fallbackGlyph}</span>
                    )}
                    <span className="kid-label" style={{ fontSize: '1.1rem', color: t.accent }}>{t.name}</span>
                    <div className="faint">{label}</div>
                  </div>
                );
              })}
            </div>
            <p className="faint" style={{ marginTop: 16 }}>
              💡 Grown-ups: tap a princess, then "👗 Change Picture" to add or AI-generate her Disney/Pixar-style look.
            </p>
          </div>
        )}

        {/* ---------------- TUTOR HUB ---------------- */}
        {screen === 'tutor' && tutor && (
          <div className="center">
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="stars" style={{ fontSize: '1.4rem' }}>⭐ {profile.starsEarned}</span>
              <button className="btn ghost" type="button" onClick={() => { getSpeech().stop(); setScreen('home'); }}>← Princesses</button>
            </div>
            <div className="lesson-stage">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <TutorStage tutor={tutor} imageSrc={img(tutor)} mood={mood} line={bubble} size={360}
                  videoEnabled={!!profile.didKey && !!profile.videoMode} />
                <strong style={{ color: tutor.accent, fontSize: '1.3rem' }}>{tutor.name}</strong>
              </div>
              <div>
                <div className="tutor-speech dyslexia">{bubble || '…'}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="read-btn" type="button" onClick={() => bubble && speak(bubble, tutor)}>🔊 Say it again</button>
                </div>
                <div className="grid cols-2" style={{ marginTop: 16, gap: 12 }}>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setScreen('lessons'); }}>📚 Lessons & Test</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('learnRead'); setScreen('kid'); }}>📖 Learn to Read</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('phonics'); setScreen('kid'); }}>🗣️ Phonics</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('montessori'); setScreen('kid'); }}>🧩 Montessori</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('games'); setScreen('kid'); }}>🎮 Games</button>
                  <button className="btn big-btn ghost" onClick={() => { getSpeech().stop(); setScreen('gallery'); }}>👗 Change Picture</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- LESSONS (1st grade) ---------------- */}
        {screen === 'lessons' && tutor && (
          <LessonPlayer
            tutor={tutor}
            imageSrc={img(tutor)}
            autoSpeak={profile.autoSpeak !== false}
            videoEnabled={!!profile.didKey && !!profile.videoMode}
            voiceOverride={profile.tutorVoices?.[tutor.id]}
            gradeBand="1"
            onEarnStar={() => earnStar(tutor.subject)}
            onRecordAnswer={(correct, kind) => onUpdate(recordAnswer(profile, tutor.subject, correct, kind))}
            onLessonComplete={(id, title) => onUpdate(recordLessonComplete(profile, tutor.subject, id, title))}
            onBack={() => setScreen('tutor')}
          />
        )}

        {/* ---------------- KID ACTIVITIES ---------------- */}
        {screen === 'kid' && tutor && (
          <KidActivities
            mode={kidMode}
            tutor={tutor}
            profile={profile}
            onEarnStar={() => earnStar(tutor.subject)}
            onBack={() => setScreen('tutor')}
          />
        )}

        {/* ---------------- GALLERY ---------------- */}
        {screen === 'gallery' && tutor && (
          <TutorGallery
            tutor={tutor}
            profile={profile}
            onUpdate={onUpdate}
            onBack={() => setScreen('home')}
          />
        )}
      </div>
    </div>
  );
}
