import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  max: number;
  min?: number;
  className?: string;
  style?: CSSProperties;
  /** Bundjustér teksten i boksen (fx et navn lige over kælenavnet). */
  bottom?: boolean;
}

/**
 * Tekst der krymper, indtil den passer i sin boks (bredde og højde fra style).
 * Sikrer at redigeret tekst aldrig flyder ud på scenen.
 */
export function FitText({ children, max, min = 16, className, style, bottom = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let s = max;
      el.style.fontSize = s + 'px';
      // Bundjusteret indhold flyder ud foroven, hvor scrollHeight ikke ser det – mål det indre.
      const innerTooTall = () => {
        if (!inner.current) return false;
        const cs = getComputedStyle(el);
        return inner.current.offsetHeight > el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + 1;
      };
      const tooBig = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1 || innerTooTall();
      while (s > min && tooBig()) {
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
    <div
      ref={ref}
      data-fit={min}
      className={className}
      style={{ overflow: 'hidden', fontSize: max, ...(bottom ? { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } : null), ...style }}
    >
      {bottom ? <div ref={inner}>{children}</div> : children}
    </div>
  );
}
