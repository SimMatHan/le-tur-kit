import { useContent } from '../content/ContentContext';
import type { JerseyId } from '../content/types';
import type { Standings } from '../game/scoring';
import { HardShadowCard } from './HardShadowCard';
import { JerseyBadge } from './JerseyBadge';
import { formatGap, formatTime } from '../game/format';
import { FitText } from './FitText';
import { jerseyLeader } from '../game/podium';

const cols: { id: JerseyId; title: string }[] = [
  { id: 'gul', title: 'Samlet tid' },
  { id: 'gron', title: 'Point' },
  { id: 'prik', title: 'Bjergpoint' },
];

/** Tre kolonner med klassementet. Førende i hver trøje får trøjeikonet ved navnet. */
export function StandingsBoard({ standings, top = 250 }: { standings: Standings; top?: number }) {
  const { riders } = useContent();
  const name = (id: string) => riders.find((r) => r.id === id)?.name ?? '?';
  const n = riders.length;
  const rowH = Math.min(72, Math.floor(560 / Math.max(n, 1)));
  const fs = Math.min(30, rowH - 26);
  const empty = standings.countedStages.length === 0;
  const leaders = { gul: jerseyLeader(standings, 'gul'), gron: jerseyLeader(standings, 'gron'), prik: jerseyLeader(standings, 'prik') };
  return (
    <div style={{ position: 'absolute', left: 86, top, width: 1748, display: 'flex', gap: 44 }}>
      {cols.map((c) => {
        const rows = standings.tables[c.id];
        const leaderValue = rows[0]?.value;
        return (
          <HardShadowCard key={c.id} tone="white" shadow="lg" style={{ flex: 1, minWidth: 0, padding: '30px 30px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <JerseyBadge jersey={c.id} size={56} />
              <span className="kicker c-red" style={{ fontSize: 22 }}>
                {c.title}
              </span>
            </div>
            {rows.map((r) => (
              <div
                key={r.riderId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: rowH,
                  gap: 14,
                  borderTop: '2px solid rgba(29,35,64,0.12)',
                  fontSize: fs,
                }}
              >
                <span className="num c-red" style={{ width: 52, fontSize: fs + 6 }}>
                  {empty ? '–' : `${r.rank}.`}
                </span>
                <FitText max={fs} min={13} style={{ flex: 1, minWidth: 0, height: rowH - 4, fontWeight: 700, lineHeight: 1.05, display: 'flex', alignItems: 'center', overflowWrap: 'anywhere' }}>
                  {name(r.riderId)}
                </FitText>
                {leaders[c.id] === r.riderId && <JerseyBadge jersey={c.id} size={rowH - 18} />}
                {!empty && r.tied && (
                  <span title="Uafgjort – afgøres af kommissæren" style={{ color: 'var(--red)', fontWeight: 700 }}>
                    =
                  </span>
                )}
                <span style={{ width: 150, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {empty
                    ? '–'
                    : c.id === 'gul'
                      ? r.rank === 1
                        ? formatTime(r.value)
                        : formatGap(r.value - (leaderValue ?? 0))
                      : `${r.value} p`}
                </span>
              </div>
            ))}
          </HardShadowCard>
        );
      })}
    </div>
  );
}
