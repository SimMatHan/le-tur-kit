import { describe, expect, it } from 'vitest';
import { applyEdits, makeRider, nextRiderNumber, referencedPhotoKeys, sanitizeEdits } from './edits';
import contentJson from './content.json';
import type { Content } from './types';

const base = contentJson as unknown as Content;

describe('redigeret indhold', () => {
  it('lægger redigeringer oven på standardindholdet', () => {
    const riders = base.riders.map((r, i) => ({ ...r, name: `Rytter ${i}` }));
    const c = applyEdits(base, { riders });
    expect(c.riders[0].name).toBe('Rytter 0');
    expect(c.commissioner).toBe(base.commissioner);
    expect(c.rules).toBe(base.rules);
  });

  it('renser ugyldige data og bevarer gyldige', () => {
    const e = sanitizeEdits({
      riders: [
        { id: 'a', number: '7', name: 'Anders', nickname: 'Bøflen', bio: 'Tekst', traits: ['Sprinter', 3, '  '], photo: 'idb:x' },
        { id: 'a', number: 2, name: 'Dublet-id', traits: [], photo: 'http://ondt.example/x.jpg' },
        { name: 'Uden id' },
        'skrald',
      ],
      commissioner: { name: 'Simon', traits: ['Kan alt'], photo: 'img/kommissaer.jpg' },
    });
    expect(e.riders).toHaveLength(3);
    expect(e.riders![0]).toMatchObject({ id: 'a', number: 7, traits: ['Sprinter'], photo: 'idb:x' });
    expect(e.riders![1].id).not.toBe('a');
    expect(e.riders![1].photo).toBeNull();
    expect(e.commissioner?.photo).toBe('img/kommissaer.jpg');
    expect(e.commissioner?.title).toBe('Løbskommissær');
  });

  it('afviser for få ryttere og begrænser til 10', () => {
    expect(sanitizeEdits({ riders: [{ name: 'a' }, { name: 'b' }] }).riders).toBeUndefined();
    const many = Array.from({ length: 14 }, (_, i) => ({ name: `R${i}` }));
    expect(sanitizeEdits({ riders: many }).riders).toHaveLength(10);
    expect(sanitizeEdits(null)).toEqual({});
  });

  it('nye ryttere får første ledige nummer og unikt id', () => {
    const rs = base.riders.filter((r) => r.number !== 3);
    expect(nextRiderNumber(rs)).toBe(3);
    const r = makeRider(base.riders);
    expect(r.number).toBe(7);
    expect(base.riders.some((x) => x.id === r.id)).toBe(false);
  });

  it('finder fotos i IndexedDB, men ikke indbyggede billeder', () => {
    const c = applyEdits(base, { riders: base.riders.map((r, i) => ({ ...r, photo: i === 0 ? 'idb:1' : null })) });
    expect(referencedPhotoKeys(c)).toEqual(['idb:1']);
  });
});
