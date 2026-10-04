import type { CSSProperties, ReactNode } from 'react';

type Tone = 'white' | 'navy' | 'navy2' | 'paper' | 'yellow';

interface Props {
  children?: ReactNode;
  tone?: Tone;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  border?: boolean;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

const bg: Record<Tone, string> = {
  white: '#fff',
  navy: 'var(--navy)',
  navy2: 'var(--navy2)',
  paper: 'var(--paper)',
  yellow: 'var(--yellow)',
};
const fg: Record<Tone, string> = {
  white: 'var(--navy)',
  navy: 'var(--paper)',
  navy2: 'var(--paper)',
  paper: 'var(--navy)',
  yellow: 'var(--navy)',
};

/** Kort/boks med hård, forskudt navy-skygge (ingen blur). */
export function HardShadowCard({ children, tone = 'white', shadow = 'md', border = true, style, className, onClick }: Props) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: bg[tone],
        color: fg[tone],
        border: border ? 'var(--border)' : undefined,
        boxShadow: shadow === 'none' ? undefined : `var(--shadow${shadow === 'md' ? '' : '-' + shadow})`,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
