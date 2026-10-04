// ============================================================
// Talking-head video avatars (D-ID).
//
// Turns the active tutor portrait + a line of text into a short video
// where the face actually speaks with realistic lip movement. This is a
// PAID service (D-ID) needing its own API key and per-video cost.
//
// If no key is set, the app falls back to the built-in portrait animation
// (AnimatedAvatar) + Web Speech voice — which is free and always works.
// ============================================================

export interface VideoResult {
  ok: boolean;
  /** URL to the generated talking-head video (mp4). */
  videoUrl?: string;
  /** The raw mp4 blob, so the caller can cache it to disk. */
  blob?: Blob;
  error?: string;
  /** True if this came from the real video service. */
  smart: boolean;
  /** Step-by-step debug log so we can see exactly what happened. */
  debug?: string[];
}

/** Voice selection for the talking-head video. */
export interface VideoVoice {
  /** 'microsoft' (built into D-ID) or 'elevenlabs' (needs D-ID import). */
  provider: 'microsoft' | 'elevenlabs';
  voiceId: string;
}

export interface VideoAvatarProvider {
  isAvailable(): boolean;
  /** Create a talking video of `imageDataUrl` saying `text`. */
  speakVideo(imageDataUrl: string, text: string, voice?: VideoVoice): Promise<VideoResult>;
}

// --- Offline fallback: signals "use portrait animation instead" ---
export const offlineVideoProvider: VideoAvatarProvider = {
  isAvailable() {
    return false;
  },
  async speakVideo(): Promise<VideoResult> {
    return { ok: false, smart: false, error: 'Video avatars need a D-ID key.' };
  },
};

// Uploads a data-URL image to D-ID's /images endpoint and returns the
// hosted URL D-ID can use as a talk source. Returns null on failure.
async function uploadImage(imageDataUrl: string, auth: string): Promise<string | null> {
  try {
    // If it's already an http(s) URL, use it directly.
    if (/^https?:\/\//i.test(imageDataUrl)) return imageDataUrl;

    const blob = await (await fetch(imageDataUrl)).blob();
    const form = new FormData();
    form.append('image', blob, 'avatar.png');
    const res = await fetch('https://api.d-id.com/images', {
      method: 'POST',
      headers: { Authorization: auth }, // do NOT set Content-Type; browser sets multipart boundary
      body: form,
    });
    if (!res.ok) {
      // Surface auth problems specifically — the most common failure.
      lastUploadError =
        res.status === 401
          ? 'D-ID rejected the key (401). In the app it must be the full API_USER:API_PASSWORD from the D-ID Studio.'
          : `D-ID image upload failed (${res.status}).`;
      return null;
    }
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    lastUploadError = 'Could not reach D-ID to upload the image.';
    return null;
  }
}

let lastUploadError = '';

// --- D-ID provider ---
export function didVideoProvider(apiKey: string): VideoAvatarProvider {
  // D-ID keys are "API_USER:API_PASSWORD" and sent as `Basic <key>` RAW
  // (per D-ID docs) — NOT standard base64 Basic auth. Normalize common
  // paste mistakes: strip an accidental leading "Basic ".
  const raw = apiKey.trim().replace(/^Basic\s+/i, '');
  const AUTH = `Basic ${raw}`;
  return {
    isAvailable() {
      return apiKey.trim().length > 10;
    },
    async speakVideo(imageDataUrl, text, voice): Promise<VideoResult> {
      const debug: string[] = [];
      // Default to a warm, natural Microsoft voice (better than "Guy").
      // Caller can pass an ElevenLabs voice (requires D-ID import on Pro+).
      const scriptProvider =
        voice?.provider === 'elevenlabs'
          ? { type: 'elevenlabs', voice_id: voice.voiceId }
          : { type: 'microsoft', voice_id: voice?.voiceId || 'en-US-DavisNeural' };
      try {
        // 0) Upload the avatar image to D-ID so it becomes a hosted URL.
        lastUploadError = '';
        debug.push('Uploading avatar image to D-ID…');
        const sourceUrl = await uploadImage(imageDataUrl, AUTH);
        if (!sourceUrl) {
          return {
            ok: false,
            smart: false,
            debug,
            error:
              lastUploadError ||
              'Could not upload the avatar. Use a realistic face image (generated or photo), not the emoji placeholder.',
          };
        }
        debug.push(`Image hosted: ${sourceUrl.slice(0, 60)}…`);

        // 1) Create a talk from the uploaded image.
        debug.push('Creating talk…');
        const createRes = await fetch('https://api.d-id.com/talks', {
          method: 'POST',
          headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: sourceUrl,
            script: {
              type: 'text',
              input: text,
              provider: scriptProvider,
            },
          }),
        });
        if (!createRes.ok) {
          let detail = '';
          try {
            const err = await createRes.json();
            detail = err?.description || err?.message || JSON.stringify(err);
          } catch {
            /* ignore */
          }
          let friendly = `D-ID create failed (${createRes.status}). ${detail}`.trim();
          if (createRes.status === 403) {
            friendly =
              'D-ID said 403 Forbidden — your D-ID plan does not allow API video creation, or API credits are used up. ' +
              'Log in at studio.d-id.com → Account settings and check that your plan includes API access and has credits. ' +
              'Talking-head videos need a D-ID API plan.';
          } else if (createRes.status === 402) {
            friendly = 'D-ID said 402 — out of credits. Add credits in your D-ID account to make videos.';
          } else if (createRes.status === 401) {
            friendly = 'D-ID said 401 — the API key is wrong. Re-paste the full API_USER:API_PASSWORD in Settings.';
          }
          return { ok: false, smart: false, debug, error: friendly };
        }
        const created = await createRes.json();
        const id = created?.id;
        if (!id) return { ok: false, smart: false, debug, error: 'D-ID: no talk id returned.' };
        debug.push(`Talk id: ${id}. Waiting for video…`);

        // 2) Poll until ready (up to ~45s).
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const statusRes = await fetch(`https://api.d-id.com/talks/${id}`, {
            headers: { Authorization: AUTH },
          });
          if (!statusRes.ok) {
            debug.push(`Poll ${i + 1}: status check ${statusRes.status}`);
            continue;
          }
          const status = await statusRes.json();
          debug.push(`Poll ${i + 1}: ${status?.status ?? 'unknown'}`);
          if (status?.status === 'done' && status?.result_url) {
            // Fetch the finished video as a blob so it plays reliably in
            // Electron regardless of signed-URL / CSP quirks.
            try {
              const vidRes = await fetch(status.result_url);
              if (vidRes.ok) {
                const blob = await vidRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                debug.push('Video ready (loaded as blob).');
                return { ok: true, smart: true, videoUrl: blobUrl, blob, debug };
              }
            } catch {
              /* fall back to direct URL below */
            }
            debug.push('Video ready (direct URL).');
            return { ok: true, smart: true, videoUrl: status.result_url, debug };
          }
          if (status?.status === 'error') {
            return {
              ok: false,
              smart: false,
              debug,
              error: `D-ID processing error: ${status?.error?.description ?? 'unknown'}`,
            };
          }
        }
        return { ok: false, smart: false, debug, error: 'D-ID timed out after ~45s. Try again.' };
      } catch (e) {
        return {
          ok: false,
          smart: false,
          debug,
          error: e instanceof Error ? e.message : 'Network error reaching D-ID.',
        };
      }
    },
  };
}

let activeVideo: VideoAvatarProvider = offlineVideoProvider;
export function getVideoAvatar(): VideoAvatarProvider {
  return activeVideo;
}
export function setVideoAvatar(p: VideoAvatarProvider) {
  activeVideo = p;
}
