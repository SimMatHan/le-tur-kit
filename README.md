# Le Tur (de France) 2026

Drukspil-etapeløb for vennegruppen som web-app. Den bruges til tre ting:

- præsentation på storskærm eller projektor
- et kommissærpanel til at køre de fem etaper
- et klassement og podie, der regnes ud automatisk

Al tekst er på dansk. Alt kører i browseren, uden backend, login eller tracking. Appen er én HTML-fil, som virker ved dobbeltklik, også uden internet.

## Hurtigt i gang

```bash
npm install
npm run build        # → dist/index.html (én selvstændig fil, ca. 3 MB)
```

Dobbeltklik derefter på `dist/index.html`. Filen kan kopieres til en USB-nøgle eller en anden computer og virker uden internet. Fonte og billeder ligger inde i filen.

> **Browser:** Brug Chrome eller Edge, når filen åbnes fra disk (`file://`). Her virker både `localStorage` og IndexedDB (fotos). Kan browseren ikke gemme fotos permanent, fx i et privat vindue, viser redigeringspanelet en advarsel.

### Til spilaftenen

1. **På forhånd:** Ret rytterne (`E` på hver rytter-slide), og indsæt fotos. Tag en backup under **Opsætning → Eksportér backup**.
2. **Computeren ved projektoren:** Åbn `dist/index.html`, og vælg **Opsætning → Importér backup**. Tryk `F` for fuldskærm.
3. **Under løbet:** Gå gennem slides med `→`. På rutesiderne trykker du `K` (eller **▶ Kør etapen**) og taster resultaterne. `S` viser klassementet når som helst.
4. **Bagefter:** Eksportér en backup, hvis I vil gemme resultaterne.

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

Knapperne nederst til højre vises kun, når musen bevæges. Her findes også **Opsætning**. Den aktuelle slide står i adressen (`#/12`), så en genindlæsning bliver på samme sted.

## Redigering af ryttere

- **Redigér:** Gå til en rytter-slide, og tryk **E**. Panelet til højre redigerer navn, kælenavn, tekst, egenskaber (tilføj og fjern), rygnummer og foto, og sliden opdateres, mens du skriver.
- **Foto:** Vælg et billede, eller træk det ind. Det beskæres automatisk til rammens format (4.6:6), skaleres ned til højst 1200 px og gemmes i browserens IndexedDB.
- **Antal ryttere:** Tilføj eller fjern ryttere (3–10) fra panelet eller under **Opsætning**. Alle slides og scoringen tilpasser sig.
- **Kommissæren** redigeres på samme måde på sin egen slide.
- **Gemning:** Alt gemmes automatisk i browseren (`localStorage` og IndexedDB) og overlever en genindlæsning.

### Backup, flytning og nulstil

Under **Opsætning**:

