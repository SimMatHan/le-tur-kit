import { bracketStatus, makeRound, setDuelWinner } from '../../game/bracket';
import { BracketView } from '../BracketView';
import { useCommissioner } from '../CommissionerContext';
import { NumberInput, RiderToggles } from '../fields';
import { useStagePanel } from '../useStagePanel';

/** Etape 5 – Champs-Élysées: beerpong, Vinokourov-mirakel eller knock-out. */
export function ChampsPanel({ n }: { n: number }) {
  const { input, setInput, riders, nameOf } = useStagePanel(n, 'champs');
  const { setProjector } = useCommissioner();
  const hits = input.hits.filter((id) => riders.some((r) => r.id === id));
  const started = input.rounds.length > 0;
  const status = bracketStatus(hits, input.rounds);

  const startKnockout = () => {
    setInput((i) => ({ ...i, rounds: [makeRound(hits)] }));
    setProjector({ kind: 'bracket' });
  };

  return (
    <>
      <section className="panel-section">
        <h3>1. Beerpong – hvem ramte?</h3>
        <RiderToggles
          riders={riders}
          selected={hits}
          disabled={started}
          onToggle={(id) => setInput((i) => ({ ...i, hits: i.hits.includes(id) ? i.hits.filter((x) => x !== id) : [...i.hits, id] }))}
        />
        {started && (
          <button
            type="button"
            className="btn btn-ghost btn-small"
            style={{ marginTop: 8 }}
            onClick={() => confirm('Nulstil knock-outen? Alle dueller slettes.') && setInput((i) => ({ ...i, rounds: [] }))}
          >
            Nulstil knock-out (for at rette hvem der ramte)
          </button>
        )}
      </section>

      <section className="panel-section">
        {hits.length === 0 && (
          <>
            <h3>2. Ingen ramte endnu</h3>
            <p className="hint">Rammer ingen, skyder alle igen.</p>
          </>
        )}

        {hits.length === 1 && (
          <>
            <h3>2. Vinokourov-mirakel!</h3>
            <p>
              Kun <strong>{nameOf(hits[0])}</strong> ramte. Han slår med to terninger – øjnene trækkes fra hans tid.
            </p>
            <div className="row wrap">
              <label className="row">
                Terningsum:
                <NumberInput label="Vinokourov terningsum" value={input.vinokourovDice} min={2} max={12} onCommit={(v) => setInput((i) => ({ ...i, vinokourovDice: v }))} />
              </label>
              <button type="button" className="btn btn-red" onClick={() => setProjector({ kind: 'vinokourov' })}>
                Vis miraklet på skærmen
              </button>
            </div>
          </>
        )}

        {hits.length >= 2 && (
          <>
            <h3>2. Knock-out i Carrot in the Box</h3>
            {!started ? (
              <button type="button" className="btn" onClick={startKnockout}>
                Start knock-out ({hits.length} ryttere, tilfældig parring)
              </button>
            ) : (
              <>
                <p className="hint">Klik på vinderen af hver duel. Ulige antal giver walkover.</p>
                <BracketView
                  entrants={hits}
                  rounds={input.rounds}
                  onWinner={(ri, di, w) => setInput((i) => ({ ...i, rounds: setDuelWinner(i.rounds, ri, di, w) }))}
                />
                <div className="row wrap" style={{ marginTop: 8 }}>
                  {status.needsNextRound && (
                    <button type="button" className="btn" onClick={() => setInput((i) => ({ ...i, rounds: [...i.rounds, makeRound(status.alive)] }))}>
                      Næste runde (tilfældig parring)
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost" onClick={() => setProjector({ kind: 'bracket' })}>
                    Vis bracket på skærmen
                  </button>
                </div>
                {status.champion && (
                  <p className="win-msg">
                    🏆 {nameOf(status.champion)} vinder Champs-Élysées!
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
