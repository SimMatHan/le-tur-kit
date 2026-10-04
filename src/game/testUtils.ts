// Hjælpere til tests: indhold med N ryttere og en tom spiltilstand.
import contentJson from '../content/content.json';
import type { Content, Rider, Stage } from '../content/types';
import { emptyGame, emptyStageState } from './scoring';
import type { GameState, StageInput, StageState } from './types';

export const baseContent = contentJson as unknown as Content;

export function riders(ids: string[]): Rider[] {
  return ids.map((id, i) => ({ id, number: i + 1, name: id.toUpperCase(), nickname: '', bio: '', traits: [], photo: null }));
}

export function contentWith(ids: string[]): Content {
  return { ...baseContent, riders: riders(ids) };
}

export const stageOf = (n: number): Stage => baseContent.stages.find((s) => s.n === n)!;

export function stageState(n: number, input: Partial<StageInput>, extra: Partial<StageState> = {}): StageState {
  const base = emptyStageState(stageOf(n));
  return { ...base, status: 'finished', ...extra, input: { ...base.input, ...input } as StageInput };
}

export function game(stages: Record<number, StageState>, extra: Partial<GameState> = {}): GameState {
  return { ...emptyGame(), ...extra, stages };
}
