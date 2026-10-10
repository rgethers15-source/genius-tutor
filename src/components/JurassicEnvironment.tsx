import { setTutorTheme } from '../engine/focusMusic';
import { useTutorTheme } from '../engine/useTutorTheme';
import { NCFirstGradeMap } from './NCFirstGradeMap';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { explorerPortrait } from '../data/jurassicTutors';
const JurassicExpedition = lazy(() => import('./JurassicExpedition').then(m => ({ default: m.JurassicExpedition }))); 
import { JURASSIC_TUTORS as PRINCESS_TUTORS } from '../data/jurassicTutors';
import { type AnimeTutor } from '../data/animeTutors';
import { SUBJECTS } from '../data/curriculum';
import { TutorStage } from './TutorStage';
import { HomeworkHelp } from './HomeworkHelp';
import { ReadingPractice } from './ReadingPractice';
import { checkNewBadges, BADGES } from '../data/badges';
import { setHomeworkAi, openAiHomeworkProvider, offlineHomeworkProvider } from '../engine/homeworkAi';
import { mandelaQuestions } from '../engine/mandelaQuestions';
import { JurassicSettings } from './JurassicSettings';
import { allLessons1ForSubject } from '../data/curriculum1';
import { EXPEDITION_LESSONS } from '../data/expeditionCurriculum';
import { type AvatarMood } from './AnimatedAvatar';
import { getSpeech, warmUpVoices, setSpeech, elevenLabsSpeechProvider, openAiSpeechProvider, webSpeechProvider } from '../engine/speech';
import { activeImageFor } from '../data/gallery';
import { LessonPlayer } from './LessonPlayer';
import { TutorGallery } from './TutorGallery';
import { KidActivities, type KidMode } from './KidActivities';
import { recordAnswer, recordLessonComplete, recordHomework, recordReading } from '../data/stats';
import { elevenKeyFor, openAiKeyFor } from '../data/keys';
import {
  nextTrack, currentTitle, onTrackChange,
} from '../engine/focusMusic';

const EXPLORER_DIRECTION = 'A youthful adult male adventure guide: warm, energetic, encouraging, clear American English speech. Original character voice, no growling during phonics.';

type Screen = 'home' | 'tutor' | 'lessons' | 'kid' | 'gallery' | 'settings' | 'expedition' | 'standards' | 'homework' | 'reading' | 'badges';

