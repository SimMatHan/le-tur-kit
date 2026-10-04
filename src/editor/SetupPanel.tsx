import { useRef, useState } from 'react';
import { useContentCtx } from '../content/ContentContext';
import { MAX_RIDERS, MIN_RIDERS } from '../content/edits';
import { exportSetup, importSetup, resetAll } from '../content/setupActions';
import { RemoteSetup } from '../remote/RemoteSetup';

interface Props {
  onClose: () => void;
  onEditRider: (riderId: string | 'commissioner') => void;
}

/** Opsætning: ryttere (tilføj/fjern), eksport/import af backup og nulstil til standard. */
export function SetupPanel({ onClose, onEditRider }: Props) {
  const { content, edits, addRider, removeRider } = useContentCtx();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal setup" role="dialog" aria-label="Opsætning" onClick={(e) => e.stopPropagation()}>
        <header className="editor-head">
          <h2>Opsætning</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Luk (Esc)">
            ×
          </button>
        </header>

        <section>
          <h3>
            Ryttere <small>({content.riders.length} af {MIN_RIDERS}–{MAX_RIDERS})</small>
          </h3>
          <ul className="rider-list">
            {content.riders.map((r) => (
              <li key={r.id}>
                <span className="rider-no">{r.number}</span>
                <span className="rider-name">
                  {r.name}
                  {r.photo ? '' : <small> · intet foto</small>}
                </span>
                <button type="button" className="btn btn-small" onClick={() => onEditRider(r.id)}>
                  Redigér
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  disabled={content.riders.length <= MIN_RIDERS}
                  onClick={() => confirm(`Fjern ${r.name}? Rytterens foto og resultater slettes.`) && removeRider(r.id)}
                >
                  Fjern
                </button>
              </li>
            ))}
            <li>
              <span className="rider-no">LK</span>
              <span className="rider-name">{content.commissioner.name}</span>
              <button type="button" className="btn btn-small" onClick={() => onEditRider('commissioner')}>
                Redigér
              </button>
            </li>
          </ul>
          <button
            type="button"
            className="btn"
            disabled={content.riders.length >= MAX_RIDERS}
            onClick={() => {
              const id = addRider();
              if (id) onEditRider(id);
            }}
          >
            + Tilføj rytter
          </button>
        </section>

        <RemoteSetup />

        <section>
          <h3>Backup</h3>
          <p className="hint">
            Alt gemmes kun i denne browser. Eksportér en backup (ryttere, fotos og resultater i én .json-fil) for at flytte til en anden computer.
            Filen indeholder fotos af rigtige personer – del den varsomt.
          </p>
          <div className="row wrap">
            <button type="button" className="btn" disabled={!!busy} onClick={() => run('export', () => exportSetup(content, edits))}>
              {busy === 'export' ? 'Eksporterer …' : 'Eksportér backup'}
            </button>
            <button type="button" className="btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>
              {busy === 'import' ? 'Importerer …' : 'Importér backup …'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f && confirm('Importen erstatter alle ryttere, fotos og resultater i denne browser. Fortsæt?')) void run('import', () => importSetup(f));
              }}
            />
          </div>
        </section>

        <section>
          <h3>Nulstil</h3>
          <p className="hint">Sletter alle redigeringer, fotos og resultater og går tilbage til standardindholdet.</p>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!!busy}
            onClick={() => confirm('Nulstil alt til standard? Det kan ikke fortrydes (medmindre du har en backup).') && run('reset', resetAll)}
          >
            Nulstil til standard
          </button>
        </section>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
