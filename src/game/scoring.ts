// Scoringsmotoren: rene funktioner uden React. Alle regler (pointskala,
// tidstillæg, bonusser, quizværdier, bonussekunder, tiebreak) læses fra
// content.json – intet er hardcodet her.
import type { Content, JerseyId, Rider, Rules, Stage, StageScoring } from '../content/types';
import { bracketStatus } from './bracket';
import type {
  BjergInput,
  ChampsInput,
  GameState,
  PrologInput,
  RiderId,
  SprintInput,
  StageInput,
  StageResult,
  StageRiderResult,
  StageState,
  UdbrudInput,
} from './types';

// ---------- Hjælpere ----------

/** Tider regnes i hele tiendedele for at undgå afrundingsfejl. */
export const toTenths = (sec: number) => Math.round(sec * 10);
export const fromTenths = (t: number) => t / 10;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function pointsForPlace(place: number | null, rules: Rules): number {
  if (place === null || place < 1) return 0;
  return rules.placementPoints[place - 1] ?? rules.pointsBeyondScale;
}

export interface Ranked {
  place: number;
  tiedWith: RiderId[];
}

/**
 * Placeringer ud fra en nøgle (fx tid). Lige nøgler giver delt placering
 * (1, 1, 3 …), medmindre kommissæren har afgjort rækkefølgen i tieOrder.
 */
export function rankBy(entries: { id: RiderId; key: number }[], dir: 'asc' | 'desc', tieOrder: RiderId[] = []): Map<RiderId, Ranked> {
  const sign = dir === 'asc' ? 1 : -1;
  const sorted = [...entries].sort((x, y) => sign * (x.key - y.key));
  const out = new Map<RiderId, Ranked>();
  let pos = 1;
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j < sorted.length && sorted[j].key === sorted[i].key) j++;
    const group = sorted.slice(i, j).map((e) => e.id);
    if (group.length === 1) out.set(group[0], { place: pos, tiedWith: [] });
    else {
      const known = group.filter((id) => tieOrder.includes(id)).sort((a, b) => tieOrder.indexOf(a) - tieOrder.indexOf(b));
      const unknown = group.filter((id) => !tieOrder.includes(id));
      if (unknown.length <= 1) {
        // Afgjort: rækkefølgen i tieOrder, en evt. enkelt uafklaret rytter til sidst.
        [...known, ...unknown].forEach((id, k) => out.set(id, { place: pos + k, tiedWith: [] }));
      } else {
        group.forEach((id) => out.set(id, { place: pos, tiedWith: group.filter((x) => x !== id) }));
      }
    }
    pos += group.length;
    i = j;
  }
  return out;
}

function emptyRow(riderId: RiderId): StageRiderResult {
  return { riderId, place: null, timeSec: 0, gron: 0, prik: 0, tiedWith: [], missing: true, notes: [] };
}

function addPoints(row: StageRiderResult, jersey: JerseyId, pts: number) {
  if (jersey === 'gron') row.gron += pts;
  else if (jersey === 'prik') row.prik += pts;
}

const fmt = (t10: number) => `${t10 < 0 ? '−' : '+'}${(Math.abs(t10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '')} sek`;

/** Placer ryttere efter etapetid (tiendedele), giv placeringspoint og sæt tid til gul. */
function placeByTime(rows: Map<RiderId, StageRiderResult>, timesT10: Map<RiderId, number>, scoring: StageScoring, rules: Rules, tieOrder: RiderId[]) {
  const ranked = rankBy([...timesT10].map(([id, key]) => ({ id, key })), 'asc', tieOrder);
  for (const [id, t] of timesT10) {
    const row = rows.get(id)!;
    const r = ranked.get(id)!;
    row.place = r.place;
    row.tiedWith = r.tiedWith;
    row.missing = false;
    row.timeSec = fromTenths(t);
    addPoints(row, scoring.placementPointsTo, pointsForPlace(r.place, rules));
  }
}

