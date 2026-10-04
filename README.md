# Le Tur (de France) 2026

Drukspil-etapeløb for vennegruppen som web-app: præsentation på storskærm, kommissærpanel til at køre etaperne og automatisk klassement. Al tekst er på dansk, og alt kører i browseren (ingen backend, ingen login, ingen tracking).

> Status: **fase 1** – projektskelet, scene, deck-motor, designkomponenter og alle præsentationsslides.

## Kom i gang

```bash
npm install
npm run dev          # udviklingsserver på http://localhost:5173
npm test             # Vitest
npm run build        # dist/index.html – én fil, der virker ved dobbeltklik
npm run check:slides # åbner dist/index.html fra disk uden netværk og tjekker alle slides
```

## Tastatur

| Tast | Funktion |
|---|---|
| ← / → / mellemrum | Forrige / næste slide |
| F | Fuldskærm |
| O | Oversigt med miniaturer (klik for at hoppe) |
| S | Klassement som overlay |
| ? | Genveje |
| Esc | Luk overlays |

Knapperne nederst til højre vises kun, når musen bevæges.

## Struktur

```
src/
  deck.ts          rækkefølgen af slides (én linje pr. slide)
  scene/           1920×1080-scene med letterbox, navigation, oversigt
  components/      Medallion, HardShadowCard, JerseyBadge, StageDivider, StageRoute,
                   PointsCard, RiderSlide, Podium, ElevationProfile …
  slides/          én komponent pr. slidetype
  content/         content.json (standardindhold + regler), typer, billeder
  game/            scoring og formatering (rene funktioner + Vitest)
reference/         design-reference.pdf, de oprindelige filer og det oprindelige content.json
```

### Tilføj en slide

1. Lav en komponent i `src/slides/`, der tager `{ page }` (og evt. egne props).
2. Tilføj én linje i `src/deck.ts`, fx `{ id: 'min-slide', title: 'Min slide', component: MinSlide }`.

## Regler

Regelteksten og alle tal (pointskala, tidstillæg, bonusser, quizværdier, bonussekunder og tiebreak) ligger i `src/content/content.json` under `rules` og `stages[].scoring`.
