import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { useContentCtx, type PersonRef } from '../content/ContentContext';
import { MAX_RIDERS, MIN_RIDERS } from '../content/edits';
import { cropPhoto } from '../content/photoCrop';
import { usePhotoUrl } from '../content/photos';
import { photosArePersistent } from '../content/photoStore';
import type { Person } from '../content/types';

interface Props {
  target: PersonRef;
  onClose: () => void;
  onAdded: (riderId: string) => void;
  onOpenSetup: () => void;
}

/** Sidepanel til redigering af en rytter eller kommissæren. Ændringer vises live og gemmes lokalt. */
export function EditorPanel({ target, onClose, onAdded, onOpenSetup }: Props) {
  const { content, updateRider, updateCommissioner, addRider, removeRider, setPhoto, saveFailed } = useContentCtx();
  const isComm = target === 'commissioner';
  const rider = isComm ? undefined : content.riders.find((r) => r.id === target);
  const person: Person | undefined = isComm ? content.commissioner : rider;
  const update = (patch: Partial<Person> & { number?: number; title?: string }) =>
    isComm ? updateCommissioner(patch) : updateRider(target, patch);

  const [trait, setTrait] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    void photosArePersistent().then(setPersistent);
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const photoUrl = usePhotoUrl(person?.photo);

  useEffect(() => {
    setError(null);
    setTrait('');
  }, [target]);

  if (!person) return null;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setPhoto(target, await cropPhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Billedet kunne ikke indlæses');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files[0]);
  };

  const addTrait = () => {
    const t = trait.trim();
    if (!t) return;
    update({ traits: [...person.traits, t].slice(0, 8) });
    setTrait('');
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const dupNumber = rider && content.riders.find((r) => r.id !== rider.id && r.number === rider.number);

  return (
    <aside className="editor" aria-label="Redigér" onKeyDown={onKeyDown}>
      <header className="editor-head">
        <h2>{isComm ? 'Redigér kommissæren' : `Redigér rytter nr. ${rider?.number}`}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Luk (Esc)" title="Luk (Esc)">
          ×
        </button>
      </header>

      <div className="editor-body">
        <section
          className={`photo-drop ${dragOver ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="photo-thumb">{photoUrl ? <img src={photoUrl} alt="" /> : <span>Intet foto</span>}</div>
          <div className="photo-actions">
            <button type="button" className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? 'Behandler …' : person.photo ? 'Skift foto …' : 'Indsæt billede …'}
            </button>
            {person.photo && (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void setPhoto(target, null)}>
                Fjern foto
              </button>
            )}
            <p className="hint">Eller træk et billede herind. Det beskæres til rammen og gemmes kun i denne browser.</p>
            {error && <p className="error">{error}</p>}
            {!persistent && (
              <p className="error">
                Denne browser kan ikke gemme fotos permanent (fx privat vindue). Fotos forsvinder ved genindlæsning – brug Chrome/Edge, eller eksportér en
                backup.
              </p>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
        </section>

        <label className="field">
          <span>Navn</span>
          <input ref={firstRef} value={person.name} onChange={(e) => update({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>Kælenavn</span>
          <input value={person.nickname} onChange={(e) => update({ nickname: e.target.value })} placeholder="fx Bøflen fra Greve" />
        </label>
        {isComm ? (
          <label className="field">
            <span>Titel</span>
            <input value={content.commissioner.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
        ) : (
          <label className="field">
            <span>Rygnummer</span>
            <input
              type="number"
              min={0}
              max={999}
              value={rider?.number ?? 0}
              onChange={(e) => update({ number: Math.max(0, Math.min(999, Math.round(Number(e.target.value) || 0))) })}
            />
            {dupNumber && <small className="warn">Nummeret bruges også af {dupNumber.name}.</small>}
          </label>
        )}
        <label className="field">
          <span>Tekst</span>
          <textarea rows={5} value={person.bio} onChange={(e) => update({ bio: e.target.value })} />
          <small className={person.bio.length > 300 ? 'warn' : ''}>{person.bio.length} tegn – teksten skaleres ned, hvis den er lang</small>
        </label>

        <div className="field">
          <span>Egenskaber</span>
          <ul className="chips">
            {person.traits.map((t, i) => (
              <li key={i} className="chip-edit">
                <input
                  value={t}
                  aria-label={`Egenskab ${i + 1}`}
                  onChange={(e) => update({ traits: person.traits.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                <button
                  type="button"
                  aria-label={`Fjern ${t}`}
                  title="Fjern"
                  onClick={() => update({ traits: person.traits.filter((_, j) => j !== i) })}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {person.traits.length < 8 && (
            <div className="row">
              <input
                value={trait}
                placeholder="Ny egenskab"
                onChange={(e) => setTrait(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTrait();
                  }
                }}
              />
              <button type="button" className="btn" onClick={addTrait} disabled={!trait.trim()}>
                Tilføj
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="editor-foot">
        <p className={saveFailed ? 'error' : 'saved'}>{saveFailed ? 'Kunne ikke gemme – browserens lager er fuldt eller slået fra' : 'Gemmes automatisk i browseren ✓'}</p>
        <div className="row wrap">
          <button
            type="button"
            className="btn"
            disabled={content.riders.length >= MAX_RIDERS}
            title={content.riders.length >= MAX_RIDERS ? `Højst ${MAX_RIDERS} ryttere` : undefined}
            onClick={() => {
              const id = addRider();
              if (id) onAdded(id);
            }}
          >
            + Tilføj rytter
          </button>
          {!isComm && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={content.riders.length <= MIN_RIDERS}
              title={content.riders.length <= MIN_RIDERS ? `Mindst ${MIN_RIDERS} ryttere` : undefined}
              onClick={() => {
                if (confirm(`Fjern ${person.name}? Rytterens foto og resultater slettes.`)) removeRider(target);
              }}
            >
              Fjern rytter
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onOpenSetup}>
            Opsætning og backup …
          </button>
        </div>
      </footer>
    </aside>
  );
}
