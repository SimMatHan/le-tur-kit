import { describe, expect, it } from 'vitest';
import { expandDeck, type DeckEntry } from './deckTypes';
import content from '../content/content.json';
import type { Content } from '../content/types';

const Dummy = () => null;

describe('expandDeck', () => {
  it('gentager rytter-slides for hver rytter', () => {
    const deck: DeckEntry[] = [
      { id: 'a', title: 'A', component: Dummy },
      { id: 'r', title: 'Rytter', component: Dummy, each: 'rider' },
      { id: 'b', title: 'B', component: Dummy, props: { stage: 2 } },
    ];
    const c = content as unknown as Content;
    const slides = expandDeck(deck, c);
    expect(slides).toHaveLength(2 + c.riders.length);
    expect(slides[1].props.riderId).toBe(c.riders[0].id);
    expect(slides.at(-1)?.props.stage).toBe(2);

    const three = { ...c, riders: c.riders.slice(0, 3) };
    expect(expandDeck(deck, three)).toHaveLength(5);
  });
});
