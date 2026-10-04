import { useCallback } from 'react';
import { useContent, useStage } from '../content/ContentContext';
import { useGame } from '../game/GameContext';
import { emptyStageState } from '../game/scoring';
import type { StageInput, StageState } from '../game/types';

/** Etapens tilstand og en setter for dens input. Første ændring sætter status til "i gang". */
export function useStagePanel<T extends StageInput['type']>(n: number, type: T) {
  const stage = useStage(n);
  const { riders } = useContent();
  const { game, updateStage } = useGame();
  const state: StageState = game.stages[n] ?? emptyStageState(stage);
  const input = (state.input.type === type ? state.input : emptyStageState(stage).input) as Extract<StageInput, { type: T }>;

  const setInput = useCallback(
    (fn: (i: Extract<StageInput, { type: T }>) => Extract<StageInput, { type: T }>) =>
      updateStage(n, (s) => {
        const cur = (s.input.type === type ? s.input : emptyStageState(stage).input) as Extract<StageInput, { type: T }>;
        return { ...s, status: s.status === 'idle' ? 'running' : s.status, input: fn(cur) };
      }),
    [n, type, stage, updateStage],
  );
  const setState = useCallback((fn: (s: StageState) => StageState) => updateStage(n, fn), [n, updateStage]);
  const nameOf = (id: string) => riders.find((r) => r.id === id)?.name ?? '?';
  return { stage, state, input, setInput, setState, riders, nameOf };
}
