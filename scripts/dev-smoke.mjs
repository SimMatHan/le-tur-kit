// Røgtest i udviklingstilstand (vite dev): React viser her advarsler, som ikke
// findes i produktions-buildet (fx ugyldig HTML-nesting eller forkerte effekter).
// Testen går appen igennem og fejler ved enhver console.error/console.warn.
//
// Brug: node scripts/dev-smoke.mjs
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { createServer } from 'vite';
import { fullRun, riders } from './fixtures.mjs';

const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const url = 'http://localhost:5199/';

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('dialog', (d) => d.accept());
const messages = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') messages.push(`[${m.type()}] ${m.text().split('\n')[0]}${m.location()?.url ? ` (${m.location().url})` : ''}`);
});
page.on('pageerror', (e) => messages.push('[pageerror] ' + e.message));

// Efterlign nyere browsere, hvor scroll-metoderne returnerer et Promise.
await page.addInitScript(() => {
  for (const proto of [Element.prototype]) {
    for (const name of ['scrollTo', 'scrollBy', 'scrollIntoView']) {
      const orig = proto[name];
      if (orig) proto[name] = function (...a) {
        orig.apply(this, a);
        return Promise.resolve();
      };
    }
  }
});
await page.addInitScript(
  ([c, g]) => {
    if (!sessionStorage.getItem('init')) {
      sessionStorage.setItem('init', '1');
      localStorage.setItem('le-tur-2026:content', JSON.stringify(c));
      localStorage.setItem('le-tur-2026:game', JSON.stringify(g));
    }
  },
  [{ riders }, fullRun()],
);

let count = 0;
try {
  await page.goto(url + '#/1');
  await page.waitForSelector('.scene');
  count = Number((await page.locator('.controls-count').first().textContent()).split('/')[1]);

  // Alle slides
  for (let i = 1; i <= count; i++) {
    await page.evaluate((n) => (location.hash = `#/${n}`), i);
    await page.waitForTimeout(80);
  }
  // Oversigt + klik på en miniature
  await page.keyboard.press('o');
  await page.locator('.overview-grid > *').nth(13).click({ position: { x: 150, y: 80 } });
  // Klassement, hjælp
  await page.keyboard.press('s');
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  await page.keyboard.press('Escape');
  // Kommissærpanelet: alle faner
  await page.keyboard.press('k');
  for (const n of ['1', '2', '3', '4', '5']) {
    await page.locator('.stage-tab', { hasText: new RegExp(`^${n}`) }).click();
    await page.waitForTimeout(100);
  }
  await page.locator('.stage-tab', { hasText: 'Klassement' }).click();
  await page.locator('.stage-tab', { hasText: /^3/ }).click();
  await page.locator('.mini-cell').first().click();
  await page.getByRole('button', { name: 'Luk kort (marker brugt)' }).click();
  await page.locator('.stage-tab', { hasText: /^1/ }).click();
  await page.getByRole('button', { name: 'Vis på skærm' }).first().click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('k');
  // Redigering og opsætning
  await page.evaluate(() => (location.hash = '#/6'));
  await page.waitForTimeout(100);
  await page.keyboard.press('e');
  await page.locator('.editor').getByLabel('Kælenavn').fill('Testkælenavn');
  await page.keyboard.press('Escape');
  await page.mouse.move(300, 300);
  await page.locator('.ctrl', { hasText: 'Opsætning' }).click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  // Telefonens fjernbetjening (uden relæ: viser "Venter på skærmen")
  await page.goto(url + '?remote=ABCDEFGHJKMN&relay=http://127.0.0.1:9');
  await page.getByText('Venter på skærmen').waitFor();
} catch (e) {
  // Også ved et nedbrud skal advarslerne rapporteres.
  messages.push('[script] ' + e.message.split('\n')[0]);
}

await browser.close();
await server.close();

// Forventede beskeder i fjernbetjenings-trinnet (relæet findes ikke).
const unexpected = messages.filter((m) => !/WebSocket connection to 'ws:\/\/127\.0\.0\.1:9/.test(m) && !/ERR_CONNECTION_REFUSED/.test(m));
if (unexpected.length) {
  console.log('Advarsler/fejl i udviklingstilstand:\n  ' + [...new Set(unexpected)].join('\n  '));
  process.exit(1);
}
console.log(`Ingen React-advarsler eller fejl i udviklingstilstand (${count} slides, oversigt, paneler, redigering, opsætning, fjernbetjening).`);
