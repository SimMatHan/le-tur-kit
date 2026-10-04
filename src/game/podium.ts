// Podiet udledes af klassementet: top 3 i gul på trappen, vinderne af grøn og
// prikket ved siden af. Uafgjort håndteres eksplicit (delt placering / delt trøje).
import type { JerseyId } from '../content/types';
import type { Standings } from './scoring';
import type { RiderId } from './types';

export interface PodiumSpot {
  riderId: RiderId;
  rank: number;
  /** Uafklaret lighed – skal afgøres af kommissæren. */
  tied: boolean;
}

export interface JerseyWinner {
  riderIds: RiderId[];
  value: number;
  tied: boolean;
}

export interface PodiumData {
  /** Er der overhovedet resultater? */
  hasResults: boolean;
  /** Er alle etaper afsluttet? (ellers er podiet foreløbigt) */
  final: boolean;
  stagesCounted: number;
  top: (PodiumSpot | null)[];
  gron: JerseyWinner | null;
  prik: JerseyWinner | null;
  /** Findes der uafklaret lighed på podiet eller om en trøje? */
  unresolved: boolean;
}

function winner(standings: Standings, j: JerseyId): JerseyWinner | null {
  const rows = standings.tables[j];
  if (!rows.length) return null;
  const leaders = rows.filter((r) => r.rank === 1);
  // En pointtrøje uden point har ingen vinder endnu.
  if (leaders[0].value <= 0) return null;
  return { riderIds: leaders.map((r) => r.riderId), value: leaders[0].value, tied: leaders.length > 1 };
}

/**
 * Føreren af en trøje (vises med trøjeikonet): nr. 1 uden uafklaret lighed.
 * Grøn og prikket kræver mindst ét point.
 */
export function jerseyLeader(standings: Standings, j: JerseyId): RiderId | null {
  if (!standings.countedStages.length) return null;
  const first = standings.tables[j][0];
  if (!first || first.tied) return null;
  if (j !== 'gul' && first.value <= 0) return null;
  return first.riderId;
}

export function podiumData(standings: Standings, totalStages: number): PodiumData {
  const hasResults = standings.countedStages.length > 0;
  if (!hasResults) {
    return { hasResults, final: false, stagesCounted: 0, top: [null, null, null], gron: null, prik: null, unresolved: false };
  }
  const gul = standings.tables.gul;
  const top = [0, 1, 2].map((i) => (gul[i] ? { riderId: gul[i].riderId, rank: gul[i].rank, tied: gul[i].tied } : null));
  const gron = winner(standings, 'gron');
  const prik = winner(standings, 'prik');
  const final = standings.completedStages === totalStages;
  const unresolved = top.some((s) => s?.tied) || !!gron?.tied || !!prik?.tied;
  return { hasResults, final, stagesCounted: standings.countedStages.length, top, gron, prik, unresolved };
}
