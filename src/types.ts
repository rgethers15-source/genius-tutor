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
  /** Turns on the immersive anime learning environment for this learner. */
  animeEnvironment?: boolean;
  /**
   * Uploaded tutor portrait images, keyed by anime tutor id.
   * Stored as data URLs so they persist locally with the profile.
   */
  tutorImages?: Record<string, string>;
  /**
   * Reasoning level the tutor should pitch content to (grade equivalent),
   * which can differ from the enrolled grade (e.g. 6th grade enrolled but
   * content pitched to a 3rd-grade reasoning level).
   */
  reasoningLevel?: GradeLevel;
  /** True to read all tutor speech aloud automatically. */
  autoSpeak?: boolean;
  /**
   * Uploaded study-room background images, keyed by room id (data URLs).
   * Rooms are the immersive spaces tutors teach in.
   */
  roomImages?: Record<string, string>;
  /** Selected study room id for the immersive environment. */
  activeRoomId?: string;
  /** Play calm lofi focus music in the study room. */
  focusMusic?: boolean;
  /** Focus-music volume 0..1. */
  musicVolume?: number;
  /** Optional caregiver-uploaded focus track (data URL). */
  customMusic?: string;
  /**
   * Optional OpenAI API key (stored locally only) that unlocks "smart mode"
   * homework help — the tutor reads uploaded homework and explains it.
   */
  openAiKey?: string;
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