// ---------- Etaper ----------

function scoreProlog(input: PrologInput, ids: RiderId[], stage: Stage, rules: Rules, tieOrder: RiderId[], rows: Map<RiderId, StageRiderResult>) {
  const t = new Map<RiderId, number>();
  for (const id of ids) if (isNum(input.times[id])) t.set(id, toTenths(input.times[id]!));
  placeByTime(rows, t, stage.scoring, rules, tieOrder);
  const sc = stage.scoring;
  if (sc.type === 'prolog' && !sc.timeToGul) rows.forEach((r) => (r.timeSec = 0));
}

function scoreSprint(input: SprintInput, ids: RiderId[], stage: Stage, rules: Rules, rows: Map<RiderId, StageRiderResult>) {
  const sc = stage.scoring;
  if (sc.type !== 'sprint') return;
  const order = input.order.filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
  order.forEach((id, i) => {
    const row = rows.get(id)!;
    const place = i + 1;
    row.place = place;
    row.missing = false;
    addPoints(row, sc.placementPointsTo, pointsForPlace(place, rules));
    const pen = sc.placementTimePenaltySec[i] ?? (sc.timePenaltyBeyondScale === 'repeatLast' ? (sc.placementTimePenaltySec.at(-1) ?? 0) : 0);
    row.timeSec = pen;
    if (pen) row.notes.push(`${fmt(toTenths(pen))} tidstillæg`);
  });
  for (const b of sc.bonuses) {
    const who = input.bonuses[b.id];
    if (who && rows.has(who)) {
      addPoints(rows.get(who)!, b.jersey, b.points);
      rows.get(who)!.notes.push(`+${b.points} ${b.jersey === 'prik' ? 'bjergpoint' : 'point'}: ${b.label}`);
    }
  }
  for (const g of input.carrotGroups) {
    for (const id of g) if (rows.has(id)) rows.get(id)!.notes.push('Afgjort med Carrot in the Box');
  }
}

/** Quizresultat pr. rytter: antal rigtige, bjergpoint, point og sekunder. */
export function quizTotals(input: UdbrudInput, stage: Stage) {
  const sc = stage.scoring;
  const out = new Map<RiderId, { correct: number; prik: number; gron: number; t10: number }>();
  if (sc.type !== 'udbrud') return out;
  for (const [cell, riders] of Object.entries(input.quiz)) {
    const row = Number(cell.split('-')[1]);
    if (!Number.isInteger(row)) continue;
    for (const id of new Set(riders)) {
      const cur = out.get(id) ?? { correct: 0, prik: 0, gron: 0, t10: 0 };
      cur.correct++;
      cur.prik += sc.quizRowBjergpoint[row] ?? 0;
      cur.gron += sc.quizRowPoint[row] ?? 0;
      cur.t10 += toTenths(sc.quizCorrectAnswerSec);
      out.set(id, cur);
    }
  }
  return out;
}

function scoreUdbrud(input: UdbrudInput, ids: RiderId[], stage: Stage, rules: Rules, tieOrder: RiderId[], rows: Map<RiderId, StageRiderResult>) {
  const quiz = quizTotals(input, stage);
  const t = new Map<RiderId, number>();
  for (const id of ids) {
    const q = quiz.get(id);
    if (q && rows.has(id)) {
      const row = rows.get(id)!;
      row.gron += q.gron;
      row.prik += q.prik;
      row.notes.push(`Quiz: ${q.correct} rigtige (${fmt(q.t10)}, +${q.gron} point, +${q.prik} bjergpoint)`);
    }
    if (isNum(input.dice[id])) t.set(id, toTenths(input.dice[id]!) + (q?.t10 ?? 0));
  }
  placeByTime(rows, t, stage.scoring, rules, tieOrder);
}

