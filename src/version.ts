// Single source of truth for the app version shown in the UI.
// Keep in sync with package.json on each release.
export const APP_VERSION = '0.12.3';
export const RELEASES_URL =
  'https://github.com/rgethers15-source/genius-tutor/releases';
export const LATEST_RELEASE_API =
  'https://api.github.com/repos/rgethers15-source/genius-tutor/releases/latest';

export interface UpdateStatus {
  current: string;
  latest?: string;
  upToDate?: boolean;
  error?: string;
}

/** Compare semver-ish "x.y.z" strings. Returns true if a >= b. */
function gte(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return true;
}

/** Check GitHub for the latest release tag (best-effort; no auth). */
export async function checkForUpdate(): Promise<UpdateStatus> {
  try {
    const res = await fetch(LATEST_RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { current: APP_VERSION, error: `GitHub ${res.status}` };
    const data = await res.json();
    const latest: string = (data?.tag_name ?? '').replace(/^v/, '');
    if (!latest) return { current: APP_VERSION, error: 'No release found' };
    return {
      current: APP_VERSION,
      latest,
      upToDate: gte(APP_VERSION, latest),
    };
  } catch (e) {
    return {
      current: APP_VERSION,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
