import { useContent } from '../content/ContentContext';
import { titleImage } from '../content/images';
import type { SlideProps } from './types';

export function TitleSlide(_: SlideProps) {
  const { meta } = useContent();
  const [main, sub] = splitTitle(meta.title);
  return (
    <div className="slide bg-ink">
      <img src={titleImage} alt="" draggable={false} className="photo-bw" style={{ position: 'absolute', left: 880, top: 0, width: 1040, height: 1080, objectFit: 'cover' }} />
      {/* Fotoet glider ud i den sorte baggrund */}
      <div style={{ position: 'absolute', left: 870, top: 0, width: 540, height: 1080, background: 'linear-gradient(90deg, var(--ink) 0, var(--ink) 4%, rgba(17,18,21,0))' }} />
      <div style={{ position: 'absolute', left: 96, top: 150, width: 980 }}>
        <div style={{ width: 76, height: 10, background: 'var(--yellow)' }} />
        <p className="kicker" style={{ fontSize: 22, letterSpacing: '0.3em', marginTop: 34, color: 'var(--muted-dark)' }}>
          {meta.kicker}
        </p>
        <h1 className="h-display" style={{ fontSize: 280, marginTop: 40, lineHeight: 0.82, letterSpacing: '-0.01em' }}>
          {main}
        </h1>
        {sub && (
          <p className="h-display c-yellow" style={{ fontSize: 108, fontWeight: 700, marginTop: 18, lineHeight: 1 }}>
            {sub}
          </p>
        )}
      </div>
      <div style={{ position: 'absolute', left: 96, top: 830, display: 'flex', alignItems: 'center', gap: 36 }}>
        <span className="num" style={{ background: 'var(--yellow)', color: 'var(--ink)', fontSize: 84, fontWeight: 800, lineHeight: 1, padding: '10px 26px 8px', borderRadius: 14 }}>
          {meta.year}
        </span>
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: '0.04em' }}>{meta.tagline}</span>
      </div>
    </div>
  );
}

/** "Le Tur (de France)" → ["LE TUR", "de France"] */
function splitTitle(t: string): [string, string | null] {
  const m = t.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? [m[1], m[2]] : [t, null];
}
