import { useEffect, useRef } from 'react';
import { useContent } from '../../content/ContentContext';
import { Stopwatch } from '../../components/Stopwatch';
import { quizTotals } from '../../game/scoring';
import { cellKey, songNumber } from '../../game/quiz';
import { useCommissioner } from '../CommissionerContext';
import { RiderToggles, TimeInput } from '../fields';
import { useStagePanel } from '../useStagePanel';

/** Etape 3 – Udbrud: musikquiz (bræt + kort) og terningkast på tid. */
export function UdbrudPanel({ n }: { n: number }) {
  const { stage, input, setInput, riders } = useStagePanel(n, 'udbrud');
  const { quiz, meta } = useContent();
  const { projector, setProjector } = useCommissioner();
  const counts = quiz.categories.map((c) => c.answers.length);
  const open = projector?.kind === 'quiz' ? projector : null;
  const key = open ? cellKey(open.cat, open.row) : null;
  const totals = quizTotals(input, stage);
  const sc = stage.scoring.type === 'udbrud' ? stage.scoring : null;
  // Vis det åbne kort (vigtigt på telefonen, hvor brættet fylder skærmen).
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (key) cardRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [key]);

  const openCell = (cat: number, row: number) => setProjector({ kind: 'quiz', cat, row, reveal: false });
  const closeCard = () => {
    if (key) setInput((i) => (key in i.quiz ? i : { ...i, quiz: { ...i.quiz, [key]: [] } }));
    setProjector(null);
  };
  const toggle = (id: string) =>
    key &&
    setInput((i) => {
      const cur = i.quiz[key] ?? [];
      return { ...i, quiz: { ...i.quiz, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
    });
  const setDice = (id: string, v: number | null) => setInput((i) => ({ ...i, dice: { ...i.dice, [id]: v } }));

  return (
    <>
      <section className="panel-section">
        <h3>Musikquiz</h3>
        <p className="hint">
          Klik på et felt for at vise kortet på skærmen. Svaret ses kun her, indtil du vælger at vise det.{' '}
          <a href={meta.playlistUrl} target="_blank" rel="noreferrer">
            Åbn playlisten på Spotify
          </a>
        </p>
        <div className="mini-board" style={{ gridTemplateColumns: `repeat(${quiz.categories.length}, 1fr)` }}>
          {quiz.categories.map((c, ci) => (
            <div key={ci} className="mini-col">
              <div className="mini-head" title={c.prompt}>
                {c.name}
              </div>
              {c.answers.map((_, ri) => {
                const k = cellKey(ci, ri);
                const used = k in input.quiz;
                const nCorrect = input.quiz[k]?.length ?? 0;
                return (
                  <button
                    key={ri}
                    type="button"
                    className={`mini-cell ${used ? 'used' : ''} ${k === key ? 'open' : ''}`}
                    onClick={() => openCell(ci, ri)}
                    title={`Sang nr. ${songNumber(counts, ci, ri)}`}
                  >
                    {ri + 1}
                    {used && <small>{nCorrect ? ` ✓${nCorrect}` : ' –'}</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {open && key && (
          <div className="quiz-card-panel" ref={cardRef}>
            <div className="row wrap">
              <strong className="grow">
                {quiz.categories[open.cat].name} · felt {open.row + 1} · sang nr. {songNumber(counts, open.cat, open.row)}
              </strong>
              {sc && (
                <small>
                  +{sc.quizRowBjergpoint[open.row] ?? 0} bjergpoint, +{sc.quizRowPoint[open.row] ?? 0} point, {sc.quizCorrectAnswerSec} sek
                </small>
              )}
            </div>
            <details className="answer">
              <summary>Vis svar (kun her)</summary>
              <p>{quiz.categories[open.cat].answers[open.row]}</p>
            </details>
            <p className="hint">Hvem svarede rigtigt?</p>
            <RiderToggles riders={riders} selected={input.quiz[key] ?? []} onToggle={toggle} />
            <div className="row wrap" style={{ marginTop: 8 }}>
              <button type="button" className="btn" onClick={closeCard}>
                Luk kort (marker brugt)
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setProjector({ ...open, reveal: !open.reveal })}>
                {open.reveal ? 'Skjul svar på skærmen' : 'Vis svar på skærmen'}
              </button>
              {key in input.quiz && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setInput((i) => {
                      const q = { ...i.quiz };
                      delete q[key];
                      return { ...i, quiz: q };
                    })
                  }
                >
                  Nulstil felt
                </button>
              )}
            </div>
          </div>
        )}

        <table className="mini-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Rytter</th>
              <th>Rigtige</th>
              <th>Bjerg</th>
              <th>Point</th>
              <th>Sek</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => {
              const t = totals.get(r.id);
              return (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{t?.correct ?? 0}</td>
                  <td>{t?.prik ?? 0}</td>
                  <td>{t?.gron ?? 0}</td>
                  <td>{t ? (t.t10 / 10).toString().replace('.', ',').replace('-', '−') : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel-section">
        <h3>Terningkast om tiden</h3>
        <Stopwatch
          riders={riders}
          times={input.dice}
          onSplit={setDice}
          onClear={(id) => setDice(id, null)}
          startOnFirstSplit
          onShowOnProjector={() => setProjector({ kind: 'stopwatch', stage: n })}
        />
        <table className="mini-table">
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  <TimeInput label={`Terningtid for ${r.name}`} value={input.dice[r.id]} onCommit={(v) => setDice(r.id, v)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
