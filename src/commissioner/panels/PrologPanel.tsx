import { Stopwatch } from '../../components/Stopwatch';
import { useCommissioner } from '../CommissionerContext';
import { TimeInput } from '../fields';
import { useStagePanel } from '../useStagePanel';

/** Etape 1 – Prolog: bajer på tid med stopuret (eller manuel tid). */
export function PrologPanel({ n }: { n: number }) {
  const { input, setInput, riders } = useStagePanel(n, 'prolog');
  const { setProjector } = useCommissioner();
  const setTime = (id: string, v: number | null) => setInput((i) => ({ ...i, times: { ...i.times, [id]: v } }));
  return (
    <>
      <section className="panel-section">
        <h3>Stopur – bajer på tid</h3>
        <Stopwatch
          riders={riders}
          times={input.times}
          onSplit={setTime}
          onClear={(id) => setTime(id, null)}
          onShowOnProjector={() => setProjector({ kind: 'stopwatch', stage: n })}
        />
      </section>
      <section className="panel-section">
        <h3>Tider (kan rettes)</h3>
        <table className="mini-table">
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <TimeInput label={`Tid for ${r.name}`} value={input.times[r.id]} onCommit={(v) => setTime(r.id, v)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
