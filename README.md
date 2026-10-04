# Le Tur (de France) 2026

Drukspil-etapeløb for vennegruppen som web-app: præsentation på storskærm, kommissærpanel til at køre etaperne og automatisk klassement. Al tekst er på dansk, og alt kører i browseren (ingen backend, ingen login, ingen tracking).

> Status: **fase 3** – præsentation, redigering, backup og scoringsmotor med tests. Klassement og podie regnes ud automatisk.

## Kom i gang

```bash
npm install
npm run dev          # udviklingsserver på http://localhost:5173
npm test             # Vitest
npm run build        # dist/index.html – én fil, der virker ved dobbeltklik
npm run check:slides # åbner dist/index.html fra disk uden netværk og tjekker alle slides (også med 10 ryttere og lange tekster)
npm run test:e2e     # end-to-end: redigér, upload foto, genindlæs, eksport → nulstil → import
```

`check:slides` og `test:e2e` bruger Chromium via `playwright-core`. Findes Chromium ikke på standardstien, så sæt `CHROMIUM_PATH`.

## Tastatur

| Tast | Funktion |
|---|---|
| ← / → / mellemrum | Forrige / næste slide |
| F | Fuldskærm |
| O | Oversigt med miniaturer (klik for at hoppe) |
| S | Klassement som overlay |
| E | Redigér rytteren/kommissæren på den aktuelle slide |
| ? | Genveje |
| Esc | Luk overlays |

Knapperne nederst til højre vises kun, når musen bevæges. Her findes også **Opsætning**.

## Redigering af ryttere

- Gå til en rytter-slide og tryk **E**. Panelet til højre redigerer navn, kælenavn, tekst, egenskaber (tilføj/fjern), rygnummer og foto – sliden opdateres live.
- **Foto:** vælg eller træk et billede ind. Det beskæres automatisk til rammens format (4.6:6), nedskaleres til maks. 1200 px og gemmes i browserens IndexedDB.
- **Ryttere:** tilføj eller fjern ryttere (3–10) fra panelet eller under **Opsætning**. Alle slides tilpasser sig.
- Kommissæren redigeres på samme måde på sin egen slide.
- Alt gemmes automatisk i browseren (localStorage + IndexedDB) og overlever genindlæsning.

### Backup, flytning og nulstil

Under **Opsætning**:

- **Eksportér backup** gemmer én `.json`-fil med ryttere, kommissær, fotos (som data-URL'er) og spiltilstand.
- **Importér backup** erstatter alt i denne browser med indholdet af filen.
- **Nulstil til standard** sletter alle redigeringer, fotos og resultater.

Data ligger kun i den browser (og på den computer), hvor du har redigeret. Brug eksport/import for at flytte mellem computere – fx fra din egen laptop til den, der sidder i projektoren.

> **Privatliv:** Rytterfotos er af rigtige mennesker. De gemmes kun i browseren og i eksportfilen – læg aldrig eksportfiler eller fotos i repoet (`.gitignore` udelukker `*backup*.json`).

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

## Scoring

Al regnelogik ligger i `src/game/` som rene funktioner uden React og er dækket af Vitest:

- `scoring.ts` – `computeStage()` laver kommissærens rå input om til placeringer, tid til gul, point til grøn og bjergpoint for én etape. `computeStandings()` lægger etaperne sammen til de tre klassementer.
- `bracket.ts` – knock-out til Carrot in the Box (tilfældig parring, walkover ved ulige antal, placeringer).
- `gameState.ts` – validering af gemt/importeret spiltilstand og fortryd-historik.

Spiltilstanden indeholder kun rå input (tider, rækkefølger, quizsvar, terningsummer, duel-vindere) plus manuelle rettelser. Alt andet regnes ud hver gang, så en rettet tid slår igennem overalt. Den gemmes i `localStorage` og kommer med i backuppen.

**Lighed:** Etapeplaceringer med præcis samme tid (0,1 s) deles (1, 1, 3 …), indtil kommissæren vælger rækkefølgen. I trøjerne afgøres lighed efter `rules.tieBreak`: flest etapesejre → bedst placeret på seneste etape → kommissærens afgørelse.

`src/game/scoring.test.ts` indeholder et komplet testløb med 6 ryttere gennem alle 5 etaper. Håndregningen står som kommentar i testen.

## Regler

Regelteksten og alle tal (pointskala, tidstillæg, bonusser, quizværdier, bonussekunder og tiebreak) ligger i `src/content/content.json` under `rules` og `stages[].scoring`.
