import { describe, expect, it } from 'vitest';
import { bracketStatus, makeRound, setDuelWinner, shuffle } from './bracket';
import type { Round } from './types';

/** Deterministisk "tilfældighed" til tests. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

describe('knock-out (Carrot in the Box)', () => {
  it('blander uden at miste eller duplikere ryttere', () => {
    const out = shuffle(['a', 'b', 'c', 'd', 'e'], seeded(1));
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('parrer tilfældigt og giver walkover ved ulige antal', () => {
    const r = makeRound(['a', 'b', 'c', 'd', 'e'], seeded(7));
    expect(r.duels).toHaveLength(3);
    const wo = r.duels.filter((d) => d.b === null);
    expect(wo).toHaveLength(1);
    expect(wo[0].winner).toBe(wo[0].a);
    expect(r.duels.flatMap((d) => [d.a, d.b]).filter(Boolean).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('forskellige seeds giver forskellige parringer', () => {
    const p = (seed: number) => JSON.stringify(makeRound(['a', 'b', 'c', 'd', 'e', 'f'], seeded(seed)).duels);
    expect(new Set([1, 2, 3, 4, 5].map(p)).size).toBeGreaterThan(1);
  });

  it('status: næste runde, vinder og placeringer', () => {
    const entrants = ['a', 'b', 'c'];
    expect(bracketStatus(entrants, []).needsNextRound).toBe(true);
    const r1: Round = { duels: [{ a: 'a', b: 'b', winner: null }, { a: 'c', b: null, winner: 'c' }] };
    expect(bracketStatus(entrants, [r1]).needsNextRound).toBe(false); // runde i gang
    const r1done = setDuelWinner([r1], 0, 0, 'b');
    const st = bracketStatus(entrants, r1done);
    expect(st.alive).toEqual(['b', 'c']);
    expect(st.needsNextRound).toBe(true);
    const fin = [...r1done, { duels: [{ a: 'b', b: 'c', winner: 'c' }] }];
    const done = bracketStatus(entrants, fin);
    expect(done.champion).toBe('c');
    expect(done.places).toEqual({ c: 1, b: 2, a: 3 });
    expect(done.needsNextRound).toBe(false);
  });

  it('rettelse af en tidligere duel nulstiller de senere runder', () => {
    const rounds: Round[] = [
      { duels: [{ a: 'a', b: 'b', winner: 'a' }, { a: 'c', b: 'd', winner: 'c' }] },
      { duels: [{ a: 'a', b: 'c', winner: 'a' }] },
    ];
    const fixed = setDuelWinner(rounds, 0, 1, 'd');
    expect(fixed).toHaveLength(1);
    expect(fixed[0].duels[1].winner).toBe('d');
    // walkover kan ikke ændres
    const wo: Round[] = [{ duels: [{ a: 'a', b: null, winner: 'a' }] }];
    expect(setDuelWinner(wo, 0, 0, null)[0].duels[0].winner).toBe('a');
  });

  it('kun én deltager er automatisk vinder', () => {
    expect(bracketStatus(['a'], []).champion).toBe('a');
  });
});
