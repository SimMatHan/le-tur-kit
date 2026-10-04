import { describe, expect, it } from 'vitest';
import {
  estimateOffset,
  formatRoomCode,
  isRoomCode,
  makeRoomCode,
  normalizeRelayUrl,
  parseClientMessage,
  parseRemoteParams,
  remoteLink,
  sanitizePatch,
  socketUrl,
  stripPhotos,
} from './protocol';

describe('rumkode', () => {
  it('er 12 tegn uden forvekslelige tegn og kan valideres', () => {
    const codes = new Set(Array.from({ length: 200 }, () => makeRoomCode()));
    expect(codes.size).toBe(200);
    for (const c of codes) {
      expect(isRoomCode(c)).toBe(true);
      expect(c).not.toMatch(/[01IOL]/);
    }
    expect(isRoomCode('abc')).toBe(false);
    expect(isRoomCode('ABCDEFGHJKM0')).toBe(false);
    expect(formatRoomCode('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN');
  });
  it('kan laves deterministisk', () => {
    expect(makeRoomCode((n) => new Uint8Array(n))).toBe('AAAAAAAAAAAA');
  });
});

describe('adresser', () => {
  it('normaliserer relæ-adresser', () => {
    expect(normalizeRelayUrl('le-tur-2026.simon.workers.dev')).toBe('https://le-tur-2026.simon.workers.dev');
    expect(normalizeRelayUrl('https://x.workers.dev/')).toBe('https://x.workers.dev');
    expect(normalizeRelayUrl('wss://x.workers.dev')).toBe('https://x.workers.dev');
    expect(normalizeRelayUrl('localhost:8787')).toBe('http://localhost:8787');
    expect(normalizeRelayUrl('127.0.0.1:8787')).toBe('http://127.0.0.1:8787');
    expect(normalizeRelayUrl('')).toBeNull();
    expect(normalizeRelayUrl('ftp://x')).toBeNull();
  });
  it('bygger WebSocket-adresse og telefon-link – og læser linket igen', () => {
    expect(socketUrl('https://x.workers.dev', 'ABCDEFGHJKMN', 'screen')).toBe('wss://x.workers.dev/ws/ABCDEFGHJKMN?role=screen');
    expect(socketUrl('http://127.0.0.1:8787', 'ABCDEFGHJKMN', 'remote')).toBe('ws://127.0.0.1:8787/ws/ABCDEFGHJKMN?role=remote');
    const link = remoteLink('https://x.workers.dev', 'ABCDEFGHJKMN');
    expect(link).toBe('https://x.workers.dev/?remote=ABCDEFGHJKMN');
    const u = new URL(link);
    expect(parseRemoteParams(u.search, u.origin)).toEqual({ room: 'ABCDEFGHJKMN', relay: 'https://x.workers.dev' });
    // App hostet et andet sted (fx Pages) → relæet med i linket
    const other = new URL(remoteLink('https://x.workers.dev', 'ABCDEFGHJKMN', 'https://le-tur-2026.pages.dev'));
    expect(other.origin).toBe('https://le-tur-2026.pages.dev');
    expect(parseRemoteParams(other.search, other.origin)?.relay).toBe('https://x.workers.dev');
    // Koden må gerne være skrevet med bindestreger/små bogstaver
    expect(parseRemoteParams('?remote=abcd-efgh-jkmn', 'https://x.workers.dev')?.room).toBe('ABCDEFGHJKMN');
    expect(parseRemoteParams('?remote=forkert', 'https://x')).toBeNull();
    expect(parseRemoteParams('', 'https://x')).toBeNull();
  });
});

describe('fælles ur', () => {
  it('estimerer forskel til relæets ur og foretrækker hurtige rundture', () => {
    expect(estimateOffset([])).toBe(0);
    // Server 1000 ms foran; rundtur 100 ms → server-tid ved midten
    expect(estimateOffset([{ t0: 0, t1: 100, server: 1050 }])).toBe(1000);
    const samples = [
      { t0: 0, t1: 40, server: 1020 },
      { t0: 1000, t1: 1040, server: 2020 },
      { t0: 2000, t1: 3000, server: 4000 }, // langsom og skæv
    ];
    expect(estimateOffset(samples)).toBe(1000);
  });
});

describe('beskeder', () => {
  it('validerer beskeder til relæet', () => {
    expect(parseClientMessage('{"t":"ping","id":1,"t0":5}')).toEqual({ t: 'ping', id: 1, t0: 5 });
    expect(parseClientMessage('{"t":"snapshot","snap":{"v":1}}')?.t).toBe('snapshot');
    expect(parseClientMessage('{"t":"snapshot","snap":{"v":99}}')).toBeNull();
    expect(parseClientMessage('{"t":"hack"}')).toBeNull();
    expect(parseClientMessage('ikke json')).toBeNull();
    expect(parseClientMessage('x'.repeat(600_000))).toBeNull();
    expect(parseClientMessage(new ArrayBuffer(3))).toBeNull();
  });

  it('renser patches fra telefonen', () => {
    expect(sanitizePatch({ nav: 'next', overlay: 'standings', projector: null, from: 'abc', seq: 3 })).toEqual({
      nav: 'next',
      overlay: 'standings',
      projector: null,
      from: 'abc',
      seq: 3,
    });
    expect(sanitizePatch({ nav: -1, overlay: 'hack', projector: { kind: 'script' }, clock: { startedAt: 'x', stoppedMs: 1 } })).toEqual({});
    expect(sanitizePatch({ projector: { kind: 'quiz', cat: 1, row: 2, reveal: false } }).projector).toMatchObject({ kind: 'quiz' });
    expect(sanitizePatch({ clock: { startedAt: null, stoppedMs: 1500 } }).clock).toEqual({ startedAt: null, stoppedMs: 1500 });
    expect(sanitizePatch(null)).toEqual({});
  });

  it('sender aldrig fotos', () => {
    const e = stripPhotos({
      riders: [{ id: 'a', number: 1, name: 'A', nickname: '', bio: '', traits: [], photo: 'idb:x' }],
      commissioner: { name: 'S', title: 'LK', nickname: '', bio: '', traits: [], photo: 'img/kommissaer.jpg' },
    });
    expect(e.riders?.[0].photo).toBeNull();
    expect(e.commissioner?.photo).toBeNull();
    expect(stripPhotos({})).toEqual({});
  });
});
