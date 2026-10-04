import { useContent } from '../content/ContentContext';
import { RiderSlide } from '../components/RiderSlide';
import type { SlideProps } from './types';

export function RiderPresentationSlide({ page, riderId }: SlideProps & { riderId: string }) {
  const { riders } = useContent();
  const rider = riders.find((r) => r.id === riderId);
  if (!rider) return <div className="slide bg-paper" />;
  return (
    <RiderSlide
      person={rider}
      kicker={`Rytter nr. ${rider.number}`}
      medallionLabel="NR."
      medallionValue={rider.number}
      page={page}
    />
  );
}
