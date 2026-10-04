import { useContent } from '../content/ContentContext';
import { RiderSlide } from '../components/RiderSlide';
import type { SlideProps } from './types';

export function CommissionerSlide({ page }: SlideProps) {
  const { commissioner } = useContent();
  return (
    <RiderSlide
      person={commissioner}
      kicker={commissioner.title}
      medallionLabel="TOUR"
      medallionValue="LK"
      medallionColor="yellow"
      page={page}
    />
  );
}
