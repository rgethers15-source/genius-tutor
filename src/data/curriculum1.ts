import type { Subject } from '../types';
import type { Lesson, Unit } from './curriculum6';

// ============================================================
// NC 1st-Grade Curriculum (for McKenzie).
//
// Built on the North Carolina Standard Course of Study for Grade 1:
//   Math (NC.1): add/subtract within 20 (fluent within 10), place value,
//                measurement, geometry.
//   ELA: Foundational Skills (phonics, phonological awareness, letter
//        knowledge), Reading, Writing, Language.
//   Plus Science, Social Studies, Art, Music, Speech, and African Heritage.
// Simple words, short steps, tap-to-answer, kinetic-friendly.
// Sources (public domain, NC DPI): 1st-unpacking math + grade-1 ELA SCOS.
// ============================================================

export const CURRICULUM_1: Unit[] = [
  // ---------------- MATH ----------------
  {
    id: 'g1-m-add',
    subject: 'math',
    name: 'Math: Adding (NC.1.OA)',
    lessons: [
      {
        id: 'g1-m-add-1',
        subject: 'math',
        standard: 'NC.1.OA.6',
        topic: 'Adding within 10',
        title: 'Putting together',
        steps: [
          { say: 'Adding means putting groups together.', visual: '🍎➕🍎' },
          { say: '2 apples and 1 apple makes 3 apples!' },
          { say: 'Use your fingers to help. You can do it!' },
        ],
        quiz: [
          { q: 'What is 2 + 2?', choices: ['4', '3', '5'], answer: '4', hint: 'Hold up 2 fingers, then 2 more. Count them all!' },
          { q: 'What is 3 + 1?', choices: ['4', '2', '5'], answer: '4', hint: 'Start at 3, then count one more: 4.' },
        ],
      },
      {
        id: 'g1-m-sub-1',
        subject: 'math',
        standard: 'NC.1.OA.6',
        topic: 'Subtracting within 10',
        title: 'Taking away',
        steps: [
          { say: 'Subtract means take some away.', visual: '🍪➖🍪' },
          { say: 'You have 3 cookies. Eat 1. Now you have 2!' },
        ],
        quiz: [
          { q: 'What is 5 - 1?', choices: ['4', '6', '3'], answer: '4', hint: 'Start at 5 and count back one: 4.' },
        ],
      },
    ],
  },
  {
    id: 'g1-m-count',
    subject: 'math',
    name: 'Math: Counting (NC.1.NBT)',
    lessons: [
      {
        id: 'g1-m-count-1',
        subject: 'math',
        standard: 'NC.1.NBT.1',
        topic: 'Counting to 20',
        title: 'Big counting',
        steps: [
          { say: "Let's count! Clap each number: 1, 2, 3…", visual: '🔢' },
          { say: 'After 10 comes 11, 12, 13… all the way to 20!' },
        ],
        quiz: [
          { q: 'What number comes after 11?', choices: ['12', '10', '20'], answer: '12', hint: 'Count up: 10, 11, then…?' },
        ],
      },
    ],
  },

  // ---------------- READING ----------------
  {
    id: 'g1-r',
    subject: 'reading',
    name: 'Reading: Sounds & Words',
    lessons: [
      {
        id: 'g1-r-1',
        subject: 'reading',
        standard: 'RF.1.3',
        topic: 'Beginning sounds',
        title: 'First sounds',
        steps: [
          { say: 'Every word starts with a sound.', visual: '🔤' },
          { say: 'Cat starts with "c". Dog starts with "d".' },
        ],
        quiz: [
          { q: 'What sound does "sun" start with?', choices: ['s', 'm', 't'], answer: 's', hint: 'Say it slow: sss-un.' },
        ],
      },
      {
        id: 'g1-r-2',
        subject: 'reading',
        standard: 'RF.1.3',
        topic: 'Rhyming words',
        title: 'Words that rhyme',
        steps: [
          { say: 'Rhyming words sound the same at the end.', visual: '🐱🎩' },
          { say: 'Cat and hat rhyme! So do dog and log.' },
        ],
        quiz: [
          { q: 'Which word rhymes with "cat"?', choices: ['hat', 'dog', 'sun'], answer: 'hat', hint: 'Which one ends with the "at" sound?' },
        ],
      },
    ],
  },

  // ---------------- WRITING ----------------
  {
    id: 'g1-w',
    subject: 'writing',
    name: 'Writing: My Letters',
    lessons: [
      {
        id: 'g1-w-1',
        subject: 'writing',
        standard: 'L.1.1',
        topic: 'Capital letters & names',
        title: 'Big letter for names',
        steps: [
          { say: 'Names start with a BIG letter.', visual: '🔠' },
          { say: 'McKenzie starts with a big M!' },
        ],
        quiz: [
          { q: 'Which name is written right?', choices: ['Maya', 'maya', 'mAYA'], answer: 'Maya', hint: 'The first letter should be big.' },
        ],
      },
    ],
  },

  // ---------------- SCIENCE ----------------
  {
    id: 'g1-s',
    subject: 'science',
    name: 'Science: My World',
    lessons: [
      {
        id: 'g1-s-1',
        subject: 'science',
        standard: 'NC.1.L',
        topic: 'Living and not living',
        title: 'Alive or not?',
        steps: [
          { say: 'Living things grow and need food and water.', visual: '🌱' },
          { say: 'A dog is living. A rock is not living.' },
        ],
        quiz: [
          { q: 'Which one is living?', choices: ['A tree', 'A chair', 'A spoon'], answer: 'A tree', hint: 'Which one grows?' },
        ],
      },
    ],
  },

  // ---------------- SOCIAL STUDIES ----------------
  {
    id: 'g1-ss',
    subject: 'socialStudies',
    name: 'Social Studies: My Family',
    lessons: [
      {
        id: 'g1-ss-1',
        subject: 'socialStudies',
        standard: 'NC.1.C&G',
        topic: 'Family and helpers',
        title: 'People who care for us',
        steps: [
          { say: 'A family is people who love and help each other.', visual: '👨‍👩‍👧' },
          { say: 'Teachers, doctors, and firefighters help us too.' },
        ],
        quiz: [
          { q: 'Who helps you learn at school?', choices: ['A teacher', 'A fish', 'A cloud'], answer: 'A teacher', hint: 'Who stands at the front of your class?' },
        ],
      },
    ],
  },

  // ---------------- ART ----------------
  {
    id: 'g1-art',
    subject: 'art',
    name: 'Art: Colors & Shapes',
    lessons: [
      {
        id: 'g1-art-1',
        subject: 'art',
        standard: 'NC.1.V',
        topic: 'Primary colors',
        title: 'Magic colors',
        steps: [
          { say: 'Red, blue, and yellow are the main colors.', visual: '🔴🔵🟡' },
          { say: 'Mix blue and yellow to make green!' },
        ],
        quiz: [
          { q: 'Blue and yellow make what color?', choices: ['Green', 'Pink', 'Black'], answer: 'Green', hint: 'Think of grass!' },
        ],
      },
    ],
  },

  // ---------------- MUSIC ----------------
  {
    id: 'g1-mu',
    subject: 'music',
    name: 'Music: Beat & Rhythm',
    lessons: [
      {
        id: 'g1-mu-1',
        subject: 'music',
        standard: 'NC.1.MU',
        topic: 'Keeping a beat',
        title: 'Clap the beat',
        steps: [
          { say: 'Music has a beat — like a heartbeat!', visual: '🥁' },
          { say: 'Clap slow, then clap fast with me!' },
        ],
        quiz: [
          { q: 'A drum helps us keep the…', choices: ['Beat', 'Color', 'Letter'], answer: 'Beat', hint: 'Boom boom boom — that is the…?' },
        ],
      },
    ],
  },

  // ---------------- SPEECH ----------------
  {
    id: 'g1-sp',
    subject: 'speech',
    name: 'Speech: Sounds I Make',
    lessons: [
      {
        id: 'g1-sp-1',
        subject: 'speech',
        standard: 'RF.1.2',
        topic: 'Letter sounds',
        title: 'Say the sound',
        steps: [
          { say: 'B makes the first sound in ball. Close your lips, then release a short voiced sound.', visual: '🅱️' },
          { say: 'Say ball with me. Now try just its first sound. Keep it brief without adding an extra vowel.' },
        ],
        quiz: [
          { q: 'What sound does M make?', choices: ['mmm', 'sss', '/p/'], answer: 'mmm', hint: 'Hum it: mmmm, like yummy!' },
        ],
      },
    ],
  },

  // ---------------- AFRICAN HERITAGE ----------------
  {
    id: 'g1-ah',
    subject: 'africanHeritage',
    name: 'African Heritage: My Roots',
    lessons: [
      {
        id: 'g1-ah-1',
        subject: 'africanHeritage',
        standard: 'Heritage',
        topic: 'The continent of Africa',
        title: 'Beautiful Africa',
        steps: [
          { say: 'Africa is a big, beautiful continent.', visual: '🌍' },
          { say: 'Many of our families and ancestors came from Africa.' },
          { say: 'It has lions, drums, and bright, colorful clothes!' },
        ],
        quiz: [
          { q: 'Africa is a big…', choices: ['Continent', 'Toy', 'Snack'], answer: 'Continent', hint: 'A continent is a huge piece of land.' },
        ],
      },
      {
        id: 'g1-ah-2',
        subject: 'africanHeritage',
        standard: 'Heritage',
        topic: 'Kente cloth & colors',
        title: 'Royal colors',
        steps: [
          { say: 'Kente cloth is bright and full of patterns.', visual: '👘' },
          { say: 'Kings and queens in Africa wore beautiful cloth. You are royal too! 👑' },
        ],
        quiz: [
          { q: 'Kente cloth is known for being…', choices: ['Colorful', 'Gray', 'Plain'], answer: 'Colorful', hint: 'It has lots of bright colors and patterns.' },
        ],
      },
      {
        id: 'g1-ah-3',
        subject: 'africanHeritage',
        standard: 'Heritage',
        topic: 'Great Black heroes',
        title: 'Amazing heroes',
        steps: [
          { say: 'Many Black heroes changed the world with kindness and courage.', visual: '⭐' },
          { say: 'You can be a hero too — by being brave and kind!' },
        ],
        quiz: [
          { q: 'A hero is someone who is…', choices: ['Brave and kind', 'Mean', 'Sleepy'], answer: 'Brave and kind', hint: 'Heroes help others and are not afraid to do good.' },
        ],
      },
    ],
  },
];

export function units1ForSubject(subject: Subject): Unit[] {
  return CURRICULUM_1.filter((u) => u.subject === subject);
}

export function allLessons1ForSubject(subject: Subject): Lesson[] {
  return units1ForSubject(subject).flatMap((u) => u.lessons);
}
