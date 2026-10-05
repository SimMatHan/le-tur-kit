import type { ReactNode } from 'react';
import type { Content, Stage } from '../content/types';
import { Card } from './Card';
import { BeerIcon, CarrotIcon, DiceIcon } from './icons';
import { NumberTag } from './NumberTag';
import { PointsCard, type PointsRow } from './PointsCard';
import { SlideFooter } from './SlideFooter';
import { FitText } from './FitText';

const jerseyGenitive = { gul: 'den gule trøje', gron: 'den grønne trøje', prik: 'den prikkede trøje' } as const;

function fmtSec(s: number) {
  const sign = s > 0 ? '+' : s < 0 ? '−' : '+';
  return `${sign}${Math.abs(s)} sek`;
}

/** Pointboksen til højre afhænger af etapens scoringsregler. */
export function stagePointsCard(stage: Stage, content: Content, compact = false) {
  const pts = content.rules.placementPoints;
  const sc = stage.scoring;
  const rows: PointsRow[] = pts.map((p, i) => ({ place: i + 1, main: `${p} point` }));
  let title = `Point til ${jerseyGenitive[sc.placementPointsTo]}`;
  let jerseys = [sc.placementPointsTo];
  if (sc.type === 'sprint') {
    title = 'Point + tidstillæg';
    jerseys = [sc.placementPointsTo, 'gul'];
    rows.forEach((r, i) => (r.extra = fmtSec(sc.placementTimePenaltySec[i] ?? sc.placementTimePenaltySec.at(-1) ?? 0)));
  }
  if (sc.type === 'champs') {
    title = 'Point + bonussekunder';
    jerseys = [sc.placementPointsTo, 'gul'];
    rows.forEach((r, i) => (r.extra = sc.knockoutBonusSec[i] !== undefined ? fmtSec(sc.knockoutBonusSec[i]) : undefined));
  }
  return <PointsCard title={title} jerseys={jerseys} rows={rows} compact={compact} />;
}

function InfoBar({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Card tone="ink" style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '28px 40px', minHeight: 132 }}>
      <span style={{ flex: 'none', display: 'flex' }}>{icon}</span>
      <div style={{ fontSize: 28, lineHeight: 1.35 }}>
        <span className="kicker c-yellow" style={{ fontSize: 20, marginRight: 16 }}>
          {label}
        </span>
        {children}
      </div>
    </Card>
  );
}

/** Ruteside for en etape: trin, pointboks, rekvisitter/OBS og evt. Vinokourov. */
export function StageRoute({ stage, content, page, action }: { stage: Stage; content: Content; page?: number; action?: ReactNode }) {
  const isChamps = stage.scoring.type === 'champs';
  // Mange trin: trinene får hele venstre side, og rekvisitter flytter til højre kolonne.
  const crowded = stage.steps.length > 4 && !isChamps;
  const bar = stage.note ? (
    <InfoBar icon={<CarrotIcon size={64} color="var(--yellow)" />} label="OBS!">
      {stage.note.replace(/^OBS!\s*/, '')}
    </InfoBar>
  ) : (
    <InfoBar icon={isChamps ? <DiceIcon size={60} /> : <BeerIcon size={60} />} label="REKVISITTER">
      {stage.props}
    </InfoBar>
  );
  return (
    <div className="slide bg-light">
      <div className="slide-head">
        <p className="kicker c-muted" style={{ fontSize: 22 }}>
          Etape {stage.n} · Ruten
        </p>
        <h1 className="h-title" style={{ marginTop: 14 }}>
          {stage.name}
        </h1>
      </div>

      <div style={{ position: 'absolute', left: 96, top: 300, width: 1010, height: crowded ? 660 : 470, display: 'flex' }}>
        <FitText max={30} min={20} style={{ width: '100%', height: '100%' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.1em' }}>
            {stage.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 30, alignItems: 'flex-start', lineHeight: 1.38 }}>
                <NumberTag value={i + 1} size={56} style={{ marginTop: -6 }} />
                <span style={{ paddingTop: 4, fontWeight: 500 }}>{s}</span>
              </li>
            ))}
          </ol>
        </FitText>
      </div>

      {!crowded && <div style={{ position: 'absolute', left: 96, top: 800, width: 1010 }}>{bar}</div>}

      <div style={{ position: 'absolute', left: 1180, top: 290, width: 644, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {stagePointsCard(stage, content, isChamps || crowded)}
        {crowded && bar}
        {isChamps && stage.vinokourov && (
          <Card tone="ink" style={{ padding: '26px 36px', display: 'flex', gap: 26, alignItems: 'flex-start' }}>
            <span style={{ flex: 'none' }}>
              <DiceIcon size={56} />
            </span>
            <div>
              <p className="kicker c-yellow" style={{ fontSize: 19 }}>
                Vinokourov-mirakel
              </p>
              <p style={{ fontSize: 26, lineHeight: 1.32, margin: '10px 0 0' }}>{stage.vinokourov}</p>
            </div>
          </Card>
        )}
      </div>
      {action}
      <SlideFooter page={page} />
    </div>
  );
}
