import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/** QR-kode tegnet som SVG (virker offline). */
export function QrCode({ text, size = 220 }: { text: string; size?: number }) {
  const { n, d } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { n, d };
  }, [text]);
  const q = 4; // stille zone
  return (
    <svg viewBox={`0 0 ${n + q * 2} ${n + q * 2}`} width={size} height={size} role="img" aria-label="QR-kode til fjernbetjening" shapeRendering="crispEdges">
      <rect width={n + q * 2} height={n + q * 2} fill="#fff" />
      <path d={d} fill="#1D2340" transform={`translate(${q} ${q})`} />
    </svg>
  );
}
