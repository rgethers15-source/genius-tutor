import type { AnimeTutor } from '../data/animeTutors';
import { allLessonsForSubject } from '../data/curriculum6';
import { CHEERS, GENTLE } from './tutorBrain';
import { getVideoAvatar, type VideoVoice } from './videoAvatar';
import { getCachedVideo, saveCachedVideo } from '../data/videoCache';

// ============================================================
// Pre-record all of a tutor's FIXED spoken lines as talking-head videos,
// cached to disk. After this runs once, lessons/quizzes/reading replay
// instantly (no waiting, no per-use cost) — feeling like real-time.
//
// Homework Help is intentionally NOT pre-recorded (its lines are dynamic).
// ============================================================

/** Collect every fixed line this tutor will ever say in lessons/quizzes. */
export function collectTutorLines(tutor: AnimeTutor): string[] {
  const lines = new Set<string>();

  // Greeting
  lines.add(tutor.greeting);

  // Lesson steps + quiz questions + "finished" line
  for (const lesson of allLessonsForSubject(tutor.subject)) {
    for (const step of lesson.steps) lines.add(step.say);
    for (const q of lesson.quiz) lines.add(q.q);
  }
  lines.add('You finished the lesson! Amazing work. Pick another, or try a test!');

  // Positive + gentle responses (all variants, so any can play instantly)
  for (const c of CHEERS) lines.add(c);
  for (const g of GENTLE) lines.add(g);
  lines.add('Correct! ⭐');

  // Reading-practice prompts
  lines.add("Let's read words out loud! Tap the mic, then say the word you see.");
  lines.add("Let's read sentences! Tap the mic and read it out loud. Take your time.");

  return Array.from(lines).filter((l) => l && l.trim().length > 0);
}

export interface PrerecordProgress {
  total: number;
  done: number;
  current: string;
  skipped: number;
  failed: number;
}

/**
 * Generate + cache videos for all of a tutor's lines.
 * Skips lines already cached. Calls onProgress after each line.
 * Returns false early if a hard error (e.g. no image / auth) occurs.
 */
export async function prerecordTutor(
  tutor: AnimeTutor,
  imageDataUrl: string,
  voice: VideoVoice | undefined,
  onProgress: (p: PrerecordProgress) => void,
  shouldCancel: () => boolean
): Promise<{ done: number; skipped: number; failed: number; error?: string }> {
  const lines = collectTutorLines(tutor);
  const progress: PrerecordProgress = {
    total: lines.length,
    done: 0,
    current: '',
    skipped: 0,
    failed: 0,
  };

  for (const line of lines) {
    if (shouldCancel()) break;
    progress.current = line;
    onProgress({ ...progress });

    // Already cached? skip (free + instant).
    const existing = await getCachedVideo(tutor.id, line);
    if (existing) {
      progress.skipped += 1;
      progress.done += 1;
      onProgress({ ...progress });
      continue;
    }

    const res = await getVideoAvatar().speakVideo(imageDataUrl, line, voice);
    if (res.ok && res.blob) {
      await saveCachedVideo(tutor.id, line, res.blob);
    } else if (res.ok && res.videoUrl) {
      // Had a URL but no blob — try to fetch + cache.
      try {
        const blob = await (await fetch(res.videoUrl)).blob();
        await saveCachedVideo(tutor.id, line, blob);
      } catch {
        progress.failed += 1;
      }
    } else {
      progress.failed += 1;
      // Stop on auth/credit errors — no point hammering the API.
      if (res.error && /401|402|403|credit|insufficient/i.test(res.error)) {
        progress.done += 1;
        onProgress({ ...progress });
        return {
          done: progress.done,
          skipped: progress.skipped,
          failed: progress.failed,
          error: res.error,
        };
      }
    }
    progress.done += 1;
    onProgress({ ...progress });
  }

  return { done: progress.done, skipped: progress.skipped, failed: progress.failed };
}
