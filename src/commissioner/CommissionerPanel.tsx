import { useState, type KeyboardEvent } from 'react';
import { useContent } from '../content/ContentContext';
import { useGame, useStandings } from '../game/GameContext';
import { useCommissioner } from './CommissionerContext';
import { BjergPanel } from './panels/BjergPanel';
import { ChampsPanel } from './panels/ChampsPanel';
import { PrologPanel } from './panels/PrologPanel';
import { SprintPanel } from './panels/SprintPanel';
import { UdbrudPanel } from './panels/UdbrudPanel';
import { ClassificationTies, ResultsTable } from './ResultsTable';
import type { StageStatus } from '../game/types';
import type { ComponentType } from 'react';

const panels: Record<string, ComponentType<{ n: number }>> = {
  prolog: PrologPanel,
  sprint: SprintPanel,
  udbrud: UdbrudPanel,
  bjerg: BjergPanel,
  champs: ChampsPanel,
};

const statusLabel: Record<StageStatus, string> = { idle: 'Ikke startet', running: 'I gang', finished: 'Afsluttet' };

/** Kommissærpanelet (K): én fane pr. etape + klassement. */
export function CommissionerPanel() {
  const { stages } = useContent();
  const { stage: n, setStage, closePanel, setProjector } = useCommissioner();
  const { canUndo, undo, updateStage } = useGame();
  const standings = useStandings();
  const [tab, setTab] = useState<'stage' | 'ties'>('stage');
  const stage = stages.find((s) => s.n === n) ?? stages[0];
  const result = standings.stageResults.find((r) => r.n === stage.n)!;
  const Panel = panels[stage.scoring.type];
  const status = result.status;
  // Uafgjorte grupper i trøjerne – kun relevant, når alle kørte etaper er afsluttet.
  const allFinished = standings.countedStages.length > 0 && standings.stageResults.filter((r) => standings.countedStages.includes(r.n)).every((r) => r.status === 'finished');
  const tieCount = allFinished ? Object.values(standings.tables).reduce((n, rows) => n + new Set(rows.filter((r) => r.tied).map((r) => r.rank)).size, 0) : 0;

  const finish = () => {
    const problems = [!result.complete && 'nogle ryttere mangler data', result.ties.length && 'der er uafgjorte placeringer'].filter(Boolean);
    if (problems.length && !confirm(`Afslut etapen alligevel? (${problems.join(' og ')})`)) return;
    updateStage(stage.n, (s) => ({ ...s, status: 'finished' }));
    setProjector(null);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const t = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(t.tagName)) t.blur();
    }
  };

  return (
    <aside className="editor commissioner" aria-label="Kommissærpanel" onKeyDown={onKeyDown}>
      <header className="editor-head">
        <h2>Kommissær</h2>
        <div className="row">
          <button type="button" className="btn btn-small btn-ghost" disabled={!canUndo} onClick={undo} title="Fortryd seneste handling (Ctrl+Z)">
            ↶ Fortryd
          </button>
          <button type="button" className="icon-btn" onClick={closePanel} aria-label="Luk (K)" title="Luk (K)">
            ×
          </button>
        </div>
      </header>
      <nav className="stage-tabs" aria-label="Etaper">
        {stages.map((s) => {
          const r = standings.stageResults.find((x) => x.n === s.n)!;
          return (
            <button
              key={s.n}
              type="button"
              className={`stage-tab ${tab === 'stage' && s.n === stage.n ? 'active' : ''} st-${r.status}`}
              onClick={() => (setStage(s.n), setTab('stage'))}
              title={`${s.name} – ${statusLabel[r.status]}`}
            >
              {s.n}
              {r.status === 'finished' ? ' ✓' : ''}
            </button>
          );
        })}
        <button type="button" className={`stage-tab ${tab === 'ties' ? 'active' : ''}`} onClick={() => setTab('ties')}>
          Klassement{tieCount ? ` (${tieCount} uafgjort)` : ''}
        </button>
      </nav>

      <div className="editor-body">
        {tab === 'ties' ? (
          <section className="panel-section">
            <h3>Uafgjort i klassementet</h3>
            <ClassificationTies />
          </section>
        ) : (
          <>
            <div className="stage-head">
              <div>
                <strong>
                  Etape {stage.n}: {stage.name}
                </strong>
                <span className={`status st-${status}`}>{statusLabel[status]}</span>
              </div>
              {status === 'finished' ? (
                <button type="button" className="btn btn-small btn-ghost" onClick={() => updateStage(stage.n, (s) => ({ ...s, status: 'running' }))}>
                  Genåbn etapen
                </button>
              ) : (
                <button type="button" className="btn btn-small btn-go" onClick={finish}>
                  Afslut etapen
                </button>
              )}
            </div>
            {status === 'finished' && <p className="hint">Etapen er afsluttet, men alt kan stadig rettes.</p>}
            <Panel n={stage.n} />
            <section className="panel-section">
              <h3>Etaperesultat (live)</h3>
              <ResultsTable result={result} />
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