function scoreBjerg(input: BjergInput, ids: RiderId[], stage: Stage, rules: Rules, tieOrder: RiderId[], rows: Map<RiderId, StageRiderResult>) {
  const sc = stage.scoring;
  const subtract = sc.type === 'bjerg' && sc.breakawayDiceSubtractSec;
  const t = new Map<RiderId, number>();
  let missingDice = false;
  for (const id of ids) {
    if (!isNum(input.times[id])) continue;
    let t10 = toTenths(input.times[id]!);
    if (input.hits.includes(id)) {
      const d = input.dice[id];
      if (!isNum(d)) missingDice = true;
      else if (subtract) {
        t10 -= toTenths(d);
        rows.get(id)!.notes.push(`Udbryder: ${fmt(-toTenths(d))} forspring`);
      }
    }
    t.set(id, t10);
  }
  placeByTime(rows, t, stage.scoring, rules, tieOrder);
  if (missingDice) for (const id of input.hits) if (rows.has(id) && !isNum(input.dice[id])) rows.get(id)!.missing = true;
}

function scoreChamps(input: ChampsInput, ids: RiderId[], stage: Stage, rules: Rules, rows: Map<RiderId, StageRiderResult>, info: string[]): boolean {
  const sc = stage.scoring;
  if (sc.type !== 'champs') return false;
  const hits = input.hits.filter((id) => ids.includes(id));
  // Ryttere, der missede, placeres ikke – men de mangler heller ikke data.
  for (const id of ids) if (!hits.includes(id)) rows.get(id)!.missing = false;
  if (hits.length === 0) {
    info.push('Ingen ramte – alle skyder igen');
    return false;
  }
  if (hits.length === 1) {
    const id = hits[0];
    const row = rows.get(id)!;
    info.push('Vinokourov-mirakel');
    row.place = 1;
    addPoints(row, sc.placementPointsTo, pointsForPlace(1, rules));
    if (!isNum(input.vinokourovDice)) {
      row.missing = true;
      return false;
    }
    row.missing = false;
    if (sc.vinokourovDiceSubtractSec) row.timeSec = -input.vinokourovDice;
    row.notes.push(`Vinokourov-mirakel: ${fmt(-toTenths(input.vinokourovDice))}`);
    return true;
  }
  const status = bracketStatus(hits, input.rounds);
  if (!status.champion) {
    for (const id of hits) rows.get(id)!.missing = true;
    info.push('Knock-out i gang');
    return false;
  }
  // Finalen er den runde, hvor den sidste rytter blev slået ud.
  const finalIdx = Math.max(...Object.values(status.eliminatedIn));
  for (const id of hits) {
    const row = rows.get(id)!;
    const place = status.places[id];
    row.missing = false;
    row.place = place;
    addPoints(row, sc.placementPointsTo, pointsForPlace(place, rules));
    // Bonussekunder: vinder, finaletaber, tabere i runden før finalen.
    const elim = status.eliminatedIn[id];
    const tier = id === status.champion ? 0 : elim === finalIdx ? 1 : elim === finalIdx - 1 ? 2 : -1;
    const bonus = tier >= 0 ? (sc.knockoutBonusSec[tier] ?? 0) : 0;
    row.timeSec = bonus;
    if (bonus) row.notes.push(`${fmt(toTenths(bonus))} bonussekunder`);
  }
  return true;
}

// ---------- Etape og klassement ----------

export function emptyInput(type: StageInput['type']): StageInput {
  switch (type) {
    case 'prolog':
      return { type, times: {} };
    case 'sprint':
      return { type, order: [], carrotGroups: [], bonuses: {} };
    case 'udbrud':
      return { type, quiz: {}, dice: {} };
    case 'bjerg':
      return { type, hits: [], dice: {}, times: {} };
    case 'champs':
      return { type, hits: [], vinokourovDice: null, rounds: [] };
  }
}

export function emptyStageState(stage: Stage): StageState {
  return { status: 'idle', input: emptyInput(stage.scoring.type), adjust: {}, tieOrder: [] };
}

