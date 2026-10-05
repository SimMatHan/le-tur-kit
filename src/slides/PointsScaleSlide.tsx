import { useContent } from '../content/ContentContext';
import { Card } from '../components/Card';
import { JerseyRow } from '../components/JerseyBadge';
import { NumberTag } from '../components/NumberTag';
import { SlideFooter } from '../components/SlideFooter';
import type { SlideProps } from './types';

export function PointsScaleSlide({ page }: SlideProps) {
  const { meta, rules, stages } = useContent();
  const pts = rules.placementPoints;
  const max = Math.max(...pts, 1);
  const n = pts.length;
  const areaW = 960;
  const gap = 28;
  const barW = Math.min(172, (areaW - gap * (n - 1)) / n);
  const maxH = 480;
  return (
    <div className="slide bg-light">
      <div className="slide-head">
        <h1 className="h-title">Pointskalaen</h1>
        <p className="lead" style={{ marginTop: 24 }}>
          {meta.pointsSubtitle}
        </p>
      </div>
      <div style={{ position: 'absolute', left: 96, bottom: 150, display: 'flex', alignItems: 'flex-end', gap }}>
        {pts.map((p, i) => {
          const h = Math.max(90, (p / max) * maxH);
          const first = i === 0;
          return (
            <div key={i} style={{ width: barW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="num" style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, marginBottom: 14 }}>
                {p}
              </span>
              <div
                style={{
                  width: '100%',
                  height: h,
                  borderRadius: '14px 14px 0 0',
                  background: first ? 'var(--yellow)' : 'var(--ink)',
                  color: first ? 'var(--ink)' : 'var(--white)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 18,
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: '0.04em',
                }}
              >
                {i + 1}. plads
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 96, bottom: 148, width: areaW + 20, height: 2, background: 'var(--line)' }} />
      <Card style={{ position: 'absolute', left: 1180, top: 250, width: 644, height: 700, padding: '44px 44px' }}>
        <p className="kicker c-muted" style={{ fontSize: 20 }}>
          Hvad køres der om?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
          {stages.map((s) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 26, height: 108, borderTop: '2px solid var(--mist)' }}>
              <NumberTag value={s.n} size={68} />
              <span className="h-display" style={{ fontSize: 40, flex: 1, whiteSpace: 'nowrap' }}>
                {s.shortName}
              </span>
              <span style={{ width: 186 }}>
                <JerseyRow jerseys={s.atStake} size={56} gap={6} />
              </span>
            </div>
          ))}
        </div>
      </Card>
      <SlideFooter page={page} />
    </div>
  );
}
