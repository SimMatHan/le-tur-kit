import { useContent } from '../content/ContentContext';
import { HardShadowCard } from '../components/HardShadowCard';
import { JerseyBadge } from '../components/JerseyBadge';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function JerseysSlide({ page }: SlideProps) {
  const { jerseys, meta } = useContent();
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Tre trøjer, én Tour</h1>
      </div>
      <div style={{ position: 'absolute', left: 116, top: 245, display: 'flex', gap: 58 }}>
        {jerseys.map((j) => (
          <HardShadowCard key={j.id} tone="white" shadow="lg" style={{ width: 526, height: 630, padding: '40px 40px' }}>
            <JerseyBadge jersey={j.id} size={150} style={{ marginLeft: -6 }} />
            <p className="kicker c-red" style={{ fontSize: 22, marginTop: 50 }}>
              {j.kicker}
            </p>
            <h2 className="h-display" style={{ fontSize: 48, marginTop: 16 }}>
              {j.name}
            </h2>
            <p className="body" style={{ fontSize: 30, marginTop: 24 }}>
              {j.text}
            </p>
          </HardShadowCard>
        ))}
      </div>
      <p className="lead" style={{ position: 'absolute', left: 108, top: 930, fontSize: 30 }}>
        {meta.jerseysNote}
      </p>
      <SlideFooter page={page} />
    </div>
  );
}
