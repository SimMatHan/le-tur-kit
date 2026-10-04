import { useContent } from '../content/ContentContext';
import { ElevationProfile } from '../components/ElevationProfile';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function RouteSlide({ page }: SlideProps) {
  const { meta, stages } = useContent();
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Ruten {meta.year}</h1>
        <p className="lead" style={{ marginTop: 40 }}>
          {meta.routeSubtitle}
        </p>
      </div>
      <ElevationProfile stages={stages} />
      <SlideFooter page={page} />
    </div>
  );
}
