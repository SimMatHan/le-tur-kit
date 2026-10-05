// Åbner dist/index.html direkte fra disk (file://) UDEN netværk, gennemgår alle
// slides ved 1920×1080 og 1280×720 og tjekker, at ingen tekst flyder ud af sine
// bokse eller bliver klippet. Kører både med standardindholdet og med et
// stresstest-sæt (10 ryttere, lange navne, lang tekst, mange egenskaber).
//
// Brug: npm run build && node scripts/check-slides.mjs [--shots <mappe>]
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? resolve(args[args.indexOf('--shots') + 1]) : null;
const file = resolve('dist/index.html');
if (!existsSync(file)) {
  console.error('dist/index.html findes ikke – kør npm run build først');
  process.exit(1);
}
const url = pathToFileURL(file).href;
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const longBio =
  'Oliver Klint. Husk navnet. Fordi han vil formentlig både stjæle en etape og din dame. En charmetrold og dansende med sin cykel vil han liste fra seng til seng og fra præmieoverrækkelse til præmieoverrækkelse. Han er desuden kendt for at kunne bunde en bajer hurtigere end nogen anden i hele Mosede, og det er ikke så lidt.';
export const stressEdits = {
  riders: Array.from({ length: 10 }, (_, i) => ({
    id: `s${i}`,
    number: i === 9 ? 100 : i + 1,
    name: i % 2 ? 'Oliver Klint-Kristoffersen Hansen' : 'Bo',
    nickname: i % 2 ? 'Gnuen fra Greve, Mosede og/eller Karlslunde. Who cares.' : 'B',
    bio: i % 2 ? longBio : 'Kort.',
    traits: i % 2 ? ['Etapeløb', 'Taktisk', 'Manipulerende', 'Charmetrold af rang', 'Sidevind', 'Enkeltstartsrytter', 'Klassikere', 'Bjergrytter'] : [],
    photo: null,
  })),
  commissioner: {
    name: 'Simon Mathias Overnaturlig Hansen',
    title: 'Løbskommissær og øverste dommer',
    nickname: 'Den overnaturlige, allervidende og altid retfærdige',
    bio: longBio,
    traits: ['Kan alt', 'Ved alt', 'Bestemmer alt'],
    photo: 'img/kommissaer.jpg',
  },
};

// Resultater til stresstesten: alle 10 ryttere gennem etape 1, 2 og 5 (inkl. delt plads).
const ids = stressEdits.riders.map((r) => r.id);
const fin = (input) => ({ status: 'finished', input, adjust: {}, tieOrder: [] });
const stressGame = {
  version: 1,
  classificationTieOrder: {},
  stages: {
    1: fin({ type: 'prolog', times: Object.fromEntries(ids.map((id, i) => [id, 8 + (i % 7) * 1.3])) }),
    2: fin({ type: 'sprint', order: [...ids].reverse(), carrotGroups: [], bonuses: { start: ids[3], third: ids[4] } }),
    5: fin({ type: 'champs', hits: [ids[1]], vinokourovDice: 12, rounds: [] }),
  },
};

const runs = [
  { name: 'standard', w: 1920, h: 1080 },
  { name: 'standard', w: 1280, h: 720 },
  { name: 'stress', w: 1920, h: 1080, edits: stressEdits, game: stressGame },
];

const browser = await chromium.launch({ executablePath });
let problems = 0;

