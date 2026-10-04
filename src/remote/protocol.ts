// Protokol for fjernbetjening: skærmen (præsentationen) og telefonen (kommissæren)
// taler sammen gennem et Cloudflare-relæ (remote/worker.ts). Filen bruges af både
// appen og relæet og må derfor ikke afhænge af DOM eller React.
import type { ContentEdits } from '../content/edits';
import type { GameState } from '../game/types';

export const PROTOCOL_VERSION = 1;

export type Role = 'screen' | 'remote';

/** Hvad der vises på skærmen ud over sliden (spejler commissioner/CommissionerContext). */
export type ProjectorViewData =
  | null
  | { kind: 'stopwatch'; stage: number }
  | { kind: 'highlow' }
  | { kind: 'bracket' }
  | { kind: 'vinokourov' }
  | { kind: 'carrot'; a: string; b: string; third: string | null };

/** Stopurets tilstand. startedAt er i fælles tid (relæets ur), så alle enheder viser det samme. */
export interface ClockData {
  startedAt: number | null;
  stoppedMs: number;
}

export interface SlideInfo {
  index: number;
  count: number;
  title: string;
  /** Etapen, som sliden hører til (til kommissærpanelets fane). */
  stage?: number;
}

export interface UiState {
  projector: ProjectorViewData;
  clock: ClockData;
  overlay: 'standings' | null;
  slide: SlideInfo;
  slides: string[];
}

/** Skærmens fulde tilstand (skærmen er "sandheden"). Fotos sendes ikke. */
export interface Snapshot {
  v: typeof PROTOCOL_VERSION;
  edits: ContentEdits;
  game: GameState;
  ui: UiState;
  /** Seneste patch-nummer, skærmen har anvendt, pr. telefon (så telefonen kan se bort fra forældede snapshots). */
  acks: Record<string, number>;
}

/** Ændringer fra telefonen. Kun de felter, der er med, ændres. */
export interface Patch {
  game?: GameState;
  projector?: ProjectorViewData;
  clock?: ClockData;
  overlay?: 'standings' | null;
  nav?: 'next' | 'prev' | number;
  /** Afsenderens id og løbenummer (til kvittering i snapshot.acks). */
  from?: string;
  seq?: number;
}

export type ClientMessage =
  | { t: 'snapshot'; snap: Snapshot }
  | { t: 'patch'; patch: Patch }
  | { t: 'ping'; id: number; t0: number };

export interface Peers {
  screens: number;
  remotes: number;
}

export type ServerMessage =
  | { t: 'welcome'; snap: Snapshot | null; peers: Peers; server: number }
  | { t: 'snapshot'; snap: Snapshot }
  | { t: 'patch'; patch: Patch }
  | { t: 'pong'; id: number; t0: number; server: number }
  | { t: 'peers'; peers: Peers };

// ---------- Rumkode ----------

/** Uden tegn, der let forveksles (0/O, 1/I/L). 12 tegn ≈ 60 bit. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 12;
export const ROOM_CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;

export function makeRoomCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(ROOM_CODE_LENGTH);
  let out = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export const isRoomCode = (s: unknown): s is string => typeof s === 'string' && ROOM_CODE_RE.test(s);

/** Rumkode i læsbare grupper: ABCD-EFGH-JKMN */
export const formatRoomCode = (code: string) => code.match(/.{1,4}/g)?.join('-') ?? code;

// ---------- Adresser ----------

