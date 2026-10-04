import type { ComponentType } from 'react';
import type { Content } from '../content/types';
import type { SlideProps } from '../slides/types';

/** Én linje i decket. `each: 'rider'` gentager sliden for hver rytter. */
export interface DeckEntry {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  each?: 'rider';
  /** Sliden kan redigeres med E (rytter-slides kan altid). */
  edit?: 'commissioner';
  /** Etapen, som K åbner kommissærpanelet på (ellers props.stage/afterStage). */
  stage?: number;
}

export interface SlideInstance {
  key: string;
  title: string;
  Component: ComponentType<SlideProps & Record<string, unknown>>;
  props: Record<string, unknown>;
  /** Hvem E redigerer på denne slide: "commissioner" eller en rytters id. */
  editTarget?: string;
  /** Etape-kontekst for kommissærpanelet. */
  stage?: number;
}

/** Folder decket ud til konkrete slides ud fra det aktuelle indhold (fx antal ryttere). */
const stageOf = (e: DeckEntry) => e.stage ?? (e.props?.stage as number | undefined) ?? (e.props?.afterStage as number | undefined);

export function expandDeck(deck: DeckEntry[], content: Content): SlideInstance[] {
  const out: SlideInstance[] = [];
  for (const e of deck) {
    if (e.each === 'rider') {
      for (const r of content.riders) {
        out.push({
          key: `${e.id}:${r.id}`,
          title: `${e.title} ${r.number} – ${r.name}`,
          Component: e.component,
          props: { ...e.props, riderId: r.id },
          editTarget: r.id,
          stage: stageOf(e),
        });
      }
    } else {
      out.push({ key: e.id, title: e.title, Component: e.component, props: { ...e.props }, editTarget: e.edit, stage: stageOf(e) });
    }
  }
  return out;
}
