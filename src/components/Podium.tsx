import type { JerseyId } from '../content/types';
import { usePhotoUrl } from '../content/photos';
import { JerseyBadge } from './JerseyBadge';
import { FitText } from './FitText';

export interface PodiumPerson {
  name: string;
  photo: string | null;
}

interface Props {
  /** Top 3 i den gule trøje (index 0 = vinder). */
  top: (PodiumPerson | null)[];
  green: PodiumPerson | null;
  prik: PodiumPerson | null;
}

function Portrait({ person, size }: { person: PodiumPerson | null; size: number }) {
  const url = usePhotoUrl(person?.photo ?? null);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '5px solid var(--paper)',
        background: 'var(--navy2)',
        boxShadow: '6px 6px 0 #0b0e1c',
        overflow: 'hidden',
        flex: 'none',
      }}
    >
      {url && <img src={url} alt={person?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}

const blocks = [
  // place-index, left, top, color
  { i: 1, left: 115, top: 662, bg: 'var(--paper)', fg: 'var(--navy)' },
  { i: 0, left: 490, top: 547, bg: 'var(--yellow)', fg: 'var(--red)' },
  { i: 2, left: 864, top: 749, bg: 'var(--paper)', fg: 'var(--navy)' },
];
const BLOCK_W = 346;
const FLOOR = 980;

/** Podie: top 3 i gul på trappen, vinderne af grøn og prikket ved siden af. */
export function Podium({ top, green, prik }: Props) {
  return (
    <>
      {blocks.map((b) => {
        const p = top[b.i] ?? null;
        const portrait = b.i === 0 ? 150 : 130;
        return (
          <div key={b.i}>
            <div
              style={{
                position: 'absolute',
                left: b.left,
                width: BLOCK_W,
                top: b.top - portrait - 96 - (b.i === 0 ? 30 : 0),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ position: 'relative' }}>
                <Portrait person={p} size={portrait} />
                {b.i === 0 && <JerseyBadge jersey="gul" size={72} style={{ position: 'absolute', right: -46, top: -20 }} />}
              </div>
              <FitText max={46} min={24} className="h-display c-yellow" style={{ width: BLOCK_W + 40, height: 64, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                {p?.name ?? 'Navn'}
              </FitText>
            </div>
            <div
              style={{
                position: 'absolute',
                left: b.left,
                top: b.top,
                width: BLOCK_W,
                height: FLOOR - b.top,
                background: b.bg,
                border: '3px solid var(--paper)',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 20,
              }}
            >
              <span className="num" style={{ fontSize: 120, color: b.fg, lineHeight: 1 }}>
                {b.i + 1}
              </span>
            </div>
          </div>
        );
      })}
      {(
        [
          ['gron', 'Den grønne trøje', green, 290],
          ['prik', 'Den prikkede trøje', prik, 640],
        ] as [JerseyId, string, PodiumPerson | null, number][]
      ).map(([j, label, p, topY]) => (
        <div
          key={j}
          style={{
            position: 'absolute',
            left: 1296,
            top: topY,
            width: 536,
            height: 296,
            background: 'var(--navy2)',
            border: '3px solid var(--paper)',
            padding: '34px 40px',
            display: 'flex',
            gap: 30,
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <JerseyBadge jersey={j} size={96} />
            <p className="kicker c-paper" style={{ fontSize: 22, marginTop: 22 }}>
              {label}
            </p>
            <FitText max={46} min={24} className="h-display c-yellow" style={{ height: 64, whiteSpace: 'nowrap', lineHeight: 1.3, marginTop: 8 }}>
              {p?.name ?? 'Navn'}
            </FitText>
          </div>
          {p && <Portrait person={p} size={150} />}
        </div>
      ))}
    </>
  );
}