/** Normaliserer en relæ-adresse: "le-tur.x.workers.dev" → "https://le-tur.x.workers.dev" (uden afsluttende /). */
export function normalizeRelayUrl(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  if (!/^[a-z]+:\/\//i.test(s)) s = (/^(localhost|127\.|\[::1\])/.test(s) ? 'http://' : 'https://') + s;
  try {
    const u = new URL(s);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol)) return null;
    const proto = u.protocol === 'ws:' ? 'http:' : u.protocol === 'wss:' ? 'https:' : u.protocol;
    return `${proto}//${u.host}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

/** WebSocket-adressen for et rum. */
export function socketUrl(relayUrl: string, room: string, role: Role): string {
  const base = normalizeRelayUrl(relayUrl) ?? relayUrl;
  return `${base.replace(/^http/, 'ws')}/ws/${room}?role=${role}`;
}

/** Linket, telefonen åbner. Appen hentes fra relæet (samme adresse), medmindre appUrl er sat. */
export function remoteLink(relayUrl: string, room: string, appUrl?: string | null): string {
  const relay = normalizeRelayUrl(relayUrl) ?? relayUrl;
  const app = (appUrl && normalizeRelayUrl(appUrl)) || relay;
  const params = new URLSearchParams({ remote: room });
  if (app !== relay) params.set('relay', relay);
  return `${app}/?${params}`;
}

/** Læser ?remote=KODE[&relay=…] fra en adresse. */
export function parseRemoteParams(search: string, origin: string): { room: string; relay: string } | null {
  const p = new URLSearchParams(search);
  const room = p.get('remote')?.toUpperCase().replace(/-/g, '');
  if (!isRoomCode(room)) return null;
  const relay = normalizeRelayUrl(p.get('relay') ?? origin);
  return relay ? { room, relay } : null;
}

// ---------- Fælles ur ----------

export interface ClockSample {
  t0: number;
  t1: number;
  server: number;
}

/** Forskel mellem relæets ur og det lokale ur (ms). Median af målinger, korrigeret for halv rundtur. */
export function estimateOffset(samples: ClockSample[]): number {
  if (!samples.length) return 0;
  // De hurtigste rundture er de mest præcise.
  const best = [...samples].sort((a, b) => a.t1 - a.t0 - (b.t1 - b.t0)).slice(0, Math.max(1, Math.ceil(samples.length / 2)));
  const offsets = best.map((s) => s.server - (s.t0 + s.t1) / 2).sort((a, b) => a - b);
  return Math.round(offsets[Math.floor(offsets.length / 2)]);
}

// ---------- Validering af beskeder ----------

const MAX_MESSAGE = 512_000;

export function parseClientMessage(data: unknown): ClientMessage | null {
  if (typeof data !== 'string' || data.length > MAX_MESSAGE) return null;
  try {
    const m = JSON.parse(data);
    if (!m || typeof m !== 'object') return null;
    if (m.t === 'ping' && typeof m.id === 'number' && typeof m.t0 === 'number') return m;
    if (m.t === 'snapshot' && m.snap && typeof m.snap === 'object' && m.snap.v === PROTOCOL_VERSION) return m;
    if (m.t === 'patch' && m.patch && typeof m.patch === 'object') return m;
    return null;
  } catch {
    return null;
  }
}

const PROJECTOR_KINDS = ['stopwatch', 'highlow', 'bracket', 'vinokourov', 'carrot'];

/** Renser en patch fra telefonen (spiltilstanden valideres separat med sanitizeGame). */
export function sanitizePatch(raw: unknown): Patch {
  const out: Patch = {};
  if (!raw || typeof raw !== 'object') return out;
  const p = raw as Record<string, unknown>;
  if (p.game && typeof p.game === 'object') out.game = p.game as GameState;
  if ('projector' in p) {
    const v = p.projector as Record<string, unknown> | null;
    if (v === null) out.projector = null;
    else if (v && typeof v === 'object' && PROJECTOR_KINDS.includes(String(v.kind))) out.projector = v as unknown as ProjectorViewData;
  }
  if (p.clock && typeof p.clock === 'object') {
    const c = p.clock as Record<string, unknown>;
    if ((c.startedAt === null || typeof c.startedAt === 'number') && typeof c.stoppedMs === 'number') out.clock = { startedAt: c.startedAt as number | null, stoppedMs: c.stoppedMs };
  }
  if (p.overlay === null || p.overlay === 'standings') out.overlay = p.overlay;
  if (p.nav === 'next' || p.nav === 'prev' || (typeof p.nav === 'number' && Number.isInteger(p.nav) && p.nav >= 0)) out.nav = p.nav;
  if (typeof p.from === 'string' && /^[a-z0-9]{1,24}$/i.test(p.from) && typeof p.seq === 'number' && Number.isInteger(p.seq)) {
    out.from = p.from;
    out.seq = p.seq;
  }
  return out;
}

/** Fjerner fotos fra indholdet, før det sendes (de er store og private). */
export function stripPhotos(edits: ContentEdits): ContentEdits {
  return {
    ...(edits.riders ? { riders: edits.riders.map((r) => ({ ...r, photo: null })) } : {}),
    ...(edits.commissioner ? { commissioner: { ...edits.commissioner, photo: null } } : {}),
  };
}
