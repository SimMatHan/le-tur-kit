import { useState, type DragEvent } from 'react';
import { CarrotHelper } from '../CarrotHelper';
import { OrderPicker } from '../fields';
import { useStagePanel } from '../useStagePanel';

/** Etape 2 – Sprint: rækkefølge ved klik/drag, bonusser og "samme kort". */
export function SprintPanel({ n }: { n: number }) {
  const { stage, input, setInput, riders, nameOf } = useStagePanel(n, 'sprint');
  const [tieMode, setTieMode] = useState(false);
  const [tieSel, setTieSel] = useState<string[]>([]);
  const [tieRun, setTieRun] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const bonuses = stage.scoring.type === 'sprint' ? stage.scoring.bonuses : [];

  const order = input.order.filter((id) => riders.some((r) => r.id === id));
  const unplaced = riders.filter((r) => !order.includes(r.id));

  const setOrder = (o: string[]) => setInput((i) => ({ ...i, order: o, carrotGroups: i.carrotGroups.map((g) => g.filter((id) => o.includes(id))).filter((g) => g.length > 1) }));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const o = [...order];
    const [x] = o.splice(from, 1);
    o.splice(to, 0, x);
    setOrder(o);
  };
  const onDrop = (e: DragEvent, to: number) => {
    e.preventDefault();
    if (dragIdx !== null) move(dragIdx, to);
    setDragIdx(null);
  };

  return (
    <>
      <section className="panel-section">
        <h3>Rækkefølge i mål</h3>
        <p className="hint">Klik på ryttere i den rækkefølge, deres kort kommer i mål. Træk eller brug pilene for at rette.</p>
        <ol className="order-list">
          {order.map((id, i) => {
            const carrot = input.carrotGroups.some((g) => g.includes(id));
            return (
              <li
                key={id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, i)}
                className={dragIdx === i ? 'dragging' : ''}
              >
                <span className="drag" aria-hidden>
                  ⠿
                </span>
                <span className="place num">{i + 1}.</span>
                <span className="grow">
                  {nameOf(id)} {carrot && <small title="Afgjort med Carrot in the Box">🥕</small>}
                </span>
                <button type="button" className="icon-sm" aria-label="Op" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  ↑
                </button>
                <button type="button" className="icon-sm" aria-label="Ned" onClick={() => move(i, i + 1)} disabled={i === order.length - 1}>
                  ↓
                </button>
                <button type="button" className="icon-sm" aria-label={`Fjern ${nameOf(id)}`} onClick={() => setOrder(order.filter((x) => x !== id))}>
                  ×
                </button>
              </li>
            );
          })}
        </ol>
        {unplaced.length > 0 && !tieMode && (
          <div className="row wrap">
            {unplaced.map((r) => (
              <button key={r.id} type="button" className="btn" onClick={() => setOrder([...order, r.id])}>
                + {r.name}
              </button>
            ))}
          </div>
        )}
        {unplaced.length >= 2 && !tieMode && (
          <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => (setTieMode(true), setTieSel([]), setTieRun(false))}>
            Samme kort – Carrot in the Box
          </button>
        )}
        {tieMode && (
          <div className="tie-box">
            <h4>Samme kort</h4>
            {!tieRun ? (
              <>
                <p className="hint">Vælg rytterne med samme kort (de næste i mål).</p>
                <div className="row wrap">
                  {unplaced.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`btn btn-small ${tieSel.includes(r.id) ? '' : 'btn-ghost'}`}
                      aria-pressed={tieSel.includes(r.id)}
                      onClick={() => setTieSel((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                    >
                      {tieSel.includes(r.id) ? '✓ ' : ''}
                      {r.name}
                    </button>
                  ))}
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" disabled={tieSel.length < 2} onClick={() => setTieRun(true)}>
                    Kør Carrot in the Box
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setTieMode(false)}>
                    Annullér
                  </button>
                </div>
              </>
            ) : (
              <>
                <CarrotHelper a={tieSel[0]} b={tieSel[1]} compact />
                {tieSel.length > 2 && <p className="hint">Flere end to: kør dueller, indtil rækkefølgen er afgjort.</p>}
                <OrderPicker
                  ids={tieSel}
                  nameOf={nameOf}
                  title="Klik på vinderen først (og derefter de næste i rækkefølge)."
                  onCancel={() => setTieMode(false)}
                  onDone={(o) => {
                    setInput((i) => ({ ...i, order: [...order, ...o], carrotGroups: [...i.carrotGroups, o] }));
                    setTieMode(false);
                  }}
                />
              </>
            )}
          </div>
        )}
      </section>

      <section className="panel-section">
        <h3>Bonusser</h3>
        {bonuses.map((b) => (
          <div key={b.id} className="bonus-row">
            <span className="grow">
              {b.label} <small>(+{b.points} {b.jersey === 'prik' ? 'bjergpoint' : 'point'})</small>
            </span>
            <div className="row wrap">
              {riders.map((r) => {
                const on = input.bonuses[b.id] === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`btn btn-small ${on ? '' : 'btn-ghost'}`}
                    aria-pressed={on}
                    onClick={() => setInput((i) => ({ ...i, bonuses: { ...i.bonuses, [b.id]: on ? null : r.id } }))}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
