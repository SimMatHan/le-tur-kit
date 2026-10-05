import type { JerseyId } from '../content/types';
import { usePhotoUrl } from '../content/photos';
import { JerseyBadge } from './JerseyBadge';
import { FitText } from './FitText';
import { NumberTag } from './NumberTag';

export interface PodiumPerson {
  name: string;
  photo: string | null;
  number: number;
  /** Placering i klassementet (delt ved lighed). */
  rank?: number;
  tied?: boolean;
}

export interface PodiumJersey {
  people: PodiumPerson[];
  value: string;
  tied: boolean;
}

interface Props {
  /** Top 3 i den gule trøje (index 0 = vinder). */
  top: (PodiumPerson | null)[];
  green: PodiumJersey | null;
  prik: PodiumJersey | null;
  /** Tid/forspring under navnet på trappen. */
  details?: (string | null)[];
  hasResults?: boolean;
}

/** Rundt portræt – foto, eller rytterens rygnummer, hvis der intet foto er. */
function Portrait({ person, size }: { person: PodiumPerson | null; size: number }) {
  const url = usePhotoUrl(person?.photo ?? null);
  if (person && !url) return <NumberTag value={person.number} label="NR." color="white" size={size} style={{ borderRadius: '50%' }} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.round(size * 0.04)}px solid var(--white)`,
        background: 'var(--ink-3)',
        overflow: 'hidden',
        flex: 'none',
      }}
    >
      {url && <img src={url} alt={person?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}

const blocks = [
  // place-index, left, top, farver, forsinkelse for "rejs dig"-animation
  { i: 1, left: 96, top: 700, bg: 'var(--white)', fg: 'var(--ink)', delay: 0.35 },
  { i: 0, left: 470, top: 600, bg: 'var(--yellow)', fg: 'var(--ink)', delay: 0.7 },
  { i: 2, left: 844, top: 780, bg: '#c8c8c1', fg: 'var(--ink)', delay: 0 },
];
const BLOCK_W = 350;
const FLOOR = 1080;

/** Podie: top 3 i gul på trappen, vinderne af grøn og prikket ved siden af. */
export function Podium({ top, green, prik, details = [], hasResults = false }: Props) {
  return (
    <>
      {blocks.map((b) => {
        const p = top[b.i] ?? null;
        const portrait = b.i === 0 ? 170 : 140;
        const rankLabel = p?.rank ? `${p.rank}${p.tied ? '=' : ''}` : String(b.i + 1);
        return (
          <div key={b.i} className="podium-step" style={{ animationDelay: `${b.delay}s` }}>
            <div
              style={{
                position: 'absolute',
                left: b.left - 30,
                width: BLOCK_W + 60,
                top: b.top - portrait - 112,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ position: 'relative' }}>
                <Portrait person={p} size={portrait} />
                {b.i === 0 && p && !p.tied && <JerseyBadge jersey="gul" size={84} style={{ position: 'absolute', right: -58, top: -24 }} />}
              </div>
              <FitText max={50} min={18} className="h-display" style={{ width: BLOCK_W + 60, height: 60, textAlign: 'center', lineHeight: 1.08, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p?.name ?? 'Navn'}
              </FitText>
              <span className="num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--muted-dark)', height: 30, whiteSpace: 'nowrap' }}>{details[b.i] ?? ''}</span>
            </div>
            <div
              style={{
                position: 'absolute',
                left: b.left,
                top: b.top,
                width: BLOCK_W,
                height: FLOOR - b.top,
                background: b.bg,
                borderRadius: '18px 18px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 22,
              }}
            >
              <span className="num" style={{ fontSize: 140, fontWeight: 800, color: b.fg, lineHeight: 1 }}>
                {rankLabel}
              </span>
              {p?.tied && (
                <span className="kicker" style={{ fontSize: 18, color: b.fg, marginTop: 8 }}>
                  Delt plads
                </span>
              )}
            </div>
          </div>
        );
      })}
      {(
        [
          ['gron', 'Den grønne trøje', green, 290],
          ['prik', 'Den prikkede trøje', prik, 650],
        ] as [JerseyId, string, PodiumJersey | null, number][]
      ).map(([j, label, w, topY], k) => (
        <div
          key={j}
          className="podium-step"
          style={{
            animationDelay: `${1 + k * 0.25}s`,
            position: 'absolute',
            left: 1284,
            top: topY,
            width: 540,
            height: 310,
            background: 'var(--ink-2)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            padding: '30px 34px',
            display: 'flex',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: j === 'gron' ? 'var(--green)' : 'var(--red)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <JerseyBadge jersey={j} size={90} />
            <p className="kicker" style={{ fontSize: 18, color: 'var(--muted-dark)', marginTop: 16, whiteSpace: 'nowrap' }}>
              {label}
            </p>
            <FitText max={50} min={16} className="h-display" style={{ height: 62, lineHeight: 1.08, marginTop: 6, display: 'flex', alignItems: 'center' }}>
              {w?.people.map((p) => p.name).join(' & ') ?? (hasResults ? 'Ingen endnu' : 'Navn')}
            </FitText>
            <span className="num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--yellow)', whiteSpace: 'nowrap' }}>{w ? `${w.value}${w.tied ? ' · delt trøje' : ''}` : ''}</span>
          </div>
          {w && w.people.length === 1 && <Portrait person={w.people[0]} size={150} />}
        </div>
      ))}
    </>
  );
}
