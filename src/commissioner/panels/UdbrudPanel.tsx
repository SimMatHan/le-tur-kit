import { PlayingCard } from '../../components/PlayingCard';
import { breakawayOf, guessNext, isCorrect, startRun, streakOf } from '../../game/highlow';
import { useCommissioner } from '../CommissionerContext';
import { NumberInput } from '../fields';
import { useStagePanel } from '../useStagePanel';

/**
 * Etape 3 – Udbrudsforsøget (højere/lavere). Appen trækker kortene: vælg rytter,
 * tryk Højere/Lavere for rytterens gæt. Ved rigtige kort tastes antal rigtige manuelt.
 */
export function UdbrudPanel({ n }: { n: number }) {
  const { stage, input, setInput, riders, nameOf } = useStagePanel(n, 'udbrud');
  const { setProjector } = useCommissioner();
  const sc = stage.scoring.type === 'udbrud' ? stage.scoring : null;
  const max = sc?.maxCountedCorrect ?? 10;
  const active = input.active && riders.some((r) => r.id === input.active) ? input.active : null;
  const run = active ? input.runs[active] : undefined;
  const streak = streakOf(run);

  const start = (id: string) => {
    const has = input.runs[id] || typeof input.manual[id] === 'number';
    if (has && !confirm(`${nameOf(id)} har allerede et udbrud. Start forfra?`)) return;
    setInput((i) => startRun(i, id));
    setProjector({ kind: 'highlow' });
  };
  const guess = (g: 'op' | 'ned') => active && setInput((i) => guessNext(i, active, g, max));
  const nextRider = riders.find((r) => breakawayOf(input, r.id) === null && !(input.runs[r.id] && !input.runs[r.id].done));

  const lastCorrect =
    run && run.cards.length > 1 ? isCorrect(run.cards[run.cards.length - 2], run.cards[run.cards.length - 1], run.guesses[run.guesses.length - 1]) : null;

  return (
    <>
      <section className="panel-section">
        <h3>Udbrudsforsøget – appen trækker kortene</h3>
        <p className="hint">
          Vælg rytteren. Han siger "højere" eller "lavere", og du trykker det samme. Forkert gæt (eller samme værdi) = hentet af feltet. Højst {max} rigtige tæller.
        </p>
        <div className="toggle-grid">
          {riders.map((r) => {
            const b = breakawayOf(input, r.id);
            const running = input.runs[r.id] && !input.runs[r.id].done && typeof input.manual[r.id] !== 'number';
            return (
              <button key={r.id} type="button" className={`toggle ${r.id === active ? 'on' : ''}`} onClick={() => start(r.id)} aria-pressed={r.id === active}>
                <span className="split-no">{r.number}</span>
                <span className="split-name">{r.name}</span>
                <span>{running ? '…' : b === null ? '–' : `${b} ✓`}</span>
              </button>
            );
          })}
        </div>

        {active && run && (
          <div className="highlow-panel">
            <div className="row wrap">
              <strong className="grow">
                {nameOf(active)}: {streak} rigtige i træk
              </strong>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => setProjector({ kind: 'highlow' })}>
                Vis på skærm
              </button>
            </div>
            <div className="highlow-cards">
              {run.cards.slice(-5).map((c, i, arr) => (
                <PlayingCard
                  key={run.cards.length - arr.length + i}
                  card={c}
                  width={64}
                  state={i === arr.length - 1 && lastCorrect !== null ? (lastCorrect ? 'ok' : 'fail') : undefined}
                />
              ))}
            </div>
            {!run.done ? (
              <div className="row highlow-buttons">
                <button type="button" className="btn btn-big" onClick={() => guess('op')}>
                  ▲ Højere
                </button>
                <button type="button" className="btn btn-big" onClick={() => guess('ned')}>
                  ▼ Lavere
                </button>
              </div>
            ) : (
              <div className="row wrap">
                <p className={streak >= max ? 'win-msg' : 'error'} style={{ margin: 0 }}>
                  {streak >= max ? `Helt alene foran – maks. udbrud (${max})!` : `Hentet af feltet efter ${streak} rigtige. Skål!`}
                </p>
                {nextRider && (
                  <button type="button" className="btn" onClick={() => start(nextRider.id)}>
                    Næste: {nextRider.name}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel-section">
        <h3>Manuelt (med rigtige kort)</h3>
        <p className="hint">Antal rigtige gæt i træk. Et tal her går forud for forsøget i appen.</p>
        <table className="mini-table">
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <NumberInput
                    label={`Udbrud for ${r.name}`}
                    value={input.manual[r.id] ?? null}
                    min={0}
                    max={52}
                    onCommit={(v) => setInput((i) => ({ ...i, manual: { ...i.manual, [r.id]: v } }))}
                  />{' '}
                  rigtige
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
