// Fotos gemmes i IndexedDB (for store til localStorage). Nøgler: "idb:<id>".
// Falder tilbage til hukommelsen, hvis IndexedDB ikke er tilgængelig.
import { notifyPhotosChanged, setPhotoResolver } from './photos';

const DB_NAME = 'le-tur-2026';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, Blob>();
const urlCache = new Map<string, string>();

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('IndexedDB utilgængelig – fotos gemmes kun indtil siden lukkes');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        if (!db) return resolve(undefined);
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(req.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

const idOf = (key: string) => key.replace(/^idb:/, '');

// crypto.randomUUID kræver "secure context" – brug en simpel id-generator, der også virker på file://.
const randomId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** Gemmes fotos permanent (IndexedDB), eller kun i hukommelsen indtil siden lukkes? */
export async function photosArePersistent(): Promise<boolean> {
  return (await openDb()) !== null;
}

export async function putPhoto(blob: Blob, key = 'idb:' + randomId()): Promise<string> {
  memory.set(key, blob);
  await tx('readwrite', (s) => s.put(blob, idOf(key)));
  revoke(key);
  notifyPhotosChanged();
  return key;
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  if (memory.has(key)) return memory.get(key);
  const b = await tx<Blob>('readonly', (s) => s.get(idOf(key)) as IDBRequest<Blob>);
  if (b) memory.set(key, b);
  return b;
}

export async function deletePhoto(key: string): Promise<void> {
  memory.delete(key);
  revoke(key);
  await tx('readwrite', (s) => s.delete(idOf(key)));
}

export async function clearPhotos(): Promise<void> {
  memory.clear();
  [...urlCache.keys()].forEach(revoke);
  await tx('readwrite', (s) => s.clear());
  notifyPhotosChanged();
}

/** Slet fotos, som ikke længere bruges af indholdet. */
export async function prunePhotos(keep: string[]): Promise<void> {
  const keys = (await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys())) ?? [];
  const keepIds = new Set(keep.map(idOf));
  await Promise.all(keys.filter((k) => !keepIds.has(String(k))).map((k) => deletePhoto('idb:' + String(k))));
}

function revoke(key: string) {
  const u = urlCache.get(key);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(key);
}

async function resolveUrl(key: string): Promise<string | undefined> {
  if (urlCache.has(key)) return urlCache.get(key);
  const b = await getPhoto(key);
  if (!b) return undefined;
  const u = URL.createObjectURL(b);
  urlCache.set(key, u);
  return u;
}

export function installPhotoStore() {
  setPhotoResolver(resolveUrl);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!m) throw new Error('Ugyldig data-URL');
  const mime = m[1] || 'application/octet-stream';
  if (m[2]) {
    const bin = atob(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(m[3])], { type: mime });
}
