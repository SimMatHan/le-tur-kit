import { useContent } from '../content/ContentContext';
import { ridersImage } from '../content/images';
import { BikeIcon } from '../components/icons';
import type { SlideProps } from './types';

const words = ['Nul', 'Én', 'To', 'Tre', 'Fire', 'Fem', 'Seks', 'Syv', 'Otte', 'Ni', 'Ti', 'Elleve', 'Tolv'];
export const numberWord = (n: number) => words[n] ?? String(n);

export function RidersIntroSlide(_: SlideProps) {
  const { meta, riders } = useContent();
  return (
    <div className="slide bg-ink">
      <img src={ridersImage} alt="" draggable={false} className="photo-bw" style={{ position: 'absolute', left: 0, top: 0, width: 880, height: 1080, objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 470, top: 0, width: 420, height: 1080, background: 'linear-gradient(270deg, var(--ink) 0, var(--ink) 4%, rgba(17,18,21,0))' }} />
      <div style={{ position: 'absolute', left: 1000, top: 250, width: 830 }}>
        <BikeIcon size={120} color="var(--yellow)" />
        <p className="kicker" style={{ fontSize: 24, letterSpacing: '0.3em', marginTop: 40, color: 'var(--muted-dark)' }}>
          Præsentation af
        </p>
        <h1 className="h-display" style={{ fontSize: 180, marginTop: 56, lineHeight: 0.88 }}>
          Årets
          <br />
          <span className="c-yellow">ryttere</span>
        </h1>
        <p style={{ fontSize: 36, fontWeight: 500, marginTop: 56, color: 'var(--muted-dark)' }}>
          {meta.ridersTagline.replace('{antal}', numberWord(riders.length))}
        </p>
      </div>
    </div>
  );
}
