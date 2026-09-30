// ============================================================
// AI avatar generation via OpenAI Images API (gpt-image-1).
//
// Generates NEW, original anime-style tutor portraits from a text prompt.
// Costs a few cents per image. Uses the caregiver's stored OpenAI key.
// Returns a data URL that gets added to the tutor's gallery.
//
// Honest limitation: this creates original art in the requested *style*.
// It cannot clone a specific reference face pixel-for-pixel.
// ============================================================

export interface GenerateResult {
  ok: boolean;
  dataUrl?: string;
  error?: string;
}

/** Anime style presets that match the semi-realistic look requested. */
export const STYLE_PRESETS: { id: string; label: string; prompt: string }[] = [
  {
    id: 'anime-hero',
    label: 'Anime Hero (silver hair)',
    prompt:
      'semi-realistic anime digital painting portrait of a friendly young male tutor, silver wavy hair, kind expressive eyes, soft studio lighting, warm and approachable, clean background',
  },
  {
    id: 'anime-dark',
    label: 'Anime Cool (dark hair)',
    prompt:
      'semi-realistic anime digital painting portrait of a friendly young male tutor, black tousled hair, warm amber eyes, gentle smile, dramatic soft lighting, clean background',
  },
  {
    id: 'anime-warm',
    label: 'Anime Warm (blonde)',
    prompt:
      'semi-realistic anime digital painting portrait of a friendly young male tutor, blonde wavy hair, soft green eyes, cozy warm lighting, kind and calm, clean background',
  },
  {
    id: 'anime-bright',
    label: 'Anime Bright (dark curls)',
    prompt:
      'vibrant anime illustration portrait of a friendly young male tutor, dark curly hair, brown eyes, warm sunset colors, cheerful and welcoming, clean background',
  },
];

/**
 * Base wrapper added to every prompt to keep results appropriate,
 * consistent, and portrait-shaped for the avatar frame.
 */
function buildPrompt(userPrompt: string): string {
  const base =
    'A single character portrait, head and shoulders, facing forward, ' +
    'appropriate for a children\'s educational app, no text, no watermark. Style: ';
  return base + userPrompt;
}

/**
 * Generate one avatar image. Returns a data URL (base64) on success.
 */
export async function generateAvatar(
  apiKey: string,
  prompt: string
): Promise<GenerateResult> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { ok: false, error: 'No valid OpenAI API key. Add one in Settings.' };
  }
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: buildPrompt(prompt),
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!res.ok) {
      let msg = `OpenAI error ${res.status}`;
      try {
        const err = await res.json();
        if (err?.error?.message) msg = err.error.message;
      } catch {
        /* keep default */
      }
      return { ok: false, error: msg };
    }

    const data = await res.json();
    const item = data?.data?.[0];
    // gpt-image-1 returns b64_json by default.
    if (item?.b64_json) {
      return { ok: true, dataUrl: `data:image/png;base64,${item.b64_json}` };
    }
    if (item?.url) {
      return { ok: true, dataUrl: item.url };
    }
    return { ok: false, error: 'No image returned by OpenAI.' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const friendly = /failed to fetch|networkerror|load failed/i.test(msg)
      ? 'Could not reach OpenAI. Check your internet connection, and make sure your OpenAI account has image generation and billing enabled.'
      : msg;
    return { ok: false, error: friendly };
  }
}
