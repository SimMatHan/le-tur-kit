import { useEffect, useState, type ReactNode } from 'react';

export const SCENE_W = 1920;
export const SCENE_H = 1080;

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return size;
}

/** Fast 1920×1080-lærred, der skaleres til vinduet med letterbox. */
export function Scene({ children }: { children: ReactNode }) {
  const { w, h } = useViewport();
  const scale = Math.min(w / SCENE_W, h / SCENE_H);
  const left = (w - SCENE_W * scale) / 2;
  const top = (h - SCENE_H * scale) / 2;
  return (
    <div className="scene-viewport">
      <div
        className="scene"
        style={{
          width: SCENE_W,
          height: SCENE_H,
          transform: `translate(${left}px, ${top}px) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Statisk miniature af en slide (til oversigten). */
export function Thumb({ width, children }: { width: number; children: ReactNode }) {
  const scale = width / SCENE_W;
  return (
    <div style={{ width, height: SCENE_H * scale, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: SCENE_W, height: SCENE_H, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
}
