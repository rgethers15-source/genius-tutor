import type { AppData, Profile } from '../types';
import { MAX_PROFILES } from '../types';

// Bridge exposed by preload.ts
interface GeniusTutorBridge {
  loadData: () => Promise<AppData | null>;
  saveData: (data: AppData) => Promise<boolean>;
}

declare global {
  interface Window {
    geniusTutor?: GeniusTutorBridge;
  }
}

const EMPTY: AppData = { profiles: [], version: 1 };

// Fallback to localStorage when running in a plain browser (dev without Electron).
const LS_KEY = 'genius-tutor-data';

export async function loadData(): Promise<AppData> {
  if (window.geniusTutor) {
    const data = await window.geniusTutor.loadData();
    return data ?? EMPTY;
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AppData) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function saveData(data: AppData): Promise<boolean> {
  if (window.geniusTutor) {
    return window.geniusTutor.saveData(data);
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function canAddProfile(data: AppData): boolean {
  return data.profiles.length < MAX_PROFILES;
}

export function upsertProfile(data: AppData, profile: Profile): AppData {
  const idx = data.profiles.findIndex((p) => p.id === profile.id);
  const profiles = [...data.profiles];
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  return { ...data, profiles };
}

export function removeProfile(data: AppData, id: string): AppData {
  return { ...data, profiles: data.profiles.filter((p) => p.id !== id) };
}

export function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
