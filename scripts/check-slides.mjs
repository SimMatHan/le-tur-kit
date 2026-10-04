// Åbner dist/index.html direkte fra disk (file://) UDEN netværk, gennemgår alle
// slides ved 1920×1080 og 1280×720, tager skærmbilleder og tjekker, at ingen
// tekst flyder ud af sine bokse.
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

const browser = await chromium.launch({ executablePath });
let problems = 0;

for (const [w, h] of [
  [1920, 1080],
  [1280, 720],
]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, offline: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.route(/^(?!file:|data:|blob:)/, (route) => {
    errors.push('Netværkskald: ' + route.request().url());
    route.abort();
  });

  await page.goto(url + '#/1');
  await page.waitForSelector('.scene');
  await page.evaluate(() => document.fonts.ready);
  const count = await page.evaluate(() => Number(document.querySelector('.controls-count')?.textContent?.split('/')[1]));

  const fontOk = await page.evaluate(() => document.fonts.check('italic 800 40px "Fraunces Variable"'));
  if (!fontOk) {
    console.log(`[${w}×${h}] Fraunces er ikke indlæst!`);
    problems++;
  }

  for (let i = 1; i <= count; i++) {
    await page.evaluate((n) => (location.hash = `#/${n}`), i);
    await page.waitForTimeout(350);
    const issues = await page.evaluate(() => {
      const scene = document.querySelector('.scene');
      const sr = { left: 0, top: 0, right: 1920, bottom: 1080 };
      const out = [];
      const sceneRect = scene.getBoundingClientRect();
      const k = sceneRect.width / 1920;
      for (const el of scene.querySelectorAll('.slide-anim *')) {
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const txt = el.textContent.trim().slice(0, 50);
        // Klippet tekst (overflow skjult, men indholdet er større)
        if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)) {
          out.push(`klippet: "${txt}" (${el.scrollWidth}×${el.scrollHeight} > ${el.clientWidth}×${el.clientHeight})`);
        }
        // Tekst uden for scenen
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        const x0 = (r.left - sceneRect.left) / k,
          y0 = (r.top - sceneRect.top) / k,
          x1 = (r.right - sceneRect.left) / k,
          y1 = (r.bottom - sceneRect.top) / k;
        if (x0 < sr.left - 1 || y0 < sr.top - 1 || x1 > sr.right + 1 || y1 > sr.bottom + 1) {
          out.push(`uden for scenen: "${txt}" (${x0.toFixed(0)},${y0.toFixed(0)})–(${x1.toFixed(0)},${y1.toFixed(0)})`);
        }
        // Tekst der stikker ud af sin forælders boks (fx kort/chips)
        const box = el.closest('[data-box], .fit-box');
        if (box) {
          const b = box.getBoundingClientRect();
          if (r.right > b.right + 2 || r.bottom > b.bottom + 2) out.push(`ud af boks: "${txt}"`);
        }
      }
      // FitText der har måttet krympe brødtekst under 28 px (info, ikke fejl)
      const small = [...scene.querySelectorAll('.slide-anim [data-fit]')]
        .filter((el) => parseFloat(el.style.fontSize) < 28 && !el.classList.contains('h-display'))
        .map((el) => `${el.style.fontSize}: "${el.textContent.trim().slice(0, 40)}"`);
      return { out, small };
    });
    if (issues.out.length) {
      problems += issues.out.length;
      console.log(`[${w}×${h}] slide ${i}:\n  ` + issues.out.join('\n  '));
    }
    if (issues.small.length && w === 1920) console.log(`  (info) slide ${i} krympet tekst: ` + issues.small.join(', '));
    if (shotsDir) {
      mkdirSync(shotsDir, { recursive: true });
      await page.screenshot({ path: `${shotsDir}/${w}-${String(i).padStart(2, '0')}.png` });
    }
  }
  if (errors.length) {
    problems += errors.length;
    console.log(`[${w}×${h}] fejl:\n  ` + errors.join('\n  '));
  }
  console.log(`[${w}×${h}] ${count} slides gennemgået`);
  await context.close();
}

await browser.close();
if (problems) {
  console.log(`\n${problems} problem(er) fundet`);
  process.exit(1);
}
console.log('\nAlt ok: ingen tekst flyder ud, ingen netværkskald, fonte indlæst.');
