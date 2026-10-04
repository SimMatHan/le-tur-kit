import type { CSSProperties } from 'react';
import type { JerseyId } from '../content/types';
import { HardShadowCard } from './HardShadowCard';
import { JerseyRow } from './JerseyBadge';

export interface PointsRow {
  place: number;
  main: string;
  extra?: string;
}

interface Props {
  title: string;
  jerseys: JerseyId[];
  rows: PointsRow[];
  compact?: boolean;
  style?: CSSProperties;
}

/** Hvid boks med pointskala (og evt. tidstillæg/bonussekunder) for en etape. */
export function PointsCard({ title, jerseys, rows, compact = false, style }: Props) {
  const rowH = compact ? 62 : 84;
  return (
    <HardShadowCard tone="white" shadow="lg" style={{ padding: compact ? '30px 44px 26px' : '40px 44px 36px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: compact ? 14 : 30 }}>
        <JerseyRow jerseys={jerseys} size={compact ? 50 : 62} gap={4} />
        <span className="kicker c-red" style={{ fontSize: 22, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          {title}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.place} style={{ display: 'flex', alignItems: 'center', height: rowH }}>
          <span className="num c-red" style={{ fontSize: compact ? 46 : 54, width: 92 }}>
            {r.place}.
          </span>
          <span style={{ fontWeight: 700, fontSize: compact ? 34 : 36, flex: 1 }}>{r.main}</span>
          {r.extra && <span style={{ fontSize: 30, whiteSpace: 'nowrap' }}>{r.extra}</span>}
        </div>
      ))}
    </HardShadowCard>
  );
}
