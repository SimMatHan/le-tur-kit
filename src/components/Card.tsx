import type { CSSProperties, ReactNode } from 'react';

type Tone = 'white' | 'ink' | 'ink2' | 'yellow';

interface Props {
  children?: ReactNode;
  tone?: Tone;
  style?: CSSProperties;
  className?: string;
}

const bg: Record<Tone, string> = {
  white: 'var(--white)',
  ink: 'var(--ink)',
  ink2: 'var(--ink-2)',
  yellow: 'var(--yellow)',
};

/** Flad boks med runde hjørner – hvid med blød skygge på lys baggrund, eller sort/gul. */
export function Card({ children, tone = 'white', style, className }: Props) {
  return (
    <div
      className={className}
      style={{
        background: bg[tone],
        color: tone === 'ink' || tone === 'ink2' ? 'var(--white)' : 'var(--ink)',
        borderRadius: 'var(--radius)',
        boxShadow: tone === 'white' ? 'var(--shadow)' : undefined,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
