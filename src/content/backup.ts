// Eksport/import af hele opsætningen: redigeret indhold, fotos (som data-URL'er)
// og spiltilstand – samlet i én .json-fil.
import { referencedPhotoKeys, sanitizeEdits, type ContentEdits } from './edits';
import type { Content } from './types';

export const BACKUP_APP = 'le-tur-2026';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  content: ContentEdits;
  photos: Record<string, string>;
  game: unknown;
}

export interface PhotoIO {
  get: (key: string) => Promise<Blob | undefined>;
  toDataUrl: (b: Blob) => Promise<string>;
}

export async function buildBackup(content: Content, edits: ContentEdits, game: unknown, io: PhotoIO, now = new Date()): Promise<BackupFile> {
  const photos: Record<string, string> = {};
  for (const key of referencedPhotoKeys(content)) {
    const blob = await io.get(key);
    if (blob) photos[key] = await io.toDataUrl(blob);
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    content: edits,
    photos,
    game: game ?? null,
  };
}

export interface ParsedBackup {
  edits: ContentEdits;
  photos: Record<string, string>;
  game: unknown;
}

/** Læser og validerer en backup-fil. Kaster en fejl med dansk tekst ved ugyldigt indhold. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Filen er ikke gyldig JSON.');
  }
  if (!data || typeof data !== 'object') throw new Error('Filen er ikke en Le Tur-backup.');
  const d = data as Partial<BackupFile>;
  if (d.app !== BACKUP_APP) throw new Error('Filen er ikke en Le Tur 2026-backup.');
  if (typeof d.version !== 'number' || d.version > BACKUP_VERSION) throw new Error('Backuppen er fra en nyere version af appen.');
  const photos: Record<string, string> = {};
  if (d.photos && typeof d.photos === 'object') {
    for (const [k, v] of Object.entries(d.photos)) {
      if (k.startsWith('idb:') && typeof v === 'string' && v.startsWith('data:image/')) photos[k] = v;
    }
  }
  const edits = sanitizeEdits(d.content);
  // Fotoreferencer uden data i filen nulstilles, så rammen ikke står tom med en død nøgle.
  edits.riders = edits.riders?.map((r) => (r.photo?.startsWith('idb:') && !photos[r.photo] ? { ...r, photo: null } : r));
  if (edits.commissioner?.photo?.startsWith('idb:') && !photos[edits.commissioner.photo]) edits.commissioner = { ...edits.commissioner, photo: null };
  if (!edits.riders) delete edits.riders;
  return { edits, photos, game: d.game ?? null };
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `le-tur-2026-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
