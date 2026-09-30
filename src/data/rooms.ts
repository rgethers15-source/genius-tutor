// ============================================================
// Study rooms — the immersive spaces the tutors teach in.
//
// Each room has a calm, cozy "lofi study" vibe. Built-in rooms use
// soft gradient backdrops (always available, no assets needed). The
// caregiver can also upload their own room images (e.g. the chill
// lofi bedroom/loft references) which replace the gradient per room.
// ============================================================

export interface StudyRoom {
  id: string;
  name: string;
  emoji: string;
  /** CSS background used when no custom image is uploaded for this room. */
  gradient: string;
  vibe: string;
}

export const STUDY_ROOMS: StudyRoom[] = [
  {
    id: 'room-lofi-loft',
    name: 'Chill Lofi Loft',
    emoji: '🌆',
    gradient:
      'linear-gradient(160deg, #2a1d2e 0%, #3a2436 45%, #4a2e2e 100%)',
    vibe: 'A cozy city loft at sunset — warm lamps, big window, lofi beats.',
  },
  {
    id: 'room-cozy-bedroom',
    name: 'Cozy Study Bedroom',
    emoji: '🛏️',
    gradient:
      'linear-gradient(160deg, #241826 0%, #33202f 50%, #3d2a2a 100%)',
    vibe: 'A warm bedroom desk with fairy lights and plants.',
  },
  {
    id: 'room-night-window',
    name: 'Rainy Night Window',
    emoji: '🌧️',
    gradient:
      'linear-gradient(160deg, #1b1626 0%, #241d33 55%, #2a2338 100%)',
    vibe: 'Soft rain on the window, low lamp light, calm and quiet.',
  },
  {
    id: 'room-sunset-cafe',
    name: 'Golden Café Corner',
    emoji: '☕',
    gradient:
      'linear-gradient(160deg, #2e2016 0%, #43301d 50%, #4a2e26 100%)',
    vibe: 'A warm café nook with golden light and gentle background hum.',
  },
];

export function getRoom(id: string | undefined): StudyRoom {
  return STUDY_ROOMS.find((r) => r.id === id) ?? STUDY_ROOMS[0];
}
