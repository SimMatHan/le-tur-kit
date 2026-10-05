import { useContent } from '../content/ContentContext';
import { Card } from '../components/Card';
import { CarrotIcon } from '../components/icons';
import { NumberTag } from '../components/NumberTag';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function CarrotSlide({ page }: SlideProps) {
  const { carrotInTheBox } = useContent();
  const steps = carrotInTheBox.steps;
  return (
    <div className="slide bg-light">
      <div className="slide-head">
        <h1 className="h-title">Carrot in the Box</h1>
        <p className="lead" style={{ marginTop: 24 }}>
          {carrotInTheBox.subtitle}
        </p>
      </div>
      <div style={{ position: 'absolute', right: 110, top: 96, transform: 'rotate(-12deg)' }}>
        <CarrotIcon size={120} color="#f07d00" />
      </div>
      <div style={{ position: 'absolute', left: 96, top: 330, width: 1728, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {steps.map((s, i) => (
          <Card key={i} tone={i === steps.length - 1 ? 'ink' : 'white'} style={{ height: 296, padding: '34px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <NumberTag value={i + 1} color={i === steps.length - 1 ? 'yellow' : 'ink'} size={64} />
            <p className="body" style={{ fontSize: 28, lineHeight: 1.35 }}>
              {s}
            </p>
          </Card>
        ))}
      </div>
      <SlideFooter page={page} />
    </div>
  );
}
