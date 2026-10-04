import { useContent } from '../content/ContentContext';
import { Podium, type PodiumPerson } from '../components/Podium';
import { FlagIcon } from '../components/icons';
import { useStandings } from '../game/useStandings';
import type { SlideProps } from './types';

export function PodiumSlide(_: SlideProps) {
  const { podium, riders } = useContent();
  const standings = useStandings();
  const done = standings.completedStages > 0;
  const person = (id?: string): PodiumPerson | null => {
    const r = done && id ? riders.find((x) => x.id === id) : undefined;
    return r ? { name: r.name, photo: r.photo } : null;
  };
  const gul = standings.tables.gul;
  return (
    <div className="slide bg-navy">
      <div className="slide-head" style={{ top: 66 }}>
        <h1 className="h-title c-yellow">{podium.title}</h1>
        <p className="kicker c-paper" style={{ marginTop: 34, fontSize: 24 }}>
          {podium.kicker}
        </p>
      </div>
      <div style={{ position: 'absolute', right: 86, top: 66 }}>
        <FlagIcon size={110} />
      </div>
      <Podium
        top={[person(gul[0]?.riderId), person(gul[1]?.riderId), person(gul[2]?.riderId)]}
        green={person(standings.tables.gron[0]?.riderId)}
        prik={person(standings.tables.prik[0]?.riderId)}
      />
    </div>
  );
}
