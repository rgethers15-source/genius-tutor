// ============================================================
// Core domain types for Genius Tutor
// ============================================================

export type AvatarCategory = 'pixar' | 'human' | 'anime';

export interface Avatar {
  id: string;
  name: string;
  category: AvatarCategory;
  /** Emoji/illustration stand-in until real animated avatars are wired in. */
  glyph: string;
  /** Warm accent color used for this avatar's UI theming. */
  accent: string;
  personality: string;
}

export type GradeLevel =
  | 'K'
  | '1' | '2' | '3' | '4' | '5' | '6'
  | '7' | '8' | '9' | '10' | '11' | '12';

export type Subject =
  | 'reading'
  | 'writing'
  | 'math'
  | 'science'
  | 'socialStudies'
  | 'art'
  | 'music';

export type LearningStyle = 'kinetic' | 'visual' | 'auditory' | 'reading';

/** Accessibility & learning-support flags. */
export interface SupportNeeds {
  dyslexiaSupport: boolean;
  speechSupport: boolean;
  extraTime: boolean;
  reducedDistraction: boolean;
  largerText: boolean;
  readAloud: boolean;
}

export interface LearningPlan {
  gradeLevel: GradeLevel;
  subjects: Subject[];
  primaryLearningStyle: LearningStyle;
  /** 1-5 difficulty pacing, adjusted by the adaptive engine over time. */
  pacing: number;
  goals: string[];
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  school?: string;
  avatarId: string;
  plan: LearningPlan;
  support: SupportNeeds;
  /** Warm/night theme preference. */
  nightMode: boolean;
  setupComplete: boolean;
  createdAt: string;
  /** Simple progress tracking; expands as the engine grows. */
  progress: Record<string, number>;
  /** Encouragement counter to reinforce self-esteem. */
  starsEarned: number;
}

export interface AppData {
  profiles: Profile[];
  version: number;
}

export const MAX_PROFILES = 4;

export const DEFAULT_SUPPORT: SupportNeeds = {
  dyslexiaSupport: false,
  speechSupport: false,
  extraTime: false,
  reducedDistraction: false,
  largerText: false,
  readAloud: true,
};
