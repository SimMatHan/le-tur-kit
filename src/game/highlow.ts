// Udbrudsforsøget: højere/lavere med et almindeligt kortspil (52 kort).
// Rene funktioner – tilfældighed injiceres, så det kan testes.
import { shuffle, type Rng } from './bracket';
import type { Card, Guess, HighLowRun, RiderId, UdbrudInput } from './types';

export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

/** Kortets værdi: 2–14 (es er højest). */
export function rankOf(card: Card): number {
  const r = RANKS.indexOf(card.slice(0, -1) as (typeof RANKS)[number]);
  return r < 0 ? 0 : r + 2;
}
export const suitOf = (card: Card) => card.slice(-1);
export const isRed = (card: Card) => suitOf(card) === '♥' || suitOf(card) === '♦';

/** Et sorteret kortspil (spar 2–A, hjerter 2–A, …). */
export const freshDeck = (): Card[] => SUITS.flatMap((s) => RANKS.map((r) => r + s));

/** Er gættet rigtigt? Samme værdi tæller som forkert. */
export function isCorrect(prev: Card, next: Card, guess: Guess): boolean {
  const a = rankOf(prev);
  const b = rankOf(next);
  return guess === 'op' ? b > a : b < a;
}

/** Antal rigtige gæt i træk i et forsøg. */
export function streakOf(run: HighLowRun | undefined): number {
  if (!run) return 0;
  let n = 0;
  for (let i = 0; i < run.guesses.length; i++) {
    if (!run.cards[i + 1] || !isCorrect(run.cards[i], run.cards[i + 1], run.guesses[i])) break;
    n++;
  }
  return n;
}

/** Rytterens udbrud: manuelt tal går forud for forsøget i appen. null = ikke kørt endnu. */
export function breakawayOf(input: UdbrudInput, id: RiderId): number | null {
  const m = input.manual[id];
  if (typeof m === 'number' && Number.isFinite(m)) return Math.max(0, Math.round(m));
  const run = input.runs[id];
  return run?.done ? streakOf(run) : null;
}

/** Træk ét kort (blander en ny bunke, hvis den er tom). */
function draw(deck: Card[], rng: Rng): { card: Card; deck: Card[] } {
  const d = deck.length ? deck : shuffle(freshDeck(), rng);
  return { card: d[0], deck: d.slice(1) };
}

/** Start et (nyt) forsøg for en rytter: det første kort vendes. */
export function startRun(input: UdbrudInput, id: RiderId, rng: Rng = Math.random): UdbrudInput {
  const { card, deck } = draw(input.deck, rng);
  const manual = { ...input.manual };
  delete manual[id];
  return { ...input, deck, manual, active: id, runs: { ...input.runs, [id]: { cards: [card], guesses: [], done: false } } };
}

/**
 * Rytteren gætter højere/lavere: næste kort trækkes. Forkert gæt eller nået loft
 * afslutter forsøget.
 */
export function guessNext(input: UdbrudInput, id: RiderId, guess: Guess, maxCorrect: number, rng: Rng = Math.random): UdbrudInput {
  const run = input.runs[id];
  if (!run || run.done) return input;
  const { card, deck } = draw(input.deck, rng);
  const cards = [...run.cards, card];
  const guesses = [...run.guesses, guess];
  const correct = isCorrect(run.cards[run.cards.length - 1], card, guess);
  const next: HighLowRun = { cards, guesses, done: !correct || streakOf({ cards, guesses, done: false }) >= maxCorrect };
  return { ...input, deck, runs: { ...input.runs, [id]: next } };
}
