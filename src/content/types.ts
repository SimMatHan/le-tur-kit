// Typer for indholdet i content.json (standardindhold) og redigeret indhold.

export type JerseyId = 'gul' | 'gron' | 'prik';

export interface Theme {
  ink: string;
  white: string;
  bg: string;
  yellow: string;
  red: string;
  green: string;
  [key: string]: unknown;
}

export interface Meta {
  title: string;
  year: number;
  tagline: string;
  footer: string;
  kicker: string;
  jerseysNote: string;
  routeSubtitle: string;
  pointsSubtitle: string;
  /** "{antal}" erstattes med antal ryttere skrevet med bogstaver. */
  ridersTagline: string;
}

export interface Jersey {
  id: JerseyId;
  name: string;
  kicker: string;
  text: string;
  img: string;
  lowestWins?: boolean;
}

export type TieBreakRule = 'stageWins' | 'lastStagePlace' | 'commissioner';

export interface Rules {
  placementPoints: number[];
  /** Point til placeringer efter skalaen (6.+ plads). */
  pointsBeyondScale: number;
  timePrecisionSec: number;
  tieBreak: TieBreakRule[];
}

export interface Person {
  name: string;
  nickname: string;
  bio: string;
  traits: string[];
  /** Enten en indbygget sti ("img/…"), en nøgle i IndexedDB ("idb:…") eller null. */
  photo: string | null;
}

export interface Rider extends Person {
  id: string;
  number: number;
}

export interface Commissioner extends Person {
  title: string;
}

export interface Bonus {
  id: string;
  label: string;
  jersey: JerseyId;
  points: number;
}

export interface PrologScoring {
  type: 'prolog';
  placementPointsTo: JerseyId;
  timeToGul: boolean;
}
export interface SprintScoring {
  type: 'sprint';
  placementPointsTo: JerseyId;
  placementTimePenaltySec: number[];
  timePenaltyBeyondScale: 'repeatLast' | 'zero';
  bonuses: Bonus[];
}
/** Udbrudsforsøget (højere/lavere): placering efter længste udbrud. */
export interface UdbrudScoring {
  type: 'udbrud';
  placementPointsTo: JerseyId;
  /** Sekunder pr. rigtigt gæt (negativt = bonus). */
  secPerCorrect: number;
  bjergpointPerCorrect: number;
  /** Højst så mange rigtige gæt tæller (tid og bjergpoint). */
  maxCountedCorrect: number;
}
export interface BjergScoring {
  type: 'bjerg';
  placementPointsTo: JerseyId;
  breakawayDiceSubtractSec: boolean;
}
export interface ChampsScoring {
  type: 'champs';
  placementPointsTo: JerseyId;
  /** Bonussekunder: vinder, finaletaber, tabere i runden før finalen. */
  knockoutBonusSec: number[];
  vinokourovDiceSubtractSec: boolean;
}
export type StageScoring = PrologScoring | SprintScoring | UdbrudScoring | BjergScoring | ChampsScoring;

export type ProfileKind = 'flad' | 'kuperet' | 'bjerg';

export interface Stage {
  n: number;
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  profile: ProfileKind;
  img: string;
  atStake: JerseyId[];
  intro: string;
  steps: string[];
  scoring: StageScoring;
  note?: string;
  vinokourov?: string;
  props: string;
}

export interface Content {
  meta: Meta;
  theme: Theme;
  jerseys: Jersey[];
  rules: Rules;
  riders: Rider[];
  commissioner: Commissioner;
  stages: Stage[];
  carrotInTheBox: { usedFor: string; subtitle: string; steps: string[] };
  podium: { title: string; kicker: string };
}
