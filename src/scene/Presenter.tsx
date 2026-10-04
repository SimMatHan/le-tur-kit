import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { deck } from '../deck';
import { useContent } from '../content/ContentContext';
import { expandDeck } from './deckTypes';
import { Scene, Thumb } from './Scene';
import { useDeckNav } from './useDeckNav';
import { StandingsOverlay } from './StandingsOverlay';
import { EditorPanel } from '../editor/EditorPanel';
import { SetupPanel } from '../editor/SetupPanel';
import { useCommissioner } from '../commissioner/CommissionerContext';
import { CommissionerPanel } from '../commissioner/CommissionerPanel';
import { ProjectorOverlay } from '../commissioner/ProjectorOverlay';
import { useGame } from '../game/GameContext';
import { REMOTE_COMMAND_EVENT, useRemoteHost, type RemoteCommand } from '../remote/RemoteHost';

type Overlay = null | 'overview' | 'standings' | 'help' | 'setup';

function useSideWidth(max: number) {
  const [w, setW] = useState(() => Math.round(Math.min(max, window.innerWidth * 0.45)));
  useEffect(() => {
    const on = () => setW(Math.round(Math.min(max, window.innerWidth * 0.45)));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [max]);
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
  const editorW = useSideWidth(440);
  const commW = useSideWidth(580);
  const comm = useCommissioner();
  const { undo } = useGame();
  const hideTimer = useRef<number | undefined>(undefined);

  const slide = slides[index];

  // Fjernbetjening: meld aktuel slide til telefonen og modtag dens kommandoer.
  const { reportSlide, status: remoteStatus, peers: remotePeers } = useRemoteHost();
  useEffect(() => {
    if (slide) reportSlide({ index, count: slides.length, title: slide.title, stage: slide.stage }, slides.map((s) => s.title), overlay === 'standings' ? 'standings' : null);
  }, [index, slide, slides, overlay, reportSlide]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<RemoteCommand>).detail;
      if (d.nav === 'next') next();
      else if (d.nav === 'prev') prev();
      else if (typeof d.nav === 'number') go(d.nav);
      if (d.overlay === 'standings') setOverlay('standings');
      else if (d.overlay === null) setOverlay((cur) => (cur === 'standings' ? null : cur));
    };
    window.addEventListener(REMOTE_COMMAND_EVENT, on);
    return () => window.removeEventListener(REMOTE_COMMAND_EVENT, on);
  }, [next, prev, go]);

  const toggle = useCallback((o: Exclude<Overlay, null>) => setOverlay((cur) => (cur === o ? null : o)), []);
  const editTarget = slide?.editTarget;
  const editorOpen = editing && !!editTarget && !comm.open;
  const sideW = comm.open ? commW : editorOpen ? editorW : 0;

  useEffect(() => {
    if (editing && !editTarget && !pendingEdit) setEditing(false);
  }, [editing, editTarget, pendingEdit]);

  // Hop til en rytters slide og åbn redigering (også for en netop tilføjet rytter).
  useEffect(() => {
    if (!pendingEdit) return;
    const i = slides.findIndex((s) => s.editTarget === pendingEdit);
    if (i >= 0) {
      go(i);
      comm.closePanel();
      setEditing(true);
      setOverlay(null);
      setPendingEdit(null);
    }
  }, [pendingEdit, slides, go, comm]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && comm.open) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
          if (editTarget) {
            comm.closePanel();
            setEditing((v) => !v);
          }
          break;
        case 'k':
        case 'K':
          if (comm.open) comm.closePanel();
          else {
            setEditing(false);
            comm.openPanel(slide?.stage);
          }
          break;
        case 'Escape':
          if (comm.projector) comm.setProjector(null);
          else if (overlay) setOverlay(null);
          else if (editing) setEditing(false);
          else comm.closePanel();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, go, toggle, overlay, slides.length, editTarget, editing, comm, undo, slide?.stage]);

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
      className={`presenter ${chrome || sideW ? 'show-chrome' : 'hide-cursor'} ${sideW ? 'editing' : ''}`}
      style={{ ['--editor-w' as string]: `${sideW || editorW}px` }}
    >
      <Scene reserveRight={sideW}>
        <div key={slide.key} className={`slide-anim ${direction > 0 ? 'from-right' : 'from-left'}`}>
          <Component page={index + 1} {...slide.props} />
        </div>
        <div className="progress" aria-hidden>
          <div className="progress-fill" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
        </div>
        <ProjectorOverlay />
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
        <CtrlButton
          label="Kommissærpanel (K)"
          onClick={() => {
            if (comm.open) comm.closePanel();
            else {
              setEditing(false);
              comm.openPanel(slide.stage);
            }
          }}
        >
          Kommissær
        </CtrlButton>
        <CtrlButton label="Opsætning og backup" onClick={() => toggle('setup')}>
          Opsætning
        </CtrlButton>
        {remoteStatus !== 'off' && (
          <span
            className="controls-count"
            title={remoteStatus === 'open' ? `Fjernbetjening: ${remotePeers?.remotes ?? 0} telefon(er) forbundet` : 'Fjernbetjening: ingen forbindelse til relæet'}
          >
            <span className={`dot st-${remoteStatus}`} aria-hidden /> 📱 {remoteStatus === 'open' ? (remotePeers?.remotes ?? 0) : '–'}
          </span>
        )}
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

      {comm.open && <CommissionerPanel />}

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
  ['K', 'Kommissærpanel (åbner på den aktuelle etape)'],
  ['E', 'Redigér rytter/kommissær (på deres slides)'],
  ['Ctrl+Z', 'Fortryd seneste handling i kommissærpanelet'],
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
