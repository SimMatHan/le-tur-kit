import { useContent } from '../content/ContentContext';
import { RiderSlide } from '../components/RiderSlide';
import type { SlideProps } from './types';
import { useStandings } from '../game/GameContext';
import { jerseyLeader } from '../game/podium';
import type { JerseyId } from '../content/types';

export function RiderPresentationSlide({ page, riderId }: SlideProps & { riderId: string }) {
  const { riders } = useContent();
  const rider = riders.find((r) => r.id === riderId);
  const standings = useStandings();
  const leads = (['gul', 'gron', 'prik'] as JerseyId[]).filter((j) => jerseyLeader(standings, j) === riderId);
  if (!rider) return <div className="slide bg-paper" />;
  return (
    <RiderSlide
      person={rider}
      kicker={`Rytter nr. ${rider.number}`}
      medallionLabel="NR."
      medallionValue={rider.number}
      page={page}
      leads={leads}
    />
  );
}
