import type { Profile } from '../types';
import { getStats } from './stats';

// ============================================================
// Rewards / badges. Earned automatically from progress. Meant to
// celebrate effort and build confidence — easy early wins, then
// bigger milestones. Purely local; no keys needed.
// ============================================================

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Returns true when the profile has earned this badge. */
  earned: (p: Profile) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first-star',
    name: 'First Star',
    emoji: '⭐',
    description: 'Earned your very first star!',
    earned: (p) => p.starsEarned >= 1,
  },
  {
    id: 'ten-stars',
    name: 'Star Collector',
    emoji: '🌟',
    description: 'Earned 10 stars.',
    earned: (p) => p.starsEarned >= 10,
  },
  {
    id: 'twentyfive-stars',
    name: 'Super Star',
    emoji: '💫',
    description: 'Earned 25 stars.',
    earned: (p) => p.starsEarned >= 25,
  },
  {
    id: 'first-lesson',
    name: 'Lesson One',
    emoji: '📗',
    description: 'Finished your first lesson.',
    earned: (p) => getStats(p).completedLessons.length >= 1,
  },
  {
    id: 'five-lessons',
    name: 'Bookworm',
    emoji: '📚',
    description: 'Finished 5 lessons.',
    earned: (p) => getStats(p).completedLessons.length >= 5,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    emoji: '🧭',
    description: 'Tried 3 different subjects.',
    earned: (p) => {
      const s = getStats(p);
      const tried = Object.values(s.bySubject).filter((v) => (v?.attempts ?? 0) > 0);
      return tried.length >= 3;
    },
  },
  {
    id: 'reader',
    name: 'Brave Reader',
    emoji: '🗣️',
    description: 'Practiced reading out loud.',
    earned: (p) => getStats(p).recent.some((e) => e.detail.toLowerCase().includes('read')),
  },
  {
    id: 'homework-hero',
    name: 'Homework Hero',
    emoji: '🦸',
    description: 'Used homework help.',
    earned: (p) => getStats(p).recent.some((e) => e.kind === 'homework'),
  },
];

/** All badge ids the profile currently qualifies for. */
export function earnedBadgeIds(profile: Profile): string[] {
  return BADGES.filter((b) => b.earned(profile)).map((b) => b.id);
}

/**
 * Returns badges newly earned since the profile's stored list, and the
 * updated full list — so the UI can celebrate new unlocks.
 */
export function checkNewBadges(profile: Profile): { newly: Badge[]; all: string[] } {
  const all = earnedBadgeIds(profile);
  const known = new Set(profile.earnedBadges ?? []);
  const newly = BADGES.filter((b) => all.includes(b.id) && !known.has(b.id));
  return { newly, all };
}
