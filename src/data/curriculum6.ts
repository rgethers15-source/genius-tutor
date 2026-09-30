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

// ============================================================
// Expanded content — more lessons across every subject.
// Still simple language + tap-to-answer, pitched to ~3rd-grade reasoning.
// ============================================================
CURRICULUM_6.push(
  // ---- MATH: more ----
  {
    id: 'm-ee',
    subject: 'math',
    name: 'Math: Expressions (NC.6.EE)',
    lessons: [
      {
        id: 'm-ee-1',
        subject: 'math',
        standard: 'NC.6.EE.1',
        topic: 'What is a variable?',
        title: 'Letters that hold numbers',
        steps: [
          { say: 'Sometimes a letter stands for a number. We call it a variable.', visual: '🔤' },
          { say: 'Like: x = 3. Here x is holding the number 3.' },
          { say: 'So x + 2 means 3 + 2, which is 5!' },
        ],
        quiz: [
          {
            q: 'If x = 4, what is x + 1?',
            choices: ['5', '4', '1'],
            answer: '5',
            hint: 'Put 4 where x is. Then add 1. 4 + 1 = ?',
          },
        ],
      },
      {
        id: 'm-ee-2',
        subject: 'math',
        standard: 'NC.6.EE.2',
        topic: 'Simple addition of tens',
        title: 'Adding bigger numbers',
        steps: [
          { say: 'To add 20 + 30, first add the tens: 2 + 3 = 5.', visual: '🔢' },
          { say: 'Then put the zero back on: 50!' },
        ],
        quiz: [
          {
            q: 'What is 40 + 20?',
            choices: ['60', '42', '80'],
            answer: '60',
            hint: 'Add 4 + 2 = 6, then add the zero: 60.',
          },
        ],
      },
    ],
  },
  {
    id: 'm-g',
    subject: 'math',
    name: 'Math: Shapes (NC.6.G)',
    lessons: [
      {
        id: 'm-g-1',
        subject: 'math',
        standard: 'NC.6.G.1',
        topic: 'Area of a rectangle',
        title: 'How much space?',
        steps: [
          { say: 'Area is how much space is inside a shape.', visual: '⬛' },
          { say: 'For a rectangle: multiply the two sides.' },
          { say: 'A box 2 across and 3 down = 2 × 3 = 6 squares!' },
        ],
        quiz: [
          {
            q: 'A rectangle is 5 across and 2 down. What is its area?',
            choices: ['10', '7', '20'],
            answer: '10',
            hint: 'Multiply the sides: 5 × 2.',
          },
        ],
      },
    ],
  },

  // ---- READING: more ----
  {
    id: 'r-info',
    subject: 'reading',
    name: 'Reading: Facts (NC ELA)',
    lessons: [
      {
        id: 'r-info-1',
        subject: 'reading',
        standard: 'RI.6.2',
        topic: 'Fact vs. opinion',
        title: 'True or just a feeling?',
        steps: [
          { say: 'A FACT is something true you can check.', visual: '✅' },
          { say: 'An OPINION is what someone feels or likes.', visual: '💭' },
          { say: '"The sky is blue" is a fact. "Blue is the best" is an opinion.' },
        ],
        quiz: [
          {
            q: 'Which one is a FACT?',
            choices: ['Dogs have four legs.', 'Dogs are the best.', 'Dogs are cute.'],
            answer: 'Dogs have four legs.',
            hint: 'A fact is something you can count or check. Which can you check?',
          },
        ],
      },
    ],
  },

  // ---- WRITING: more ----
  {
    id: 'w-2',
    subject: 'writing',
    name: 'Writing: Capitals & Dots',
    lessons: [
      {
        id: 'w-2-1',
        subject: 'writing',
        standard: 'L.6.2',
        topic: 'Capital letters',
        title: 'When to use big letters',
        steps: [
          { say: 'We start every sentence with a BIG letter.', visual: '🔠' },
          { say: 'We also use big letters for names, like Madeline.' },
          { say: 'Every sentence ends with a dot (.) — that is a period.' },
        ],
        quiz: [
          {
            q: 'Which sentence is written correctly?',
            choices: ['The cat is soft.', 'the cat is soft', 'the Cat Is soft'],
            answer: 'The cat is soft.',
            hint: 'Big letter at the start, and a dot at the end.',
          },
        ],
      },
    ],
  },

  // ---- SCIENCE: more ----
  {
    id: 's-2',
    subject: 'science',
    name: 'Science: Earth & Sky',
    lessons: [
      {
        id: 's-2-1',
        subject: 'science',
        standard: 'NC.6.E',
        topic: 'Day and night',
        title: 'Why do we have night?',
        steps: [
          { say: 'The Earth spins around like a slow top.', visual: '🌍' },
          { say: 'When our side faces the sun, it is day. ☀️' },
          { say: 'When our side turns away, it is night. 🌙' },
        ],
        quiz: [
          {
            q: 'What makes it become night?',
            choices: ['Earth turns away from the sun', 'The sun breaks', 'The moon eats the sun'],
            answer: 'Earth turns away from the sun',
            hint: 'The Earth spins. Our side turns away from the sun.',
          },
        ],
      },
      {
        id: 's-2-2',
        subject: 'science',
        standard: 'NC.6.P',
        topic: 'Solid, liquid, gas',
        title: 'Three kinds of stuff',
        steps: [
          { say: 'Ice is a SOLID — it holds its shape.', visual: '🧊' },
          { say: 'Water is a LIQUID — it flows and pours.', visual: '💧' },
          { say: 'Steam is a GAS — it floats in the air.', visual: '💨' },
        ],
        quiz: [
          {
            q: 'Which one is a liquid?',
            choices: ['Water', 'Ice', 'A rock'],
            answer: 'Water',
            hint: 'A liquid can pour and flow. Which one pours?',
          },
        ],
      },
    ],
  },

  // ---- SOCIAL STUDIES: more ----
  {
    id: 'ss-2',
    subject: 'socialStudies',
    name: 'Social Studies: Maps & Money',
    lessons: [
      {
        id: 'ss-2-1',
        subject: 'socialStudies',
        standard: 'NC.6.G',
        topic: 'Reading a map',
        title: 'Which way is which?',
        steps: [
          { say: 'On a map, up is North and down is South.', visual: '🧭' },
          { say: 'Right is East, and left is West.' },
          { say: 'Remember: Never (N) Eat (E) Soggy (S) Waffles (W)!' },
        ],
        quiz: [
          {
            q: 'On a map, which way is up?',
            choices: ['North', 'South', 'West'],
            answer: 'North',
            hint: 'Up on a map is always North.',
          },
        ],
      },
    ],
  }
);

