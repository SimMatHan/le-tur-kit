import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deck } from '../deck';
import { useContent } from '../content/ContentContext';
import { expandDeck } from './deckTypes';
import { Scene, Thumb } from './Scene';
import { useDeckNav } from './useDeckNav';
import { StandingsOverlay } from './StandingsOverlay';
import { EditorPanel } from '../editor/EditorPanel';
import { SetupPanel } from '../editor/SetupPanel';

type Overlay = null | 'overview' | 'standings' | 'help' | 'setup';

function useEditorWidth() {
  const [w, setW] = useState(() => Math.round(Math.min(440, window.innerWidth * 0.42)));
  useEffect(() => {
    const on = () => setW(Math.round(Math.min(440, window.innerWidth * 0.42)));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

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
  const [editing, setEditing] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<string | null>(null);
  const editorW = useEditorWidth();
  const hideTimer = useRef<number | undefined>(undefined);

  const slide = slides[index];

  const toggle = useCallback((o: Exclude<Overlay, null>) => setOverlay((cur) => (cur === o ? null : o)), []);
  const editTarget = slide?.editTarget;
  const editorOpen = editing && !!editTarget;

  useEffect(() => {
    if (editing && !editTarget && !pendingEdit) setEditing(false);
  }, [editing, editTarget, pendingEdit]);

  // Hop til en rytters slide og åbn redigering (også for en netop tilføjet rytter).
  useEffect(() => {
    if (!pendingEdit) return;
    const i = slides.findIndex((s) => s.editTarget === pendingEdit);
    if (i >= 0) {
      go(i);
      setEditing(true);
      setOverlay(null);
      setPendingEdit(null);
    }
  }, [pendingEdit, slides, go]);

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
        case 'e':
        case 'E':
          if (editTarget) setEditing((v) => !v);
          break;
        case 'Escape':
          if (overlay) setOverlay(null);
          else setEditing(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, toggle, overlay, slides.length, editTarget]);

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
    <div
      className={`presenter ${chrome || editorOpen ? 'show-chrome' : 'hide-cursor'} ${editorOpen ? 'editing' : ''}`}
      style={{ ['--editor-w' as string]: `${editorW}px` }}
    >
      <Scene reserveRight={editorOpen ? editorW : 0}>
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
        {editTarget && (
          <CtrlButton label="Redigér (E)" onClick={() => setEditing((v) => !v)}>
            Redigér
          </CtrlButton>
        )}
        <CtrlButton label="Opsætning og backup" onClick={() => toggle('setup')}>
          Opsætning
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

      {editorOpen && editTarget && (
        <EditorPanel
          target={editTarget}
          onClose={() => setEditing(false)}
          onAdded={(id) => setPendingEdit(id)}
          onOpenSetup={() => setOverlay('setup')}
        />
      )}

      {overlay === 'setup' && <SetupPanel onClose={() => setOverlay(null)} onEditRider={(id) => setPendingEdit(id)} />}
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
  ['E', 'Redigér rytter/kommissær (på deres slides)'],
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
