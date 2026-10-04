import type { CSSProperties } from 'react';
import { jerseyImage } from '../content/images';
import type { JerseyId } from '../content/types';

const names: Record<JerseyId, string> = {
  gul: 'Den gule trøje',
  gron: 'Den grønne trøje',
  prik: 'Den prikkede trøje',
};

/** Trøjeikon (gul, grøn eller prikket). */
export function JerseyBadge({ jersey, size = 60, style }: { jersey: JerseyId; size?: number; style?: CSSProperties }) {
  return (
    <img
      src={jerseyImage(jersey)}
      alt={names[jersey]}
      title={names[jersey]}
      width={size}
      height={size}
      draggable={false}
      style={{ display: 'inline-block', objectFit: 'contain', flex: 'none', ...style }}
    />
  );
}

export function JerseyRow({ jerseys, size = 60, gap = 10 }: { jerseys: JerseyId[]; size?: number; gap?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {jerseys.map((j) => (
        <JerseyBadge key={j} jersey={j} size={size} />
      ))}
    </span>
  );
}
