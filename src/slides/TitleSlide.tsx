import { useContent } from '../content/ContentContext';
import { titleImage } from '../content/images';
import { Medallion } from '../components/Medallion';
import type { SlideProps } from './types';

export function TitleSlide(_: SlideProps) {
  const { meta } = useContent();
  const [main, sub] = splitTitle(meta.title);
  return (
    <div className="slide bg-navy">
      <img src={titleImage} alt="" draggable={false} style={{ position: 'absolute', left: 998, top: 0, width: 922, height: 1080, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 101, top: 188, width: 820 }}>
        <p className="kicker c-paper" style={{ fontSize: 24, letterSpacing: '0.3em' }}>
          {meta.kicker}
        </p>
        <h1 className="h-display c-yellow" style={{ fontSize: 200, fontWeight: 900, marginTop: 50, letterSpacing: '0.01em' }}>
          {main}
        </h1>
        {sub && (
          <p style={{ fontFamily: 'var(--head)', fontStyle: 'italic', fontWeight: 400, fontSize: 84, margin: '48px 0 0', color: 'var(--paper)' }}>
            {sub}
          </p>
        )}
      </div>
      <p style={{ position: 'absolute', left: 101, top: 893, margin: 0, fontWeight: 700, fontSize: 34, color: 'var(--yellow)' }}>{meta.tagline}</p>
      <Medallion
        value={meta.year}
        label="UDGAVE"
        color="red"
        size={290}
        valueSize={92}
        ringColor="var(--navy)"
        style={{ position: 'absolute', left: 853, top: 640 }}
      />
    </div>
  );
}

/** "Le Tur (de France)" → ["LE TUR", "(de France)"] */
function splitTitle(t: string): [string, string | null] {
  const m = t.match(/^(.*?)\s*(\(.*\))\s*$/);
  return m ? [m[1].toUpperCase(), m[2]] : [t.toUpperCase(), null];
}
