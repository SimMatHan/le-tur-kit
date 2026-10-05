import type { CSSProperties } from 'react';
import type { JerseyId } from '../content/types';
import { Card } from './Card';
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
  const rowH = compact ? 60 : 78;
  return (
    <Card style={{ padding: compact ? '28px 40px 22px' : '36px 40px 30px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: compact ? 10 : 18 }}>
        <JerseyRow jerseys={jerseys} size={compact ? 46 : 54} gap={4} />
        <span className="kicker c-muted" style={{ fontSize: 19, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
          {title}
        </span>
      </div>
      {rows.map((r, i) => (
        <div key={r.place} style={{ display: 'flex', alignItems: 'center', height: rowH, borderTop: '2px solid var(--mist)' }}>
          <span className="num" style={{ fontSize: compact ? 40 : 46, width: 78, color: i === 0 ? 'var(--ink)' : 'var(--muted)' }}>
            {r.place}
          </span>
          <span style={{ fontWeight: 700, fontSize: compact ? 32 : 34, flex: 1 }}>{r.main}</span>
          {r.extra && (
            <span className="num" style={{ fontSize: compact ? 32 : 34, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {r.extra}
            </span>
          )}
        </div>
      ))}
    </Card>
  );
}
