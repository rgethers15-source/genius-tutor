import type { QuizItem } from '../data/curriculum6';
import type { Subject } from '../types';

// ============================================================
// AI question generator — creates UNLIMITED NC-aligned practice
// questions on demand, pitched to the learner's reasoning level.
//
// This is the honest path to "the full 6th-grade curriculum": instead
// of hand-writing thousands of items, the app asks OpenAI to generate
// fresh, standards-aligned questions for any subject/topic at the right
// level. Falls back to the built-in bank when no key or on error.
// ============================================================

const SUBJECT_TOPICS: Record<Subject, string> = {
  math: 'NC 6th-grade math (ratios, percents, negative numbers, variables/expressions, area/geometry, data/statistics)',
  reading: 'NC 6th-grade reading (main idea, fact vs opinion, context clues, character, sequence)',
  writing: 'NC 6th-grade writing/language (complete sentences, capitalization, punctuation, story structure, parts of speech)',
  science: 'NC 6th-grade science (living things, earth & sky, states of matter, animals, weather, energy)',
  socialStudies: 'NC 6th-grade social studies (community, maps/directions, government, geography, history)',
  art: 'elementary art concepts (colors, shapes, mixing, patterns)',
  music: 'elementary music concepts (rhythm, tempo, beat, instruments)',
  speech: 'phonics and speech sounds (letter sounds, blending, rhyming, clear pronunciation)',
  africanHeritage: 'African heritage and culture for kids (countries, famous Black leaders and inventors, Kente cloth, Kwanzaa, music, positive identity)',
};

export async function generateQuestions(
  apiKey: string,
  subject: Subject,
  reasoningLevel: string,
  count = 5
): Promise<QuizItem[]> {
  const topic = SUBJECT_TOPICS[subject];
  const system =
    `You write ${count} multiple-choice practice questions about ${topic}. ` +
    `The learner is in 6th grade but reasons at a grade-${reasoningLevel} level and is dyslexic. ` +
    'Use VERY short, simple words and one idea per question. Each question has exactly 3 short choices, ' +
    'one correct answer (must match one choice exactly), and a gentle one-sentence hint. ' +
    'Return ONLY valid JSON: an array of objects with keys q, choices (array of 3 strings), answer, hint. No extra text.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Make ${count} questions now.` },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const parsed = safeParseItems(content);
  return parsed.slice(0, count);
}

function safeParseItems(content: string): QuizItem[] {
  try {
    const obj = JSON.parse(content);
    // Model may return {questions:[...]} or a bare array.
    const arr: unknown[] = Array.isArray(obj)
      ? obj
      : Array.isArray(obj?.questions)
        ? obj.questions
        : Array.isArray(obj?.items)
          ? obj.items
          : [];
    return arr
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const choices = Array.isArray(r.choices) ? (r.choices as unknown[]).map(String) : [];
        return {
          q: String(r.q ?? r.question ?? ''),
          choices,
          answer: String(r.answer ?? ''),
          hint: String(r.hint ?? 'Take your time — you can do it!'),
        } as QuizItem;
      })
      .filter((it) => it.q && it.choices.length >= 2 && it.answer && it.choices.includes(it.answer));
  } catch {
    return [];
  }
}
