import type { Profile } from '../types';

// ============================================================
// Per-tutor image gallery helpers.
//
// A tutor's gallery holds every image for that tutor — both the ones the
// caregiver uploaded and the ones generated with AI. One image is "active"
// (the face that animates, talks, and helps). These helpers keep the older
// single-image `tutorImages` field working by treating it as the first
// gallery entry, so nothing the family already added is ever lost.
// ============================================================

/** All images for a tutor: legacy upload (if any) + gallery, de-duplicated. */
export function galleryFor(profile: Profile, tutorId: string): string[] {
  const legacy = profile.tutorImages?.[tutorId];
  const gallery = profile.tutorGallery?.[tutorId] ?? [];
  const all = legacy ? [legacy, ...gallery] : [...gallery];
  return Array.from(new Set(all));
}

/** The active (talking) image for a tutor, or undefined for emoji fallback. */
export function activeImageFor(profile: Profile, tutorId: string): string | undefined {
  const chosen = profile.activeTutorImage?.[tutorId];
  const all = galleryFor(profile, tutorId);
  if (chosen && all.includes(chosen)) return chosen;
  return all[0]; // default to the first image if none explicitly chosen
}

/** Add an image (uploaded or generated) to a tutor's gallery + make it active. */
export function addToGallery(profile: Profile, tutorId: string, dataUrl: string): Profile {
  const existing = profile.tutorGallery?.[tutorId] ?? [];
  const next = existing.includes(dataUrl) ? existing : [...existing, dataUrl];
  return {
    ...profile,
    tutorGallery: { ...(profile.tutorGallery ?? {}), [tutorId]: next },
    activeTutorImage: { ...(profile.activeTutorImage ?? {}), [tutorId]: dataUrl },
  };
}

/** Choose which gallery image is the active/talking one. */
export function setActiveImage(profile: Profile, tutorId: string, dataUrl: string): Profile {
  return {
    ...profile,
    activeTutorImage: { ...(profile.activeTutorImage ?? {}), [tutorId]: dataUrl },
  };
}

/** Remove an image from a tutor's gallery (and legacy slot); fix active. */
export function removeFromGallery(profile: Profile, tutorId: string, dataUrl: string): Profile {
  const gallery = (profile.tutorGallery?.[tutorId] ?? []).filter((u) => u !== dataUrl);
  const legacy = profile.tutorImages?.[tutorId];
  const newLegacy = { ...(profile.tutorImages ?? {}) };
  if (legacy === dataUrl) delete newLegacy[tutorId];

  const active = profile.activeTutorImage?.[tutorId];
  const newActive = { ...(profile.activeTutorImage ?? {}) };
  if (active === dataUrl) delete newActive[tutorId];

  return {
    ...profile,
    tutorImages: newLegacy,
    tutorGallery: { ...(profile.tutorGallery ?? {}), [tutorId]: gallery },
    activeTutorImage: newActive,
  };
}
