// Lokal lagring. Alle nøgler har et præfiks, fordi file:// kan dele
// localStorage med andre lokale HTML-filer.
export const STORAGE_PREFIX = 'le-tur-2026:';
export const CONTENT_KEY = STORAGE_PREFIX + 'content';
export const GAME_KEY = STORAGE_PREFIX + 'game';

export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('Kunne ikke gemme i localStorage', e);
    return false;
  }
}
