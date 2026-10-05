// Kommissærtilstand (ikke gemt): hvilket panel der er åbent, stopurets ur,
// og hvad der vises på projektoren. Ved fjernbetjening
// synkroniseres projektor-visning og ur mellem telefon og skærm.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { roundTenth } from '../game/format';
import type { ClockData, ProjectorViewData } from '../remote/protocol';
import { sharedNow } from '../remote/sharedTime';

export type ProjectorView = ProjectorViewData;
export type Clock = ClockData;

export interface CommissionerSync {
  projector?: ProjectorView;
  clock?: Clock;
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
  /** Anvend ændringer fra den anden enhed (sendes ikke videre). */
  applyRemote: (s: CommissionerSync) => void;
}

const Ctx = createContext<CommissionerCtx | null>(null);

interface Props {
  children: ReactNode;
  /** Kaldes, når brugeren her ændrer projektor-visning eller ur (til fjernbetjening). */
  onLocalChange?: (s: CommissionerSync) => void;
}

export function CommissionerProvider({ children, onLocalChange }: Props) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(1);
  const [projector, setProjectorState] = useState<ProjectorView>(null);
  const [clock, setClockState] = useState<Clock>({ startedAt: null, stoppedMs: 0 });
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const onLocal = useRef(onLocalChange);
  useEffect(() => {
    onLocal.current = onLocalChange;
  }, [onLocalChange]);

  const openPanel = useCallback((n?: number) => {
    if (n) setStage(n);
    setOpen(true);
  }, []);
  const closePanel = useCallback(() => setOpen(false), []);

  const setProjector = useCallback((v: ProjectorView) => {
    setProjectorState(v);
    onLocal.current?.({ projector: v });
  }, []);

  const setClock = useCallback((next: Clock) => {
    clockRef.current = next;
    setClockState(next);
    onLocal.current?.({ clock: next });
  }, []);

  const startClock = useCallback(() => {
    const c = clockRef.current;
    if (!c.startedAt) setClock({ startedAt: sharedNow() - c.stoppedMs, stoppedMs: 0 });
  }, [setClock]);
  const stopClock = useCallback(() => {
    const c = clockRef.current;
    if (c.startedAt) setClock({ startedAt: null, stoppedMs: sharedNow() - c.startedAt });
  }, [setClock]);
  const resetClock = useCallback(() => setClock({ startedAt: null, stoppedMs: 0 }), [setClock]);
  const elapsed = useCallback(() => roundTenth((clock.startedAt ? sharedNow() - clock.startedAt : clock.stoppedMs) / 1000), [clock]);

  const applyRemote = useCallback((s: CommissionerSync) => {
    if ('projector' in s) setProjectorState(s.projector ?? null);
    if (s.clock) {
      clockRef.current = s.clock;
      setClockState(s.clock);
    }
  }, []);

  const value = useMemo(
    () => ({ open, stage, openPanel, closePanel, setStage, projector, setProjector, clock, startClock, stopClock, resetClock, elapsed, applyRemote }),
    [open, stage, openPanel, closePanel, projector, setProjector, clock, startClock, stopClock, resetClock, elapsed, applyRemote],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommissioner(): CommissionerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCommissioner skal bruges inde i CommissionerProvider');
  return ctx;
}
