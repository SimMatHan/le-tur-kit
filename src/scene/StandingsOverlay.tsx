import { StandingsBoard } from '../components/StandingsBoard';
import { useStandings } from '../game/useStandings';
import { useContent } from '../content/ContentContext';

/** Klassementet som overlay (S) oven på den aktuelle slide. */
export function StandingsOverlay({ onClose }: { onClose: () => void }) {
  const standings = useStandings();
  const { stages } = useContent();
  return (
    <div className="slide bg-paper overlay-in" onClick={onClose} style={{ zIndex: 20 }}>
      <div className="slide-head">
        <h1 className="h-title">Klassementet</h1>
        <p className="lead" style={{ marginTop: 30 }}>
          {standings.completedStages === 0 ? 'Ingen etaper er kørt endnu' : `Efter ${standings.completedStages} af ${stages.length} etaper`}
        </p>
      </div>
      <StandingsBoard standings={standings} top={270} />
    </div>
  );
}
