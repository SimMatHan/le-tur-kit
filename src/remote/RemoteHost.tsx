// Skærmens side af fjernbetjeningen: forbinder til relæet, sender skærmens tilstand
// (snapshot) til telefonen og anvender telefonens ændringer (patch).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCommissioner } from '../commissioner/CommissionerContext';
import { useContentCtx } from '../content/ContentContext';
import { STORAGE_PREFIX, readJson, writeJson } from '../content/storage';
import { useGame } from '../game/GameContext';
import { sanitizeGame } from '../game/gameState';
import { RelayConnection, type ConnStatus } from './connection';
import {
  PROTOCOL_VERSION,
  isRoomCode,
  makeRoomCode,
  normalizeRelayUrl,
  sanitizePatch,
  stripPhotos,
  type Patch,
  type Peers,
  type SlideInfo,
  type Snapshot,
} from './protocol';

const REMOTE_KEY = STORAGE_PREFIX + 'remote';

export interface RemoteConfig {
  relayUrl: string;
  room: string;
  active: boolean;
}

/** Kommando fra telefonen til præsentationen (navigation og klassement-overlay). */
export interface RemoteCommand {
  nav?: Patch['nav'];
  overlay?: Patch['overlay'];
}
export const REMOTE_COMMAND_EVENT = 'le-tur:remote-command';

/** Standard-relæ: VITE_RELAY_URL ved build, ellers siden selv, hvis den hentes fra relæet. */
export function defaultRelayUrl(): string {
  const env = import.meta.env.VITE_RELAY_URL as string | undefined;
  if (env) return normalizeRelayUrl(env) ?? '';
  if (location.protocol === 'https:') return location.origin;
  return '';
}

function loadConfig(): RemoteConfig {
  const raw = readJson(REMOTE_KEY) as Partial<RemoteConfig> | undefined;
  return {
    relayUrl: typeof raw?.relayUrl === 'string' && raw.relayUrl ? raw.relayUrl : defaultRelayUrl(),
    room: isRoomCode(raw?.room) ? raw.room : makeRoomCode(),
    active: raw?.active === true,
  };
}

interface RemoteHostCtx {
  config: RemoteConfig;
  status: ConnStatus | 'off';
  peers: Peers | null;
  start: (relayUrl: string) => boolean;
  stop: () => void;
  newRoom: () => void;
  /** Præsentationen melder, hvilken slide der vises. */
  reportSlide: (slide: SlideInfo, slides: string[], overlay: 'standings' | null) => void;
}

const Ctx = createContext<RemoteHostCtx | null>(null);

export function RemoteHostProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RemoteConfig>(loadConfig);
  const [status, setStatus] = useState<ConnStatus | 'off'>('off');
  const [peers, setPeers] = useState<Peers | null>(null);
  const [slide, setSlide] = useState<{ slide: SlideInfo; slides: string[]; overlay: 'standings' | null }>({
    slide: { index: 0, count: 0, title: '' },
    slides: [],
    overlay: null,
  });
  const conn = useRef<RelayConnection | null>(null);
  const acks = useRef<Record<string, number>>({});
  const [ackTick, setAckTick] = useState(0);

  const { edits, content } = useContentCtx();
  const { game, applyExternal } = useGame();
  const { projector, clock, applyRemote } = useCommissioner();

  useEffect(() => {
    writeJson(REMOTE_KEY, config);
  }, [config]);

  // Telefonens ændringer anvendes her og sendes videre til præsentationen.
  const contentRef = useRef(content);
  contentRef.current = content;
  const onPatch = useCallback(
    (raw: unknown) => {
      const p = sanitizePatch(raw);
      if (p.game) applyExternal(sanitizeGame(p.game, contentRef.current), { history: true });
      if ('projector' in p || p.clock) applyRemote({ ...('projector' in p ? { projector: p.projector ?? null } : {}), ...(p.clock ? { clock: p.clock } : {}) });
      if (p.nav !== undefined || p.overlay !== undefined) {
        const cmd: RemoteCommand = {};
        if (p.nav !== undefined) cmd.nav = p.nav;
        if (p.overlay !== undefined) cmd.overlay = p.overlay;
        window.dispatchEvent(new CustomEvent<RemoteCommand>(REMOTE_COMMAND_EVENT, { detail: cmd }));
      }
      if (p.from && p.seq) {
        acks.current = { ...acks.current, [p.from]: p.seq };
        setAckTick((t) => t + 1);
      }
    },
    [applyExternal, applyRemote],
  );
  const onPatchRef = useRef(onPatch);
  onPatchRef.current = onPatch;

  // Forbind/afbryd
  const remotesRef = useRef(0);
  const [hello, setHello] = useState(0);
  useEffect(() => {
    if (!config.active || !normalizeRelayUrl(config.relayUrl)) {
      setStatus('off');
      setPeers(null);
      return;
    }
    const c = new RelayConnection({
      relayUrl: config.relayUrl,
      room: config.room,
      role: 'screen',
      onStatus: (s) => {
        setStatus(s);
        if (s === 'open') setHello((h) => h + 1);
      },
      onMessage: (m) => {
        if (m.t === 'welcome' || m.t === 'peers') {
          setPeers(m.peers);
          // En ny telefon skal have tilstanden med det samme.
          if (m.peers.remotes > remotesRef.current) setHello((h) => h + 1);
          remotesRef.current = m.peers.remotes;
        } else if (m.t === 'patch') onPatchRef.current(m.patch);
      },
    });
    conn.current = c;
    return () => {
      c.close();
      conn.current = null;
    };
  }, [config.active, config.relayUrl, config.room]);

  // Send skærmens tilstand, når noget ændrer sig (samlet i små bidder).
  const snapshot = useMemo<Snapshot>(
    () => ({
      v: PROTOCOL_VERSION,
      edits: stripPhotos(edits),
      game,
      ui: { projector, clock, overlay: slide.overlay, slide: slide.slide, slides: slide.slides },
      acks: acks.current,
    }),
    // ackTick: kvitteringer skal også sendes, selv om intet andet ændrede sig
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edits, game, projector, clock, slide, ackTick],
  );
  useEffect(() => {
    if (status !== 'open') return;
    const t = window.setTimeout(() => conn.current?.send({ t: 'snapshot', snap: snapshot }), 40);
    return () => window.clearTimeout(t);
  }, [snapshot, status, hello]);

  const start = useCallback((relayUrl: string) => {
    const url = normalizeRelayUrl(relayUrl);
    if (!url) return false;
    setConfig((c) => ({ ...c, relayUrl: url, active: true }));
    return true;
  }, []);
  const stop = useCallback(() => setConfig((c) => ({ ...c, active: false })), []);
  const newRoom = useCallback(() => setConfig((c) => ({ ...c, room: makeRoomCode() })), []);
  const reportSlide = useCallback((s: SlideInfo, slides: string[], overlay: 'standings' | null) => {
    setSlide((cur) =>
      cur.slide.index === s.index && cur.slide.count === s.count && cur.slide.title === s.title && cur.slide.stage === s.stage && cur.overlay === overlay && cur.slides.join('\n') === slides.join('\n')
        ? cur
        : { slide: s, slides, overlay },
    );
  }, []);

  const value = useMemo(() => ({ config, status, peers, start, stop, newRoom, reportSlide }), [config, status, peers, start, stop, newRoom, reportSlide]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRemoteHost(): RemoteHostCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRemoteHost skal bruges inde i RemoteHostProvider');
  return ctx;
}
