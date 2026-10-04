import { Stopwatch } from '../../components/Stopwatch';
import { useCommissioner } from '../CommissionerContext';
import { NumberInput, RiderToggles, TimeInput } from '../fields';
import { useStagePanel } from '../useStagePanel';

/** Etape 4 – Bjerg: beerpong (udbrud), terningsum pr. udbryder og bajer på tid. */
export function BjergPanel({ n }: { n: number }) {
  const { input, setInput, riders, nameOf } = useStagePanel(n, 'bjerg');
  const { setProjector } = useCommissioner();
  const setTime = (id: string, v: number | null) => setInput((i) => ({ ...i, times: { ...i.times, [id]: v } }));
  const hits = input.hits.filter((id) => riders.some((r) => r.id === id));

  return (
    <>
      <section className="panel-section">
        <h3>1. Beerpong – hvem ramte?</h3>
        <p className="hint">De der rammer, stikker af fra feltet.</p>
        <RiderToggles
          riders={riders}
          selected={hits}
          onToggle={(id) => setInput((i) => ({ ...i, hits: i.hits.includes(id) ? i.hits.filter((x) => x !== id) : [...i.hits, id] }))}
        />
      </section>
      <section className="panel-section">
        <h3>2. Udbrydernes terningsum</h3>
        {hits.length === 0 ? (
          <p className="hint">Ingen udbrydere endnu.</p>
        ) : (
          <table className="mini-table">
            <tbody>
              {hits.map((id) => (
                <tr key={id}>
                  <td>{nameOf(id)}</td>
                  <td>
                    <NumberInput
                      label={`Terningsum for ${nameOf(id)}`}
                      value={input.dice[id]}
                      min={2}
                      max={12}
                      onCommit={(v) => setInput((i) => ({ ...i, dice: { ...i.dice, [id]: v } }))}
                    />{' '}
                    sek forspring
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="panel-section">
        <h3>3. Bajer på tid</h3>
        <Stopwatch
          riders={riders}
          times={input.times}
          onSplit={setTime}
          onClear={(id) => setTime(id, null)}
          onShowOnProjector={() => setProjector({ kind: 'stopwatch', stage: n })}
        />
        <table className="mini-table">
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <TimeInput label={`Bajer-tid for ${r.name}`} value={input.times[r.id]} onCommit={(v) => setTime(r.id, v)} />
                </td>
                <td className="muted">{hits.includes(r.id) && typeof input.dice[r.id] === 'number' ? `−${input.dice[r.id]} sek` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
