import { useContent } from '../content/ContentContext';
import type { JerseyId } from '../content/types';

// Midlertidig stub (fase 1): alle står på nul. Erstattes af scoringsmotoren i fase 3.
export interface StandingRow {
  riderId: string;
  rank: number;
  value: number;
  tied: boolean;
}
export interface StandingsView {
  completedStages: number;
  tables: Record<JerseyId, StandingRow[]>;
}

export function useStandings(_afterStage?: number): StandingsView {
  const { riders } = useContent();
  const rows = riders.map((r, i) => ({ riderId: r.id, rank: i + 1, value: 0, tied: false }));
  return { completedStages: 0, tables: { gul: rows, gron: rows, prik: rows } };
}
