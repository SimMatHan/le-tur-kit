// Det, publikum ser på scenen: stort stopur, udbrudsforsøget (højere/lavere), bracket, Vinokourov-mirakel
// og Carrot in the Box-duel. Tegnes på 1920×1080-scenen oven på sliden.
import { useContent } from '../content/ContentContext';
import { usePhotoUrl } from '../content/photos';
import { formatTime } from '../game/format';
import { useGame } from '../game/GameContext';
import { ClockFace } from '../components/Stopwatch';
import { CarrotIcon, DiceIcon } from '../components/icons';
import { NumberTag } from '../components/NumberTag';
import { BracketView } from './BracketView';
import { useCommissioner } from './CommissionerContext';
import { PlayingCard } from '../components/PlayingCard';
import { breakawayOf, isCorrect, streakOf } from '../game/highlow';

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
    st?.input.type === 'prolog' ? st.input.times : st?.input.type === 'bjerg' ? st.input.times : {};
  const done = riders
    .filter((r) => typeof times[r.id] === 'number')
    .sort((a, b) => (times[a.id] as number) - (times[b.id] as number));
  return (
    <div className="proj-stopwatch overlay-in">
      <CloseX />
      <p className="kicker c-yellow">{s ? `Etape ${s.n} · ${s.name}` : 'Stopur'}</p>
      <ClockFace size={300} className="c-white" />
      <ol className="proj-splits">
        {done.map((r, i) => (
          <li key={r.id}>
            <span className="num c-yellow">{i + 1}</span> <span>{r.name}</span> <span className="num tabular">{formatTime(times[r.id] as number)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Udbrudsforsøget på skærmen: rytterens kort, udbruddets længde og stillingen. */
function HighLowView() {
  const { game } = useGame();
  const { riders, stages } = useContent();
  const stage = stages.find((s) => s.scoring.type === 'udbrud');
  const st = stage ? game.stages[stage.n] : undefined;
  const input = st?.input.type === 'udbrud' ? st.input : null;
  if (!stage || !input) return null;
  const max = stage.scoring.type === 'udbrud' ? stage.scoring.maxCountedCorrect : 10;
  const active = riders.find((r) => r.id === input.active);
  const run = active ? input.runs[active.id] : undefined;
  const streak = streakOf(run);
  const cards = run?.cards.slice(-6) ?? [];
  const offset = (run?.cards.length ?? 0) - cards.length;
  const verdict = (i: number) => {
    const k = offset + i;
    if (!run || k === 0) return undefined;
    return isCorrect(run.cards[k - 1], run.cards[k], run.guesses[k - 1]) ? 'ok' : 'fail';
  };
  const board = riders
    .map((r) => ({ r, b: breakawayOf(input, r.id) }))
    .filter((x) => x.b !== null)
    .sort((x, y) => (y.b as number) - (x.b as number));

  return (
    <div className="slide bg-ink overlay-in" style={{ zIndex: 20 }}>
      <CloseX />
      <div className="slide-head" style={{ top: 72 }}>
        <p className="kicker c-yellow" style={{ fontSize: 22 }}>
          Etape {stage.n} · Udbrudsforsøget
        </p>
        <h1 className="h-title" style={{ marginTop: 14 }}>
          {active ? active.name : 'Hvem stikker af?'}
        </h1>
      </div>
      {run && (
        <>
          <NumberTag value={streak} label="I TRÆK" color={run.done && streak < max ? 'red' : 'yellow'} size={200} valueSize={110} style={{ position: 'absolute', left: 1180, top: 72 }} />
          <div className="proj-cards">
            {cards.map((c, i) => (
              <div key={offset + i} className="proj-card-wrap">
                {i > 0 && <span className={`proj-guess ${verdict(i)}`}>{run.guesses[offset + i - 1] === 'op' ? '▲' : '▼'}</span>}
                <PlayingCard card={c} width={190} state={verdict(i)} />
              </div>
            ))}
          </div>
          <p className={`proj-highlow-status ${run.done ? (streak >= max ? 'max' : 'out') : ''}`}>
            {!run.done ? 'Højere eller lavere?' : streak >= max ? 'Helt alene foran – maks. udbrud!' : 'Hentet af feltet!'}
          </p>
        </>
      )}
      <div className="proj-board">
        <p className="kicker c-yellow" style={{ fontSize: 18 }}>
          Længste udbrud
        </p>
        <ol>
          {board.map(({ r, b }) => (
            <li key={r.id}>
              <span className="grow">{r.name}</span> <span className="num c-yellow">{b}</span>
            </li>
          ))}
          {!board.length && <li className="muted">Ingen endnu</li>}
        </ol>
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
          <DiceIcon size={110} color="var(--ink)" bg="var(--yellow)" />
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
    <div className="slide bg-ink overlay-in" style={{ zIndex: 20 }}>
      <CloseX />
      <div className="slide-head" style={{ top: 72 }}>
        <h1 className="h-title">Knock-out på Champs-Élysées</h1>
        <p className="lead" style={{ marginTop: 20 }}>
          Carrot in the Box – den der ender med terningen, er ude
        </p>
      </div>
      <div style={{ position: 'absolute', left: 96, top: 300, right: 96, bottom: 80 }}>
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
        <CarrotIcon size={110} color="#f07d00" />
        <p className="kicker c-muted" style={{ fontSize: 24, marginTop: 18 }}>
          Carrot in the Box
        </p>
        <div className="h-display" style={{ fontSize: 110, marginTop: 20 }}>
          {name(a)} <span className="c-muted">mod</span> {name(b)}
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
    case 'highlow':
      return <HighLowView />;
    case 'vinokourov':
      return <VinokourovView />;
    case 'bracket':
      return <BracketScreen />;
    case 'carrot':
      return <CarrotView a={projector.a} b={projector.b} third={projector.third} />;
  }
}
