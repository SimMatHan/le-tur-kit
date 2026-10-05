import { useContent } from '../content/ContentContext';
import type { JerseyId } from '../content/types';
import type { Standings } from '../game/scoring';
import { Card } from './Card';
import { JerseyBadge } from './JerseyBadge';
import { formatGap, formatTime } from '../game/format';
import { FitText } from './FitText';
import { jerseyLeader } from '../game/podium';

const cols: { id: JerseyId; title: string; accent: string; soft: string }[] = [
  { id: 'gul', title: 'Samlet tid', accent: 'var(--yellow)', soft: 'var(--yellow-soft)' },
  { id: 'gron', title: 'Point', accent: 'var(--green)', soft: 'var(--green-soft)' },
  { id: 'prik', title: 'Bjergpoint', accent: 'var(--red)', soft: 'var(--red-soft)' },
];

/** Tre kolonner med klassementet. Førende i hver trøje får trøjeikonet og en farvet række. */
export function StandingsBoard({ standings, top = 250 }: { standings: Standings; top?: number }) {
  const { riders } = useContent();
  const name = (id: string) => riders.find((r) => r.id === id)?.name ?? '?';
  const n = riders.length;
  const rowH = Math.min(76, Math.floor(580 / Math.max(n, 1)));
  const fs = Math.min(30, rowH - 26);
  const empty = standings.countedStages.length === 0;
  const leaders = { gul: jerseyLeader(standings, 'gul'), gron: jerseyLeader(standings, 'gron'), prik: jerseyLeader(standings, 'prik') };
  return (
    <div style={{ position: 'absolute', left: 96, top, width: 1728, display: 'flex', gap: 32 }}>
      {cols.map((c) => {
        const rows = standings.tables[c.id];
        const leaderValue = rows[0]?.value;
        return (
          <Card key={c.id} style={{ flex: 1, minWidth: 0, padding: '26px 26px 20px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 8, background: c.accent }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '4px 6px 14px' }}>
              <JerseyBadge jersey={c.id} size={52} />
              <span className="h-display" style={{ fontSize: 34 }}>
                {c.title}
              </span>
            </div>
            {rows.map((r) => {
              const lead = !empty && leaders[c.id] === r.riderId;
              return (
                <div
                  key={r.riderId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: rowH,
                    gap: 14,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: lead ? c.soft : undefined,
                    borderTop: lead ? undefined : '2px solid var(--mist)',
                    fontSize: fs,
                  }}
                >
                  <span className="num" style={{ width: 40, fontSize: fs + 8, color: lead ? 'var(--ink)' : 'var(--muted)' }}>
                    {empty ? '–' : r.rank}
                  </span>
                  <FitText
                    max={fs}
                    min={13}
                    style={{ flex: 1, minWidth: 0, height: rowH - 4, fontWeight: 700, lineHeight: 1.05, display: 'flex', alignItems: 'center', overflowWrap: 'anywhere' }}
                  >
                    {name(r.riderId)}
                  </FitText>
                  {lead && <JerseyBadge jersey={c.id} size={rowH - 22} />}
                  {!empty && r.tied && (
                    <span title="Uafgjort – afgøres af kommissæren" style={{ color: 'var(--red)', fontWeight: 700 }}>
                      =
                    </span>
                  )}
                  <span className="num" style={{ width: 130, textAlign: 'right', whiteSpace: 'nowrap', fontSize: fs + 4, fontWeight: 600 }}>
                    {empty
                      ? '–'
                      : c.id === 'gul'
                        ? r.rank === 1
                          ? formatTime(r.value)
                          : formatGap(r.value - (leaderValue ?? 0))
                        : `${r.value} p`}
                  </span>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );
}
