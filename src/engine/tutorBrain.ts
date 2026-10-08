import type { Profile, Subject } from '../types';

// ============================================================
// Tutor Brain — generates gentle, simple, step-by-step lessons.
//
// Tuned for a learner who is 12/6th grade but reasons around a 3rd-grade
// level, with ADHD + dyslexia + reading difficulty. Principles baked in:
//   - VERY short sentences, common words, one idea at a time
//   - always encouraging, never negative about mistakes
//   - concrete, hands-on, visual examples
//   - break every task into tiny steps
//
// Rule-based today (works offline, no key). Implement TutorAiProvider with
// a real model later for open-ended homework help — UI won't change.
// ============================================================

export interface TutorTurn {
  /** What the tutor says out loud (short, simple). */
  say: string;
  /** Optional multiple-choice options to reduce reading/typing load. */
  choices?: string[];
  /** The correct choice text, if this turn is a question. */
  answer?: string;
  /** A hint the tutor gives if the child is stuck. */
  hint?: string;
  /** Mood to drive the avatar animation. */
  mood: 'idle' | 'speaking' | 'happy' | 'thinking' | 'cheer';
}

export interface TutorAiProvider {
  /** Open-ended help (e.g. explain uploaded homework). */
  help(profile: Profile, subject: Subject, question: string): Promise<TutorTurn>;
}

// --- Tiny, concrete question bank pitched to ~3rd-grade reasoning ---
type QA = { say: string; choices: string[]; answer: string; hint: string };

const BANK: Record<Subject, QA[]> = {
  reading: [
    {
      say: 'Read this word with me: C - A - T. What word is it?',
      choices: ['Cat', 'Dog', 'Car'],
      answer: 'Cat',
      hint: 'Say each sound slow: cuh... aa... tuh. Blend them together!',
    },
    {
      say: 'The sun is hot. What is hot?',
      choices: ['The sun', 'Ice', 'The moon'],
      answer: 'The sun',
      hint: 'Look at the first word in the sentence. What is it about?',
    },
  ],
  math: [
    {
      say: 'You have 2 apples. I give you 1 more. How many now?',
      choices: ['2', '3', '4'],
      answer: '3',
      hint: 'Hold up 2 fingers. Now add 1 more finger. Count them all!',
    },
    {
      say: 'What is 5 take away 2?',
      choices: ['2', '3', '7'],
      answer: '3',
      hint: 'Start at 5. Count backward 2 times: 4... 3.',
    },
  ],
  science: [
    {
      say: 'Plants need this to grow. What is it?',
      choices: ['Sunlight', 'Candy', 'Rocks'],
      answer: 'Sunlight',
      hint: 'Think about where you see plants growing outside. What shines on them?',
    },
  ],
  writing: [
    {
      say: "Let's make a sentence. Which one is complete?",
      choices: ['The dog runs.', 'runs fast', 'the big'],
      answer: 'The dog runs.',
      hint: 'A sentence needs a who and a what they do. Who? The dog. Does what? Runs.',
    },
  ],
  socialStudies: [
    {
      say: 'Who helps put out fires?',
      choices: ['Firefighter', 'Chef', 'Pilot'],
      answer: 'Firefighter',
      hint: 'Think of the person with a big red truck and a hose.',
    },
  ],
  art: [
    {
      say: 'Mixing blue and yellow makes what color?',
      choices: ['Green', 'Purple', 'Pink'],
      answer: 'Green',
      hint: 'Think of grass and leaves — they come from blue and yellow!',
    },
  ],
  music: [
    {
      say: 'Clap along! A slow beat is called what?',
      choices: ['Slow tempo', 'Fast tempo', 'Loud'],
      answer: 'Slow tempo',
      hint: 'Tempo means speed. Slow music = slow tempo.',
    },
  ],
  speech: [
    {
      say: 'What sound does the letter S make?',
      choices: ['sss', 'buh', 'mmm'],
      answer: 'sss',
      hint: 'Think of a snake: sssss!',
    },
  ],
  africanHeritage: [
    {
      say: 'Kente cloth with bright colors comes from which continent?',
      choices: ['Africa', 'Antarctica', 'Europe'],
      answer: 'Africa',
      hint: 'It is a big, beautiful continent where many of our ancestors came from.',
    },
  ],
};

export const CHEERS = [
  'Yes! You did it! I am so proud of you! 🌟',
  'That is right! Your brain is getting stronger! 💪',
  'Amazing job, Madeline! High five! ✋',
  'Woohoo! You are a superstar! ⭐',
];

export const GENTLE = [
  'Almost! That is okay. Mistakes help us learn. Try again — you can do it!',
  'Good try! Let me give you a hint. We will get it together!',
  "That's a great guess. Let's look one more time — I believe in you!",
];

export function pickCheer(): string {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)];
}
export function pickGentle(): string {
  return GENTLE[Math.floor(Math.random() * GENTLE.length)];
}

/** Get the next question for a subject. */
export function nextQuestion(subject: Subject): TutorTurn {
  const pool = BANK[subject] ?? BANK.reading;
  const q = pool[Math.floor(Math.random() * pool.length)];
  return {
    say: q.say,
    choices: q.choices,
    answer: q.answer,
    hint: q.hint,
    mood: 'speaking',
  };
}

/** Check the child's answer and produce an encouraging spoken response. */
export function checkAnswer(turn: TutorTurn, chosen: string): TutorTurn {
  const correct =
    turn.answer &&
    chosen.trim().toLowerCase() === turn.answer.trim().toLowerCase();
  if (correct) {
    return { say: pickCheer(), mood: 'cheer' };
  }
  return {
    say: `${pickGentle()} ${turn.hint ? 'Hint: ' + turn.hint : ''}`.trim(),
    mood: 'thinking',
  };
}

// --- Simple offline "explain my homework" fallback ---
export const ruleBasedTutorAi: TutorAiProvider = {
  async help(_profile, _subject, question) {
    // Without a real AI model we can't truly read/solve arbitrary homework,
    // so we respond honestly and helpfully at the child's level.
    const q = question.trim();
    return {
      say:
        q.length === 0
          ? "Type your question and I'll help you break it into small, easy steps!"
          : `Great question! Let's take it slow. First, read it out loud with me. Then we find the ONE thing it is asking. What word do you see that you don't know? Point to it and we'll figure it out together!`,
      mood: 'speaking',
    };
  },
};

let activeTutorAi: TutorAiProvider = ruleBasedTutorAi;
export function getTutorAi(): TutorAiProvider {
  return activeTutorAi;
}
export function setTutorAi(p: TutorAiProvider) {
  activeTutorAi = p;
}
