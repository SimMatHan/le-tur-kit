import { useState } from 'react';
import { useContent } from '../content/ContentContext';
import { shuffle } from '../game/bracket';
import { useCommissioner } from './CommissionerContext';

/**
 * Carrot in the Box-hjælper: viser reglerne og vælger tilfældigt "den tredje
 * rytter", der udpeger, hvem af de to duellanter der må kigge under sin kop.
 */
export function CarrotHelper({ a, b, compact = false }: { a: string; b: string; compact?: boolean }) {
  const { riders, carrotInTheBox } = useContent();
  const { setProjector } = useCommissioner();
  const [third, setThird] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(!compact);
  const name = (id: string | null) => riders.find((r) => r.id === id)?.name ?? '?';
  const candidates = riders.filter((r) => r.id !== a && r.id !== b).map((r) => r.id);

  const draw = () => {
    const t = shuffle(candidates)[0] ?? null;
    setThird(t);
    setProjector({ kind: 'carrot', a, b, third: t });
  };

  return (
    <div className="carrot-helper">
      <div className="row wrap">
        <strong>
          {name(a)} mod {name(b)}
        </strong>
        <button type="button" className="btn btn-small" onClick={draw} disabled={!candidates.length}>
          🥕 Vælg tredje rytter
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setProjector({ kind: 'carrot', a, b, third })}>
          Vis på skærm
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setShowRules((v) => !v)}>
          {showRules ? 'Skjul regler' : 'Regler'}
        </button>
      </div>
      {third && (
        <p className="carrot-third">
          <strong>{name(third)}</strong> udpeger, hvem af de to der må kigge under sin kop.
        </p>
      )}
      {showRules && (
        <ol className="carrot-rules">
          {carrotInTheBox.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
