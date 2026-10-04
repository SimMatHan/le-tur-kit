import { describe, expect, it } from 'vitest';
import { cellKey, songNumber } from './quiz';

describe('musikquiz', () => {
  it('sangnummer: øverst til venstre først, derefter ned gennem hver kategori', () => {
    const five = [5, 5, 5, 5, 5];
    expect(songNumber(five, 0, 0)).toBe(1);
    expect(songNumber(five, 0, 4)).toBe(5);
    expect(songNumber(five, 1, 0)).toBe(6);
    expect(songNumber(five, 1, 2)).toBe(8);
    expect(songNumber(five, 4, 4)).toBe(25);
  });
  it('tåler kategorier med forskelligt antal felter', () => {
    expect(songNumber([3, 4, 5], 2, 0)).toBe(8);
  });
  it('feltnøgle', () => {
    expect(cellKey(2, 3)).toBe('2-3');
  });
});
