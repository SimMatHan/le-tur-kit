import { useState } from 'react';
import { formatRoomCode, normalizeRelayUrl, remoteLink } from './protocol';
import { QrCode } from './QrCode';
import { useRemoteHost } from './RemoteHost';

const statusText = {
  off: 'Slået fra',
  connecting: 'Forbinder til relæet …',
  open: 'Forbundet til relæet',
  closed: 'Ingen forbindelse – prøver igen …',
} as const;

/** Opsætning → Fjernbetjening: start relæforbindelse og vis QR-kode til telefonen. */
export function RemoteSetup() {
  const { config, status, peers, start, stop, newRoom } = useRemoteHost();
  const [url, setUrl] = useState(config.relayUrl);
  const [error, setError] = useState<string | null>(null);
  const appUrl = (import.meta.env.VITE_APP_URL as string | undefined) || null;
  const link = config.active && normalizeRelayUrl(config.relayUrl) ? remoteLink(config.relayUrl, config.room, appUrl) : null;
  const phones = peers?.remotes ?? 0;

  return (
    <section>
      <h3>Fjernbetjening (telefon)</h3>
      <p className="hint">
        Styr slides og etaper fra din telefon – inkl. stopur og quiz med svar, som kun vises på telefonen. Kræver internet og relæet på Cloudflare (se
        README: <code>npm run deploy:remote</code>).
      </p>
      {!config.active ? (
        <div className="row wrap">
          <input
            className="grow"
            value={url}
            placeholder="https://le-tur-2026.<konto>.workers.dev"
            aria-label="Relæ-adresse"
            onChange={(e) => setUrl(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <button
            type="button"
            className="btn"
            onClick={() => {
              setError(null);
              if (!start(url)) setError('Ugyldig adresse – fx https://le-tur-2026.dit-navn.workers.dev');
            }}
          >
            Start fjernbetjening
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="remote-setup">
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="remote-qr" title="Scan med telefonen">
              <QrCode text={link} size={200} />
            </a>
          )}
          <div className="grow">
            <p className="remote-status">
              <span className={`dot st-${status}`} aria-hidden /> {statusText[status]}
              {status === 'open' && <> · {phones === 0 ? 'ingen telefon endnu' : phones === 1 ? '1 telefon forbundet' : `${phones} telefoner forbundet`}</>}
            </p>
            <p className="hint">Scan QR-koden med telefonen, eller åbn linket:</p>
            <input readOnly value={link ?? ''} aria-label="Link til telefonen" onFocus={(e) => e.target.select()} style={{ width: '100%' }} />
            <p className="hint">
              Rumkode: <strong>{formatRoomCode(config.room)}</strong> · Relæ: {config.relayUrl}
            </p>
            <div className="row wrap">
              <button type="button" className="btn btn-ghost" onClick={() => confirm('Lav en ny rumkode? Forbundne telefoner mister forbindelsen.') && newRoom()}>
                Ny rumkode
              </button>
              <button type="button" className="btn btn-ghost" onClick={stop}>
                Stop fjernbetjening
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
