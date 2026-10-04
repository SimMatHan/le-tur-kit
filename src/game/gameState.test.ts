import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT, pushState, sanitizeGame, undo } from './gameState';
import { computeStandings, emptyGame } from './scoring';
import { baseContent, contentWith, game, stageState } from './testUtils';

describe('spiltilstand: gem/indlæs', () => {
  it('overlever en JSON-rundtur (localStorage/backup) uden at ændre resultatet', () => {
    const c = contentWith(['a', 'b', 'c']);
    const g = game(
      {
        1: stageState(1, { times: { a: 8.4, b: 9, c: 7.1 } }, { tieOrder: ['a'], adjust: { b: { timeSec: 1, note: 'tyvstart' } } }),
        2: stageState(2, { order: ['c', 'a', 'b'], carrotGroups: [['a', 'b']], bonuses: { start: 'b' } }),
        3: stageState(3, { runs: { a: { cards: ['5♠', '9♥', '2♣'], guesses: ['op', 'op'], done: true } }, manual: { b: 2, c: 0 }, deck: ['A♠', 'K♥'], active: 'a' }),
        4: stageState(4, { hits: ['a'], dice: { a: 6 }, times: { a: 9, b: 8, c: 7 } }, { status: 'running' }),
        5: stageState(5, { hits: ['a', 'c'], rounds: [{ duels: [{ a: 'a', b: 'c', winner: 'a' }] }] }),
      },
      { classificationTieOrder: { gul: ['c', 'a'] } },
    );
    const back = sanitizeGame(JSON.parse(JSON.stringify(g)), baseContent);
    expect(back).toEqual(g);
    expect(computeStandings(c, back)).toEqual(computeStandings(c, g));
  });

  it('ødelagte eller ukendte data giver en tom/renset tilstand', () => {
    expect(sanitizeGame(null, baseContent)).toEqual(emptyGame());
    expect(sanitizeGame('skrald', baseContent)).toEqual(emptyGame());
    const g = sanitizeGame(
      {
        stages: {
          1: { status: 'hacket', input: { type: 'prolog', times: { a: 'x', b: 5, c: Infinity } } },
          2: { input: { type: 'prolog' } }, // forkert type for etape 2
          9: { input: { type: 'prolog', times: {} } }, // findes ikke
        },
      },
      baseContent,
    );
    expect(g.stages[1].status).toBe('idle');
    expect(g.stages[1].input).toEqual({ type: 'prolog', times: { b: 5 } });
    expect(g.stages[2]).toBeUndefined();
    // Gemte data fra den gamle musikquiz bliver til en tom udbrudsetape
    const old = sanitizeGame({ stages: { 3: { status: 'running', input: { type: 'udbrud', quiz: { '0-0': ['a'] }, dice: { a: 1 } } } } }, baseContent);
    expect(old.stages[3].input).toEqual({ type: 'udbrud', runs: {}, manual: {}, deck: [], active: null });
    // Ugyldige kort og gæt fjernes
    const bad = sanitizeGame(
      { stages: { 3: { input: { type: 'udbrud', runs: { a: { cards: ['5♠', 'X♥', '9♥'], guesses: ['op', 'hop'], done: true } }, deck: ['A♠', '<b>'] } } } },
      baseContent,
    );
    expect(bad.stages[3].input).toMatchObject({ runs: { a: { cards: ['5♠', '9♥'], guesses: ['op'], done: true } }, deck: ['A♠'] });
    expect(g.stages[9]).toBeUndefined();
  });
});

describe('fortryd', () => {
  it('fortryder seneste handling og begrænser historikken', () => {
    let h = { past: [], present: emptyGame() } as ReturnType<typeof undo>;
    const a = game({ 1: stageState(1, { times: { a: 1 } }) });
    const b = game({ 1: stageState(1, { times: { a: 2 } }) });
    h = pushState(h, a);
    h = pushState(h, b);
    expect(h.present).toBe(b);
    h = undo(h);
    expect(h.present).toBe(a);
    h = undo(undo(undo(h)));
    expect(h.present).toEqual(emptyGame());
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) h = pushState(h, game({}));
    expect(h.past.length).toBe(HISTORY_LIMIT);
  });
});