export function emptyGame(): GameState {
  return { version: 1, stages: {}, classificationTieOrder: {} };
}

/** Beregn én etapes resultat ud fra rå input og manuelle rettelser. */
export function computeStage(stage: Stage, state: StageState | undefined, riders: Rider[], rules: Rules): StageResult {
  const ids = riders.map((r) => r.id);
  const st = state ?? emptyStageState(stage);
  const rows = new Map(ids.map((id) => [id, emptyRow(id)]));
  const info: string[] = [];
  const input = st.input.type === stage.scoring.type ? st.input : emptyInput(stage.scoring.type);
  let champsDone = true;

  switch (input.type) {
    case 'prolog':
      scoreProlog(input, ids, stage, rules, st.tieOrder, rows);
      break;
    case 'sprint':
      scoreSprint(input, ids, stage, rules, rows);
      break;
    case 'udbrud':
      scoreUdbrud(input, ids, stage, rules, st.tieOrder, rows);
      break;
    case 'bjerg':
      scoreBjerg(input, ids, stage, rules, st.tieOrder, rows);
      break;
    case 'champs':
      champsDone = scoreChamps(input, ids, stage, rules, rows, info);
      break;
  }

  // Manuelle rettelser lægges ovenpå.
  for (const [id, a] of Object.entries(st.adjust)) {
    const row = rows.get(id);
    if (!row) continue;
    if (isNum(a.timeSec) && a.timeSec !== 0) {
      row.timeSec = fromTenths(toTenths(row.timeSec) + toTenths(a.timeSec));
      row.notes.push(`Rettelse: ${fmt(toTenths(a.timeSec))}${a.note ? ` (${a.note})` : ''}`);
    }
    if (isNum(a.gron) && a.gron !== 0) {
      row.gron += a.gron;
      row.notes.push(`Rettelse: ${a.gron > 0 ? '+' : ''}${a.gron} point${a.note ? ` (${a.note})` : ''}`);
    }
    if (isNum(a.prik) && a.prik !== 0) {
      row.prik += a.prik;
      row.notes.push(`Rettelse: ${a.prik > 0 ? '+' : ''}${a.prik} bjergpoint${a.note ? ` (${a.note})` : ''}`);
    }
  }

  const list = ids.map((id) => rows.get(id)!);
  const ties: RiderId[][] = [];
  for (const r of list) {
    if (r.tiedWith.length && !ties.some((g) => g.includes(r.riderId))) ties.push([r.riderId, ...r.tiedWith]);
  }
  return {
    n: stage.n,
    type: stage.scoring.type,
    status: st.status,
    complete: list.every((r) => !r.missing) && champsDone,
    rows: list,
    ties,
    info,
  };
}

export interface ClassificationRow {
  riderId: RiderId;
  rank: number;
  /** Samlet tid (sek.) for gul, point for grøn/prik. */
  value: number;
  /** Uafgjort efter alle automatiske tiebreaks – kommissæren skal afgøre. */
  tied: boolean;
  tiedWith: RiderId[];
}

export interface Standings {
  stageResults: StageResult[];
  /** Etaper, der tæller med (har data eller er afsluttet), op til og med uptoStage. */
  countedStages: number[];
  completedStages: number;
  totals: Record<RiderId, { timeSec: number; gron: number; prik: number; stageWins: number }>;
  tables: Record<JerseyId, ClassificationRow[]>;
}