export function JurassicEnvironment({
  profile,
  onExit,
  onUpdate,
  onParent,
}: {
  profile: Profile;
  onExit: () => void;
  onUpdate: (p: Profile) => void;
  onParent: () => void;
}) {
  const [screen, setScreen] = useState<Screen>('home');
  const [tutor, setTutor] = useState<AnimeTutor | null>(null);
  useTutorTheme(tutor?.id, profile.tutorThemes);
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
    preferredVoice: useEleven ? profile.tutorVoices?.[t.id] || t.voice.preferredVoice : profile.princessOpenAiVoices?.[t.id] ?? 'echo' } }));
  const selectedTutor = tutor ? tutors.find(t => t.id === tutor.id)! : null;

  // Voice provider priority (same as anime env).
  useEffect(() => {
    const useHuman = profile.humanVoice !== false;
    const eleven = elevenKeyFor(profile);
    const openai = openAiKeyFor(profile);
    if (useHuman && useEleven && eleven && eleven.length > 10) setSpeech(elevenLabsSpeechProvider(eleven));
    else if (useHuman && profile.princessVoiceProvider !== 'elevenlabs' && openai && openai.length > 10) setSpeech(openAiSpeechProvider(openai, EXPLORER_DIRECTION));
    else setSpeech(webSpeechProvider);
  }, [profile.elevenLabsKey, profile.openAiKey, profile.humanVoice, profile.princessVoiceProvider, useEleven]);

  useEffect(() => { onTrackChange(() => setNowPlaying(currentTitle())); return () => onTrackChange(null); }, []);

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

  useEffect(() => { const key=openAiKeyFor(profile); setHomeworkAi(key ? openAiHomeworkProvider(key) : offlineHomeworkProvider); }, [profile.openAiKey]);

  const updateProgress = (next: Profile) => { const { all } = checkNewBadges(next); onUpdate({ ...next, earnedBadges: all }); };
  const earnStar = (subject: string) =>
    updateProgress({
      ...recordAnswer(profile, subject as never, true, 'quiz'),
      starsEarned: profile.starsEarned + 1,
    });

  const img = (t: AnimeTutor) => activeImageFor(profile, t.id) || explorerPortrait(PRINCESS_TUTORS.findIndex(p => p.id === t.id));

  return (
    <div className={`anime-env jurassic-world ${profile.princessReducedMotion ? "quiet-kingdom" : ""}`} style={{ position: 'relative', minHeight: '100%' }}>
      <div className="jurassic-backdrop" aria-hidden="true"/><div className="jurassic-fireflies" aria-hidden="true"/>

      {/* Simple top bar */}
      <div className="room-bar">
        <span className="room-now">🧭 {profile.name}'s Expedition Base</span>
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
        {screen === 'settings' && <JurassicSettings profile={profile} tutors={PRINCESS_TUTORS} title="Explorer settings" direction={EXPLORER_DIRECTION} onUpdate={onUpdate} onBack={() => setScreen('home')} />}
        {screen === 'standards' && <NCFirstGradeMap profile={profile} onUpdate={onUpdate} onBack={() => setScreen('home')} />}
        {screen === 'expedition' && <Suspense fallback={<p>Preparing dinosaur island…</p>}><JurassicExpedition zombies={profile.jurassicZombies === true} quiet={profile.princessReducedMotion === true} onBack={() => setScreen('home')} rescues={profile.jurassicRescues ?? 0} onRescue={() => updateProgress({...profile,jurassicRescues:(profile.jurassicRescues??0)+1})} onAnswer={(correct,subject)=>updateProgress({...recordAnswer(profile,subject,correct,'quiz'),starsEarned:profile.starsEarned+(correct?1:0)})} /></Suspense>}
        {screen === 'badges' && <div className="center card"><h1>🏆 Expedition trophies</h1><p>{profile.jurassicRescues ?? 0} rescue expeditions completed · {profile.starsEarned} learning stars</p><button className="btn" onClick={() => setScreen('home')}>Return to base</button><div className="grid cols-3">{BADGES.map(b => <div className="card" key={b.id} style={{opacity:profile.earnedBadges?.includes(b.id)?1:.55}}><h2>{b.emoji} {b.name}</h2><p>{b.description}</p><strong>{profile.earnedBadges?.includes(b.id)?'Earned':'Keep exploring'}</strong></div>)}</div></div>}
        {screen === 'homework' && selectedTutor && <HomeworkHelp tutor={selectedTutor} profile={{...profile,reasoningLevel:'1',openAiKey:openAiKeyFor(profile) || undefined}} onBack={() => setScreen('tutor')} onUsed={() => updateProgress(recordHomework(profile,selectedTutor.subject))}/> }
        {screen === 'reading' && selectedTutor && <ReadingPractice tutor={selectedTutor} profile={profile} onBack={() => setScreen('tutor')} onEarnStar={() => updateProgress({...recordReading(profile,selectedTutor.subject),starsEarned:profile.starsEarned+1})}/> }
        {/* ---------------- HOME: pick a princess ---------------- */}
        {screen === 'home' && (
          <div className="center">
            <div className="row between">
              <h1 className="expedition-title" style={{ fontSize: '2.2rem' }}>
                🦖 {profile.name}'s Dinosaur Rescue Academy
              </h1>
              <button className="btn ghost" type="button" onClick={onExit}>← Back</button>
            </div>
            <p className="dyslexia" style={{ fontSize: '1.3rem' }}>
              Choose your guide. Learn, explore, and bring the dinosaurs home safely.
            </p>
            <button className="btn big-btn" onClick={() => { getSpeech().stop(); setScreen('expedition'); }}>🦖 Enter the 3D rescue island</button>
<button className="btn ghost" onClick={() => setScreen('standards')}>🧭 First-grade field missions</button><button className="btn ghost" onClick={() => setScreen('badges')}>🏆 Rescue trophies</button><button className="btn ghost" onClick={onParent}>🔒 Grown-up dashboard</button>
            <p className="faint">{profile.school} · Grade 1 · Charlotte, NC</p>
            <div className="grid cols-4" style={{ marginTop: 20 }}>
              {tutors.map((t) => {
                const label = SUBJECTS.find((s) => s.value === t.subject)?.label ?? t.subject;
                const im = img(t);
                return (
                  <div key={t.id} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTutor(t); } }} className="kid-tile explorer-portal" style={{ borderColor: `${t.accent}66` }} onClick={() => openTutor(t)}>
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
              Your field team includes explorers, rescue heroes, and dinosaur guides.
            </p>
          </div>
        )}

        {/* ---------------- TUTOR HUB ---------------- */}
        {screen === 'tutor' && tutor && (
          <div className="center">
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="stars" style={{ fontSize: '1.4rem' }}>⭐ {profile.starsEarned}</span>
              <button className="btn ghost" type="button" onClick={() => { getSpeech().stop(); setScreen('home'); }}>← Explorers</button>
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
                  <button className="read-btn" type="button" onClick={() => bubble && speak(bubble, selectedTutor!, 'speaking', true)}>🔊 Say it again</button><button className="btn ghost" onClick={() => { setTutorTheme(tutor.id); onUpdate({ ...profile,focusMusic:true,tutorThemes:true }); }}>🎵 Play {tutor.name}’s theme</button>
                </div>
                <div className="grid cols-2" style={{ marginTop: 16, gap: 12 }}>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setScreen('lessons'); }}>📚 Lessons & Test</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('learnRead'); setScreen('kid'); }}>📖 Learn to Read</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('phonics'); setScreen('kid'); }}>🗣️ Phonics</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('montessori'); setScreen('kid'); }}>🧩 Montessori</button>
                  <button className="kid-btn" style={{ background: tutor.accent }} onClick={() => { getSpeech().stop(); setKidMode('games'); setScreen('kid'); }}>🎮 Games</button>
                  <button className="kid-btn" onClick={() => { getSpeech().stop(); setScreen('homework'); }}>📝 Homework help</button>
                  <button className="kid-btn" onClick={() => { getSpeech().stop(); setScreen('reading'); }}>🎤 Read aloud</button>
                  <button className="btn big-btn ghost" onClick={() => { getSpeech().stop(); setScreen('gallery'); }}>🧢 Change Picture</button>
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
            onGenerateQuestions={openAiKeyFor(profile) ? count => mandelaQuestions(openAiKeyFor(profile)!, tutor.subject, count) : undefined}
            lessonBank={[...allLessons1ForSubject(tutor.subject), ...EXPEDITION_LESSONS.filter(l => l.subject === tutor.subject)]}
            onEarnStar={() => {}}
            onRecordAnswer={(correct, kind) => updateProgress({ ...recordAnswer(profile, tutor.subject, correct, kind), starsEarned: profile.starsEarned + (correct ? 1 : 0) })}
            onLessonComplete={(id, title) => updateProgress(recordLessonComplete(profile, tutor.subject, id, title))}
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
