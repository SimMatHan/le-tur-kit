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
}

export interface SlideInstance {
  key: string;
  title: string;
  Component: ComponentType<SlideProps & Record<string, unknown>>;
  props: Record<string, unknown>;
}

/** Folder decket ud til konkrete slides ud fra det aktuelle indhold (fx antal ryttere). */
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
        });
      }
    } else {
      out.push({ key: e.id, title: e.title, Component: e.component, props: { ...e.props } });
    }
  }
  return out;
}
