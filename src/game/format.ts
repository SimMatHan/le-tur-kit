// Formatering af tider (sekunder med tiendedele) på dansk.

export function roundTenth(sec: number): number {
  return Math.round(sec * 10) / 10;
}

/** 83.4 → "1:23,4"; 9.0 → "9,0" */
export function formatTime(sec: number): string {
  const neg = sec < 0;
  const t = Math.abs(roundTenth(sec));
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  const sStr = s.toFixed(1).replace('.', ',');
  const body = m > 0 ? `${m}:${s < 10 ? '0' : ''}${sStr}` : sStr;
  return (neg ? '−' : '') + body;
}

/** Tidsforskel til føreren: "+0:12,3" / "+4,0" */
export function formatGap(sec: number): string {
  return '+' + formatTime(Math.max(0, sec));
}

/** Parser "1:23,4", "83.4", "83,4" → sekunder. Returnerer null ved ugyldigt input. */
export function parseTime(input: string): number | null {
  const s = input.trim().replace(',', '.').replace('−', '-');
  if (!s) return null;
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const parts = body.split(':');
  if (parts.length > 2) return null;
  let total = 0;
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const sec = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(sec) || sec >= 60) return null;
    total = m * 60 + sec;
  } else {
    total = Number(parts[0]);
    if (!Number.isFinite(total)) return null;
  }
  return roundTenth(neg ? -total : total);
}
