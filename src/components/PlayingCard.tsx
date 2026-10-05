import type { CSSProperties } from 'react';
import { isRed, suitOf } from '../game/highlow';
import type { Card } from '../game/types';

/** Spillekort: hvidt med blød skygge, rød/sort efter kulør. Grøn/rød ring viser, om gættet holdt. */
export function PlayingCard({ card, width = 160, state, style }: { card: Card; width?: number; state?: 'ok' | 'fail'; style?: CSSProperties }) {
  const h = Math.round(width * 1.4);
  const rank = card.slice(0, -1);
  const suit = suitOf(card);
  const color = isRed(card) ? 'var(--red)' : 'var(--ink)';
  const ring = state === 'fail' ? 'var(--red)' : state === 'ok' ? 'var(--green)' : null;
  return (
    <div
      className="playing-card"
      aria-label={card}
      style={{
        width,
        height: h,
        borderRadius: width * 0.08,
        boxShadow: [
          ring ? `0 0 0 ${Math.max(3, Math.round(width * 0.035))}px ${ring}` : 'inset 0 0 0 1px var(--line)',
          `0 ${Math.round(width * 0.04)}px ${Math.round(width * 0.12)}px rgba(17,18,21,0.25)`,
        ].join(', '),
        background: '#fff',
        color,
        position: 'relative',
        flex: 'none',
        ...style,
      }}
    >
      <span className="num" style={{ position: 'absolute', left: width * 0.08, top: width * 0.04, fontSize: width * 0.3, lineHeight: 1 }}>
        {rank}
      </span>
      <span style={{ position: 'absolute', left: width * 0.09, top: width * 0.36, fontSize: width * 0.2, lineHeight: 1 }}>{suit}</span>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: width * 0.55, paddingTop: width * 0.12 }}>
        {suit}
      </span>
    </div>
  );
}
