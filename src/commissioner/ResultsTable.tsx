import { useState } from 'react';
import { useContent } from '../content/ContentContext';
import { formatTime } from '../game/format';
import { useGame, useStandings } from '../game/GameContext';
import type { JerseyId } from '../content/types';
import type { StageResult } from '../game/types';
import { NumberInput, OrderPicker, TimeInput } from './fields';

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

/** Etaperesultatet live: placering, tid, point – med manuelle rettelser og afgørelse af lighed. */
export function ResultsTable({ result }: { result: StageResult }) {
  const { riders } = useContent();
  const { updateStage } = useGame();
  const [editing, setEditing] = useState<string | null>(null);
  const name = (id: string) => riders.find((r) => r.id === id)?.name ?? '?';
  const state = useGame().game.stages[result.n];
  const rows = [...result.rows].sort((a, b) => (a.place ?? 99) - (b.place ?? 99));

  const setAdjust = (id: string, patch: Record<string, number | string | null>) =>
    updateStage(result.n, (s) => {
      const cur = { ...(s.adjust[id] ?? {}) } as Record<string, unknown>;
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === 0 || v === '') delete cur[k];
        else cur[k] = v;
      }
      const adjust = { ...s.adjust, [id]: cur };
      if (!Object.keys(cur).length) delete adjust[id];
      return { ...s, adjust };
    });

  return (
    <div className="results">
      {result.info.length > 0 && <p className="info-line">{result.info.join(' · ')}</p>}
      {result.ties.map((g) => (
        <div key={g.join()} className="tie-box">
          <strong>Uafgjort placering:</strong> {g.map(name).join(' = ')}
          <OrderPicker
            ids={g}
            nameOf={name}
            title="Afgør rækkefølgen (fx efter Carrot in the Box): klik på den bedst placerede først."
            onDone={(o) => updateStage(result.n, (s) => ({ ...s, tieOrder: [...s.tieOrder.filter((x) => !o.includes(x)), ...o] }))}
          />
        </div>
      ))}
      <table className="result-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Rytter</th>
            <th title="Bidrag til den gule trøje">Tid</th>
            <th title="Point til den grønne trøje">Grøn</th>
            <th title="Bjergpoint">Prik</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const adj = state?.adjust[r.riderId];
            const open = editing === r.riderId;
            return (
              <tr key={r.riderId} className={r.missing ? 'missing' : ''}>
                <td className="num">{r.place ? `${r.place}.` : '–'}</td>
                <td>
                  {name(r.riderId)}
                  {r.tiedWith.length > 0 && <span className="tie-flag"> =</span>}
                  {r.missing && <small className="muted"> mangler data</small>}
                  {r.notes.length > 0 && <div className="notes">{r.notes.join(' · ')}</div>}
                  {open && (
                    <div className="adjust">
                      <label>
                        Tid ±
                        <TimeInput label="Ret tid (sek, + eller −)" value={adj?.timeSec ?? null} width={70} onCommit={(v) => setAdjust(r.riderId, { timeSec: v })} />
                      </label>
                      <label>
                        Grøn ±
                        <NumberInput label="Ret grønne point" value={adj?.gron ?? null} onCommit={(v) => setAdjust(r.riderId, { gron: v })} width={56} />
                      </label>
                      <label>
                        Prik ±
                        <NumberInput label="Ret bjergpoint" value={adj?.prik ?? null} onCommit={(v) => setAdjust(r.riderId, { prik: v })} width={56} />
                      </label>
                      <label className="grow">
                        Note
                        <input
                          defaultValue={adj?.note ?? ''}
                          placeholder="fx tyvstart"
                          onBlur={(e) => e.target.value !== (adj?.note ?? '') && setAdjust(r.riderId, { note: e.target.value })}
                        />
                      </label>
                    </div>
                  )}
                </td>
                <td className="tabular">{r.place !== null || r.timeSec ? formatTime(r.timeSec) : '–'}</td>
                <td className="tabular">{r.gron}</td>
                <td className="tabular">{r.prik}</td>
                <td>
                  <button type="button" className={`icon-sm ${adj ? 'has-adjust' : ''}`} title="Ret tal manuelt" aria-label={`Ret ${name(r.riderId)}`} onClick={() => setEditing(open ? null : r.riderId)}>
                    ✎
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const jerseyNames: Record<JerseyId, string> = { gul: 'Gul', gron: 'Grøn', prik: 'Prikket' };

/** Uafgjorte trøje-klassementer, som kommissæren skal afgøre. */
export function ClassificationTies() {
  const { riders } = useContent();
  const { update } = useGame();
  const standings = useStandings();
  const name = (id: string) => riders.find((r) => r.id === id)?.name ?? '?';
  const groups: { jersey: JerseyId; ids: string[]; value: number }[] = [];
  for (const j of ['gul', 'gron', 'prik'] as JerseyId[]) {
    const seen = new Set<string>();
    for (const r of standings.tables[j]) {
      if (!r.tied || seen.has(r.riderId)) continue;
      const g = [r.riderId, ...r.tiedWith];
      g.forEach((x) => seen.add(x));
      groups.push({ jersey: j, ids: g, value: r.value });
    }
  }
  if (!standings.countedStages.length) return <p className="hint">Ingen etaper er kørt endnu.</p>;
  if (!groups.length) return <p className="hint">Ingen uafgjorte i klassementerne. Lighed afgøres automatisk efter etapesejre og seneste etape.</p>;
  return (
    <>
      {groups.map((g) => (
        <div key={g.jersey + g.ids.join()} className="tie-box">
          <strong>
            {jerseyNames[g.jersey]} trøje – helt lige ({g.jersey === 'gul' ? formatTime(g.value) : `${signed(g.value)} p`}):
          </strong>{' '}
          {g.ids.map(name).join(' = ')}
          <OrderPicker
            ids={g.ids}
            nameOf={name}
            title="Afgør rækkefølgen: klik på den, der skal stå forrest."
            onDone={(o) =>
              update((s) => ({
                ...s,
                classificationTieOrder: { ...s.classificationTieOrder, [g.jersey]: [...(s.classificationTieOrder[g.jersey] ?? []).filter((x) => !o.includes(x)), ...o] },
              }))
            }
          />
        </div>
      ))}
    </>
  );
}
