import type {
  ActivityEvent,
  LearnerStats,
  Profile,
  Subject,
  SubjectStats,
} from '../types';

// ============================================================
// Learning-stats helpers. Pure functions that return an updated Profile,
// so they flow through the same save pipeline as everything else.
// ============================================================

const EMPTY_SUBJECT: SubjectStats = {
  correct: 0,
  attempts: 0,
  lessonsCompleted: 0,
  timeSpent: 0,
};

export function emptyStats(): LearnerStats {
  return { bySubject: {}, completedLessons: [], recent: [], totalMinutes: 0 };
}

export function getStats(profile: Profile): LearnerStats {
  return profile.stats ?? emptyStats();
}

function subjectStats(stats: LearnerStats, subject: Subject): SubjectStats {
  return { ...EMPTY_SUBJECT, ...(stats.bySubject[subject] ?? {}) };
}

const RECENT_CAP = 25;

function pushRecent(stats: LearnerStats, ev: ActivityEvent): ActivityEvent[] {
  const next = [...stats.recent, ev];
  return next.slice(-RECENT_CAP);
}

/** Record a single answered question (right or wrong). */
export function recordAnswer(
  profile: Profile,
  subject: Subject,
  correct: boolean,
  kind: ActivityEvent['kind'] = 'quiz'
): Profile {
  const stats = getStats(profile);
  const s = subjectStats(stats, subject);
  s.attempts += 1;
  if (correct) s.correct += 1;
  const now = new Date().toISOString();
  return {
    ...profile,
    stats: {
      ...stats,
      bySubject: { ...stats.bySubject, [subject]: s },
      lastActive: now,
      recent: pushRecent(stats, {
        at: now,
        subject,
        kind,
        detail: correct ? 'Answered correctly' : 'Tried an answer',
      }),
    },
  };
}

/** Record completing a lesson. */
export function recordLessonComplete(
  profile: Profile,
  subject: Subject,
  lessonId: string,
  lessonTitle: string
): Profile {
  const stats = getStats(profile);
  const s = subjectStats(stats, subject);
  const already = stats.completedLessons.includes(lessonId);
  if (!already) s.lessonsCompleted += 1;
  const now = new Date().toISOString();
  return {
    ...profile,
    stats: {
      ...stats,
      bySubject: { ...stats.bySubject, [subject]: s },
      completedLessons: already
        ? stats.completedLessons
        : [...stats.completedLessons, lessonId],
      lastActive: now,
      recent: pushRecent(stats, {
        at: now,
        subject,
        kind: 'lesson',
        detail: `Finished lesson: ${lessonTitle}`,
      }),
    },
  };
}

/** Record a homework help session. */
export function recordHomework(profile: Profile, subject: Subject): Profile {
  const stats = getStats(profile);
  const now = new Date().toISOString();
  return {
    ...profile,
    stats: {
      ...stats,
      lastActive: now,
      recent: pushRecent(stats, {
        at: now,
        subject,
        kind: 'homework',
        detail: 'Worked on homework help',
      }),
    },
  };
}

/** Record a reading-out-loud success (feeds the Brave Reader badge). */
export function recordReading(profile: Profile, subject: Subject): Profile {
  const stats = getStats(profile);
  const s = subjectStats(stats, subject);
  s.attempts += 1;
  s.correct += 1;
  const now = new Date().toISOString();
  return {
    ...profile,
    stats: {
      ...stats,
      bySubject: { ...stats.bySubject, [subject]: s },
      lastActive: now,
      recent: pushRecent(stats, {
        at: now,
        subject,
        kind: 'quiz',
        detail: 'Read a word out loud',
      }),
    },
  };
}

/** Add approximate minutes spent (called on exit). */
export function addMinutes(profile: Profile, minutes: number): Profile {
  const stats = getStats(profile);
  return { ...profile, stats: { ...stats, totalMinutes: stats.totalMinutes + minutes } };
}

/** Accuracy 0..1 for a subject (attempts guarded). */
export function accuracy(stats: LearnerStats, subject: Subject): number {
  const s = stats.bySubject[subject];
  if (!s || s.attempts === 0) return 0;
  return s.correct / s.attempts;
}

/** Subjects ranked by accuracy (best first) among those attempted. */
export function rankedSubjects(stats: LearnerStats): { subject: Subject; acc: number; attempts: number }[] {
  return (Object.keys(stats.bySubject) as Subject[])
    .map((subject) => ({
      subject,
      acc: accuracy(stats, subject),
      attempts: stats.bySubject[subject]?.attempts ?? 0,
    }))
    .filter((r) => r.attempts > 0)
    .sort((a, b) => b.acc - a.acc);
}
