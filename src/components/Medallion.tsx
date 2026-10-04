import type { CSSProperties, ReactNode } from 'react';

export type MedallionColor = 'yellow' | 'red' | 'navy' | 'paper';

interface Props {
  /** Tallet eller teksten i midten (fx 1, "LK", 2026). */
  value: ReactNode;
  /** Lille overskrift over tallet (fx "NR.", "ETAPE"). */
  label?: string;
  size?: number;
  color?: MedallionColor;
  /** Skriftstørrelse for value; standard afledes af size. */
  valueSize?: number;
  shadow?: boolean;
  ringColor?: string;
  style?: CSSProperties;
  className?: string;
  title?: string;
}

const fg: Record<MedallionColor, string> = {
  yellow: 'var(--navy)',
  red: 'var(--paper)',
  navy: 'var(--yellow)',
  paper: 'var(--navy)',
};
const labelFg: Record<MedallionColor, string> = {
  yellow: 'var(--navy)',
  red: 'var(--paper)',
  navy: 'var(--paper)',
  paper: 'var(--red)',
};

/** Rundt mærke med tal – gennemgående motiv for numre, etaper og placeringer. */
export function Medallion({
  value,
  label,
  size = 110,
  color = 'yellow',
  valueSize,
  shadow = true,
  ringColor = 'var(--navy)',
  style,
  className,
  title,
}: Props) {
  const ring = Math.max(3, Math.round(size * 0.045));
  const vs = valueSize ?? Math.round(size * (label ? 0.42 : 0.48));
  return (
    <div
      className={className}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `var(--${color})`,
        border: `${ring}px solid ${ringColor}`,
        boxShadow: shadow ? `${Math.round(size * 0.05)}px ${Math.round(size * 0.05)}px 0 var(--navy)` : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: 'var(--body)',
            fontWeight: 700,
            letterSpacing: '0.16em',
            fontSize: Math.max(12, Math.round(size * 0.105)),
            color: labelFg[color],
            marginBottom: size * 0.04,
            paddingLeft: '0.16em',
          }}
        >
          {label}
        </span>
      )}
      <span className="num" style={{ fontSize: vs, color: fg[color], paddingRight: '0.04em' }}>
        {value}
      </span>
    </div>
  );
}
