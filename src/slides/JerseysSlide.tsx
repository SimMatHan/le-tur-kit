import { useContent } from '../content/ContentContext';
import { Card } from '../components/Card';
import { JerseyBadge } from '../components/JerseyBadge';
import { SlideFooter } from '../components/SlideFooter';
import type { JerseyId } from '../content/types';
import type { SlideProps } from './types';

const jerseyColor: Record<JerseyId, string> = { gul: 'var(--yellow)', gron: 'var(--green)', prik: 'var(--red)' };

export function JerseysSlide({ page }: SlideProps) {
  const { jerseys, meta } = useContent();
  return (
    <div className="slide bg-light">
      <div className="slide-head">
        <h1 className="h-title">Tre trøjer, én Tour</h1>
      </div>
      <div style={{ position: 'absolute', left: 96, top: 290, display: 'flex', gap: 48 }}>
        {jerseys.map((j) => (
          <Card key={j.id} style={{ width: 544, height: 600, padding: '44px 46px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 10, background: jerseyColor[j.id] }} />
            <JerseyBadge jersey={j.id} size={150} style={{ marginLeft: -8 }} />
            <p className="kicker c-muted" style={{ fontSize: 20, marginTop: 40 }}>
              {j.kicker}
            </p>
            <h2 className="h-display" style={{ fontSize: 56, marginTop: 14 }}>
              {j.name}
            </h2>
            <p className="body" style={{ fontSize: 28, marginTop: 20, color: 'var(--ink-3)' }}>
              {j.text}
            </p>
          </Card>
        ))}
      </div>
      <p className="lead" style={{ position: 'absolute', left: 96, top: 920, fontSize: 28 }}>
        {meta.jerseysNote}
      </p>
      <SlideFooter page={page} />
    </div>
  );
}
