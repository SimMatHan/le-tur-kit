import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deck } from '../deck';
import { useContent } from '../content/ContentContext';
import { expandDeck } from './deckTypes';
import { Scene, Thumb } from './Scene';
import { useDeckNav } from './useDeckNav';
import { StandingsOverlay } from './StandingsOverlay';

type Overlay = null | 'overview' | 'standings' | 'help';

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
};

export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

export function Presenter() {
  const content = useContent();
  const slides = useMemo(() => expandDeck(deck, content), [content]);
  const { index, direction, go, next, prev } = useDeckNav(slides.length);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [chrome, setChrome] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  const slide = slides[index];

  const toggle = useCallback((o: Exclude<Overlay, null>) => setOverlay((cur) => (cur === o ? null : o)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          if (overlay === 'overview') return;
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          if (overlay === 'overview') return;
          e.preventDefault();
          prev();
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(slides.length - 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'o':
        case 'O':
          toggle('overview');
          break;
        case 's':
        case 'S':
          toggle('standings');
          break;
        case '?':
          toggle('help');
          break;
        case 'Escape':
          setOverlay(null);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, toggle, overlay, slides.length]);

  // Knapper vises kun, når musen bevæges – projektoren forbliver ren.
  useEffect(() => {
    const onMove = () => {
      setChrome(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setChrome(false), 2500);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!slide) return null;
  const { Component } = slide;

  return (
    <div className={`presenter ${chrome ? 'show-chrome' : 'hide-cursor'}`}>
      <Scene>
        <div key={slide.key} className={`slide-anim ${direction > 0 ? 'from-right' : 'from-left'}`}>
          <Component page={index + 1} {...slide.props} />
        </div>
        <div className="progress" aria-hidden>
          <div className="progress-fill" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
        </div>
        {overlay === 'standings' && <StandingsOverlay onClose={() => setOverlay(null)} />}
      </Scene>

      <div className="controls" role="toolbar" aria-label="Navigation">
        <CtrlButton label="Forrige (←)" onClick={prev}>
          ‹
        </CtrlButton>
        <span className="controls-count">
          {index + 1} / {slides.length}
        </span>
        <CtrlButton label="Næste (→)" onClick={next}>
          ›
        </CtrlButton>
        <CtrlButton label="Oversigt (O)" onClick={() => toggle('overview')}>
          Oversigt
        </CtrlButton>
        <CtrlButton label="Klassement (S)" onClick={() => toggle('standings')}>
          Stilling
        </CtrlButton>
        <CtrlButton label="Fuldskærm (F)" onClick={toggleFullscreen}>
          ⛶
        </CtrlButton>
        <CtrlButton label="Genveje (?)" onClick={() => toggle('help')}>
          ?
        </CtrlButton>
      </div>

      {overlay === 'overview' && (
        <div className="overview" onClick={() => setOverlay(null)}>
          <div className="overview-grid" onClick={(e) => e.stopPropagation()}>
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={`overview-item ${i === index ? 'current' : ''}`}
                onClick={() => {
                  go(i);
                  setOverlay(null);
                }}
                title={s.title}
              >
                <Thumb width={300}>
                  <s.Component page={i + 1} {...s.props} />
                </Thumb>
                <span className="overview-label">
                  {i + 1}. {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {overlay === 'help' && <HelpOverlay onClose={() => setOverlay(null)} />}
    </div>
  );
}

function CtrlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="ctrl" title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

const keys: [string, string][] = [
  ['← / →, mellemrum', 'Forrige / næste slide'],
  ['F', 'Fuldskærm'],
  ['O', 'Oversigt med miniaturer'],
  ['S', 'Klassement'],
  ['K', 'Kommissærpanel'],
  ['E', 'Redigér rytter (på rytter-slides)'],
  ['Esc', 'Luk overlays'],
];

function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="h-display" style={{ fontSize: 34, marginBottom: 16 }}>
          Genveje
        </h2>
        <table className="help-table">
          <tbody>
            {keys.map(([k, v]) => (
              <tr key={k}>
                <td>
                  <kbd>{k}</kbd>
                </td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
