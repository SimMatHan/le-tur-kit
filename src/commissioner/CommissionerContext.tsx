// Kommissærtilstand (ikke gemt): hvilket panel der er åbent, stopurets ur,
// hvad der vises på projektoren, og det åbne quizkort.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { roundTenth } from '../game/format';

export type ProjectorView =
  | null
  | { kind: 'stopwatch'; stage: number }
  | { kind: 'quiz'; cat: number; row: number; reveal: boolean }
  | { kind: 'bracket' }
  | { kind: 'vinokourov' }
  | { kind: 'carrot'; a: string; b: string; third: string | null };

export interface Clock {
  /** Date.now() da uret startede (justeret ved pause), null hvis stoppet. */
  startedAt: number | null;
  /** Akkumuleret tid i ms, når uret er stoppet. */
  stoppedMs: number;
}

interface CommissionerCtx {
  open: boolean;
  stage: number;
  openPanel: (stage?: number) => void;
  closePanel: () => void;
  setStage: (n: number) => void;
  projector: ProjectorView;
  setProjector: (v: ProjectorView) => void;
  clock: Clock;
  startClock: () => void;
  stopClock: () => void;
  resetClock: () => void;
  /** Aktuel tid i sekunder (tiendedele). */
  elapsed: () => number;
}

const Ctx = createContext<CommissionerCtx | null>(null);

export function CommissionerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(1);
  const [projector, setProjector] = useState<ProjectorView>(null);
  const [clock, setClock] = useState<Clock>({ startedAt: null, stoppedMs: 0 });

  const openPanel = useCallback((n?: number) => {
    if (n) setStage(n);
    setOpen(true);
  }, []);
  const closePanel = useCallback(() => setOpen(false), []);

  const startClock = useCallback(() => setClock((c) => (c.startedAt ? c : { startedAt: Date.now() - c.stoppedMs, stoppedMs: 0 })), []);
  const stopClock = useCallback(() => setClock((c) => (c.startedAt ? { startedAt: null, stoppedMs: Date.now() - c.startedAt } : c)), []);
  const resetClock = useCallback(() => setClock({ startedAt: null, stoppedMs: 0 }), []);
  const elapsed = useCallback(() => roundTenth(((clock.startedAt ? Date.now() - clock.startedAt : clock.stoppedMs) / 1000)), [clock]);

  const value = useMemo(
    () => ({ open, stage, openPanel, closePanel, setStage, projector, setProjector, clock, startClock, stopClock, resetClock, elapsed }),
    [open, stage, openPanel, closePanel, projector, clock, startClock, stopClock, resetClock, elapsed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommissioner(): CommissionerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCommissioner skal bruges inde i CommissionerProvider');
  return ctx;
}
