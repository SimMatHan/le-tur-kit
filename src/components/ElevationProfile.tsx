import type { Stage } from '../content/types';
import { NumberTag } from './NumberTag';

/**
 * Højdeprofil som rigtig SVG. Hver etape får et lige bredt segment, hvis form
 * følger stage.profile (flad, kuperet, bjerg), og et nummermærke over sit højdepunkt.
 * Alle mål er scene-px; y-værdierne er højde over bundlinjen.
 */
const W = 1728;
const H = 570;
const TAG = 92;

type Pt = [number, number]; // [andel af segmentets bredde, højde i px]

function shape(kind: Stage['profile'], idx: number, nextStart: number | null): { pts: Pt[]; peak: Pt } {
  if (kind === 'bjerg')
    return {
      pts: [[0, 190], [0.3, 262], [0.68, 490], [0.75, 513], [0.83, 476], [1, 205]],
      peak: [0.75, 513],
    };
  if (kind === 'kuperet')
    return {
      pts: [[0, 104], [0.23, 175], [0.4, 148], [0.59, 218], [0.76, 162], [1, 190]],
      peak: [0.59, 218],
    };
  // Flad: første etape lidt højere (som i referencen), glidende overgang til næste.
  const h = idx === 0 ? 117 : 92;
  const pts: Pt[] = [[0, idx === 0 ? 110 : h], [0.15, h], [0.85, h]];
  if (nextStart !== null) pts.push([1, Math.max(h - 10, Math.min(nextStart, h + 20))]);
  else pts.push([1, h]);
  return { pts, peak: [0.5, h] };
}

export function ElevationProfile({ stages, top = 290 }: { stages: Stage[]; top?: number }) {
  const n = stages.length;
  const segW = W / n;
  const shapes = stages.map((s, i) => shape(s.profile, i, i < n - 1 && stages[i + 1].profile !== 'flad' ? 104 : null));

  // Spring mellem segmenter bliver til en skrå overgang i stedet for en lodret kant.
  const pts = shapes.flatMap((sh, i) => {
    const prevEnd = i > 0 ? shapes[i - 1].pts.at(-1)![1] : null;
    return sh.pts.map(([fx, h], j) => {
      const x = j === 0 && prevEnd !== null && Math.abs(prevEnd - h) > 4 ? 0.1 : fx;
      return [i * segW + x * segW, H - h] as const;
    });
  });
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const d = `M0 ${H} ` + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ` L${W} ${H} Z`;

  return (
    <div style={{ position: 'absolute', left: 96, top, width: W, height: H + 110 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }} role="img" aria-label="Højdeprofil for ruten">
        <defs>
          <linearGradient id="profile-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b2c33" />
            <stop offset="1" stopColor="#111215" />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#profile-fill)" />
        {stages.map((s, i) =>
          i > 0 ? <line key={s.n} x1={i * segW} x2={i * segW} y1={0} y2={H} stroke="rgba(17,18,21,0.12)" strokeWidth={2} strokeDasharray="4 8" /> : null,
        )}
        <path d={line} fill="none" stroke="var(--yellow)" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {stages.map((s, i) => {
        const [fx, h] = shapes[i].peak;
        const cx = i * segW + fx * segW;
        const cy = H - h - 76;
        return <NumberTag key={s.n} value={s.n} size={TAG} color="yellow" style={{ position: 'absolute', left: cx - TAG / 2, top: cy - TAG / 2 }} />;
      })}
      {stages.map((s, i) => (
        <div key={s.n} style={{ position: 'absolute', left: i * segW, width: segW, top: H + 18, textAlign: 'center' }}>
          <div className="h-display" style={{ fontSize: 44, whiteSpace: 'nowrap' }}>
            {s.shortName}
          </div>
          <div style={{ fontSize: 24, marginTop: 6, whiteSpace: 'nowrap', color: 'var(--muted)', fontWeight: 500 }}>{s.tagline}</div>
        </div>
      ))}
    </div>
  );
}