// A second wave of lessons for more variety and practice.
CURRICULUM_6.push(
  {
    id: 'm-sp',
    subject: 'math',
    name: 'Math: Data (NC.6.SP)',
    lessons: [
      {
        id: 'm-sp-1',
        subject: 'math',
        standard: 'NC.6.SP.5',
        topic: 'Finding the biggest number',
        title: 'Most and least',
        steps: [
          { say: 'Look at these numbers: 3, 7, 2. The biggest is 7!', visual: '📊' },
          { say: 'The smallest is 2. We just compare them.' },
        ],
        quiz: [
          {
            q: 'Which is the biggest? 4, 9, 1',
            choices: ['9', '4', '1'],
            answer: '9',
            hint: 'Which number is the most? Count up: 1, 4, 9.',
          },
          {
            q: 'Which is the smallest? 8, 5, 6',
            choices: ['5', '8', '6'],
            answer: '5',
            hint: 'The smallest is the least. 5 is less than 6 and 8.',
          },
        ],
      },
    ],
  },
  {
    id: 'r-vocab',
    subject: 'reading',
    name: 'Reading: New Words',
    lessons: [
      {
        id: 'r-vocab-1',
        subject: 'reading',
        standard: 'L.6.4',
        topic: 'Using context clues',
        title: 'Guessing a word',
        steps: [
          { say: 'If you see a hard word, look at the other words to help.', visual: '🔍' },
          { say: '"The huge elephant was very big." Huge means... big!' },
        ],
        quiz: [
          {
            q: '"The tiny ant was very small." What does tiny mean?',
            choices: ['Small', 'Loud', 'Fast'],
            answer: 'Small',
            hint: 'Look at the other words. It says "very small."',
          },
        ],
      },
    ],
  },
  {
    id: 'w-3',
    subject: 'writing',
    name: 'Writing: Telling a Story',
    lessons: [
      {
        id: 'w-3-1',
        subject: 'writing',
        standard: 'W.6.3',
        topic: 'Beginning, middle, end',
        title: 'Parts of a story',
        steps: [
          { say: 'Every story has 3 parts: a beginning, a middle, and an end.', visual: '1️⃣2️⃣3️⃣' },
          { say: 'The beginning tells who and where.' },
          { say: 'The middle is what happens. The end is how it finishes.' },
        ],
        quiz: [
          {
            q: 'Which part comes FIRST in a story?',
            choices: ['The beginning', 'The middle', 'The end'],
            answer: 'The beginning',
            hint: 'First, middle, last. Which is first?',
          },
        ],
      },
    ],
  },
  {
    id: 's-3',
    subject: 'science',
    name: 'Science: Animals',
    lessons: [
      {
        id: 's-3-1',
        subject: 'science',
        standard: 'NC.6.L',
        topic: 'Animal groups',
        title: 'Kinds of animals',
        steps: [
          { say: 'Some animals have fur, like a dog. They are mammals.', visual: '🐶' },
          { say: 'Some have feathers and fly. They are birds.', visual: '🐦' },
          { say: 'Some live in water and have fins. They are fish.', visual: '🐟' },
        ],
        quiz: [
          {
            q: 'Which animal is a bird?',
            choices: ['An eagle', 'A shark', 'A cow'],
            answer: 'An eagle',
            hint: 'A bird has feathers and can fly. Which one flies?',
          },
        ],
      },
    ],
  }
);

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
