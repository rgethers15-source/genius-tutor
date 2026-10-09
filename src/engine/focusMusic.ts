// ============================================================
// Focus music — real, instrumental lo-fi (not synth tones).
//
// Plays a looping playlist of CC0 (public-domain) lo-fi tracks bundled
// with the app (from the OpenLo-Fi collection). Auto-advances to the next
// track, loops the playlist, and supports volume + a caregiver-uploaded
// custom track. Importing via Vite `?url` guarantees the paths resolve in
// both dev and the packaged desktop build.
// ============================================================

import trackNeon from '../../public/music/rain-off-the-neon-signs.mp3?url';
import trackMoon from '../../public/music/elevator-to-the-moon.mp3?url';
import trackGlow from '../../public/music/midnight-window-glow.mp3?url';
import trackPuddles from '../../public/music/electric-puddles.mp3?url';
import trackHaze from '../../public/music/high-rise-haze.mp3?url';

export interface Track {
  title: string;
  url: string;
}

export const PLAYLIST: Track[] = [
  { title: 'Rain Off the Neon Signs', url: trackNeon },
  { title: 'Elevator to the Moon', url: trackMoon },
  { title: 'Midnight Window Glow', url: trackGlow },
  { title: 'Electric Puddles', url: trackPuddles },
  { title: 'High-Rise Haze', url: trackHaze },
];

let audio: HTMLAudioElement | null = null;
let index = 0;
let playing = false;
let volume = 0.18;
let ducked = false;
let customUrl: string | null = null;
let onChange: (() => void) | null = null;

function currentUrl(): string {
  return customUrl ?? PLAYLIST[index].url;
}

export function currentTitle(): string {
  return customUrl ? 'Your track' : PLAYLIST[index].title;
}

export function isPlaying(): boolean {
  return playing;
}

/** Subscribe to now-playing changes (for UI). */
export function onTrackChange(cb: (() => void) | null): void {
  onChange = cb;
}

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.addEventListener('ended', () => {
      // Custom track loops itself; playlist advances.
      if (customUrl) {
        audio!.currentTime = 0;
        void audio!.play().catch(() => { /* user gesture may be needed */ });
      } else {
        nextTrack();
      }
    });
  }
  return audio;
}

function loadAndPlay() {
  const a = ensureAudio();
  a.src = currentUrl();
  a.volume = volume * (ducked ? 0.2 : 1);
  void a.play().catch(() => {
    /* autoplay/user-gesture guard; button press will retry */
  });
  onChange?.();
}

export function startFocusMusic(vol = 0.18): void {
  volume = Math.max(0, Math.min(1, vol));
  playing = true;
  loadAndPlay();
}

export function stopFocusMusic(): void {
  playing = false;
  if (audio) audio.pause();
}

export function nextTrack(): void {
  if (customUrl) return; // custom track has no "next"
  index = (index + 1) % PLAYLIST.length;
  if (playing) loadAndPlay();
  else onChange?.();
}

export function prevTrack(): void {
  if (customUrl) return;
  index = (index - 1 + PLAYLIST.length) % PLAYLIST.length;
  if (playing) loadAndPlay();
  else onChange?.();
}

export function setVolume(vol: number): void {
  volume = Math.max(0, Math.min(1, vol));
  if (audio) audio.volume = volume * (ducked ? 0.2 : 1);
}

/** Load a caregiver-provided audio file (data URL) as the focus track. */
export function setCustomTrack(dataUrl: string | null): void {
  customUrl = dataUrl;
  if (playing) loadAndPlay();
  else onChange?.();
}

export function duckMusic(on: boolean): void {
  ducked = on;
  if (audio) audio.volume = volume * (ducked ? 0.2 : 1);
}
