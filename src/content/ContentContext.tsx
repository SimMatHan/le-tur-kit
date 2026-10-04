import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import defaultContentJson from './content.json';
import { applyEdits, makeRider, MAX_RIDERS, MIN_RIDERS, sanitizeEdits, type ContentEdits } from './edits';
import { deletePhoto, putPhoto } from './photoStore';
import { CONTENT_KEY, readJson, writeJson } from './storage';
import type { Commissioner, Content, Rider, Stage } from './types';

export const defaultContent = defaultContentJson as unknown as Content;

/** "commissioner" eller en rytters id. */
export type PersonRef = 'commissioner' | string;

interface ContentCtx {
  content: Content;
  edits: ContentEdits;
  saveFailed: boolean;
  updateRider: (id: string, patch: Partial<Rider>) => void;
  updateCommissioner: (patch: Partial<Commissioner>) => void;
  /** Tilføjer en rytter og returnerer dens id (null hvis maks. er nået). */
  addRider: () => string | null;
  removeRider: (id: string) => boolean;
  setPhoto: (who: PersonRef, photo: Blob | null) => Promise<void>;
}

const Ctx = createContext<ContentCtx | null>(null);

export function ContentProvider({ children, initialEdits }: { children: ReactNode; initialEdits?: ContentEdits }) {
  const [edits, setEdits] = useState<ContentEdits>(() => initialEdits ?? sanitizeEdits(readJson(CONTENT_KEY)));
  const [saveFailed, setSaveFailed] = useState(false);
  const content = useMemo(() => applyEdits(defaultContent, edits), [edits]);
  const contentRef = useRef(content);
  contentRef.current = content;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveFailed(!writeJson(CONTENT_KEY, edits));
  }, [edits]);

  const setRiders = useCallback((fn: (riders: Rider[]) => Rider[]) => {
    setEdits((e) => ({ ...e, riders: fn(e.riders ?? defaultContent.riders) }));
  }, []);

  const updateRider = useCallback(
    (id: string, patch: Partial<Rider>) => setRiders((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch, id: r.id } : r))),
    [setRiders],
  );

  const updateCommissioner = useCallback((patch: Partial<Commissioner>) => {
    setEdits((e) => ({ ...e, commissioner: { ...(e.commissioner ?? defaultContent.commissioner), ...patch } }));
  }, []);

  const addRider = useCallback(() => {
    const riders = contentRef.current.riders;
    if (riders.length >= MAX_RIDERS) return null;
    const r = makeRider(riders);
    setRiders((rs) => [...rs, r]);
    return r.id;
  }, [setRiders]);

  const removeRider = useCallback(
    (id: string) => {
      const riders = contentRef.current.riders;
      if (riders.length <= MIN_RIDERS) return false;
      const photo = riders.find((r) => r.id === id)?.photo;
      setRiders((rs) => rs.filter((r) => r.id !== id));
      if (photo?.startsWith('idb:')) void deletePhoto(photo);
      return true;
    },
    [setRiders],
  );

  const setPhoto = useCallback(
    async (who: PersonRef, blob: Blob | null) => {
      const c = contentRef.current;
      const old = who === 'commissioner' ? c.commissioner.photo : c.riders.find((r) => r.id === who)?.photo;
      const key = blob ? await putPhoto(blob) : null;
      if (who === 'commissioner') updateCommissioner({ photo: key });
      else updateRider(who, { photo: key });
      if (old?.startsWith('idb:')) await deletePhoto(old);
    },
    [updateCommissioner, updateRider],
  );

  const value = useMemo(
    () => ({ content, edits, saveFailed, updateRider, updateCommissioner, addRider, removeRider, setPhoto }),
    [content, edits, saveFailed, updateRider, updateCommissioner, addRider, removeRider, setPhoto],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContentCtx(): ContentCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useContent skal bruges inde i ContentProvider');
  return ctx;
}

export const useContent = () => useContentCtx().content;

export function useStage(n: number): Stage {
  const content = useContent();
  const stage = content.stages.find((s) => s.n === n);
  if (!stage) throw new Error(`Etape ${n} findes ikke`);
  return stage;
}
