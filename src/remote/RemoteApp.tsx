// Telefonens side af fjernbetjeningen: hele kommissærpanelet plus slide-styring.
// Skærmen er "sandheden"; telefonen sender ændringer (patch) og modtager skærmens
// tilstand (snapshot). Intet gemmes på telefonen.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { CommissionerProvider, useCommissioner, type CommissionerSync } from '../commissioner/CommissionerContext';
import { CommissionerPanel } from '../commissioner/CommissionerPanel';
import { ContentProvider, useContentCtx } from '../content/ContentContext';
import { sanitizeEdits } from '../content/edits';
import { GameProvider, useGame } from '../game/GameContext';
import { sanitizeGame } from '../game/gameState';
import { RelayConnection, type ConnStatus } from './connection';
import { formatRoomCode, type Patch, type Peers, type Snapshot } from './protocol';

const clientId = () => Math.random().toString(36).slice(2, 10);

export function RemoteApp({ room, relay }: { room: string; relay: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<ConnStatus>('connecting');
  const [peers, setPeers] = useState<Peers | null>(null);
  const conn = useRef<RelayConnection | null>(null);
  const id = useMemo(clientId, []);
  const seq = useRef(0);

  useEffect(() => {
    document.title = 'Le Tur – fjernbetjening';
    const c = new RelayConnection({
      relayUrl: relay,
      room,
      role: 'remote',
      onStatus: setStatus,
      onMessage: (m) => {
        if (m.t === 'welcome') {
          setPeers(m.peers);
          if (m.snap) setSnap(m.snap);
        } else if (m.t === 'snapshot') setSnap(m.snap);
        else if (m.t === 'peers') setPeers(m.peers);
      },
    });
    conn.current = c;
    return () => c.close();
  }, [room, relay]);

  const send = useCallback(
    (p: Patch) => {
      seq.current += 1;
      conn.current?.send({ t: 'patch', patch: { ...p, from: id, seq: seq.current } });
    },
    [id],
  );

  // Indholdet (rytternavne) kommer fra skærmen; kun ved reelle ændringer.
  const editsJson = JSON.stringify(snap?.edits ?? {});
  const edits = useMemo(() => sanitizeEdits(JSON.parse(editsJson)), [editsJson]);

  const screenOnline = (peers?.screens ?? 0) > 0;

  return (
    <div className="remote-app">
      <header className="remote-bar">
        <div className="row">
          <strong className="grow">Le Tur · Fjernbetjening</strong>
          <span className={`dot st-${status === 'open' ? (screenOnline ? 'open' : 'closed') : status}`} aria-hidden />
          <small>{status !== 'open' ? 'Forbinder …' : screenOnline ? 'Skærmen er forbundet' : 'Skærmen er ikke forbundet'}</small>
        </div>
        <small className="muted">Rum {formatRoomCode(room)}</small>
      </header>
      {!snap ? (
        <div className="remote-wait">
          <p>Venter på skærmen …</p>
          <p className="hint">Åbn præsentationen, og start fjernbetjening under Opsætning med samme rumkode.</p>
        </div>
      ) : (
        <ContentProvider persist={false} externalEdits={edits}>
          <GameProvider persist={false} onLocalChange={(g) => send({ game: g })}>
            <CommissionerProvider onLocalChange={(s: CommissionerSync) => send(s)}>
              <SnapshotSync snap={snap} id={id} seq={seq} />
              <SlideControls snap={snap} send={send} />
              <CommissionerPanel embedded />
            </CommissionerProvider>
          </GameProvider>
        </ContentProvider>
      )}
    </div>
  );
}

/** Anvender skærmens tilstand – men ikke hvis den er ældre end telefonens seneste ændring. */
function SnapshotSync({ snap, id, seq }: { snap: Snapshot; id: string; seq: RefObject<number> }) {
  const { content } = useContentCtx();
  const { game, applyExternal } = useGame();
  const { applyRemote, setStage, projector, clock } = useCommissioner();
  const gameRef = useRef(game);
  gameRef.current = game;
  const fresh = (snap.acks?.[id] ?? 0) >= (seq.current ?? 0);

  useEffect(() => {
    if (!fresh) return;
    const g = sanitizeGame(snap.game, content);
    if (JSON.stringify(g) !== JSON.stringify(gameRef.current)) applyExternal(g);
    const sync: CommissionerSync = {};
    if (JSON.stringify(snap.ui.projector) !== JSON.stringify(projector)) sync.projector = snap.ui.projector;
    if (JSON.stringify(snap.ui.clock) !== JSON.stringify(clock)) sync.clock = snap.ui.clock;
    if (Object.keys(sync).length) applyRemote(sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, fresh]);

  // Panelet følger etapen på skærmens aktuelle slide.
  const slideStage = snap.ui.slide.stage;
  useEffect(() => {
    if (slideStage) setStage(slideStage);
  }, [slideStage, setStage]);
  return null;
}

function SlideControls({ snap, send }: { snap: Snapshot; send: (p: Patch) => void }) {
  const { projector, setProjector } = useCommissioner();
  const { slide, slides, overlay } = snap.ui;
  return (
    <div className="remote-slides">
      <div className="row">
        <button type="button" className="btn remote-nav" onClick={() => send({ nav: 'prev' })} disabled={slide.index <= 0} aria-label="Forrige slide">
          ‹
        </button>
        <select className="grow" aria-label="Gå til slide" value={slide.index} onChange={(e) => send({ nav: Number(e.target.value) })}>
          {slides.map((t, i) => (
            <option key={i} value={i}>
              {i + 1}/{slides.length} · {t}
            </option>
          ))}
        </select>
        <button type="button" className="btn remote-nav" onClick={() => send({ nav: 'next' })} disabled={slide.index >= slide.count - 1} aria-label="Næste slide">
          ›
        </button>
      </div>
      <div className="row wrap">
        <button type="button" className={`btn btn-small ${overlay ? '' : 'btn-ghost'}`} onClick={() => send({ overlay: overlay ? null : 'standings' })}>
          {overlay ? 'Skjul klassement' : 'Vis klassement'}
        </button>
        {projector && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setProjector(null)}>
            Luk overlay på skærmen
          </button>
        )}
      </div>
    </div>
  );
}
