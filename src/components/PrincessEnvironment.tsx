import { lazy, Suspense } from 'react';
import { setTutorTheme, setCustomTrack } from '../engine/focusMusic';
import { useTutorTheme } from '../engine/useTutorTheme';
import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { princessPortrait } from '../data/princessPortraits';
import { PRINCESS_TUTORS } from '../data/princessTutors';
import { type AnimeTutor } from '../data/animeTutors';
import { SUBJECTS } from '../data/curriculum';
import { TutorStage } from './TutorStage';
import { PrincessSettings, PRINCESS_DIRECTION } from './PrincessSettings';
import { type AvatarMood } from './AnimatedAvatar';
import { getSpeech, warmUpVoices, setSpeech, elevenLabsSpeechProvider, openAiSpeechProvider, webSpeechProvider } from '../engine/speech';
import { activeImageFor } from '../data/gallery';
import { LessonPlayer } from './LessonPlayer';
import { TutorGallery } from './TutorGallery';
import { KidActivities, type KidMode } from './KidActivities';
import { recordAnswer, recordLessonComplete } from '../data/stats';
import { elevenKeyFor, openAiKeyFor } from '../data/keys';
import {
  startFocusMusic, stopFocusMusic, setVolume, nextTrack, currentTitle, onTrackChange,
} from '../engine/focusMusic';

const RoyalRealm = lazy(() => import('./RoyalRealm').then(m => ({default:m.RoyalRealm})));

