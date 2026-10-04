import { useContent } from '../content/ContentContext';
import { StandingsBoard } from '../components/StandingsBoard';
import { SlideFooter } from '../components/SlideFooter';
import { useStandings } from '../game/GameContext';
import type { SlideProps } from './types';

export function StandingsSlide({ page, afterStage }: SlideProps & { afterStage: number }) {
  const { stages } = useContent();
  const standings = useStandings(afterStage);
  const stage = stages.find((s) => s.n === afterStage);
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Stillingen efter etape {afterStage}</h1>
        <p className="lead" style={{ marginTop: 30 }}>
          {stage?.name}
          {!standings.countedStages.includes(afterStage) && ' · resultaterne er ikke indtastet endnu'}
        </p>
      </div>
      <StandingsBoard standings={standings} top={270} />
      <SlideFooter page={page} />
    </div>
  );
}
