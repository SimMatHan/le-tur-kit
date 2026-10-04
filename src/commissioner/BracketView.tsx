import { useContent } from '../content/ContentContext';
import { bracketStatus } from '../game/bracket';
import type { Round } from '../game/types';
import { CarrotHelper } from './CarrotHelper';
import { useState } from 'react';

interface Props {
  entrants: string[];
  rounds: Round[];
  /** Kun i kommissærpanelet: klik på vinderen af en duel. */
  onWinner?: (round: number, duel: number, winner: string | null) => void;
  big?: boolean;
}

export function roundName(i: number, total: number): string {
  if (i === total - 1) return 'Finale';
  if (i === total - 2) return 'Semifinale';
  return `Runde ${i + 1}`;
}

/** Knock-out-bracket: runder som kolonner, dueller som kort. */
export function BracketView({ entrants, rounds, onWinner, big = false }: Props) {
  const { riders } = useContent();
  const name = (id: string | null) => riders.find((r) => r.id === id)?.name ?? '?';
  const status = bracketStatus(entrants, rounds);
  const [helper, setHelper] = useState<string | null>(null);
  // Forventet antal runder (til navngivning): ceil(log2(n))
  const expected = Math.max(rounds.length, Math.ceil(Math.log2(Math.max(2, entrants.length))));

  return (
    <div className={`bracket ${big ? 'big' : ''}`}>
      {rounds.map((r, ri) => (
        <div key={ri} className="bracket-round">
          <div className="bracket-title">{roundName(ri, expected)}</div>
          {r.duels.map((d, di) => (
            <div key={di} className="duel">
              {[d.a, d.b].map((p, k) =>
                p === null ? (
                  <div key={k} className="duelist walkover">
                    walkover
                  </div>
                ) : onWinner && d.b !== null ? (
                  <button
                    key={k}
                    type="button"
                    className={`duelist ${d.winner === p ? 'win' : d.winner ? 'lose' : ''}`}
                    onClick={() => onWinner(ri, di, d.winner === p ? null : p)}
                    title="Klik på vinderen"
                  >
                    {name(p)}
                  </button>
                ) : (
                  <div key={k} className={`duelist ${d.winner === p ? 'win' : d.winner ? 'lose' : ''}`}>
                    {name(p)}
                  </div>
                ),
              )}
              {onWinner && d.b !== null && !d.winner && (
                <button type="button" className="link-btn" onClick={() => setHelper(helper === `${ri}-${di}` ? null : `${ri}-${di}`)}>
                  🥕 Carrot-hjælper
                </button>
              )}
              {helper === `${ri}-${di}` && d.b !== null && <CarrotHelper a={d.a} b={d.b} compact />}
            </div>
          ))}
        </div>
      ))}
      {status.champion && (
        <div className="bracket-round">
          <div className="bracket-title">Vinder</div>
          <div className="duel champion">
            <div className="duelist win">🏆 {name(status.champion)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
