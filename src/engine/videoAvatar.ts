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

// --- D-ID provider ---
export function didVideoProvider(apiKey: string): VideoAvatarProvider {
  const AUTH = `Basic ${apiKey.trim()}`;
  return {
    isAvailable() {
      return apiKey.trim().length > 10;
    },
    async speakVideo(imageDataUrl, text) {
      try {
        // 1) Create a talk. D-ID accepts a source image URL; data URLs work
        //    for many accounts, otherwise the caregiver hosts the image.
        const createRes = await fetch('https://api.d-id.com/talks', {
          method: 'POST',
          headers: {
            Authorization: AUTH,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_url: imageDataUrl,
            script: {
              type: 'text',
              input: text,
              provider: { type: 'microsoft', voice_id: 'en-US-GuyNeural' },
            },
          }),
        });
        if (!createRes.ok) {
          return { ok: false, smart: false, error: `D-ID create error ${createRes.status}` };
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
