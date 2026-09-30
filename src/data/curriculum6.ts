import type { Subject } from '../types';

// ============================================================
// NC 6th-Grade Curriculum (simplified to ~3rd-grade reasoning)
//
// Structured on the North Carolina Standard Course of Study (NC SCOS),
// the standards Charlotte-Mecklenburg (Southwest Middle) teaches to:
//   Math (NC.6): Ratios & Proportional Reasoning (RP), The Number System (NS),
//                Expressions & Equations (EE), Geometry (G), Statistics (SP)
//   ELA: Reading (Literature + Informational), Writing, Language
// Sources (public domain, NC DPI):
//   Math: files.nc.gov/dpi 6th-unpacking
//   ELA:  files.nc.gov/dpi ELA parent guide 6th
//
// Each lesson keeps the *topic* grade-appropriate (6th) but the *language,
// steps, and examples* are simplified so a learner reasoning at ~3rd grade
// can succeed. Every item is tap-to-answer to reduce reading/typing load.
// ============================================================

export interface QuizItem {
  /** Kid-facing question (short, simple words). */
  q: string;
  choices: string[];
  answer: string;
  /** Gentle hint if stuck. */
  hint: string;
}

export interface LessonStep {
  /** One idea, spoken by the tutor. */
  say: string;
  /** Optional simple visual/emoji cue. */
  visual?: string;
}

export interface Lesson {
  id: string;
  subject: Subject;
  /** NC standard code, e.g. "NC.6.RP.2". */
  standard: string;
  /** Grade-level topic name. */
  topic: string;
  /** Kid-friendly title. */
  title: string;
  steps: LessonStep[];
  quiz: QuizItem[];
}

export interface Unit {
  id: string;
  subject: Subject;
  name: string;
  lessons: Lesson[];
}

