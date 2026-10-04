import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup, backupFileName } from './backup';
import { applyEdits } from './edits';
import contentJson from './content.json';
import type { Content } from './types';

const base = contentJson as unknown as Content;

describe('backup', () => {
  const riders = base.riders.map((r, i) => ({ ...r, name: `Rytter ${i + 1}`, photo: i < 2 ? `idb:p${i}` : null }));
  const edits = { riders, commissioner: { ...base.commissioner, nickname: 'Ny' } };
  const content = applyEdits(base, edits);
  const io = {
    get: async (k: string) => (k === 'idb:p0' ? new Blob(['x']) : undefined),
    toDataUrl: async () => 'data:image/jpeg;base64,eA==',
  };

  it('eksporterer indhold, brugte fotos og spiltilstand – og importerer det igen', async () => {
    const game = { stages: { 1: { times: { r1: 12.3 } } } };
    const b = await buildBackup(content, edits, game, io, new Date('2026-07-01T12:00:00Z'));
    expect(Object.keys(b.photos)).toEqual(['idb:p0']);
    const parsed = parseBackup(JSON.stringify(b));
    expect(parsed.edits.riders?.map((r) => r.name)).toEqual(riders.map((r) => r.name));
    expect(parsed.edits.riders?.[0].photo).toBe('idb:p0');
    // Foto uden data i filen nulstilles
    expect(parsed.edits.riders?.[1].photo).toBeNull();
    expect(parsed.edits.commissioner?.nickname).toBe('Ny');
    expect(parsed.photos['idb:p0']).toMatch(/^data:image\//);
    expect(parsed.game).toEqual(game);
  });

  it('afviser filer, der ikke er en backup', () => {
    expect(() => parseBackup('ikke json')).toThrow(/JSON/);
    expect(() => parseBackup('{"app":"andet"}')).toThrow(/Le Tur/);
    expect(() => parseBackup('{"app":"le-tur-2026","version":99}')).toThrow(/nyere/);
  });

  it('ignorerer fotos, der ikke er billeder', () => {
    const p = parseBackup(JSON.stringify({ app: 'le-tur-2026', version: 1, photos: { 'idb:a': 'data:text/html,<script>', x: 'data:image/png;base64,' } }));
    expect(p.photos).toEqual({});
  });

  it('navngiver filen med dato', () => {
    expect(backupFileName(new Date(2026, 6, 4))).toBe('le-tur-2026-backup-2026-07-04.json');
  });
});
