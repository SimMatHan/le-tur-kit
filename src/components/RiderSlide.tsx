import type { ReactNode } from 'react';
import type { JerseyId, Person } from '../content/types';
import { JerseyRow } from './JerseyBadge';
import { FitText } from './FitText';
import { PhotoFrame } from './PhotoFrame';
import { SlideFooter } from './SlideFooter';

interface Props {
  person: Person;
  kicker: string;
  /** Lille tekst på rygnummeret (fx "NR.", "TOUR"). */
  bibLabel: string;
  bibValue: ReactNode;
  /** Gult rygnummer (kommissæren) i stedet for hvidt. */
  bibYellow?: boolean;
  page?: number;
  /** Ekstra lag, fx redigeringsknapper. */
  overlay?: ReactNode;
  /** Trøjer, rytteren fører lige nu. */
  leads?: JerseyId[];
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '2.4em',
        padding: '0 1.1em',
        borderRadius: '1.2em',
        background: 'var(--white)',
        boxShadow: 'inset 0 0 0 2px var(--ink)',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** Rygnummer som på en rigtig Tour-trøje: hvid lap med sort tal. */
function Bib({ label, value, yellow }: { label: string; value: ReactNode; yellow?: boolean }) {
  const len = String(value).length;
  return (
    <div
      style={{
        position: 'absolute',
        left: 560,
        top: 760,
        width: 240,
        height: 170,
        borderRadius: 18,
        background: yellow ? 'var(--yellow)' : 'var(--white)',
        boxShadow: '0 12px 30px rgba(17,18,21,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0.9,
      }}
    >
      <span className="kicker" style={{ fontSize: 18, letterSpacing: '0.24em', paddingLeft: '0.24em', color: yellow ? 'var(--ink)' : 'var(--muted)' }}>
        {label}
      </span>
      <span className="num" style={{ fontSize: len >= 3 ? 96 : 116, fontWeight: 800, marginTop: 4 }}>
        {value}
      </span>
    </div>
  );
}

/** Præsentation af en rytter (eller kommissæren): foto, rygnummer, navn, kælenavn, bio og egenskaber. */
export function RiderSlide({ person, kicker, bibLabel, bibValue, bibYellow, page, overlay, leads = [] }: Props) {
  return (
    <div className="slide bg-light">
      <PhotoFrame photo={person.photo} alt={person.name} style={{ left: 96, top: 96, width: 640, height: 820 }} />
      <Bib label={bibLabel} value={bibValue} yellow={bibYellow} />

      <div style={{ position: 'absolute', left: 880, top: 96, width: 944 }}>
        <div style={{ width: 76, height: 10, background: 'var(--yellow)' }} />
        <p className="kicker c-muted" style={{ fontSize: 22, display: 'flex', alignItems: 'center', gap: 20, height: 44, marginTop: 26 }}>
          {kicker}
          {leads.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--ink)' }}>
              · Fører <JerseyRow jerseys={leads} size={42} gap={4} />
            </span>
          )}
        </p>
        <FitText bottom max={124} min={48} className="h-display" style={{ height: 200, marginTop: 10, lineHeight: 0.92, paddingBottom: '0.14em' }}>
          {person.name}
        </FitText>
        {person.nickname && (
          <FitText max={44} min={26} style={{ height: 64, marginTop: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <span className="marker">{person.nickname}</span>
          </FitText>
        )}
        <FitText max={32} min={20} style={{ height: 200, marginTop: 30, lineHeight: 1.4, color: 'var(--ink-3)' }}>
          {person.bio}
        </FitText>
      </div>

      <div style={{ position: 'absolute', left: 880, top: 730, width: 960 }}>
        <p className="kicker c-muted" style={{ fontSize: 20 }}>
          Egenskaber
        </p>
        {/* Chips er målt i em, så FitText kan skalere dem ned, hvis der er mange. */}
        <FitText max={30} min={16} style={{ height: 196, marginTop: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55em 0.6em', paddingBottom: 4, paddingRight: 4 }}>
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
