// Fælles stopur til etape 1, 3 og 4: start, og klik på rytterens navn, når han
// er færdig. Tiden registreres pr. rytter. Kan også startes af første klik
// (terningkast: den første 6'er får 0 sek.).
import { useEffect, useState } from 'react';
import { useCommissioner } from '../commissioner/CommissionerContext';
import { formatTime } from '../game/format';
import type { Rider } from '../content/types';

/** Løbende ur (opdateres ~10 gange i sekundet). */
export function useClockTime(): number {
  const { clock, elapsed } = useCommissioner();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!clock.startedAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => window.clearInterval(id);
  }, [clock.startedAt]);
  return elapsed();
}

export function ClockFace({ size = 64, className }: { size?: number; className?: string }) {
  const t = useClockTime();
  return (
    <span className={`clock-face num ${className ?? ''}`} style={{ fontSize: size }}>
      {formatTime(t)}
    </span>
  );
}

interface Props {
  riders: Rider[];
  times: Record<string, number | null | undefined>;
  onSplit: (riderId: string, sec: number) => void;
  onClear: (riderId: string) => void;
  /** Første klik på en rytter starter uret og giver 0 sek. */
  startOnFirstSplit?: boolean;
  /** Ryttere, der ikke skal kunne klikkes (fx endnu ikke relevante). */
  disabled?: Set<string>;
  label?: string;
  onShowOnProjector?: () => void;
}

export function Stopwatch({ riders, times, onSplit, onClear, startOnFirstSplit, disabled, label, onShowOnProjector }: Props) {
  const { clock, startClock, stopClock, resetClock, elapsed } = useCommissioner();
  const running = !!clock.startedAt;
  const anyTime = riders.some((r) => typeof times[r.id] === 'number');

  const split = (id: string) => {
    if (!running) {
      if (startOnFirstSplit && !anyTime && clock.stoppedMs === 0) {
        startClock();
        onSplit(id, 0);
      }
      return;
    }
    onSplit(id, elapsed());
    // Stop automatisk, når alle er i mål.
    const left = riders.filter((r) => r.id !== id && typeof times[r.id] !== 'number' && !disabled?.has(r.id));
    if (left.length === 0) stopClock();
  };

  return (
    <div className="stopwatch">
      <div className="stopwatch-head">
        <ClockFace size={56} />
        <div className="row wrap">
          {running ? (
            <button type="button" className="btn" onClick={stopClock}>
              Stop
            </button>
          ) : (
            <button type="button" className="btn btn-go" onClick={startClock} disabled={startOnFirstSplit && !anyTime && clock.stoppedMs === 0}>
              {clock.stoppedMs ? 'Fortsæt' : 'Start'}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={resetClock} disabled={running}>
            Nulstil ur
          </button>
          {onShowOnProjector && (
            <button type="button" className="btn btn-ghost" onClick={onShowOnProjector}>
              Vis på skærm
            </button>
          )}
        </div>
      </div>
      <p className="hint">
        {label ??
          (startOnFirstSplit && !running && !anyTime
            ? 'Klik på den første, der slår en 6’er – uret starter, og han får 0 sek.'
            : running
              ? 'Klik på rytterens navn, når han er færdig.'
              : 'Start uret, og klik på rytterens navn, når han er færdig.')}
      </p>
      <div className="split-grid">
        {riders.map((r) => {
          const t = times[r.id];
          const has = typeof t === 'number';
          return (
            <div key={r.id} className={`split ${has ? 'done' : ''}`}>
              <button
                type="button"
                className="split-btn"
                disabled={has || disabled?.has(r.id) || (!running && !(startOnFirstSplit && !anyTime && clock.stoppedMs === 0))}
                onClick={() => split(r.id)}
              >
                <span className="split-no">{r.number}</span>
                <span className="split-name">{r.name}</span>
                <span className="split-time">{has ? formatTime(t!) : '–'}</span>
              </button>
              {has && (
                <button type="button" className="split-clear" title="Fjern tid" aria-label={`Fjern tid for ${r.name}`} onClick={() => onClear(r.id)}>
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