function stageHasData(st: StageState | undefined): boolean {
  if (!st) return false;
  if (st.status !== 'idle') return true;
  const i = st.input;
  const any = (o: object) => Object.values(o).some((v) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
  switch (i.type) {
    case 'prolog':
      return any(i.times);
    case 'sprint':
      return i.order.length > 0 || any(i.bonuses);
    case 'udbrud':
      return any(i.quiz) || any(i.dice);
    case 'bjerg':
      return i.hits.length > 0 || any(i.times);
    case 'champs':
      return i.hits.length > 0;
  }
}

/**
 * Samlet klassement. Lighed afgøres efter rules.tieBreak:
 * flest etapesejre → bedst placeret på seneste etape → kommissærens afgørelse.
 */
export function computeStandings(content: Pick<Content, 'stages' | 'riders' | 'rules'>, game: GameState, uptoStage = Infinity): Standings {
  const { riders, rules } = content;
  const stages = content.stages.filter((s) => s.n <= uptoStage);
  const stageResults = stages.map((s) => computeStage(s, game.stages[s.n], riders, rules));
  const counted = stageResults.filter((r) => stageHasData(game.stages[r.n]));
  const totals: Standings['totals'] = {};
  for (const r of riders) totals[r.id] = { timeSec: 0, gron: 0, prik: 0, stageWins: 0 };
  const t10: Record<RiderId, number> = {};
  for (const r of riders) t10[r.id] = 0;
  for (const sr of counted) {
    for (const row of sr.rows) {
      const t = totals[row.riderId];
      t10[row.riderId] += toTenths(row.timeSec);
      t.gron += row.gron;
      t.prik += row.prik;
      if (row.place === 1) t.stageWins++;
    }
  }
  for (const r of riders) totals[r.id].timeSec = fromTenths(t10[r.id]);
  const lastStage = counted.at(-1);

  const table = (jersey: JerseyId): ClassificationRow[] => {
    const value = (id: RiderId) => (jersey === 'gul' ? t10[id] : jersey === 'gron' ? totals[id].gron : totals[id].prik);
    const better = jersey === 'gul' ? -1 : 1; // gul: lavest vinder
    const manual = game.classificationTieOrder[jersey] ?? [];
    const lastPlace = (id: RiderId) => lastStage?.rows.find((r) => r.riderId === id)?.place ?? Infinity;

    // Sammenlign to ryttere: <0 hvis a er foran b, 0 hvis helt lige.
    const cmp = (a: RiderId, b: RiderId): number => {
      const dv = value(b) - value(a);
      if (dv !== 0) return better * dv > 0 ? 1 : -1;
      for (const rule of rules.tieBreak) {
        if (rule === 'stageWins') {
          const d = totals[b].stageWins - totals[a].stageWins;
          if (d !== 0) return d;
        } else if (rule === 'lastStagePlace') {
          const pa = lastPlace(a);
          const pb = lastPlace(b);
          if (pa !== pb) return pa < pb ? -1 : 1;
        } else if (rule === 'commissioner') {
          const ia = manual.indexOf(a);
          const ib = manual.indexOf(b);
          if (ia >= 0 && ib >= 0 && ia !== ib) return ia - ib;
        }
      }
      return 0;
    };

    const ids = riders.map((r) => r.id).sort((a, b) => cmp(a, b) || riders.findIndex((r) => r.id === a) - riders.findIndex((r) => r.id === b));
    const rows: ClassificationRow[] = [];
    ids.forEach((id, i) => {
      const prev = rows[i - 1];
      const tiedPrev = prev && cmp(prev.riderId, id) === 0;
      rows.push({
        riderId: id,
        rank: tiedPrev ? prev.rank : i + 1,
        value: jersey === 'gul' ? fromTenths(t10[id]) : value(id),
        tied: false,
        tiedWith: [],
      });
    });
    // Markér grupper med samme rank som uafgjorte.
    for (const row of rows) {
      const group = rows.filter((r) => r.rank === row.rank);
      if (group.length > 1) {
        row.tied = true;
        row.tiedWith = group.filter((r) => r !== row).map((r) => r.riderId);
      }
    }
    return rows;
  };

  return {
    stageResults,
    countedStages: counted.map((r) => r.n),
    completedStages: stageResults.filter((r) => r.status === 'finished').length,
    totals,
    tables: { gul: table('gul'), gron: table('gron'), prik: table('prik') },
  };
}