- **Eksportér backup** gemmer én `.json`-fil med ryttere, kommissær, fotos (som data-URL'er) og spiltilstand.
- **Importér backup** erstatter alt i denne browser med indholdet af filen.
- **Nulstil til standard** sletter alle redigeringer, fotos og resultater.

Data ligger kun i den browser og på den computer, hvor du har redigeret. Brug eksport og import for at flytte mellem computere.

## Kør etaperne (kommissærpanelet)

Tryk **K**, eller klik **▶ Kør etapen** på en ruteside (knappen vises, når musen bevæges). Panelet lægger sig til højre, så sliden stadig kan ses. Øverst vælger du etape, og her er knapperne **Fortryd** (Ctrl+Z), **Afslut etapen** og **Genåbn etapen**. Nederst står etaperesultatet live. Med **✎** kan du rette tid, point og bjergpoint og skrive en note, og du kan afgøre uafgjorte placeringer.

| Etape | I panelet | På skærmen |
|---|---|---|
| 1 Prolog | Stopur: start, og klik på rytterens navn, når bajeren er bundet. Alle tider kan også tastes eller rettes. | Stort stopur med tider (Vis på skærm) |
| 2 Sprint | Klik ryttere i målrækkefølge. Træk eller brug ↑/↓ for at rette. **Samme kort – Carrot in the Box** afgør en gruppe. Bonusknapper. | Carrot-duel med "tredje rytter" |
| 3 Udbrud | Quizbræt: klik et felt, se svaret (kun i panelet), og markér hvem der svarede rigtigt. Ved terningkastet starter første klik uret, og den rytter får 0 sek. | Quizkort med felt og sangnummer. Svaret vises kun, hvis du vælger det. Quiz-sliden kan også klikkes direkte. |
| 4 Bjerg | Hvem ramte beerpong, terningsum pr. udbryder og bajer på tid. | Stort stopur |
| 5 Champs-Élysées | Hvem ramte. Én: **Vinokourov-mirakel** med terningsum. Flere: knock-out med tilfældig parring og walkover, hvor du klikker vinderen af hver duel. | Vinokourov-animation og bracket |

Fanen **Klassement** viser uafgjorte trøjer, som ikke kan afgøres automatisk, og lader kommissæren vælge rækkefølgen.

## Klassement og podie

- **Klassement:** `S` viser det som overlay, og der er en stillings-slide efter hver etape med etapevinderen. Føreren af hver trøje står med trøjeikonet ved navnet. Grøn og prikket kræver mindst ét point.
- **Rytter-slides** viser "Fører" med trøjeikoner, når rytteren fører en trøje.
- **Podiet** udfyldes automatisk med navne og fotos:
  - Top 3 i gul står på trappen, og vinderne af grøn og prikket står ved siden af.
  - Uden foto vises rygnummeret som medaljon.
  - Indtil alle etaper er afsluttet, står der "Foreløbig stilling".
  - Når løbet er slut, kommer der konfetti. Den slås fra, hvis computeren er sat til reduceret bevægelse.
- **Uafgjort** vises eksplicit: "1=" og "Delt plads" på trappen og "delt trøje" ved trøjerne. Kommissæren afgør det under **K → Klassement**.

## Regler og scoring

Regelteksten og alle tal ligger i `src/content/content.json` under `rules` og `stages[].scoring`. Det gælder pointskala, tidstillæg, bonusser, quizværdier, bonussekunder og tiebreak. Intet er hardcodet.

Al regnelogik ligger i `src/game/` som rene funktioner uden React og er dækket af Vitest:

- `scoring.ts`:
  - `computeStage()` laver kommissærens rå input om til placeringer, tid til gul, point til grøn og bjergpoint for én etape.
  - `computeStandings()` lægger etaperne sammen til de tre klassementer.
- `bracket.ts`: knock-out til Carrot in the Box med tilfældig parring, walkover ved ulige antal og placeringer.
- `podium.ts`: podiet og trøjeførere.
- `gameState.ts`: validering af gemt eller importeret spiltilstand og fortryd-historik.

Spiltilstanden indeholder kun rå input (tider, rækkefølger, quizsvar, terningsummer og duel-vindere) plus manuelle rettelser. Alt andet regnes ud hver gang, så en rettet tid slår igennem overalt.

**Lighed i etaper:** Placeringer med præcis samme tid (0,1 s) deles (1, 1, 3 …), indtil kommissæren vælger rækkefølgen.

**Lighed i trøjer:** Afgøres efter `rules.tieBreak`. Først flest etapesejre, derefter bedste placering på seneste etape og til sidst kommissærens afgørelse.

## Deploy til Cloudflare Pages

Appen er statisk, så den kan lægges på Cloudflare Pages med Direct Upload. `npm run deploy` bygger, kontrollerer at `dist/index.html` er selvstændig, og uploader `dist/` med Wrangler.

**Første gang:**

```bash
npx wrangler login     # åbner browseren og logger ind på din Cloudflare-konto
npm run deploy:create  # opretter Pages-projektet "le-tur-2026"
npm run deploy         # bygger og uploader → https://le-tur-2026.pages.dev
```

**Senere:** `npm run deploy`.

**Noter:**
- **Projektnavnet** `le-tur-2026` står i `package.json` under `deploy` og `deploy:create`. Er navnet optaget, så skift det begge steder.
- **`public/_headers`** følger med og sætter `noindex` og et par sikkerhedsheadere. Den har ingen effekt, når filen åbnes fra disk.
- **Direct Upload kan ikke senere skiftes til Git-integration.** Vil du have automatiske deploys fra GitHub, skal du oprette et nyt Pages-projekt med Git-integration: byggekommando `npm run build`, output-mappe `dist`.

### Privatliv: en deployet version er offentlig

**Alt, hvad der ligger i `dist/index.html`, kan ses af alle, der kender adressen.** Det gælder:

- standardindholdet fra `content.json`, herunder kommissærens navn og tekst
- det indbyggede kommissærfoto (`src/assets/img/kommissaer.jpg`)

**Det, I redigerer i appen, uploades aldrig.** Det gælder rytternavne, fotos og resultater. De ligger kun i den browser, der redigerede, og i eksportfilen. En gæst på den deployede side ser derfor kun standardindholdet. Det ændrer sig, hvis I bygger jeres ægte indhold ind i `content.json` eller importerer en backup på en delt computer.

Rytterfotos er af rigtige venner, så **commit dem aldrig til repoet**, og læg dem aldrig i `src/assets/`. `.gitignore` udelukker `*backup*.json` og `photos/`.

### Luk siden med Cloudflare Access (gratis)

Vil du deploye med indhold i, eller bare holde siden privat, så luk den med **Cloudflare Access**. Zero Trust-gratisplanen dækker små grupper; tjek Cloudflares prisside for det aktuelle antal brugere. Pages' egen kontakt beskytter kun preview-deployments, så produktionsadressen kræver et par ekstra trin. Dashboardets navne kan ændre sig; se [Cloudflares guide](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain), hvis noget ikke passer.

1. Gå til **Workers & Pages → le-tur-2026 → Settings → General**, og vælg **Enable access policy**. Det opretter en Access-applikation for preview-deployments (`*.le-tur-2026.pages.dev`).
2. Klik **Manage** ud for policyen. Gå under **Access → Applications** til applikationen, og klik **Configure**. Under **Public hostname** fjerner du `*` fra **Subdomain**, så applikationen dækker `le-tur-2026.pages.dev`, og gemmer.
3. Gå tilbage til projektets **Settings → General**, og vælg **Enable access policy** igen. Nu findes der to Access-applikationer: én for hovedadressen og én for previews.
4. **Bestem, hvem der må komme ind:**
   - Gå til **Zero Trust → Access → Applications**, og redigér begge applikationers policy.
   - Sæt **Action: Allow** og **Include → Emails**, og skriv vennernes e-mailadresser.
   - Under **Authentication** kan du bruge **One-time PIN** som login. Så får man en kode på mail, og det kræver ingen anden identitetsudbyder.
5. **Eget domæne:** Har du et, så opret også en **Self-hosted** applikation for det under **Zero Trust → Access → Applications** med samme policy.

Test i et privat vindue: `https://le-tur-2026.pages.dev` skal nu vise Cloudflares login-side.

## Udvikling og tests

```bash
npm run dev           # udviklingsserver på http://localhost:5173
npm test              # Vitest: scoring, knock-out, podie, quiz, backup, redigering m.m.
npm run build         # typecheck + single-file-build
npm run verify:dist   # statisk kontrol: dist/index.html har ingen eksterne ressourcer
npm run check:slides  # åbner dist/index.html fra disk uden netværk ved 1920×1080 og 1280×720
                      # og tjekker, at ingen tekst flyder ud eller klippes (også ved 10 ryttere og lange tekster)
npm run test:e2e      # end-to-end i Chromium via file:// uden netværk
npm run verify        # alt ovenstående i rækkefølge
```

`check:slides` og `test:e2e` bruger Chromium via `playwright-core`. Findes Chromium ikke på standardstien, så sæt `CHROMIUM_PATH` til den lokale Chrome/Chromium.

### Acceptkriterier og hvor de testes

| Kriterium | Test |
|---|---|
| `dist/index.html` åbner ved dobbeltklik uden internet, og alle billeder og fonte vises | `verify:dist` (ingen eksterne ressourcer, fonte og billeder inlinet) og `check:slides` (åbner via `file://` offline, ingen netværkskald, Fraunces indlæst) |
| Redigering af navn, tekst, egenskaber og foto overlever en genindlæsning | `test:e2e`: "Ændringer og foto er bevaret efter genindlæsning" |
| Eksport → nulstil → import genskaber alt, inkl. fotos | `test:e2e`: eksport, nulstil og import |
| Et komplet testløb med 6 ryttere gennem 5 etaper stemmer med en håndregning | `src/game/scoring.test.ts` (håndregningen står i kommentaren) og `test:e2e` (samme løb kørt via panelerne) |
| Ingen tekst flyder ud ved 1920×1080 eller 1280×720 | `check:slides` |
| `npm test` og `npm run build` kører uden fejl og advarsler | `npm run verify` |

### Struktur

```
src/
  deck.ts          rækkefølgen af slides (én linje pr. slide)
  scene/           1920×1080-scene med letterbox, navigation, oversigt, klassement-overlay
  components/      Medallion, HardShadowCard, JerseyBadge, StageDivider, StageRoute, PointsCard,
                   RiderSlide, Stopwatch, Podium, ElevationProfile, FitText, Confetti …
  slides/          én komponent pr. slidetype
  content/         content.json (standardindhold + regler), typer, billeder, lagring,
                   fotos (IndexedDB), beskæring, backup
  editor/          redigeringspanel (E) og opsætning (backup/nulstil)
  commissioner/    kommissærpanel (K), etapepaneler, bracket, Carrot-hjælper, projektor-overlays
  game/            scoring, knock-out, podie, quiz, spiltilstand (rene funktioner + Vitest)
public/_headers    headers til Cloudflare Pages
scripts/           check-slides, e2e, verify-dist og fælles testdata
reference/         design-reference.pdf, de oprindelige filer og det oprindelige content.json
```

### Tilføj en slide

1. Lav en komponent i `src/slides/`, der tager `{ page }` (og evt. egne props).
2. Tilføj én linje i `src/deck.ts`, fx `{ id: 'min-slide', title: 'Min slide', component: MinSlide }`.
