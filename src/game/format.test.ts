import { describe, expect, it } from 'vitest';
import { formatGap, formatTime, parseTime, roundTenth } from './format';

describe('tidsformat', () => {
  it('runder til tiendedele', () => {
    expect(roundTenth(12.345)).toBe(12.3);
    expect(roundTenth(12.35)).toBe(12.4);
  });
  it('formaterer sekunder og minutter med komma', () => {
    expect(formatTime(9)).toBe('9,0');
    expect(formatTime(83.4)).toBe('1:23,4');
    expect(formatTime(60)).toBe('1:00,0');
    expect(formatTime(-3)).toBe('−3,0');
    expect(formatGap(4)).toBe('+4,0');
  });
  it('parser dansk og engelsk input', () => {
    expect(parseTime('1:23,4')).toBe(83.4);
    expect(parseTime('83.4')).toBe(83.4);
    expect(parseTime('12,25')).toBe(12.3);
    expect(parseTime('-3')).toBe(-3);
    expect(parseTime('')).toBeNull();
    expect(parseTime('abc')).toBeNull();
    expect(parseTime('1:75')).toBeNull();
  });
});