type Screen = 'realm' | 'home' | 'tutor' | 'lessons' | 'kid' | 'gallery' | 'settings';

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
  useTutorTheme(screen === 'realm' ? 'royal-prince' : tutor?.id, profile.tutorThemes);
  const [kidMode, setKidMode] = useState<KidMode>('learnRead');
  const [mood, setMood] = useState<AvatarMood>('idle');
  const [bubble, setBubble] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [nowPlaying, setNowPlaying] = useState(currentTitle());

  useEffect(() => {
    warmUpVoices();
    return () => getSpeech().stop();
  }, []);

  const elevenAvailable = !!elevenKeyFor(profile);
  const useEleven = profile.princessVoiceProvider === 'elevenlabs' ||
    ((profile.princessVoiceProvider ?? 'auto') === 'auto' && elevenAvailable);
  const tutors = PRINCESS_TUTORS.map(t => ({ ...t, voice: { ...t.voice, rate: profile.princessVoiceRate ?? 0.95,
    preferredVoice: useEleven ? profile.tutorVoices?.[t.id] || t.voice.preferredVoice : profile.princessOpenAiVoices?.[t.id] ?? 'shimmer' } }));
  const selectedTutor = tutor ? tutors.find(t => t.id === tutor.id)! : null;

  // Voice provider priority (same as anime env).
  useEffect(() => {
    const useHuman = profile.humanVoice !== false;
    const eleven = elevenKeyFor(profile);
    const openai = openAiKeyFor(profile);
    if (useHuman && useEleven && eleven && eleven.length > 10) setSpeech(elevenLabsSpeechProvider(eleven));
    else if (useHuman && profile.princessVoiceProvider !== 'elevenlabs' && openai && openai.length > 10) setSpeech(openAiSpeechProvider(openai, PRINCESS_DIRECTION));
    else setSpeech(webSpeechProvider);
  }, [profile.elevenLabsKey, profile.openAiKey, profile.humanVoice, profile.princessVoiceProvider, useEleven]);

  // Focus music.
  useEffect(() => {
    onTrackChange(() => setNowPlaying(currentTitle()));
    setCustomTrack(profile.customMusic ?? null);
    if (profile.focusMusic) startFocusMusic(profile.musicVolume ?? 0.18);
    else stopFocusMusic();
    return () => { stopFocusMusic(); onTrackChange(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.focusMusic, profile.customMusic]);
  useEffect(() => { setVolume(profile.musicVolume ?? 0.18); }, [profile.musicVolume]);

  const speak = useCallback(
    (text: string, t: AnimeTutor, m: AvatarMood = 'speaking', force = false) => {
      setVoiceError('');
      setBubble(text);
      getSpeech().stop();
      if (profile.autoSpeak === false && !force) { setMood(m === 'speaking' ? 'idle' : m); return; }
      getSpeech().speak(text, {
        voice: t.voice,
        purpose: 'reading',
        allowSystemFallback: true,
        onError: setVoiceError,
        onStart: () => setMood('speaking'),
        onEnd: () => setMood((c) => (c === 'cheer' ? 'happy' : 'idle')),
      });
    },
    [profile.autoSpeak]
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

  const img = (t: AnimeTutor) => activeImageFor(profile, t.id) || princessPortrait(PRINCESS_TUTORS.findIndex(p => p.id === t.id));

  return (
    <div className={`anime-env princess-world ${profile.princessReducedMotion ? "quiet-kingdom" : ""}`} style={{ position: 'relative', minHeight: '100%' }}>
      <div className="royal-backdrop" aria-hidden="true" />

      {/* Simple top bar */}
      <div className="room-bar">
        <span className="room-now">💎 {profile.name}'s Diamond Wonderland</span>
        <div className="room-music">
          <button className="chip small" onClick={() => { getSpeech().stop(); setScreen('settings'); }}>⚙️ Settings</button>
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
        {voiceError && <p className="card" role="alert">{voiceError}</p>}
        {screen === 'realm' && <Suspense fallback={<p>Opening the royal gardens…</p>}><RoyalRealm tutors={tutors} quiet={profile.princessReducedMotion === true} journeys={profile.royalJourneys ?? 0} onBack={() => setScreen('home')} onAnswer={(correct,subject) => onUpdate({ ...recordAnswer(profile,subject,correct,'quiz'), starsEarned:profile.starsEarned+(correct?1:0) })} onJourney={() => onUpdate({ ...profile,royalJourneys:(profile.royalJourneys??0)+1 })} /></Suspense>}
        {screen === 'settings' && <PrincessSettings profile={profile} onUpdate={onUpdate} onBack={() => setScreen('home')} />}
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
            <button className="btn big-btn" onClick={() => { getSpeech().stop(); setScreen('realm'); }}>🏰 Enter the 3D royal realm</button>
            <p className="faint">{profile.royalJourneys ?? 0} royal journeys completed · Nine learning quests · Princesses and Prince Adisa</p>
            <div className="grid cols-4" style={{ marginTop: 20 }}>
              {tutors.map((t) => {
                const label = SUBJECTS.find((s) => s.value === t.subject)?.label ?? t.subject;
                const im = img(t);
                return (
                  <div key={t.id} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTutor(t); } }} className="kid-tile princess-portal" style={{ borderColor: `${t.accent}66` }} onClick={() => openTutor(t)}>
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
              Your royal adventure begins here. Choose a princess and explore!
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
                <TutorStage tutor={selectedTutor!} imageSrc={img(tutor)} mood={mood} line={bubble} size={360}
                  videoEnabled={false} />
                <strong style={{ color: tutor.accent, fontSize: '1.3rem' }}>{tutor.name}</strong>
              </div>
              <div>
                <div className="tutor-speech dyslexia">{bubble || '…'}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="read-btn" type="button" onClick={() => bubble && speak(bubble, selectedTutor!, 'speaking', true)}>🔊 Say it again</button>
                  <button className="btn ghost" onClick={() => { setTutorTheme(tutor.id); onUpdate({ ...profile,focusMusic:true,tutorThemes:true }); }}>🎵 Play {tutor.name}’s theme</button>
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
            tutor={selectedTutor!}
            imageSrc={img(tutor)}
            autoSpeak={profile.autoSpeak !== false}
            videoEnabled={!!profile.didKey && !!profile.videoMode}
            voiceOverride={selectedTutor?.voice.preferredVoice}
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
            tutor={selectedTutor!}
            profile={{ ...profile, activeTutorImage: { ...profile.activeTutorImage, [tutor.id]: img(tutor)! }, tutorVoices: { ...profile.tutorVoices, [tutor.id]: selectedTutor!.voice.preferredVoice! } }}
            onEarnStar={() => earnStar(tutor.subject)}
            onBack={() => setScreen('tutor')}
          />
        )}

        {/* ---------------- GALLERY ---------------- */}
        {screen === 'gallery' && tutor && (
          <TutorGallery
            tutor={selectedTutor!}
            profile={profile}
            onUpdate={onUpdate}
            onBack={() => setScreen('home')}
          />
        )}
      </div>
    </div>
  );
}
