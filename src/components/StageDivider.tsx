import { builtinImage } from '../content/images';
import type { Stage } from '../content/types';
import { FitText } from './FitText';
import { JerseyRow } from './JerseyBadge';
import { Medallion } from './Medallion';

/** Etapeskilt: gul baggrund, duotone-foto til højre og rød medaljon på billedkanten. */
export function StageDivider({ stage, total }: { stage: Stage; total: number }) {
  return (
    <div className="slide bg-yellow">
      <img
        src={builtinImage(stage.img)}
        alt=""
        draggable={false}
        style={{ position: 'absolute', left: 1095, top: 0, width: 825, height: 1080, objectFit: 'cover' }}
      />
      <Medallion
        value={stage.n}
        label="ETAPE"
        color="red"
        size={320}
        valueSize={150}
        style={{ position: 'absolute', left: 935, top: 62 }}
      />
      <div style={{ position: 'absolute', left: 101, top: 120, width: 820 }}>
        <p className="kicker c-red" style={{ fontSize: 28 }}>
          Etape {stage.n} af {total}
        </p>
        <FitText max={100} min={56} className="h-display" style={{ height: 150, marginTop: 26, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
          {stage.name}
        </FitText>
        <FitText max={32} min={24} style={{ height: 520, marginTop: 50, lineHeight: 1.36, width: 860 }}>
          {stage.intro}
        </FitText>
      </div>
      <div style={{ position: 'absolute', left: 101, top: 912, display: 'flex', alignItems: 'center', gap: 56 }}>
        <span className="kicker">Der køres om</span>
        <JerseyRow jerseys={stage.atStake} size={80} gap={18} />
      </div>
    </div>
  );
}
