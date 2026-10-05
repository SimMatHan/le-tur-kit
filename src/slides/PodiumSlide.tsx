import { useContent } from '../content/ContentContext';
import { Confetti } from '../components/Confetti';
import { Podium, type PodiumJersey, type PodiumPerson } from '../components/Podium';
import { FlagIcon } from '../components/icons';
import { formatGap, formatTime } from '../game/format';
import { useStandings } from '../game/GameContext';
import { podiumData, type JerseyWinner } from '../game/podium';
import type { SlideProps } from './types';

export function PodiumSlide(_: SlideProps) {
  const { podium, riders, stages } = useContent();
  const standings = useStandings();
  const data = podiumData(standings, stages.length);

  const person = (id: string | undefined, rank?: number, tied?: boolean): PodiumPerson | null => {
    const r = id ? riders.find((x) => x.id === id) : undefined;
    return r ? { name: r.name, photo: r.photo, number: r.number, rank, tied } : null;
  };
  const jersey = (w: JerseyWinner | null, unit: string): PodiumJersey | null =>
    w ? { people: w.riderIds.map((id) => person(id)!).filter(Boolean), value: `${w.value} ${unit}`, tied: w.tied } : null;

  const leaderTime = standings.tables.gul[0]?.value ?? 0;
  const details = data.top.map((s, i) => {
    if (!s) return null;
    const t = standings.totals[s.riderId]?.timeSec ?? 0;
    return i === 0 || s.rank === 1 ? formatTime(t) : formatGap(t - leaderTime);
  });

  const kicker = !data.hasResults
    ? 'Udfyldes automatisk, når etaperne er kørt'
    : data.final
      ? podium.kicker
      : `Foreløbig stilling efter ${data.stagesCounted} af ${stages.length} etaper`;

  return (
    <div className="slide bg-ink">
      {data.final && <Confetti />}
      <div className="slide-head" style={{ top: 72 }}>
        <h1 className="h-title">{podium.title}</h1>
        <p className="kicker" style={{ marginTop: 22, fontSize: 22, color: 'var(--muted-dark)' }}>
          {kicker}
          {data.unresolved && <span className="c-yellow"> · uafgjort afgøres af kommissæren</span>}
        </p>
      </div>
      <div style={{ position: 'absolute', right: 96, top: 80 }}>
        <FlagIcon size={100} color="var(--white)" bg="var(--ink)" />
      </div>
      <Podium
        top={data.top.map((s) => (s ? person(s.riderId, s.rank, s.tied) : null))}
        green={jersey(data.gron, 'point')}
        prik={jersey(data.prik, 'bjergpoint')}
        details={details}
        hasResults={data.hasResults}
      />
    </div>
  );
}
