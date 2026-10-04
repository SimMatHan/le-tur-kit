// Knock-out i Carrot in the Box: tilfældig parring, walkover ved ulige antal.
// Rene funktioner; tilfældighed injiceres (rng), så det kan testes.
import type { Duel, RiderId, Round } from './types';

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ny runde: tilfældige par, og ved ulige antal går den sidste videre på walkover. */
export function makeRound(players: RiderId[], rng: Rng = Math.random): Round {
  const s = shuffle(players, rng);
  const duels: Duel[] = [];
  for (let i = 0; i < s.length; i += 2) {
    const b = s[i + 1] ?? null;
    duels.push({ a: s[i], b, winner: b === null ? s[i] : null });
  }
  return { duels };
}

export const roundDone = (r: Round) => r.duels.every((d) => d.winner !== null);
export const winnersOf = (r: Round) => r.duels.map((d) => d.winner).filter((w): w is RiderId => w !== null);
export const losersOf = (r: Round) =>
  r.duels.filter((d) => d.b !== null && d.winner !== null).map((d) => (d.winner === d.a ? d.b! : d.a));

export interface BracketStatus {
  /** Ryttere, der stadig er med (efter sidste afsluttede runde). */
  alive: RiderId[];
  champion: RiderId | null;
  /** Skal der laves en ny runde? */
  needsNextRound: boolean;
  /** Placering pr. rytter, når knock-outen er afgjort (tabere i samme runde deler). */
  places: Record<RiderId, number>;
  /** Runde-index, hvor rytteren blev slået ud. */
  eliminatedIn: Record<RiderId, number>;
}

export function bracketStatus(entrants: RiderId[], rounds: Round[]): BracketStatus {
  let alive = [...entrants];
  const eliminatedIn: Record<RiderId, number> = {};
  const aliveAfter: number[] = [];
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    if (!roundDone(r)) break;
    for (const l of losersOf(r)) eliminatedIn[l] = i;
    alive = winnersOf(r);
    aliveAfter[i] = alive.length;
  }
  const lastDone = aliveAfter.length - 1;
  const champion = entrants.length >= 2 && lastDone >= 0 && alive.length === 1 ? alive[0] : entrants.length === 1 ? entrants[0] : null;
  const places: Record<RiderId, number> = {};
  if (champion) {
    places[champion] = 1;
    for (const [id, round] of Object.entries(eliminatedIn)) places[id] = aliveAfter[round] + 1;
  }
  const inProgress = rounds.length > aliveAfter.length;
  return { alive, champion, needsNextRound: !champion && !inProgress && alive.length >= 2, places, eliminatedIn };
}

/** Sæt vinderen af en duel (og nulstil senere runder, hvis en afgjort duel ændres). */
export function setDuelWinner(rounds: Round[], roundIdx: number, duelIdx: number, winner: RiderId | null): Round[] {
  const next = rounds.slice(0, roundIdx + 1).map((r, i) =>
    i === roundIdx ? { duels: r.duels.map((d, j) => (j === duelIdx && d.b !== null ? { ...d, winner } : d)) } : r,
  );
  return next;
}
