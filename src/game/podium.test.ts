import { describe, expect, it } from 'vitest';
import { jerseyLeader, podiumData } from './podium';
import { computeStandings } from './scoring';
import { contentWith, game, stageState } from './testUtils';

describe('podiet', () => {
  const c = contentWith(['a', 'b', 'c', 'd']);

  it('er tomt uden resultater', () => {
    const p = podiumData(computeStandings(c, game({})), 5);
    expect(p.hasResults).toBe(false);
    expect(p.top).toEqual([null, null, null]);
  });

  it('top 3 i gul og vinderne af grøn og prikket; foreløbigt indtil alle etaper er afsluttet', () => {
    const s = computeStandings(
      c,
      game({
        1: stageState(1, { times: { a: 8, b: 9, c: 10, d: 11 } }),
        4: stageState(4, { hits: [], times: { a: 9, b: 5, c: 6, d: 7 } }, { status: 'running' }),
      }),
    );
    const p = podiumData(s, 5);
    // Tid: a 17, b 14, c 16, d 18 → b, c, a
    expect(p.top.map((x) => x?.riderId)).toEqual(['b', 'c', 'a']);
    expect(p.gron).toMatchObject({ riderIds: ['a'], value: 25, tied: false });
    expect(p.prik).toMatchObject({ riderIds: ['b'], value: 25 });
    expect(p.final).toBe(false);
    expect(p.stagesCounted).toBe(2);
    expect(p.unresolved).toBe(false);
  });

  it('uafgjort vises eksplicit: delt plads og delt trøje', () => {
    const s = computeStandings(c, game({ 1: stageState(1, { times: { a: 8, b: 8, c: 9, d: 9 } }) }));
    const p = podiumData(s, 5);
    expect(p.top.map((x) => [x?.rank, x?.tied])).toEqual([
      [1, true],
      [1, true],
      [3, true],
    ]);
    expect(p.gron).toMatchObject({ riderIds: ['a', 'b'], tied: true });
    // Ingen har bjergpoint → ingen vinder af den prikkede trøje endnu
    expect(p.prik).toBeNull();
    expect(p.unresolved).toBe(true);
  });

  it('er endeligt, når alle etaper er afsluttet', () => {
    const stages = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, stageState(n, {})]));
    const s = computeStandings(c, game({ ...stages, 1: stageState(1, { times: { a: 8, b: 9, c: 10, d: 11 } }) }));
    expect(podiumData(s, 5).final).toBe(true);
  });
});

describe('trøjeførere', () => {
  it('kræver resultater, ingen uafklaret lighed og point i grøn/prikket', () => {
    const c = contentWith(['a', 'b', 'c']);
    expect(jerseyLeader(computeStandings(c, game({})), 'gul')).toBeNull();
    const s = computeStandings(c, game({ 1: stageState(1, { times: { a: 8, b: 9, c: 10 } }) }));
    expect(jerseyLeader(s, 'gul')).toBe('a');
    expect(jerseyLeader(s, 'gron')).toBe('a');
    expect(jerseyLeader(s, 'prik')).toBeNull(); // ingen bjergpoint endnu
    const tie = computeStandings(c, game({ 1: stageState(1, { times: { a: 8, b: 8, c: 10 } }) }));
    expect(jerseyLeader(tie, 'gul')).toBeNull();
  });
});
