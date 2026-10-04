import { useMemo } from 'react';

const colors = ['var(--yellow)', 'var(--red)', 'var(--green)', 'var(--paper)', '#ffffff'];

/** Deterministisk "tilfældighed", så konfettien ser ens ud i miniaturer og ved genindlæsning. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Let CSS-konfetti på scenen. Slås fra ved prefers-reduced-motion (se CSS). */
export function Confetti({ count = 70, seed = 7 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: r() * 1920,
      delay: r() * 2.5,
      dur: 3.2 + r() * 2.8,
      w: 12 + r() * 14,
      h: 8 + r() * 18,
      rot: r() * 360,
      drift: (r() - 0.5) * 260,
      color: colors[i % colors.length],
      round: r() > 0.75,
    }));
  }, [count, seed]);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            width: p.w,
            height: p.round ? p.w : p.h,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--rot' as string]: `${p.rot}deg`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
