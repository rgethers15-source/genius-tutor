// ============================================================
// D-ID talking-head VIDEO voice options.
//
// These are the voices baked into generated videos. The default set uses
// warm, natural MALE Microsoft Neural voices (available on D-ID without a
// voice-import plan). Pick one per tutor before pre-recording.
//
// Note: ElevenLabs voices can also be used in D-ID videos, but importing
// them requires a D-ID Pro/Advanced plan. These Microsoft options work on
// standard D-ID API plans.
// ============================================================

export interface VideoVoiceOption {
  id: string;
  label: string;
}

// Warm male voices suited for a kind tutor. (Microsoft Neural multilingual
// voices sound natural and expressive.)
export const VIDEO_VOICE_OPTIONS: VideoVoiceOption[] = [
  { id: 'en-US-AndrewMultilingualNeural', label: 'Andrew — warm & friendly' },
  { id: 'en-US-BrandonMultilingualNeural', label: 'Brandon — deep & confident' },
  { id: 'en-US-BrianMultilingualNeural', label: 'Brian — smooth & calm' },
  { id: 'en-US-TonyNeural', label: 'Tony — upbeat & clear' },
  { id: 'en-US-JasonNeural', label: 'Jason — relaxed storyteller' },
  { id: 'en-US-DavisNeural', label: 'Davis — mellow & steady' },
  { id: 'en-US-SteffanNeural', label: 'Steffan — bright & engaging' },
];

export function videoVoiceLabel(id: string): string {
  return VIDEO_VOICE_OPTIONS.find((v) => v.id === id)?.label ?? id;
}
