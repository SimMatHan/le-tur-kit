// Ren logik for spiltilstanden: validering af gemte data og fortryd-historik.
import type { Content } from '../content/types';
import { emptyGame, emptyInput, emptyStageState } from './scoring';
import type { GameState, StageState } from './types';
import { RANKS, SUITS } from './highlow';

const CARD_RE = new RegExp(`^(${RANKS.join('|')})[${SUITS.join('')}]$`);
const isCard = (c: string) => CARD_RE.test(c);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const numRec = (v: unknown): Record<string, number | null> => {
  const out: Record<string, number | null> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v)) if (typeof x === 'number' && Number.isFinite(x)) out[k] = x;
  return out;
};

/** Validerer en gemt/importeret spiltilstand. Ukendte eller ødelagte dele erstattes af tomme. */
export function sanitizeGame(raw: unknown, content: Pick<Content, 'stages'>): GameState {
  const g = emptyGame();
  if (!isObj(raw)) return g;
  const stages = isObj(raw.stages) ? raw.stages : {};
  for (const stage of content.stages) {
    const s = stages[stage.n];
    if (!isObj(s) || !isObj(s.input)) continue;
    const type = stage.scoring.type;
    const i = s.input;
    if (i.type !== type) continue;
    const base = emptyStageState(stage);
    const st: StageState = {
      status: s.status === 'running' || s.status === 'finished' ? s.status : 'idle',
      input: emptyInput(type),
      adjust: {},
      tieOrder: strArr(s.tieOrder),
    };
    if (isObj(s.adjust)) {
      for (const [id, a] of Object.entries(s.adjust)) {
        if (!isObj(a)) continue;
        st.adjust[id] = {
          timeSec: typeof a.timeSec === 'number' ? a.timeSec : undefined,
          gron: typeof a.gron === 'number' ? a.gron : undefined,
          prik: typeof a.prik === 'number' ? a.prik : undefined,
          note: typeof a.note === 'string' ? a.note : undefined,
        };
      }
    }
    switch (type) {
      case 'prolog':
        st.input = { type, times: numRec(i.times) };
        break;
      case 'sprint':
        st.input = {
          type,
          order: strArr(i.order),
          carrotGroups: Array.isArray(i.carrotGroups) ? i.carrotGroups.map(strArr) : [],
          bonuses: isObj(i.bonuses) ? Object.fromEntries(Object.entries(i.bonuses).filter(([, v]) => typeof v === 'string')) as Record<string, string> : {},
        };
        break;
      case 'udbrud':
        // Gamle gemte data fra musikquizzen (quiz/dice) har ingen runs og bliver til en tom etape.
        st.input = {
          type,
          runs: isObj(i.runs)
            ? Object.fromEntries(
                Object.entries(i.runs)
                  .filter(([, r]) => isObj(r))
                  .map(([id, r]) => {
                    const run = r as Record<string, unknown>;
                    const cards = strArr(run.cards).filter(isCard);
                    const guesses = (Array.isArray(run.guesses) ? run.guesses : []).filter((g): g is 'op' | 'ned' => g === 'op' || g === 'ned');
                    return [id, { cards, guesses: guesses.slice(0, Math.max(0, cards.length - 1)), done: run.done === true }];
                  })
                  .filter(([, r]) => (r as { cards: string[] }).cards.length > 0),
              )
            : {},
          manual: numRec(i.manual),
          deck: strArr(i.deck).filter(isCard),
          active: typeof i.active === 'string' ? i.active : null,
        };
        break;
      case 'bjerg':
        st.input = { type, hits: strArr(i.hits), dice: numRec(i.dice), times: numRec(i.times) };
        break;
      case 'champs':
        st.input = {
          type,
          hits: strArr(i.hits),
          vinokourovDice: typeof i.vinokourovDice === 'number' ? i.vinokourovDice : null,
          rounds: Array.isArray(i.rounds)
            ? i.rounds.filter(isObj).map((r) => ({
                duels: (Array.isArray(r.duels) ? r.duels : []).filter(isObj).map((d) => ({
                  a: String(d.a),
                  b: typeof d.b === 'string' ? d.b : null,
                  winner: typeof d.winner === 'string' ? d.winner : null,
                })),
              }))
            : [],
        };
        break;
    }
    g.stages[stage.n] = { ...base, ...st };
  }
  if (isObj(raw.classificationTieOrder)) {
    for (const j of ['gul', 'gron', 'prik'] as const) {
      const v = strArr(raw.classificationTieOrder[j]);
      if (v.length) g.classificationTieOrder[j] = v;
    }
  }
  return g;
}

export interface History {
  past: GameState[];
  present: GameState;
}

export const HISTORY_LIMIT = 100;

/** Ny tilstand med den gamle gemt til fortryd. */
export function pushState(h: History, next: GameState): History {
  if (next === h.present) return h;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next };
}

export function undo(h: History): History {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1] };
}
