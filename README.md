# Le Tur (de France) 2026

Drukspil-etapeløb for vennegruppen som web-app: præsentation på storskærm, kommissærpanel til at køre etaperne og automatisk klassement. Al tekst er på dansk, og alt kører i browseren (ingen backend, ingen login, ingen tracking).

> Status: **fase 5** – præsentation, redigering, backup, scoringsmotor, kommissærpaneler, klassement og podie.

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
| K | Kommissærpanel (åbner på etapen for den aktuelle slide) |
| Ctrl+Z | Fortryd seneste handling i kommissærpanelet |
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

## Kør etaperne (kommissærpanelet)

Tryk **K** (eller **▶ Kør etapen** på en ruteside, når musen bevæges). Panelet lægger sig til højre, mens sliden stadig ses. Øverst vælges etape, og der er **Fortryd** (Ctrl+Z), **Afslut etapen** og **Genåbn etapen**. Nederst ses etaperesultatet live med **✎** til manuelle rettelser (tid ±, point ±, bjergpoint ± og en note) og afgørelse af uafgjorte placeringer.

| Etape | I panelet | På skærmen |
|---|---|---|
| 1 Prolog | Stopur: start og klik på rytterens navn, når bajeren er bundet. Alle tider kan også tastes/rettes. | Stort stopur med tider (Vis på skærm) |
| 2 Sprint | Klik ryttere i målrækkefølge, træk eller ↑/↓ for at rette. **Samme kort – Carrot in the Box** afgør en gruppe. Bonusknapper. | Carrot-duel med "tredje rytter" |
| 3 Udbrud | Quizbræt: klik et felt, se svaret (kun i panelet), markér hvem der svarede rigtigt. Terningkast-stopur, hvor første klik starter uret (0 sek.). | Quizkort med felt og sangnummer – svaret kun hvis du vælger det. Quiz-sliden kan også klikkes direkte. |
| 4 Bjerg | Hvem ramte beerpong, terningsum pr. udbryder, bajer på tid. | Stort stopur |
| 5 Champs-Élysées | Hvem ramte. Én: **Vinokourov-mirakel** med terningsum. Flere: knock-out med tilfældig parring, walkover og klik på vinderen af hver duel. | Vinokourov-animation, bracket |

Fanen **Klassement** viser uafgjorte trøjer, som ikke kan afgøres automatisk, og lader kommissæren vælge rækkefølgen.

## Klassement og podie

- **S** viser klassementet som overlay; desuden er der en stillings-slide efter hver etape (med etapevinderen). Føreren af hver trøje står med trøjeikonet ved navnet – grøn og prikket kræver mindst ét point.
- Rytter-slides viser "Fører" med trøjeikoner, når rytteren fører en trøje.
- **Podiet** udfyldes automatisk med navne og fotos (rygnummer som medaljon, hvis der intet foto er): top 3 i gul på trappen, vinderne af grøn og prikket ved siden af. Indtil alle etaper er afsluttet, står der "Foreløbig stilling". Når løbet er slut, kommer der konfetti (slås fra ved *reducer bevægelse*).
- **Uafgjort** vises eksplicit: "1=" og "Delt plads" på trappen, "delt trøje" ved trøjerne. Kommissæren afgør det under **K → Klassement**.

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
