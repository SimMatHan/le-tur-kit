import { useEffect, useState } from 'react';
import { builtinImage } from './images';

/**
 * Slår et foto op: indbygget sti ("img/…") eller en IndexedDB-nøgle ("idb:…").
 * IndexedDB-delen kobles på i photoStore (fase 2).
 */
type Resolver = (ref: string) => Promise<string | undefined>;
let idbResolver: Resolver | null = null;
const listeners = new Set<() => void>();

export function setPhotoResolver(r: Resolver) {
  idbResolver = r;
  notifyPhotosChanged();
}

export function notifyPhotosChanged() {
  listeners.forEach((l) => l());
}

export function usePhotoUrl(ref: string | null | undefined): string | undefined {
  const builtin = builtinImage(ref);
  const [url, setUrl] = useState<string | undefined>(builtin);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!ref) setUrl(undefined);
    else if (builtin) setUrl(builtin);
    else if (idbResolver) idbResolver(ref).then((u) => alive && setUrl(u));
    else setUrl(undefined);
    return () => {
      alive = false;
    };
  }, [ref, builtin, tick]);

  return url;
}
