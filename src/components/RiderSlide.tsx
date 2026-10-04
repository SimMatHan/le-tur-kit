import type { ReactNode } from 'react';
import type { Person } from '../content/types';
import { FitText } from './FitText';
import { Medallion, type MedallionColor } from './Medallion';
import { PhotoFrame } from './PhotoFrame';
import { SlideFooter } from './SlideFooter';

interface Props {
  person: Person;
  kicker: string;
  medallionLabel: string;
  medallionValue: ReactNode;
  medallionColor?: MedallionColor;
  page?: number;
  /** Ekstra lag, fx redigeringsknapper. */
  overlay?: ReactNode;
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '8.7em',
        height: '2.87em',
        padding: '0 1.33em',
        borderRadius: '1.45em',
        background: 'var(--yellow)',
        border: 'var(--border)',
        boxShadow: '4px 4px 0 var(--navy)',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** Præsentation af en rytter (eller kommissæren): foto, medaljon, navn, kælenavn, bio og egenskaber. */
export function RiderSlide({ person, kicker, medallionLabel, medallionValue, medallionColor = 'red', page, overlay }: Props) {
  return (
    <div className="slide bg-paper">
      <PhotoFrame photo={person.photo} alt={person.name} style={{ left: 86, top: 86, width: 664, height: 864 }} />
      <Medallion
        value={medallionValue}
        label={medallionLabel}
        color={medallionColor}
        size={206}
        valueSize={String(medallionValue).length >= 3 ? 64 : String(medallionValue).length === 2 ? 74 : 84}
        style={{ position: 'absolute', left: 625, top: 33 }}
      />

      <div style={{ position: 'absolute', left: 864, top: 118, width: 970 }}>
        <p className="kicker c-red" style={{ fontSize: 26 }}>
          {kicker}
        </p>
        <FitText
          max={92}
          min={44}
          className="h-display"
          style={{ height: 150, marginTop: 24, lineHeight: 1.12, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
        >
          {person.name}
        </FitText>
        {person.nickname && (
          <FitText
            max={48}
            min={28}
            style={{ height: 70, marginTop: 4, fontFamily: 'var(--head)', fontStyle: 'italic', fontWeight: 400, color: 'var(--red)', whiteSpace: 'nowrap' }}
          >
            – {person.nickname}
          </FitText>
        )}
        <FitText max={32} min={22} style={{ height: 240, marginTop: 30, lineHeight: 1.32 }}>
          {person.bio}
        </FitText>
      </div>

      <div style={{ position: 'absolute', left: 864, top: 712, width: 980 }}>
        <p className="kicker" style={{ fontSize: 26 }}>
          Egenskaber
        </p>
        {/* Chips er målt i em, så FitText kan skalere dem ned, hvis der er mange. */}
        <FitText max={30} min={16} style={{ height: 214, marginTop: 30 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6em 0.87em', paddingBottom: 6, paddingRight: 6 }}>
            {person.traits.map((t, i) => (
              <Chip key={i}>{t}</Chip>
            ))}
          </div>
        </FitText>
      </div>
      <SlideFooter page={page} />
      {overlay}
    </div>
  );
}
