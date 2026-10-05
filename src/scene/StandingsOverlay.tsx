import { StandingsBoard } from '../components/StandingsBoard';
import { useStandings } from '../game/GameContext';
import { useContent } from '../content/ContentContext';

/** Klassementet som overlay (S) oven på den aktuelle slide. */
export function StandingsOverlay({ onClose }: { onClose: () => void }) {
  const standings = useStandings();
  const { stages } = useContent();
  return (
    <div className="slide bg-light overlay-in" onClick={onClose} style={{ zIndex: 20 }}>
      <div className="slide-head">
        <h1 className="h-title">Klassementet</h1>
        <p className="lead" style={{ marginTop: 24 }}>
          {standings.countedStages.length === 0 ? 'Ingen etaper er kørt endnu' : `Efter ${standings.countedStages.length} af ${stages.length} etaper`}
        </p>
      </div>
      <StandingsBoard standings={standings} top={300} />
    </div>
  );
}
