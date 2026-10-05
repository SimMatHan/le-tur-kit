import type { CSSProperties, ReactNode } from 'react';

export type TagColor = 'yellow' | 'ink' | 'white' | 'red';

interface Props {
  /** Tallet eller teksten i midten (fx 1, "LK", 2026). */
  value: ReactNode;
  /** Lille overskrift over tallet (fx "NR.", "ETAPE"). */
  label?: string;
  size?: number;
  color?: TagColor;
  /** Skriftstørrelse for value; standard afledes af size. */
  valueSize?: number;
  style?: CSSProperties;
  className?: string;
  title?: string;
}

const fg: Record<TagColor, string> = {
  yellow: 'var(--ink)',
  ink: 'var(--yellow)',
  white: 'var(--ink)',
  red: 'var(--white)',
};
const labelFg: Record<TagColor, string> = {
  yellow: 'var(--ink)',
  ink: 'var(--white)',
  white: 'var(--muted)',
  red: 'var(--white)',
};

/** Kvadratisk mærke med tal (rygnummer, etape, placering) – gennemgående motiv. */
export function NumberTag({ value, label, size = 96, color = 'ink', valueSize, style, className, title }: Props) {
  const vs = valueSize ?? Math.round(size * (label ? 0.5 : 0.6));
  return (
    <div
      className={className}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.16),
        background: `var(--${color})`,
        boxShadow: color === 'white' ? 'inset 0 0 0 2px var(--line)' : undefined,
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
            fontSize: Math.max(11, Math.round(size * 0.1)),
            color: labelFg[color],
            marginBottom: Math.round(size * 0.04),
            paddingLeft: '0.16em',
          }}
        >
          {label}
        </span>
      )}
      <span className="num" style={{ fontSize: vs, fontWeight: 800, color: fg[color] }}>
        {value}
      </span>
    </div>
  );
}
