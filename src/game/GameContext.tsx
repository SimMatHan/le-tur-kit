import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useContent } from '../content/ContentContext';
import { GAME_KEY, readJson, writeJson } from '../content/storage';
import { pushState, sanitizeGame, undo as undoHistory, type History } from './gameState';
import { computeStandings, emptyStageState, type Standings } from './scoring';
import type { GameState, StageState } from './types';

interface GameCtx {
  game: GameState;
  canUndo: boolean;
  /** Ændr hele spiltilstanden (gemmes til fortryd). */
  update: (fn: (g: GameState) => GameState) => void;
  /** Ændr én etape (gemmes til fortryd). */
  updateStage: (n: number, fn: (s: StageState) => StageState) => void;
  undo: () => void;
  resetGame: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const content = useContent();
  const [hist, setHist] = useState<History>(() => ({ past: [], present: sanitizeGame(readJson(GAME_KEY), content) }));
  const contentRef = useRef(content);
  contentRef.current = content;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeJson(GAME_KEY, hist.present);
  }, [hist.present]);

  const update = useCallback((fn: (g: GameState) => GameState) => setHist((h) => pushState(h, fn(h.present))), []);
  const updateStage = useCallback(
    (n: number, fn: (s: StageState) => StageState) =>
      update((g) => {
        const stage = contentRef.current.stages.find((s) => s.n === n);
        if (!stage) return g;
        return { ...g, stages: { ...g.stages, [n]: fn(g.stages[n] ?? emptyStageState(stage)) } };
      }),
    [update],
  );
  const undo = useCallback(() => setHist(undoHistory), []);
  const resetGame = useCallback(() => update((g) => ({ ...g, stages: {}, classificationTieOrder: {} })), [update]);

  const value = useMemo(
    () => ({ game: hist.present, canUndo: hist.past.length > 0, update, updateStage, undo, resetGame }),
    [hist, update, updateStage, undo, resetGame],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame skal bruges inde i GameProvider');
  return ctx;
}

/** Klassementet (evt. kun til og med en given etape). */
export function useStandings(uptoStage?: number): Standings {
  const content = useContent();
  const { game } = useGame();
  return useMemo(() => computeStandings(content, game, uptoStage), [content, game, uptoStage]);
}
