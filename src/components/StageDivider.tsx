import { builtinImage } from '../content/images';
import type { Stage } from '../content/types';
import { FitText } from './FitText';
import { JerseyRow } from './JerseyBadge';

/** Etapeskilt: gul baggrund, gul/sort duotone-foto til højre og et stort etapenummer. */
export function StageDivider({ stage, total }: { stage: Stage; total: number }) {
  return (
    <div className="slide bg-yellow">
      <img
        src={builtinImage(stage.img)}
        alt=""
        draggable={false}
        className="photo-duo"
        style={{ position: 'absolute', left: 1060, top: 0, width: 860, height: 1080, objectFit: 'cover' }}
      />
      {/* Stort etapenummer på billedkanten */}
      <div
        className="num"
        aria-hidden
        style={{
          position: 'absolute',
          left: 880,
          top: 70,
          width: 300,
          height: 300,
          borderRadius: 40,
          background: 'var(--ink)',
          color: 'var(--yellow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0.85,
        }}
      >
        <span className="kicker" style={{ color: 'var(--white)', fontSize: 24, letterSpacing: '0.3em', paddingLeft: '0.3em' }}>
          Etape
        </span>
        <span style={{ fontSize: 210, fontWeight: 800, marginTop: 6 }}>{stage.n}</span>
      </div>
      <div style={{ position: 'absolute', left: 96, top: 110, width: 760 }}>
        <p className="kicker" style={{ fontSize: 24 }}>
          Etape {stage.n} af {total}
        </p>
        <FitText bottom max={132} min={64} className="h-display" style={{ height: 270, marginTop: 24, lineHeight: 0.92, paddingBottom: '0.14em' }}>
          {stage.name}
        </FitText>
        <div style={{ width: 120, height: 8, background: 'var(--ink)', marginTop: 40 }} />
        <FitText max={32} min={22} style={{ height: 380, marginTop: 40, lineHeight: 1.4, fontWeight: 500 }}>
          {stage.intro}
        </FitText>
      </div>
      <div style={{ position: 'absolute', left: 96, top: 930, display: 'flex', alignItems: 'center', gap: 40 }}>
        <span className="kicker">Der køres om</span>
        <JerseyRow jerseys={stage.atStake} size={76} gap={14} />
      </div>
    </div>
  );
}
