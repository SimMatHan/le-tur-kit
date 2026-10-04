import { useContent } from '../content/ContentContext';
import { ridersImage } from '../content/images';
import { BikeIcon } from '../components/icons';
import type { SlideProps } from './types';

const words = ['Nul', 'Én', 'To', 'Tre', 'Fire', 'Fem', 'Seks', 'Syv', 'Otte', 'Ni', 'Ti', 'Elleve', 'Tolv'];
export const numberWord = (n: number) => words[n] ?? String(n);

export function RidersIntroSlide(_: SlideProps) {
  const { meta, riders } = useContent();
  return (
    <div className="slide bg-navy">
      <img src={ridersImage} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: 864, height: 1080, objectFit: 'cover' }} />
      <div
        style={{
          position: 'absolute',
          left: 719,
          top: 718,
          width: 290,
          height: 290,
          borderRadius: '50%',
          background: 'var(--red)',
          border: '5px solid var(--paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BikeIcon size={160} />
      </div>
      <div style={{ position: 'absolute', left: 1008, top: 259, width: 820 }}>
        <p className="kicker c-paper" style={{ fontSize: 26, letterSpacing: '0.3em' }}>
          Præsentation af
        </p>
        <h1 className="h-display c-yellow" style={{ fontSize: 124, marginTop: 34 }}>
          Årets ryttere
        </h1>
        <p className="lead c-paper" style={{ fontSize: 38, marginTop: 160 }}>
          {meta.ridersTagline.replace('{antal}', numberWord(riders.length))}
        </p>
      </div>
    </div>
  );
}
