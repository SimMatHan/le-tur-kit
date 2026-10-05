import type { CSSProperties } from 'react';
import { isRed, suitOf } from '../game/highlow';
import type { Card } from '../game/types';

/** Spillekort i plakatstil: hvid med hård skygge, rød/navy farve efter kulør. */
export function PlayingCard({ card, width = 160, state, style }: { card: Card; width?: number; state?: 'ok' | 'fail'; style?: CSSProperties }) {
  const h = Math.round(width * 1.4);
  const rank = card.slice(0, -1);
  const suit = suitOf(card);
  const color = isRed(card) ? 'var(--red)' : 'var(--navy)';
  const border = state === 'fail' ? 'var(--red)' : state === 'ok' ? 'var(--green)' : 'var(--navy)';
  return (
    <div
      className="playing-card"
      aria-label={card}
      style={{
        width,
        height: h,
        borderRadius: width * 0.08,
        border: `${Math.max(3, Math.round(width * 0.03))}px solid ${border}`,
        boxShadow: `${Math.round(width * 0.05)}px ${Math.round(width * 0.05)}px 0 var(--navy)`,
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
