import type { Profile, Subject } from '../types';

// ============================================================
// Adaptive Learning Engine
//
// This is the pluggable "brain" of the tutor. Today it uses simple,
// transparent rule-based logic so the app works fully offline with no
// API keys. To add "superior intelligence" later, implement the
// AiProvider interface (e.g. with OpenAI/Anthropic) and pass it in —
// the rest of the app does not change.
// ============================================================

export interface Activity {
  id: string;
  subject: Subject;
  title: string;
  prompt: string;
  /** Kinetic = do something with your body/hands, not just read. */
  kinetic: boolean;
  encouragement: string;
}

export interface AiProvider {
  /** Generate a personalized activity for the given profile + subject. */
  suggestActivity(profile: Profile, subject: Subject): Promise<Activity>;
}

// --- Encouraging, self-esteem-boosting phrases (avatar speaks kindly) ---
const CHEERS = [
  'You are doing amazing — I believe in you!',
  "Every try makes your brain stronger. Let's go!",
  "Mistakes are how geniuses learn. You've got this!",
  'I am so proud of how hard you are working!',
  'Your ideas are wonderful. Keep going, superstar!',
];

export function pickCheer(seed = Date.now()): string {
  return CHEERS[seed % CHEERS.length];
}

// --- Rule-based kinetic activity bank, tuned by grade band ---
type Band = 'early' | 'middle' | 'upper';

function bandFor(profile: Profile): Band {
  const g = profile.plan.gradeLevel;
  if (g === 'K' || ['1', '2', '3'].includes(g)) return 'early';
  if (['4', '5', '6', '7', '8'].includes(g)) return 'middle';
  return 'upper';
}

const BANK: Record<Subject, Record<Band, { title: string; prompt: string; kinetic: boolean }[]>> = {
  reading: {
    early: [
      { title: 'Sound Hop', prompt: 'I say a letter sound — you hop to something in the room that starts with it!', kinetic: true },
      { title: 'Story Act-Out', prompt: 'We read a short story, then you act out the animal in it. Ready?', kinetic: true },
    ],
    middle: [
      { title: 'Read & Draw', prompt: 'Read this paragraph, then draw the scene you pictured in your mind.', kinetic: true },
      { title: 'Word Detective', prompt: 'Find 3 new words in this passage and act out what each one means.', kinetic: true },
    ],
    upper: [
      { title: 'Debate Walk', prompt: 'Read this article. Walk to the left of the room for "agree," right for "disagree," and tell me why.', kinetic: true },
    ],
  },
  writing: {
    early: [
      { title: 'Air Letters', prompt: 'Trace this letter big in the air with your whole arm, then write it down!', kinetic: true },
    ],
    middle: [
      { title: 'Story Cubes', prompt: 'Toss 3 objects on the table. Write a silly story that uses all three.', kinetic: true },
    ],
    upper: [
      { title: 'Idea Sprint', prompt: 'Stand up and brainstorm out loud for 60 seconds, then write your best idea.', kinetic: true },
    ],
  },
  math: {
    early: [
      { title: 'Count & Clap', prompt: 'Clap and count with me! We will count by 2s up to 20.', kinetic: true },
      { title: 'Shape Hunt', prompt: 'Find 3 circles and 3 squares around the room. Bring them here!', kinetic: true },
    ],
    middle: [
      { title: 'Measure Quest', prompt: 'Measure 3 objects with a ruler and put them in order from small to big.', kinetic: true },
    ],
    upper: [
      { title: 'Real-World Math', prompt: 'Plan a pretend $20 budget for a picnic. Move objects to represent each cost.', kinetic: true },
    ],
  },
  science: {
    early: [{ title: 'Sink or Float', prompt: 'Guess if each object sinks or floats, then test it in a bowl of water!', kinetic: true }],
    middle: [{ title: 'Kitchen Lab', prompt: 'Mix baking soda and vinegar and describe what your senses notice.', kinetic: true }],
    upper: [{ title: 'Build a Model', prompt: 'Build a model of the water cycle using things around your home.', kinetic: true }],
  },
  socialStudies: {
    early: [{ title: 'Map My Room', prompt: 'Draw a map of your room and walk the path from door to bed.', kinetic: true }],
    middle: [{ title: 'Time Traveler', prompt: 'Act out a day in the life of someone from 100 years ago.', kinetic: true }],
    upper: [{ title: 'Community Walk', prompt: 'List 3 community helpers, then role-play interviewing one.', kinetic: true }],
  },
  art: {
    early: [{ title: 'Color Dance', prompt: 'Paint how a happy song feels — move your brush to the beat!', kinetic: true }],
    middle: [{ title: 'Build a Sculpture', prompt: 'Make a sculpture from recycled items and give it a name.', kinetic: true }],
    upper: [{ title: 'Design Challenge', prompt: 'Sketch a poster for a cause you care about, then present it.', kinetic: true }],
  },
  music: {
    early: [{ title: 'Rhythm Steps', prompt: 'March in place to the beat while we clap a pattern together.', kinetic: true }],
    middle: [{ title: 'Make an Instrument', prompt: 'Build a shaker from a jar and rice, then keep a steady beat.', kinetic: true }],
    upper: [{ title: 'Compose a Hook', prompt: 'Tap a 4-beat rhythm and hum a melody over it. Record it!', kinetic: true }],
  },
};

/** Default offline provider: transparent, rule-based, always kinetic-first. */
export const ruleBasedProvider: AiProvider = {
  async suggestActivity(profile, subject) {
    const band = bandFor(profile);
    const options = BANK[subject][band] ?? BANK[subject].early;
    const choice = options[Math.floor(Math.random() * options.length)];
    return {
      id: `act_${subject}_${Date.now().toString(36)}`,
      subject,
      title: choice.title,
      prompt: adjustForSupport(profile, choice.prompt),
      kinetic: choice.kinetic,
      encouragement: pickCheer(),
    };
  },
};

/** Gently adapt wording for accessibility needs. */
function adjustForSupport(profile: Profile, prompt: string): string {
  let out = prompt;
  if (profile.support.extraTime) out += ' Take all the time you need — there is no rush.';
  if (profile.support.speechSupport) out += ' You can answer by pointing, drawing, or speaking — whatever feels good.';
  return out;
}

// Active provider (swap for an AI-backed one later).
let activeProvider: AiProvider = ruleBasedProvider;
export function setProvider(p: AiProvider) {
  activeProvider = p;
}
export function getProvider(): AiProvider {
  return activeProvider;
}
