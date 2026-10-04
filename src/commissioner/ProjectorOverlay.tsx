// Det, publikum ser på scenen: stort stopur, quizkort, bracket, Vinokourov-mirakel
// og Carrot in the Box-duel. Tegnes på 1920×1080-scenen oven på sliden.
import { useContent } from '../content/ContentContext';
import { usePhotoUrl } from '../content/photos';
import { formatTime } from '../game/format';
import { useGame } from '../game/GameContext';
import { ClockFace } from '../components/Stopwatch';
import { CarrotIcon, DiceIcon, MusicIcon } from '../components/icons';
import { Medallion } from '../components/Medallion';
import { BracketView } from './BracketView';
import { useCommissioner } from './CommissionerContext';
import { songNumber } from '../game/quiz';

function CloseX() {
  const { setProjector } = useCommissioner();
  return (
    <button type="button" className="proj-close chrome-only" onClick={() => setProjector(null)} aria-label="Luk (Esc)" title="Luk (Esc)">
      ×
    </button>
  );
}

function StopwatchView({ stage }: { stage: number }) {
  const { game } = useGame();
  const { riders, stages } = useContent();
  const st = game.stages[stage];
  const s = stages.find((x) => x.n === stage);
  const times: Record<string, number | null | undefined> =
    st?.input.type === 'prolog' ? st.input.times : st?.input.type === 'udbrud' ? st.input.dice : st?.input.type === 'bjerg' ? st.input.times : {};
  const done = riders
    .filter((r) => typeof times[r.id] === 'number')
    .sort((a, b) => (times[a.id] as number) - (times[b.id] as number));
  return (
    <div className="proj-stopwatch overlay-in">
      <CloseX />
      <p className="kicker c-yellow">{s ? `Etape ${s.n} · ${s.name}` : 'Stopur'}</p>
      <ClockFace size={240} className="c-paper" />
      <ol className="proj-splits">
        {done.map((r, i) => (
          <li key={r.id}>
            <span className="num c-yellow">{i + 1}.</span> <span>{r.name}</span> <span className="tabular">{formatTime(times[r.id] as number)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuizCardView({ cat, row, reveal }: { cat: number; row: number; reveal: boolean }) {
  const { quiz } = useContent();
  const c = quiz.categories[cat];
  if (!c) return null;
  const counts = quiz.categories.map((x) => x.answers.length);
  return (
    <div className="proj-dim overlay-in">
      <div className="proj-quiz">
        <CloseX />
        <div className="proj-quiz-head">
          <MusicIcon size={80} color="var(--navy)" />
          <div>
            <div className="h-display" style={{ fontSize: 76 }}>
              {c.name}
            </div>
            <div style={{ fontSize: 34, marginTop: 6 }}>{c.prompt}</div>
          </div>
        </div>
        <div className="proj-quiz-body">
          <Medallion value={row + 1} label="FELT" color="red" size={220} valueSize={100} />
          <div>
            <p className="kicker c-red" style={{ fontSize: 28 }}>
              Sang nr. i playlisten
            </p>
            <div className="num" style={{ fontSize: 200, lineHeight: 1 }}>
              {songNumber(counts, cat, row)}
            </div>
          </div>
        </div>
        {reveal && <div className="proj-answer">{c.answers[row]}</div>}
      </div>
    </div>
  );
}

function VinokourovView() {
  const { game } = useGame();
  const { riders, stages } = useContent();
  const champs = stages.find((s) => s.scoring.type === 'champs');
  const st = champs ? game.stages[champs.n] : undefined;
  const input = st?.input.type === 'champs' ? st.input : null;
  const hit = input?.hits.length === 1 ? riders.find((r) => r.id === input.hits[0]) : undefined;
  const photo = usePhotoUrl(hit?.photo);
  return (
    <div className="proj-vino">
      <CloseX />
      <div className="vino-rays" aria-hidden />
      <p className="vino-kicker">Champs-Élysées</p>
      <h1 className="vino-title h-display">Vinokourov-mirakel!</h1>
      <div className="vino-rider">
        {photo && <img src={photo} alt="" />}
        <div>
          <div className="h-display" style={{ fontSize: 96 }}>
            {hit?.name ?? '?'}
          </div>
          <p style={{ fontSize: 36, margin: '10px 0 0' }}>har snydt feltet og kører alene mod mål</p>
        </div>
      </div>
      {typeof input?.vinokourovDice === 'number' && (
        <div className="vino-dice">
          <DiceIcon size={110} color="var(--paper)" bg="var(--red)" />
          <span className="num">−{input.vinokourovDice} sek</span>
        </div>
      )}
    </div>
  );
}

function BracketScreen() {
  const { game } = useGame();
  const { stages } = useContent();
  const champs = stages.find((s) => s.scoring.type === 'champs');
  const st = champs ? game.stages[champs.n] : undefined;
  const input = st?.input.type === 'champs' ? st.input : null;
  return (
    <div className="slide bg-navy overlay-in" style={{ zIndex: 20 }}>
      <CloseX />
      <div className="slide-head" style={{ top: 66 }}>
        <h1 className="h-title c-yellow">Knock-out på Champs-Élysées</h1>
        <p className="lead c-paper" style={{ marginTop: 20 }}>
          Carrot in the Box – den der ender med terningen, er ude
        </p>
      </div>
      <div style={{ position: 'absolute', left: 86, top: 260, right: 86, bottom: 80 }}>
        {input && <BracketView entrants={input.hits} rounds={input.rounds} big />}
      </div>
    </div>
  );
}

function CarrotView({ a, b, third }: { a: string; b: string; third: string | null }) {
  const { riders } = useContent();
  const name = (id: string | null) => riders.find((r) => r.id === id)?.name ?? '?';
  return (
    <div className="proj-dim overlay-in">
      <div className="proj-carrot">
        <CloseX />
        <CarrotIcon size={120} />
        <p className="kicker c-red" style={{ fontSize: 28 }}>
          Carrot in the Box
        </p>
        <div className="h-display" style={{ fontSize: 96 }}>
          {name(a)} <span className="c-red">mod</span> {name(b)}
        </div>
        {third && (
          <p style={{ fontSize: 44, marginTop: 30 }}>
            <strong>{name(third)}</strong> udpeger, hvem der må kigge under sin kop.
          </p>
        )}
      </div>
    </div>
  );
}

export function ProjectorOverlay() {
  const { projector } = useCommissioner();
  if (!projector) return null;
  switch (projector.kind) {
    case 'stopwatch':
      return <StopwatchView stage={projector.stage} />;
    case 'quiz':
      return <QuizCardView cat={projector.cat} row={projector.row} reveal={projector.reveal} />;
    case 'vinokourov':
      return <VinokourovView />;
    case 'bracket':
      return <BracketScreen />;
    case 'carrot':
      return <CarrotView a={projector.a} b={projector.b} third={projector.third} />;
  }
}
