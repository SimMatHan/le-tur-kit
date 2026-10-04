// Decket: rækkefølgen af slides. En ny slide = én komponent + én linje her.
import type { DeckEntry } from './scene/deckTypes';
import { TitleSlide } from './slides/TitleSlide';
import { JerseysSlide } from './slides/JerseysSlide';
import { RouteSlide } from './slides/RouteSlide';
import { PointsScaleSlide } from './slides/PointsScaleSlide';
import { RidersIntroSlide } from './slides/RidersIntroSlide';
import { RiderPresentationSlide } from './slides/RiderPresentationSlide';
import { CommissionerSlide } from './slides/CommissionerSlide';
import { StageDividerSlide, StageRouteSlide } from './slides/StageSlides';
import { CarrotSlide } from './slides/CarrotSlide';
import { QuizBoardSlide } from './slides/QuizBoardSlide';
import { StandingsSlide } from './slides/StandingsSlide';
import { PodiumSlide } from './slides/PodiumSlide';

export const deck: DeckEntry[] = [
  { id: 'forside', title: 'Forside', component: TitleSlide },
  { id: 'troejer', title: 'Tre trøjer, én Tour', component: JerseysSlide },
  { id: 'ruten', title: 'Ruten', component: RouteSlide },
  { id: 'pointskala', title: 'Pointskalaen', component: PointsScaleSlide },
  { id: 'ryttere', title: 'Årets ryttere', component: RidersIntroSlide },
  { id: 'rytter', title: 'Rytter', component: RiderPresentationSlide, each: 'rider' },
  { id: 'kommissaer', title: 'Løbskommissæren', component: CommissionerSlide, edit: 'commissioner' },

  { id: 'etape-1', title: 'Etape 1: Prolog', component: StageDividerSlide, props: { stage: 1 } },
  { id: 'rute-1', title: 'Ruten: Prolog', component: StageRouteSlide, props: { stage: 1 } },
  { id: 'stilling-1', title: 'Stilling efter etape 1', component: StandingsSlide, props: { afterStage: 1 } },

  { id: 'etape-2', title: 'Etape 2: Sprint', component: StageDividerSlide, props: { stage: 2 } },
  { id: 'rute-2', title: 'Ruten: Sprinteretapen', component: StageRouteSlide, props: { stage: 2 } },
  { id: 'carrot', title: 'Carrot in the Box', component: CarrotSlide, stage: 2 },
  { id: 'stilling-2', title: 'Stilling efter etape 2', component: StandingsSlide, props: { afterStage: 2 } },

  { id: 'etape-3', title: 'Etape 3: Udbrud', component: StageDividerSlide, props: { stage: 3 } },
  { id: 'rute-3', title: 'Ruten: Udbrudsetapen', component: StageRouteSlide, props: { stage: 3 } },
  { id: 'quiz', title: 'Musikquizzen', component: QuizBoardSlide, stage: 3 },
  { id: 'stilling-3', title: 'Stilling efter etape 3', component: StandingsSlide, props: { afterStage: 3 } },

  { id: 'etape-4', title: 'Etape 4: Bjerg', component: StageDividerSlide, props: { stage: 4 } },
  { id: 'rute-4', title: 'Ruten: Bjergetapen', component: StageRouteSlide, props: { stage: 4 } },
  { id: 'stilling-4', title: 'Stilling efter etape 4', component: StandingsSlide, props: { afterStage: 4 } },

  { id: 'etape-5', title: 'Etape 5: Champs-Élysées', component: StageDividerSlide, props: { stage: 5 } },
  { id: 'rute-5', title: 'Ruten: Champs-Élysées', component: StageRouteSlide, props: { stage: 5 } },
  { id: 'stilling-5', title: 'Stilling efter etape 5', component: StandingsSlide, props: { afterStage: 5 } },

  { id: 'podie', title: 'Podiet i Paris', component: PodiumSlide },
];
