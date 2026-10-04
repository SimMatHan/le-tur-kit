import { describe, expect, it } from 'vitest';
import { cropRect, PHOTO_ASPECT } from './photoCrop';

describe('beskæring af fotos', () => {
  it('beskærer et liggende foto til portræt og bevarer fuld højde', () => {
    const r = cropRect(4000, 3000);
    expect(r.sh).toBe(3000);
    expect(r.sw / r.sh).toBeCloseTo(PHOTO_ASPECT, 2);
    expect(r.sx).toBe(Math.round((4000 - r.sw) / 2));
    expect(Math.max(r.dw, r.dh)).toBe(1200);
  });

  it('beskærer et højt foto lidt over midten', () => {
    const r = cropRect(1000, 3000);
    expect(r.sw).toBe(1000);
    expect(r.sy).toBeGreaterThan(0);
    expect(r.sy).toBeLessThan((3000 - r.sh) / 2);
  });

  it('opskalerer ikke små billeder', () => {
    const r = cropRect(300, 400);
    expect(r.dh).toBe(r.sh);
    expect(r.dh).toBeLessThanOrEqual(400);
  });
});
