// Spiltilstand: de rå input, kommissæren taster ind. Alt afledt (placeringer,
// point, tider, klassement) regnes ud af scoring.ts og gemmes aldrig.
import type { JerseyId } from '../content/types';

export type RiderId = string;

/** Tider er sekunder (med tiendedele). */
export type Times = Record<RiderId, number | null | undefined>;

export interface PrologInput {
  type: 'prolog';
  times: Times;
}

export interface SprintInput {
  type: 'sprint';
  /** Endelig rækkefølge i mål (efter evt. Carrot in the Box). */
  order: RiderId[];
  /** Grupper med samme kort, der er afgjort med Carrot in the Box (kun til visning). */
  carrotGroups: RiderId[][];
  /** Bonus-id → rytter (fx "start" → r3). */
  bonuses: Record<string, RiderId | null | undefined>;
}

export interface UdbrudInput {
  type: 'udbrud';
  /** Quizfelt "kategori-række" (0-baseret, fx "0-2") → ryttere, der svarede rigtigt. */
  quiz: Record<string, RiderId[]>;
  /** Terningtid: sekunder fra første 6'er (den første får 0). */
  dice: Times;
}

export interface BjergInput {
  type: 'bjerg';
  /** Ryttere, der ramte beerpong (udbryderne). */
  hits: RiderId[];
  /** Terningsum (2–12) pr. udbryder = sekunders forspring. */
  dice: Record<RiderId, number | null | undefined>;
  /** Bajer-tid pr. rytter. */
  times: Times;
}

export interface Duel {
  a: RiderId;
  /** null = walkover (ulige antal), a går videre. */
  b: RiderId | null;
  winner: RiderId | null;
}
export interface Round {
  duels: Duel[];
}

export interface ChampsInput {
  type: 'champs';
  hits: RiderId[];
  /** Vinokourov-mirakel: terningsum for den eneste, der ramte. */
  vinokourovDice: number | null;
  /** Knock-out i Carrot in the Box. */
  rounds: Round[];
}

export type StageInput = PrologInput | SprintInput | UdbrudInput | BjergInput | ChampsInput;
export type StageType = StageInput['type'];

/** Manuelle rettelser (lægges til de beregnede tal). */
export interface Adjustment {
  timeSec?: number;
  gron?: number;
  prik?: number;
  note?: string;
}

export type StageStatus = 'idle' | 'running' | 'finished';

export interface StageState {
  status: StageStatus;
  input: StageInput;
  adjust: Record<RiderId, Adjustment>;
  /** Kommissærens afgørelse ved lighed i etapeplaceringen: prioriteret rækkefølge. */
  tieOrder: RiderId[];
}

export interface GameState {
  version: 1;
  stages: Record<number, StageState>;
  /** Kommissærens afgørelse ved lighed i en trøje: prioriteret rækkefølge. */
  classificationTieOrder: Partial<Record<JerseyId, RiderId[]>>;
}

// ---------- Afledte resultater ----------

export interface StageRiderResult {
  riderId: RiderId;
  /** Placering (1-baseret, delt ved lighed) – null hvis rytteren mangler data/ikke placeres. */
  place: number | null;
  /** Bidrag til den gule trøje (sek.). Negativt = bonus. */
  timeSec: number;
  gron: number;
  prik: number;
  /** Ryttere med samme placering, som ikke er afgjort. */
  tiedWith: RiderId[];
  /** Mangler rytteren data på etapen? */
  missing: boolean;
  /** Forklaringer til visning, fx "+3 sek tidstillæg". */
  notes: string[];
}

export interface StageResult {
  n: number;
  type: StageType;
  status: StageStatus;
  /** Har alle ryttere de nødvendige data? */
  complete: boolean;
  rows: StageRiderResult[];
  /** Grupper af ryttere med uafgjort placering (skal afgøres af kommissæren). */
  ties: RiderId[][];
  /** Ekstra info, fx "Vinokourov-mirakel" eller "Ingen ramte – skyd igen". */
  info: string[];
}
