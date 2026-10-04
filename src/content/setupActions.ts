// Handlinger for hele opsætningen: eksport, import og nulstil.
// Import og nulstil genindlæser siden, så alt (indhold, fotos, spil) er konsistent.
import { backupFileName, buildBackup, parseBackup } from './backup';
import type { ContentEdits } from './edits';
import { blobToDataUrl, clearPhotos, dataUrlToBlob, getPhoto, putPhoto } from './photoStore';
import { CONTENT_KEY, GAME_KEY, readJson, writeJson } from './storage';
import type { Content } from './types';

export async function exportSetup(content: Content, edits: ContentEdits): Promise<void> {
  const backup = await buildBackup(content, edits, readJson(GAME_KEY), { get: getPhoto, toDataUrl: blobToDataUrl });
  const blob = new Blob([JSON.stringify(backup, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importSetup(file: File): Promise<void> {
  const parsed = parseBackup(await file.text());
  await clearPhotos();
  for (const [key, dataUrl] of Object.entries(parsed.photos)) {
    await putPhoto(await dataUrlToBlob(dataUrl), key);
  }
  writeJson(CONTENT_KEY, parsed.edits);
  writeJson(GAME_KEY, parsed.game ?? undefined);
  location.reload();
}

export async function resetAll(): Promise<void> {
  writeJson(CONTENT_KEY, undefined);
  writeJson(GAME_KEY, undefined);
  await clearPhotos();
  location.reload();
}
