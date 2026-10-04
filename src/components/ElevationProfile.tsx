import type { Stage } from '../content/types';
import { Medallion } from './Medallion';

/**
 * Højdeprofil som rigtig SVG. Hver etape får et lige bredt segment, hvis form
 * følger stage.profile (flad, kuperet, bjerg), og en medaljon over sit højdepunkt.
 * Alle mål er scene-px; y-værdierne er højde over bundlinjen.
 */
const W = 1748;
const H = 570;
const MEDAL = 112;

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

export function ElevationProfile({ stages, top = 295 }: { stages: Stage[]; top?: number }) {
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
  const d = `M0 ${H} ` + pts.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ` L${W} ${H} Z`;

  return (
    <div style={{ position: 'absolute', left: 86, top, width: W, height: H + 110 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', left: 0, top: 0 }} role="img" aria-label="Højdeprofil for ruten">
        <path d={d} fill="var(--navy)" />
      </svg>
      {stages.map((s, i) => {
        const [fx, h] = shapes[i].peak;
        const cx = i * segW + fx * segW;
        const cy = H - h - 80;
        return <Medallion key={s.n} value={s.n} size={MEDAL} valueSize={52} style={{ position: 'absolute', left: cx - MEDAL / 2, top: cy - MEDAL / 2 }} />;
      })}
      {stages.map((s, i) => (
        <div key={s.n} style={{ position: 'absolute', left: i * segW, width: segW, top: H + 12, textAlign: 'center' }}>
          <div className="h-display" style={{ fontSize: 42, whiteSpace: 'nowrap' }}>
            {s.shortName}
          </div>
          <div style={{ fontSize: 26, marginTop: 6, whiteSpace: 'nowrap' }}>{s.tagline}</div>
        </div>
      ))}
    </div>
  );
}
