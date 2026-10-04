import { useContent } from '../content/ContentContext';
import { HardShadowCard } from '../components/HardShadowCard';
import { JerseyRow } from '../components/JerseyBadge';
import { Medallion } from '../components/Medallion';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function PointsScaleSlide({ page }: SlideProps) {
  const { meta, rules, stages } = useContent();
  const pts = rules.placementPoints;
  const max = Math.max(...pts, 1);
  const n = pts.length;
  const areaW = 1010;
  const gap = 40;
  const barW = Math.min(170, (areaW - gap * (n - 1)) / n);
  const maxH = 500;
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Pointskalaen</h1>
        <p className="lead" style={{ marginTop: 40 }}>
          {meta.pointsSubtitle}
        </p>
      </div>
      <div style={{ position: 'absolute', left: 115, bottom: 143, display: 'flex', alignItems: 'flex-end', gap }}>
        {pts.map((p, i) => {
          const h = Math.max(100, (p / max) * maxH);
          const first = i === 0;
          return (
            <div key={i} style={{ width: barW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className={`num ${first ? 'c-red' : ''}`} style={{ fontSize: 66, marginBottom: 10 }}>
                {p}
              </span>
              <div
                style={{
                  width: '100%',
                  height: h,
                  background: first ? 'var(--yellow)' : 'var(--navy)',
                  border: first ? 'var(--border)' : undefined,
                  boxShadow: 'var(--shadow)',
                  color: first ? 'var(--navy)' : 'var(--paper)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 18,
                  fontWeight: 700,
                  fontSize: 26,
                }}
              >
                {i + 1}. plads
              </div>
            </div>
          );
        })}
      </div>
      <HardShadowCard tone="white" shadow="lg" style={{ position: 'absolute', left: 1193, top: 228, width: 642, height: 716, padding: '48px 40px' }}>
        <p className="kicker c-red" style={{ fontSize: 26 }}>
          Hvad køres der om?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34, marginTop: 36 }}>
          {stages.map((s) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <Medallion value={s.n} size={78} valueSize={34} />
              <span style={{ fontWeight: 700, fontSize: 32, flex: 1, whiteSpace: 'nowrap' }}>{s.shortName}</span>
              <span style={{ width: 196 }}>
                <JerseyRow jerseys={s.atStake} size={58} gap={6} />
              </span>
            </div>
          ))}
        </div>
      </HardShadowCard>
      <SlideFooter page={page} />
    </div>
  );
}
