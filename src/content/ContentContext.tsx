import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import defaultContentJson from './content.json';
import type { Content, Stage } from './types';

export const defaultContent = defaultContentJson as unknown as Content;

interface ContentCtx {
  content: Content;
  setContent: (next: Content | ((prev: Content) => Content)) => void;
}

const Ctx = createContext<ContentCtx | null>(null);

export function ContentProvider({ children, initial }: { children: ReactNode; initial?: Content }) {
  const [content, setContent] = useState<Content>(initial ?? defaultContent);
  const value = useMemo(() => ({ content, setContent }), [content]);
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