for (const run of runs) {
  const tag = `[${run.name} ${run.w}×${run.h}]`;
  const context = await browser.newContext({ viewport: { width: run.w, height: run.h }, offline: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route(/^(?!file:|data:|blob:)/, (route) => {
    errors.push('Netværkskald: ' + route.request().url());
    route.abort();
  });
  if (run.edits) {
    await page.addInitScript(
      ([e, g]) => {
        localStorage.setItem('le-tur-2026:content', JSON.stringify(e));
        if (g) localStorage.setItem('le-tur-2026:game', JSON.stringify(g));
      },
      [run.edits, run.game ?? null],
    );
  }

  await page.goto(url + '#/1');
  await page.waitForSelector('.scene');
  await page.evaluate(() => document.fonts.ready);
  const count = await page.evaluate(() => Number(document.querySelector('.controls-count')?.textContent?.split('/')[1]));

  // Fontene indlæses først, når de bruges – så bed om dem, og tjek, at de kan indlæses offline.
  const fontOk = await page.evaluate(async () => {
    const specs = ['800 40px "Barlow Condensed"', '700 40px "Barlow Condensed"', '400 20px "Barlow"', '700 20px "Barlow"'];
    const loaded = await Promise.all(specs.map((s) => document.fonts.load(s).then((f) => f.length > 0, () => false)));
    return loaded.every(Boolean) && specs.every((s) => document.fonts.check(s));
  });
  if (!fontOk) {
    console.log(`${tag} Barlow-fontene er ikke indlæst!`);
    problems++;
  }

  for (let i = 1; i <= count; i++) {
    await page.evaluate((n) => (location.hash = `#/${n}`), i);
    await page.waitForTimeout(320);
    const issues = await page.evaluate(() => {
      const scene = document.querySelector('.scene');
      const root = scene.querySelector('.slide-anim');
      const sceneRect = scene.getBoundingClientRect();
      const k = sceneRect.width / 1920;
      const out = [];
      const label = (el) => `"${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)}"`;

      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const text = el.innerText?.trim();
        // 1) Klippet indhold: en boks med skjult overflow, hvis tekstindhold er større end boksen
        const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
        if (clips && text && !el.classList.contains('slide') && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) {
          out.push(`klippet: ${label(el)} (${el.scrollWidth}×${el.scrollHeight} > ${el.clientWidth}×${el.clientHeight})`);
        }
        if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) out.push(`afkortet med …: ${label(el)}`);
        // 2) Tekst uden for scenen
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasOwnText) continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        const x0 = (r.left - sceneRect.left) / k;
        const y0 = (r.top - sceneRect.top) / k;
        const x1 = (r.right - sceneRect.left) / k;
        const y1 = (r.bottom - sceneRect.top) / k;
        if (x0 < -1 || y0 < -1 || x1 > 1921 || y1 > 1081) out.push(`uden for scenen: ${label(el)} (${x0.toFixed(0)},${y0.toFixed(0)})–(${x1.toFixed(0)},${y1.toFixed(0)})`);
      }
      // FitText, der har måttet krympe brødtekst under 28 px (info, ikke fejl)
      const small = [...root.querySelectorAll('[data-fit]')]
        .filter((el) => parseFloat(el.style.fontSize) < 28 && Number(el.dataset.fit) < 28 && !el.classList.contains('h-display'))
        .map((el) => `${el.style.fontSize}: ${label(el)}`);
      return { out, small };
    });
    if (issues.out.length) {
      problems += issues.out.length;
      console.log(`${tag} slide ${i}:\n  ` + issues.out.join('\n  '));
    }
    if (issues.small.length && run.name === 'standard' && run.w === 1920) console.log(`  (info) slide ${i} krympet tekst: ` + issues.small.join(', '));
    if (shotsDir) {
      mkdirSync(shotsDir, { recursive: true });
      await page.screenshot({ path: `${shotsDir}/${run.name}-${run.w}-${String(i).padStart(2, '0')}.png` });
    }
  }
  if (errors.length) {
    problems += errors.length;
    console.log(`${tag} fejl:\n  ` + errors.join('\n  '));
  }
  console.log(`${tag} ${count} slides gennemgået`);
  await context.close();
}

await browser.close();
if (problems) {
  console.log(`\n${problems} problem(er) fundet`);
  process.exit(1);
}
console.log('\nAlt ok: ingen tekst flyder ud eller klippes, ingen netværkskald, fonte indlæst.');
