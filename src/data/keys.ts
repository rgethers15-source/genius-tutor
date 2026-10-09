// ============================================================
// API keys are DEVICE-level credentials, not per-child settings.
// Store them once and share across every profile, so you don't have to
// re-enter the OpenAI / ElevenLabs / D-ID keys on each child's profile.
//
// Keys live in localStorage (local to the device only). A key saved on
// any profile is mirrored here and reused everywhere.
// ============================================================

import type { Profile } from '../types';

const K_OPENAI = 'gt_key_openai';
const K_ELEVEN = 'gt_key_eleven';
const K_DID = 'gt_key_did';

function get(k: string): string | undefined {
  try {
    return localStorage.getItem(k) ?? undefined;
  } catch {
    return undefined;
  }
}
function set(k: string, v: string | undefined) {
  try {
    if (v && v.trim()) localStorage.setItem(k, v.trim());
    else localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

/** Resolve the effective key: the profile's own, else the shared device key. */
export function openAiKeyFor(p: Profile): string | undefined {
  return (p.openAiKey && p.openAiKey.trim()) || get(K_OPENAI);
}
export function elevenKeyFor(p: Profile): string | undefined {
  return (p.elevenLabsKey && p.elevenLabsKey.trim()) || get(K_ELEVEN);
}
export function didKeyFor(p: Profile): string | undefined {
  return (p.didKey && p.didKey.trim()) || get(K_DID);
}

/** Mirror a profile's keys into the shared device store (call on save). */
export function syncKeysToDevice(p: Profile): void {
  if (p.openAiKey) set(K_OPENAI, p.openAiKey);
  if (p.elevenLabsKey) set(K_ELEVEN, p.elevenLabsKey);
  if (p.didKey) set(K_DID, p.didKey);
}

/** True if any OpenAI key is available (profile or device). */
export function hasOpenAi(p: Profile): boolean {
  const k = openAiKeyFor(p);
  return !!k && k.length > 10;
}
export function hasEleven(p: Profile): boolean {
  const k = elevenKeyFor(p);
  return !!k && k.length > 10;
}
export function hasDid(p: Profile): boolean {
  const k = didKeyFor(p);
  return !!k && k.length > 10;
}
