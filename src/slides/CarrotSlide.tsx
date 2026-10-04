import { useContent } from '../content/ContentContext';
import { HardShadowCard } from '../components/HardShadowCard';
import { CarrotIcon } from '../components/icons';
import { Medallion } from '../components/Medallion';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function CarrotSlide({ page }: SlideProps) {
  const { carrotInTheBox } = useContent();
  const steps = carrotInTheBox.steps;
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Carrot in the Box</h1>
        <p className="lead" style={{ marginTop: 40 }}>
          {carrotInTheBox.subtitle}
        </p>
      </div>
      <div style={{ position: 'absolute', right: 96, top: 66, transform: 'rotate(-12deg)' }}>
        <CarrotIcon size={130} />
      </div>
      <div style={{ position: 'absolute', left: 86, top: 312, width: 1748, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '44px 40px' }}>
        {steps.map((s, i) => (
          <HardShadowCard key={i} tone="white" shadow="lg" style={{ height: 300, padding: '34px 34px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Medallion value={i + 1} color={i === steps.length - 1 ? 'red' : 'navy'} size={78} valueSize={34} />
            <p className="body" style={{ fontSize: 28, lineHeight: 1.32 }}>
              {s}
            </p>
          </HardShadowCard>
        ))}
      </div>
      <SlideFooter page={page} />
    </div>
  );
}
