import { describe, expect, it } from 'vitest';
import { breakawayOf, freshDeck, guessNext, isCorrect, rankOf, startRun, streakOf } from './highlow';
import { emptyInput } from './scoring';
import type { UdbrudInput } from './types';

const empty = () => emptyInput('udbrud') as UdbrudInput;
/** rng = 0.99 → blandingen bytter intet, så bunken er sorteret: 2♠, 3♠, … A♠, 2♥, … */
const noShuffle = () => 0.99;

describe('kort', () => {
  it('es er højest, billedkort i rækkefølge', () => {
    expect(['2♠', '10♥', 'J♦', 'Q♣', 'K♠', 'A♥'].map(rankOf)).toEqual([2, 10, 11, 12, 13, 14]);
    expect(freshDeck()).toHaveLength(52);
    expect(new Set(freshDeck()).size).toBe(52);
  });
  it('samme værdi tæller som forkert', () => {
    expect(isCorrect('7♠', '9♥', 'op')).toBe(true);
    expect(isCorrect('7♠', '2♥', 'ned')).toBe(true);
    expect(isCorrect('7♠', '7♥', 'op')).toBe(false);
    expect(isCorrect('7♠', '7♥', 'ned')).toBe(false);
  });
  it('tæller rigtige i træk indtil første forkerte', () => {
    expect(streakOf({ cards: ['5♠', '9♥', '2♣', 'K♦'], guesses: ['op', 'ned', 'ned'], done: true })).toBe(2);
    expect(streakOf(undefined)).toBe(0);
  });
});

describe('udbrudsforsøget i appen', () => {
  it('trækker kort, tæller udbruddet og slutter ved forkert gæt', () => {
    let s = startRun(empty(), 'a', noShuffle);
    expect(s.runs.a.cards).toEqual(['2♠']);
    expect(s.active).toBe('a');
    for (let i = 0; i < 3; i++) s = guessNext(s, 'a', 'op', 10, noShuffle); // 3♠, 4♠, 5♠
    expect(streakOf(s.runs.a)).toBe(3);
    expect(s.runs.a.done).toBe(false);
    expect(breakawayOf(s, 'a')).toBeNull(); // stadig i gang
    s = guessNext(s, 'a', 'ned', 10, noShuffle); // 6♠ er ikke lavere end 5♠
    expect(s.runs.a.done).toBe(true);
    expect(breakawayOf(s, 'a')).toBe(3);
    // Afsluttet forsøg ændres ikke af flere gæt
    expect(guessNext(s, 'a', 'op', 10, noShuffle)).toBe(s);
  });

  it('slutter automatisk, når loftet nås', () => {
    let s = startRun(empty(), 'a', noShuffle);
    for (let i = 0; i < 3; i++) s = guessNext(s, 'a', 'op', 3, noShuffle);
    expect(s.runs.a.done).toBe(true);
    expect(breakawayOf(s, 'a')).toBe(3);
  });

  it('kortene trækkes fra én fælles bunke uden gentagelser', () => {
    let s = startRun(empty(), 'a', noShuffle);
    s = guessNext(s, 'a', 'ned', 10, noShuffle);
    s = startRun(s, 'b', noShuffle);
    const all = [...s.runs.a.cards, ...s.runs.b.cards];
    expect(new Set(all).size).toBe(all.length);
    expect(s.deck.length).toBe(52 - all.length);
  });

  it('en tom bunke blandes på ny', () => {
    const s = startRun({ ...empty(), deck: [] }, 'a', Math.random);
    expect(s.deck).toHaveLength(51);
  });

  it('nyt forsøg erstatter et manuelt tal', () => {
    const s = startRun({ ...empty(), manual: { a: 7 } }, 'a', noShuffle);
    expect(s.manual.a).toBeUndefined();
    expect(breakawayOf({ ...empty(), manual: { a: 7.4 } }, 'a')).toBe(7);
  });
});
