import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  max: number;
  min?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Tekst der krymper, indtil den passer i sin boks (bredde og højde fra style).
 * Sikrer at redigeret tekst aldrig flyder ud på scenen.
 */
export function FitText({ children, max, min = 16, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let s = max;
      el.style.fontSize = s + 'px';
      while (s > min && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) {
        s -= 1;
        el.style.fontSize = s + 'px';
      }
    };
    fit();
    let alive = true;
    document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
    };
  }, [children, max, min]);

  return (
    <div ref={ref} data-fit={min} className={className} style={{ overflow: 'hidden', fontSize: max, ...style }}>
      {children}
    </div>
  );
}
