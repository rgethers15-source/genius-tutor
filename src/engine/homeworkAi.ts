// ============================================================
// Homework Help engine.
//
// Two modes:
//  1) OFFLINE SCAFFOLD (default, no key): guides the child through a
//     proven "break it down" routine step by step. It cannot read/solve
//     the actual homework, and it says so honestly — but it teaches the
//     strategy good tutors use and keeps her moving with confidence.
//  2) SMART MODE (with an OpenAI key): sends the uploaded homework
//     (image or text) to a vision model that reads it and explains it in
//     simple, kid-friendly steps at her level.
//
// Configure smart mode by calling setHomeworkAi(openAiHomeworkProvider(key)).
// ============================================================

export interface HomeworkContext {
  learnerName: string;
  /** Grade the child is enrolled in. */
  grade: string;
  /** Reasoning level to pitch explanations to (e.g. "3"). */
  reasoningLevel: string;
  /** Special supports to honor. */
  dyslexia: boolean;
  adhd: boolean;
}

export interface HomeworkResponse {
  /** What the tutor says out loud (short, simple, step by step). */
  say: string;
  /** True if this came from real AI understanding of the upload. */
  smart: boolean;
}

export interface HomeworkAiProvider {
  /** `imageDataUrl` optional; `question` is any typed text from the child. */
  explain(
    ctx: HomeworkContext,
    question: string,
    imageDataUrl?: string
  ): Promise<HomeworkResponse>;
  /** Whether this provider can actually read/solve the homework. */
  isSmart(): boolean;
}

// --- Offline scaffold (honest, strategy-based) ---
const STEPS = [
  "Okay {name}, let's do this together! First, take a deep breath. You've got this. 🌟",
  "Step 1: Read the problem out loud with me, slowly. Point to each word.",
  "Step 2: Find the ONE thing it is asking you to do. Look for a question word.",
  "Step 3: Circle or point to any word you don't know. We'll figure it out.",
  "Step 4: Try the first small piece. Just the first step — not the whole thing.",
  "Step 5: Show me what you got! Even a guess is great. We learn by trying.",
];

export const offlineHomeworkProvider: HomeworkAiProvider = {
  isSmart() {
    return false;
  },
  async explain(ctx, question, _imageDataUrl) {
    const name = ctx.learnerName || 'friend';
    if (!question.trim() && !_imageDataUrl) {
      return {
        say: `Hi ${name}! Upload a picture of your homework, or type your question. Then I'll help you break it into tiny, easy steps!`,
        smart: false,
      };
    }
    // Rotate through the coaching steps so repeated taps advance the routine.
    const idx = Math.min(homeworkStep, STEPS.length - 1);
    homeworkStep = (homeworkStep + 1) % STEPS.length;
    return {
      say: STEPS[idx].replace('{name}', name),
      smart: false,
    };
  },
};

let homeworkStep = 0;

// --- Smart mode (OpenAI vision) — activated when a key is provided ---
export function openAiHomeworkProvider(apiKey: string): HomeworkAiProvider {
  return {
    isSmart() {
      return true;
    },
    async explain(ctx, question, imageDataUrl) {
      const system = [
        'You are a kind, patient tutor for a child.',
        `The child is named ${ctx.learnerName}, enrolled in grade ${ctx.grade},`,
        `but explain at a grade-${ctx.reasoningLevel} reasoning level.`,
        ctx.dyslexia ? 'They are dyslexic: use very short sentences and simple words.' : '',
        ctx.adhd ? 'They have ADHD: give ONE tiny step at a time, be encouraging.' : '',
        'Never give the final answer outright — guide them to it step by step.',
        'Be warm and celebrate effort.',
      ]
        .filter(Boolean)
        .join(' ');

      const content: unknown[] = [{ type: 'text', text: question || 'Please help me with this homework.' }];
      if (imageDataUrl) {
        content.push({ type: 'image_url', image_url: { url: imageDataUrl } });
      }

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content },
            ],
            max_tokens: 300,
          }),
        });
        if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
        const data = await res.json();
        const say = data?.choices?.[0]?.message?.content?.trim() || 'Let me help you step by step!';
        return { say, smart: true };
      } catch {
        return {
          say: "I couldn't reach my smart brain right now. Let's use our steps instead! Read the problem out loud with me first.",
          smart: false,
        };
      }
    },
  };
}

let activeHomeworkAi: HomeworkAiProvider = offlineHomeworkProvider;
export function getHomeworkAi(): HomeworkAiProvider {
  return activeHomeworkAi;
}
export function setHomeworkAi(p: HomeworkAiProvider) {
  activeHomeworkAi = p;
}
export function resetHomeworkRoutine() {
  homeworkStep = 0;
}