export const CURRICULUM_6: Unit[] = [
  // ---------------- MATH ----------------
  {
    id: 'm-rp',
    subject: 'math',
    name: 'Math: Ratios (NC.6.RP)',
    lessons: [
      {
        id: 'm-rp-1',
        subject: 'math',
        standard: 'NC.6.RP.1',
        topic: 'Understanding ratios',
        title: 'What is a ratio?',
        steps: [
          { say: 'A ratio compares two things. Like 2 apples to 3 oranges.', visual: '🍎🍎 : 🍊🍊🍊' },
          { say: 'We say it like this: "2 to 3."' },
          { say: 'Ratios help us compare amounts. Ready to try one?' },
        ],
        quiz: [
          {
            q: 'There are 3 cats and 1 dog. What is the ratio of cats to dogs?',
            choices: ['3 to 1', '1 to 3', '3 to 3'],
            answer: '3 to 1',
            hint: 'Count the cats first, then the dogs. Cats come first!',
          },
          {
            q: '2 red balls and 2 blue balls. The ratio of red to blue is…',
            choices: ['2 to 2', '2 to 4', '4 to 2'],
            answer: '2 to 2',
            hint: 'How many red? How many blue? Say red first.',
          },
        ],
      },
      {
        id: 'm-rp-2',
        subject: 'math',
        standard: 'NC.6.RP.3',
        topic: 'Percents as parts of 100',
        title: 'What does percent mean?',
        steps: [
          { say: 'Percent means "out of 100." The little sign looks like this: %', visual: '💯' },
          { say: '50% means 50 out of 100. That is half!' },
          { say: '10% means 10 out of 100. A small part.' },
        ],
        quiz: [
          {
            q: 'Half of something is what percent?',
            choices: ['50%', '10%', '100%'],
            answer: '50%',
            hint: 'Half means 50 out of 100.',
          },
        ],
      },
    ],
  },
  {
    id: 'm-ns',
    subject: 'math',
    name: 'Math: Numbers (NC.6.NS)',
    lessons: [
      {
        id: 'm-ns-1',
        subject: 'math',
        standard: 'NC.6.NS.5',
        topic: 'Positive and negative numbers',
        title: 'Numbers below zero',
        steps: [
          { say: 'Some numbers are below zero. We call them negative.', visual: '🌡️' },
          { say: 'Think of a cold day. -5 means 5 below zero!' },
          { say: 'Positive numbers are above zero, like +5.' },
        ],
        quiz: [
          {
            q: 'Which number is below zero?',
            choices: ['-3', '3', '0'],
            answer: '-3',
            hint: 'Look for the little minus sign in front.',
          },
        ],
      },
    ],
  },

  // ---------------- READING (ELA) ----------------
  {
    id: 'r-lit',
    subject: 'reading',
    name: 'Reading: Stories (NC ELA)',
    lessons: [
      {
        id: 'r-lit-1',
        subject: 'reading',
        standard: 'RL.6.1',
        topic: 'Finding the main idea',
        title: 'What is the story about?',
        steps: [
          { say: "Every story has a main idea. It is the BIG thing it is about.", visual: '💡' },
          { say: 'We read: "Sam loves his dog. They play every day."' },
          { say: 'The main idea is: Sam and his dog. Easy!' },
        ],
        quiz: [
          {
            q: '"The bird flew high. It liked the sky." What is it about?',
            choices: ['A bird', 'A fish', 'A car'],
            answer: 'A bird',
            hint: 'Who is doing things in the sentences? Look at the first word.',
          },
        ],
      },
    ],
  },

  // ---------------- WRITING (ELA) ----------------
  {
    id: 'w-1',
    subject: 'writing',
    name: 'Writing: Sentences (NC ELA)',
    lessons: [
      {
        id: 'w-1-1',
        subject: 'writing',
        standard: 'L.6.1',
        topic: 'Complete sentences',
        title: 'Building a sentence',
        steps: [
          { say: 'A sentence needs a WHO and a DOES WHAT.', visual: '👤 ➕ 🏃' },
          { say: 'Like: "The dog runs." Who? The dog. Does what? Runs.' },
          { say: 'It starts with a big letter and ends with a dot.' },
        ],
        quiz: [
          {
            q: 'Which one is a full sentence?',
            choices: ['The cat sleeps.', 'big red', 'runs fast'],
            answer: 'The cat sleeps.',
            hint: 'It needs a who AND what they do, plus a dot at the end.',
          },
        ],
      },
    ],
  },

  // ---------------- SCIENCE ----------------
  {
    id: 's-1',
    subject: 'science',
    name: 'Science: Living Things',
    lessons: [
      {
        id: 's-1-1',
        subject: 'science',
        standard: 'NC.6.L',
        topic: 'What living things need',
        title: 'Staying alive',
        steps: [
          { say: 'Living things need food, water, and air.', visual: '🍎💧🌬️' },
          { say: 'Plants also need sunlight to grow.', visual: '🌱☀️' },
          { say: 'People, animals, and plants are all living things.' },
        ],
        quiz: [
          {
            q: 'What do plants need to grow?',
            choices: ['Sunlight', 'Candy', 'Toys'],
            answer: 'Sunlight',
            hint: 'Look outside. What shines on the plants?',
          },
        ],
      },
    ],
  },

  // ---------------- SOCIAL STUDIES ----------------
  {
    id: 'ss-1',
    subject: 'socialStudies',
    name: 'Social Studies: Community',
    lessons: [
      {
        id: 'ss-1-1',
        subject: 'socialStudies',
        standard: 'NC.6.C&G',
        topic: 'Community helpers & rules',
        title: 'People who help us',
        steps: [
          { say: 'A community is people living and working together.', visual: '🏘️' },
          { say: 'Helpers keep us safe: firefighters, doctors, teachers.', visual: '🚒👩\u200d⚕️' },
          { say: 'Rules help everyone get along and stay safe.' },
        ],
        quiz: [
          {
            q: 'Who helps you when you are sick?',
            choices: ['A doctor', 'A pilot', 'A painter'],
            answer: 'A doctor',
            hint: 'Think of the person at the clinic who checks your health.',
          },
        ],
      },
    ],
  },
];

export function unitsForSubject(subject: Subject): Unit[] {
  return CURRICULUM_6.filter((u) => u.subject === subject);
}

export function allLessonsForSubject(subject: Subject): Lesson[] {
  return unitsForSubject(subject).flatMap((u) => u.lessons);
}

export function getLesson(id: string): Lesson | undefined {
  for (const u of CURRICULUM_6) {
    const l = u.lessons.find((x) => x.id === id);
    if (l) return l;
  }
  return undefined;
}

/** Build a mixed "test" for a subject from all its quiz items. */
export function buildTest(subject: Subject, count = 5): QuizItem[] {
  const items = allLessonsForSubject(subject).flatMap((l) => l.quiz);
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
