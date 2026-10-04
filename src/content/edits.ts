// Redigeret indhold: kun ryttere og kommissær kan ændres i appen.
// Ændringerne gemmes som et "patch" oven på standardindholdet i content.json,
// så nye regler i content.json slår igennem uden at overskrive redigeringer.
import type { Commissioner, Content, Rider } from './types';

export interface ContentEdits {
  riders?: Rider[];
  commissioner?: Commissioner;
}

export const MIN_RIDERS = 3;
export const MAX_RIDERS = 10;

export function applyEdits(base: Content, edits: ContentEdits): Content {
  return {
    ...base,
    riders: edits.riders ?? base.riders,
    commissioner: edits.commissioner ?? base.commissioner,
  };
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function cleanTraits(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string').map((t) => t.trim()).filter(Boolean).slice(0, 8) : [];
}

function cleanPhoto(v: unknown): string | null {
  return typeof v === 'string' && (v.startsWith('img/') || v.startsWith('idb:')) ? v : null;
}

/** Validerer og renser redigeringer (fx fra localStorage eller en importeret fil). */
export function sanitizeEdits(raw: unknown): ContentEdits {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: ContentEdits = {};
  if (Array.isArray(r.riders)) {
    const seen = new Set<string>();
    const riders: Rider[] = [];
    for (const x of r.riders) {
      if (!x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      let id = str(o.id) || newRiderId();
      while (seen.has(id)) id = newRiderId();
      seen.add(id);
      riders.push({
        id,
        number: Number.isFinite(Number(o.number)) ? Math.max(0, Math.round(Number(o.number))) : riders.length + 1,
        name: str(o.name, 'Ny rytter'),
        nickname: str(o.nickname),
        bio: str(o.bio),
        traits: cleanTraits(o.traits),
        photo: cleanPhoto(o.photo),
      });
    }
    if (riders.length >= MIN_RIDERS) out.riders = riders.slice(0, MAX_RIDERS);
  }
  if (r.commissioner && typeof r.commissioner === 'object') {
    const o = r.commissioner as Record<string, unknown>;
    out.commissioner = {
      name: str(o.name),
      title: str(o.title, 'Løbskommissær'),
      nickname: str(o.nickname),
      bio: str(o.bio),
      traits: cleanTraits(o.traits),
      photo: cleanPhoto(o.photo),
    };
  }
  return out;
}

export function newRiderId(): string {
  return 'r' + Math.random().toString(36).slice(2, 9);
}

export function nextRiderNumber(riders: Rider[]): number {
  const used = new Set(riders.map((r) => r.number));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

export function makeRider(riders: Rider[]): Rider {
  return {
    id: newRiderId(),
    number: nextRiderNumber(riders),
    name: 'Fornavn Efternavn',
    nickname: 'Kælenavnet fra Byen',
    bio: 'Skriv 2–3 sætninger om rytteren her.',
    traits: ['Egenskab', 'Egenskab', 'Egenskab'],
    photo: null,
  };
}

/** Alle foto-referencer i IndexedDB, som indholdet bruger. */
export function referencedPhotoKeys(content: Pick<Content, 'riders' | 'commissioner'>): string[] {
  return [...content.riders.map((r) => r.photo), content.commissioner.photo].filter((p): p is string => !!p && p.startsWith('idb:'));
}
