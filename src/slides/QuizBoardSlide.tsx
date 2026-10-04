import { useContent } from '../content/ContentContext';
import { MusicIcon, PlayIcon } from '../components/icons';
import type { SlideProps } from './types';
import { useCommissioner } from '../commissioner/CommissionerContext';
import { useGame } from '../game/GameContext';

interface BoardProps {
  /** Brugte felter som "kategori-række", fx "0-2". */
  used?: Set<string>;
  onCell?: (cat: number, row: number) => void;
}

export function QuizBoard({ used, onCell }: BoardProps) {
  const { quiz } = useContent();
  const cats = quiz.categories;
  const rows = Math.max(...cats.map((c) => c.answers.length), 1);
  const colW = (1754 - (cats.length - 1) * 26) / cats.length;
  return (
    <div style={{ position: 'absolute', left: 85, top: 280, width: 1754, display: 'flex', gap: 26 }}>
      {cats.map((c, ci) => (
        <div key={ci} style={{ width: colW, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: 'var(--yellow)',
              color: 'var(--navy)',
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 14px',
              marginBottom: 6,
            }}
          >
            <span className="h-display" style={{ fontSize: 38, whiteSpace: 'nowrap' }}>
              {c.name}
            </span>
            <span style={{ fontSize: 22, lineHeight: 1.2, marginTop: 6 }}>{c.prompt}</span>
          </div>
          {Array.from({ length: rows }, (_, ri) => {
            const key = `${ci}-${ri}`;
            const isUsed = used?.has(key);
            return (
              <button
                key={ri}
                type="button"
                disabled={!onCell}
                onClick={() => onCell?.(ci, ri)}
                style={{
                  height: 84,
                  background: isUsed ? 'transparent' : 'var(--navy2)',
                  border: '2px solid var(--paper)',
                  opacity: isUsed ? 0.35 : 1,
                  cursor: onCell ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <span className="num c-yellow" style={{ fontSize: 54, textDecoration: isUsed ? 'line-through' : undefined }}>
                  {ri + 1}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function QuizBoardSlide(_: SlideProps) {
  const { quiz, meta, stages } = useContent();
  const { game } = useGame();
  const { openPanel, setProjector } = useCommissioner();
  const quizStage = stages.find((s) => s.scoring.type === 'udbrud');
  const st = quizStage ? game.stages[quizStage.n] : undefined;
  const used = new Set(st?.input.type === 'udbrud' ? Object.keys(st.input.quiz) : []);
  const onCell = (cat: number, row: number) => {
    if (quizStage) openPanel(quizStage.n);
    setProjector({ kind: 'quiz', cat, row, reveal: false });
  };
  return (
    <div className="slide bg-navy">
      <div className="slide-head" style={{ top: 66 }}>
        <h1 className="h-title c-yellow">Musikquizzen</h1>
        <p className="lead c-paper" style={{ marginTop: 26 }}>
          {quiz.orderNote}
        </p>
      </div>
      <div style={{ position: 'absolute', right: 86, top: 62 }}>
        <MusicIcon size={120} />
      </div>
      <QuizBoard used={used} onCell={onCell} />
      <a
        href={meta.playlistUrl}
        target="_blank"
        rel="noreferrer"
        style={{ position: 'absolute', left: 86, top: 978, display: 'flex', alignItems: 'center', gap: 18, color: 'var(--yellow)', fontWeight: 700, fontSize: 32 }}
      >
        <PlayIcon size={38} />
        Åbn playlisten på Spotify
      </a>
    </div>
  );
}
