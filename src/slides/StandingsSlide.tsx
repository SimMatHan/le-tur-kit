import { useContent } from '../content/ContentContext';
import { StandingsBoard } from '../components/StandingsBoard';
import { SlideFooter } from '../components/SlideFooter';
import { useStandings } from '../game/GameContext';
import type { SlideProps } from './types';

export function StandingsSlide({ page, afterStage }: SlideProps & { afterStage: number }) {
  const { stages, riders } = useContent();
  const standings = useStandings(afterStage);
  const stage = stages.find((s) => s.n === afterStage);
  const result = standings.stageResults.find((r) => r.n === afterStage);
  const counted = standings.countedStages.includes(afterStage);
  const winners = counted ? (result?.rows.filter((r) => r.place === 1).map((r) => riders.find((x) => x.id === r.riderId)?.name) ?? []) : [];
  return (
    <div className="slide bg-light">
      <div className="slide-head">
        <h1 className="h-title">Stillingen efter etape {afterStage}</h1>
        <p className="lead" style={{ marginTop: 24 }}>
          {stage?.name}
          {!counted && ' · resultaterne er ikke indtastet endnu'}
          {winners.length > 0 && (
            <>
              {' · '}
              {winners.length > 1 ? 'Delt etapesejr' : 'Etapevinder'}: <strong style={{ color: 'var(--ink)' }}>{winners.join(' & ')}</strong>
            </>
          )}
          {counted && result && !result.complete && ' · foreløbigt (etapen mangler data)'}
        </p>
      </div>
      <StandingsBoard standings={standings} top={300} />
      <SlideFooter page={page} />
    </div>
  );
}
