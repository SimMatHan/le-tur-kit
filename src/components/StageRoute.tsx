import type { ReactNode } from 'react';
import type { Content, Stage } from '../content/types';
import { HardShadowCard } from './HardShadowCard';
import { BeerIcon, CarrotIcon, DiceIcon } from './icons';
import { Medallion } from './Medallion';
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
    <HardShadowCard tone="navy" border={false} shadow="lg" style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '28px 44px', minHeight: 140 }}>
      <span style={{ flex: 'none', display: 'flex' }}>{icon}</span>
      <div style={{ fontSize: 30, lineHeight: 1.3 }}>
        <span style={{ color: 'var(--yellow)', fontWeight: 700, letterSpacing: '0.06em', marginRight: 18 }}>{label}</span>
        {children}
      </div>
    </HardShadowCard>
  );
}

/** Ruteside for en etape: trin, pointboks, rekvisitter/OBS og evt. Vinokourov. */
export function StageRoute({ stage, content, page, action }: { stage: Stage; content: Content; page?: number; action?: ReactNode }) {
  const isChamps = stage.scoring.type === 'champs';
  // Mange trin: trinene får hele venstre side, og rekvisitter flytter til højre kolonne.
  const crowded = stage.steps.length > 4 && !isChamps;
  const bar = stage.note ? (
    <InfoBar icon={<CarrotIcon size={70} color="var(--yellow)" />} label="OBS!">
      {stage.note.replace(/^OBS!\s*/, '')}
    </InfoBar>
  ) : (
    <InfoBar icon={isChamps ? <DiceIcon size={64} /> : <BeerIcon size={64} />} label="REKVISITTER">
      {stage.props}
    </InfoBar>
  );
  return (
    <div className="slide bg-paper">
      <div className="slide-head">
        <h1 className="h-title">Ruten: {stage.name}</h1>
      </div>
      <Medallion value={stage.n} size={128} valueSize={60} style={{ position: 'absolute', left: 1710, top: 55 }} />

      <div style={{ position: 'absolute', left: 84, top: 248, width: 1050, height: crowded ? 720 : 530, display: 'flex' }}>
        <FitText max={30} min={22} style={{ width: '100%', height: '100%' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: '14px 0 0', display: 'flex', flexDirection: 'column', gap: '1.2em' }}>
            {stage.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 34, alignItems: 'flex-start', lineHeight: 1.32 }}>
                <Medallion value={i + 1} color="navy" size={84} valueSize={38} ringColor="var(--navy)" style={{ marginTop: -14 }} />
                <span style={{ paddingTop: 4 }}>{s}</span>
              </li>
            ))}
          </ol>
        </FitText>
      </div>

      {!crowded && <div style={{ position: 'absolute', left: 84, top: 798, width: 1042 }}>{bar}</div>}

      <div style={{ position: 'absolute', left: 1193, top: 250, width: 642, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {stagePointsCard(stage, content, isChamps || crowded)}
        {crowded && bar}
        {isChamps && stage.vinokourov && (
          <HardShadowCard tone="navy" border={false} shadow="lg" style={{ padding: '28px 40px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            <span style={{ flex: 'none' }}>
              <DiceIcon size={60} />
            </span>
            <div>
              <p className="kicker c-yellow" style={{ fontSize: 22 }}>
                Vinokourov-mirakel
              </p>
              <p style={{ fontSize: 28, lineHeight: 1.3, margin: '12px 0 0' }}>{stage.vinokourov}</p>
            </div>
          </HardShadowCard>
        )}
      </div>
      {action}
      <SlideFooter page={page} />
    </div>
  );
}
