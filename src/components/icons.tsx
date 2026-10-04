// Enkle, flade ikoner i plakatstil.
interface IconProps {
  size?: number;
  color?: string;
  bg?: string;
}

export function CameraIcon({ size = 100, color = 'var(--paper)', bg = 'var(--navy2)' }: IconProps) {
  return (
    <svg width={size} height={size * 0.88} viewBox="0 0 100 88" aria-hidden>
      <rect x="30" y="0" width="40" height="18" rx="6" fill={color} />
      <rect x="0" y="10" width="100" height="78" rx="10" fill={color} />
      <circle cx="50" cy="48" r="22" fill={bg} />
      <circle cx="50" cy="48" r="15" fill={color} />
    </svg>
  );
}

export function BeerIcon({ size = 70, color = 'var(--yellow)', bg = 'var(--navy)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" aria-hidden>
      <rect x="0" y="0" width="50" height="70" rx="5" fill={color} />
      <path d="M48 12h10a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12H48v-9h9a4 4 0 0 0 4-4V25a4 4 0 0 0-4-4h-9z" fill={color} />
      <rect x="14" y="14" width="7" height="42" rx="3" fill={bg} />
      <rect x="29" y="14" width="7" height="42" rx="3" fill={bg} />
    </svg>
  );
}

export function CarrotIcon({ size = 80, color = 'var(--red)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <path d="M16 8c8 2 12 8 14 14 2-8 8-13 16-13-2 7-6 11-12 13 7-1 13 2 16 8-7 2-13 0-17-4z" fill={color} />
      <path d="M30 24c10-6 26 2 26 14 0 6-6 12-14 18L16 76c-3 2-6-1-4-4l12-30c3-8 2-14 6-18z" fill={color} />
      <path d="M33 38l8 4M28 50l8 3M24 61l7 3" stroke="var(--paper)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function DiceIcon({ size = 70, color = 'var(--yellow)', bg = 'var(--navy)', pips = 5 }: IconProps & { pips?: number }) {
  const p: Record<number, [number, number][]> = {
    1: [[35, 35]],
    2: [[20, 20], [50, 50]],
    3: [[20, 20], [35, 35], [50, 50]],
    4: [[20, 20], [50, 20], [20, 50], [50, 50]],
    5: [[20, 20], [50, 20], [35, 35], [20, 50], [50, 50]],
    6: [[20, 18], [50, 18], [20, 35], [50, 35], [20, 52], [50, 52]],
  };
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" aria-hidden>
      <rect x="0" y="0" width="70" height="70" rx="12" fill={color} />
      {(p[pips] ?? p[5]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6.5" fill={bg} />
      ))}
    </svg>
  );
}

export function MusicIcon({ size = 120, color = 'var(--yellow)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <path d="M38 22l70-20v84h-1a18 14 0 1 1-14-14V30L50 42v56h-1a18 14 0 1 1-14-14z" fill={color} />
    </svg>
  );
}

export function BikeIcon({ size = 160, color = 'var(--paper)' }: IconProps) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 160 96" aria-hidden fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="64" r="25" />
      <circle cx="128" cy="64" r="25" />
      <path d="M32 64l24-40h50l22 40M56 24l16 40h20l14-40M48 8h22M100 8h14l-8 16" />
    </svg>
  );
}

export function FlagIcon({ size = 90, color = 'var(--yellow)', bg = 'var(--navy)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" aria-hidden>
      <circle cx="9" cy="8" r="7" fill={color} />
      <rect x="5" y="8" width="8" height="82" rx="4" fill={color} />
      <path d="M13 14c18-8 30 8 48 0s20-4 26-2v40c-8-4-12-4-26 2s-30-8-48 0z" fill={color} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4, 5].map((c) =>
          (r + c) % 2 === 0 ? <rect key={`${r}-${c}`} x={17 + c * 11} y={17 + r * 9 + (c % 2) * 1} width="11" height="9" fill={bg} /> : null,
        ),
      )}
    </svg>
  );
}

export function PlayIcon({ size = 36, color = 'var(--yellow)', bg = 'var(--navy)' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect width="36" height="36" rx="5" fill={color} />
      <path d="M13 9l14 9-14 9z" fill={bg} />
    </svg>
  );
}
