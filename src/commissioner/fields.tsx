// Små formularfelter til kommissærpanelerne. Værdier gemmes først ved
// Enter/blur, så hver indtastning bliver ét fortryd-trin.
import { useEffect, useState, type KeyboardEvent } from 'react';
import { formatTime, parseTime } from '../game/format';

export function TimeInput({ value, onCommit, label, width = 92 }: { value: number | null | undefined; onCommit: (v: number | null) => void; label: string; width?: number }) {
  const fmt = (v: number | null | undefined) => (typeof v === 'number' ? formatTime(v) : '');
  const [text, setText] = useState(fmt(value));
  const [bad, setBad] = useState(false);
  useEffect(() => {
    setText(fmt(value));
    setBad(false);
  }, [value]);
  const commit = () => {
    if (text.trim() === '') {
      if (value !== null && value !== undefined) onCommit(null);
      return;
    }
    const v = parseTime(text);
    if (v === null) return setBad(true);
    setBad(false);
    if (v !== value) onCommit(v);
  };
  return (
    <input
      className={`time-input ${bad ? 'bad' : ''}`}
      aria-label={label}
      title={bad ? 'Ugyldig tid – skriv fx 12,3 eller 1:05,2' : label}
      value={text}
      placeholder="–"
      inputMode="decimal"
      style={{ width }}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function NumberInput({
  value,
  onCommit,
  label,
  min,
  max,
  width = 70,
  step = 1,
}: {
  value: number | null | undefined;
  onCommit: (v: number | null) => void;
  label: string;
  min?: number;
  max?: number;
  width?: number;
  step?: number;
}) {
  const [text, setText] = useState(value?.toString() ?? '');
  useEffect(() => {
    setText(value?.toString() ?? '');
  }, [value]);
  const commit = () => {
    const t = text.trim().replace(',', '.').replace('−', '-');
    if (t === '') return value !== null && value !== undefined && onCommit(null);
    let v = Number(t);
    if (!Number.isFinite(v)) return setText(value?.toString() ?? '');
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    if (v !== value) onCommit(v);
    else setText(v.toString());
  };
  return (
    <input
      className="num-input"
      aria-label={label}
      title={label}
      value={text}
      placeholder="–"
      inputMode="decimal"
      step={step}
      style={{ width }}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

/** Rækkefølge ved klik: klik på ryttere i den rækkefølge, de skal stå. */
export function OrderPicker({ ids, nameOf, onDone, onCancel, title }: { ids: string[]; nameOf: (id: string) => string; onDone: (order: string[]) => void; onCancel?: () => void; title: string }) {
  const [order, setOrder] = useState<string[]>([]);
  const left = ids.filter((id) => !order.includes(id));
  const pick = (id: string) => {
    const next = [...order, id];
    // Den sidste placeres automatisk.
    if (left.length === 2) onDone([...next, left.find((x) => x !== id)!]);
    else setOrder(next);
  };
  return (
    <div className="order-picker">
      <p className="hint">{title}</p>
      <div className="row wrap">
        {order.map((id, i) => (
          <span key={id} className="pill done">
            {i + 1}. {nameOf(id)}
          </span>
        ))}
        {left.map((id) => (
          <button key={id} type="button" className="btn btn-small" onClick={() => pick(id)}>
            {nameOf(id)}
          </button>
        ))}
        {order.length > 0 && (
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setOrder([])}>
            Start forfra
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn btn-small btn-ghost" onClick={onCancel}>
            Annullér
          </button>
        )}
      </div>
    </div>
  );
}

/** Rytter-knapper der kan slås til/fra (fx "ramte beerpong", "svarede rigtigt"). */
export function RiderToggles({ riders, selected, onToggle, disabled }: { riders: { id: string; name: string; number: number }[]; selected: string[]; onToggle: (id: string) => void; disabled?: boolean }) {
  return (
    <div className="toggle-grid">
      {riders.map((r) => {
        const on = selected.includes(r.id);
        return (
          <button key={r.id} type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} disabled={disabled} onClick={() => onToggle(r.id)}>
            <span className="split-no">{r.number}</span>
            <span className="split-name">{r.name}</span>
            <span aria-hidden>{on ? '✓' : ''}</span>
          </button>
        );
      })}
    </div>
  );
}
