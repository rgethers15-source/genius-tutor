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
  error?: string;
  /** True if this came from the real video service. */
  smart: boolean;
}

export interface VideoAvatarProvider {
  isAvailable(): boolean;
  /** Create a talking video of `imageDataUrl` saying `text`. */
  speakVideo(imageDataUrl: string, text: string): Promise<VideoResult>;
}

// --- Offline fallback: signals "use portrait animation instead" ---
export const offlineVideoProvider: VideoAvatarProvider = {
  isAvailable() {
    return false;
  },
  async speakVideo() {
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
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    return null;
  }
}

// --- D-ID provider ---
export function didVideoProvider(apiKey: string): VideoAvatarProvider {
  const AUTH = `Basic ${apiKey.trim()}`;
  return {
    isAvailable() {
      return apiKey.trim().length > 10;
    },
    async speakVideo(imageDataUrl, text) {
      try {
        // 0) Upload the avatar image to D-ID so it becomes a hosted URL.
        //    (D-ID's /talks source_url must be a reachable URL, not base64.)
        const sourceUrl = await uploadImage(imageDataUrl, AUTH);
        if (!sourceUrl) {
          return {
            ok: false,
            smart: false,
            error:
              'Could not upload the avatar to D-ID. Use a realistic face image (a generated or photo avatar), not the emoji placeholder.',
          };
        }

        // 1) Create a talk from the uploaded image.
        const createRes = await fetch('https://api.d-id.com/talks', {
          method: 'POST',
          headers: {
            Authorization: AUTH,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_url: sourceUrl,
            script: {
              type: 'text',
              input: text,
              provider: { type: 'microsoft', voice_id: 'en-US-GuyNeural' },
            },
          }),
        });
        if (!createRes.ok) {
          let detail = '';
          try {
            const err = await createRes.json();
            detail = err?.description || err?.message || '';
          } catch {
            /* ignore */
          }
          return {
            ok: false,
            smart: false,
            error: `D-ID could not make the video (${createRes.status}). ${detail}`.trim(),
          };
        }
        const created = await createRes.json();
        const id = created?.id;
        if (!id) return { ok: false, smart: false, error: 'D-ID: no talk id returned.' };

        // 2) Poll until the video is ready (short clips finish quickly).
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const statusRes = await fetch(`https://api.d-id.com/talks/${id}`, {
            headers: { Authorization: AUTH },
          });
          if (!statusRes.ok) continue;
          const status = await statusRes.json();
          if (status?.status === 'done' && status?.result_url) {
            return { ok: true, smart: true, videoUrl: status.result_url };
          }
          if (status?.status === 'error') {
            return { ok: false, smart: false, error: 'D-ID processing error.' };
          }
        }
        return { ok: false, smart: false, error: 'D-ID timed out. Try again.' };
      } catch (e) {
        return {
          ok: false,
          smart: false,
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
