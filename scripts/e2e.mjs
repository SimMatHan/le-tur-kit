// End-to-end-test af dist/index.html åbnet fra disk (file://) uden netværk.
// Dækker acceptkriterierne for redigering: ændringer overlever genindlæsning,
// og eksport → nulstil → import genskaber alt, inkl. fotos.
//
// Brug: npm run build && node scripts/e2e.mjs
import { chromium } from 'playwright-core';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const url = pathToFileURL(resolve('dist/index.html')).href;
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const userDir = mkdtempSync(join(tmpdir(), 'le-tur-e2e-'));
const context = await chromium.launchPersistentContext(userDir, {
  executablePath,
  viewport: { width: 1600, height: 900 },
  offline: true,
  acceptDownloads: true,
});
const page = context.pages()[0] ?? (await context.newPage());
page.on('dialog', (d) => d.accept());
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

let failed = 0;
async function step(name, fn) {
  try {
    await fn();
    console.log('✓ ' + name);
  } catch (e) {
    failed++;
    console.log('✗ ' + name + '\n   ' + (e?.message ?? e));
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}
const sceneText = () => page.locator('.slide-anim').innerText();
const slideCount = async () => Number((await page.locator('.controls-count').textContent()).split('/')[1]);
async function waitReload() {
  await page.waitForLoadState('load');
  await page.waitForSelector('.scene');
  await page.waitForTimeout(300);
}

/** Et testbillede (liggende 1600×1000) lavet med canvas i browseren. */
async function testImage() {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1600;
    c.height = 1000;
    const g = c.getContext('2d');
    g.fillStyle = '#D2372B';
    g.fillRect(0, 0, 1600, 1000);
    g.fillStyle = '#F2B705';
    g.fillRect(500, 200, 600, 600);
    return c.toDataURL('image/png').split(',')[1];
  });
  return { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}

await page.goto(url + '#/6');
await waitReload();

await step('E åbner redigering på rytter-slide', async () => {
  await page.keyboard.press('e');
  await page.waitForSelector('.editor');
  expect((await page.locator('.editor h2').textContent()).includes('rytter nr. 1'), 'forkert overskrift');
});

await step('Navn, kælenavn, tekst, egenskaber og rygnummer kan redigeres live', async () => {
  const ed = page.locator('.editor');
  await ed.getByLabel('Navn', { exact: true }).fill('Anders Björk');
  await ed.getByLabel('Kælenavn').fill('Bøflen fra Greve');
  await ed.getByLabel('Tekst').fill('Et powerhouse fra Hammershus.');
  await ed.getByLabel('Rygnummer').fill('11');
  await ed.getByRole('button', { name: 'Fjern Egenskab' }).first().click();
  await ed.getByPlaceholder('Ny egenskab').fill('Sidevind');
  await ed.getByPlaceholder('Ny egenskab').press('Enter');
  const t = await sceneText();
  for (const s of ['Anders Björk', 'Bøflen fra Greve', 'Hammershus', 'Sidevind', 'RYTTER NR. 11']) expect(t.includes(s), `mangler "${s}" på sliden`);
});

await step('Foto uploades, beskæres til portræt og nedskaleres til maks. 1200 px', async () => {
  await page.locator('.editor input[type=file]').setInputFiles(await testImage());
  await page.waitForSelector('.slide-anim img[alt="Anders Björk"]');
  const size = await page.locator('.slide-anim img[alt="Anders Björk"]').evaluate(async (img) => {
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  });
  expect(size[1] <= 1200 && Math.abs(size[0] / size[1] - 4.6 / 6) < 0.01, `forkert størrelse ${size}`);
});

await step('Kommissæren kan redigeres', async () => {
  await page.keyboard.press('Escape');
  await page.evaluate(() => (location.hash = '#/12'));
  await page.waitForTimeout(300);
  await page.keyboard.press('e');
  await page.locator('.editor').getByLabel('Kælenavn').fill('Den allervidende');
  expect((await sceneText()).includes('Den allervidende'), 'kommissær ikke opdateret');
  await page.keyboard.press('Escape');
});

await step('Ændringer og foto er bevaret efter genindlæsning', async () => {
  await page.evaluate(() => (location.hash = '#/6'));
  await page.reload();
  await waitReload();
  const t = await sceneText();
  expect(t.includes('Anders Björk') && t.includes('Sidevind'), 'tekst ikke bevaret');
  await page.waitForSelector('.slide-anim img[alt="Anders Björk"]', { timeout: 3000 });
});

await step('Tilføj og fjern rytter (antal slides følger med)', async () => {
  const before = await slideCount();
  await page.keyboard.press('e');
  await page.locator('.editor').getByRole('button', { name: '+ Tilføj rytter' }).click();
  await page.waitForTimeout(300);
  expect((await slideCount()) === before + 1, 'slide ikke tilføjet');
  // Rytter 1 har nu nr. 11, så den nye rytter får første ledige nummer: 1.
  expect((await page.locator('.editor h2').textContent()).includes('nr. 1'), 'ny rytter ikke valgt');
  expect((await page.locator('.slide-anim').innerText()).includes('Fornavn Efternavn'), 'viser ikke ny rytter');
  await page.locator('.editor').getByRole('button', { name: 'Fjern rytter' }).click();
  await page.waitForTimeout(300);
  expect((await slideCount()) === before, 'slide ikke fjernet');
  await page.keyboard.press('Escape');
});

let backupPath;
await step('Eksport giver én .json-fil med indhold og foto som data-URL', async () => {
  await page.locator('.ctrl', { hasText: 'Opsætning' }).click({ force: true });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Eksportér backup' }).click()]);
  backupPath = join(userDir, dl.suggestedFilename());
  await dl.saveAs(backupPath);
  const data = JSON.parse(readFileSync(backupPath, 'utf8'));
  expect(data.app === 'le-tur-2026', 'forkert app-felt');
  expect(data.content.riders[0].name === 'Anders Björk', 'navn mangler i backup');
  const photos = Object.values(data.photos);
  expect(photos.length === 1 && photos[0].startsWith('data:image/jpeg'), 'foto mangler i backup');
});

await step('Nulstil til standard fjerner alt', async () => {
  await page.getByRole('button', { name: 'Nulstil til standard' }).click();
  await waitReload();
  await page.evaluate(() => (location.hash = '#/6'));
  await page.waitForTimeout(300);
  const t = await sceneText();
  expect(t.includes('Fornavn Efternavn') && !t.includes('Anders'), 'ikke nulstillet');
  expect((await page.locator('.slide-anim img').count()) === 0, 'foto ikke fjernet');
});

await step('Import genskaber indhold og foto', async () => {
  await page.mouse.move(10, 10);
  await page.locator('.ctrl', { hasText: 'Opsætning' }).click({ force: true });
  await page.locator('.setup input[type=file]').setInputFiles(backupPath);
  await waitReload();
  await page.evaluate(() => (location.hash = '#/6'));
  await page.waitForTimeout(400);
  const t = await sceneText();
  expect(t.includes('Anders Björk') && t.includes('Bøflen fra Greve'), 'indhold ikke genskabt');
  await page.waitForSelector('.slide-anim img[alt="Anders Björk"]', { timeout: 3000 });
  await page.evaluate(() => (location.hash = '#/12'));
  await page.waitForTimeout(300);
  expect((await sceneText()).includes('Den allervidende'), 'kommissær ikke genskabt');
});

if (errors.length) {
  failed++;
  console.log('✗ Fejl i siden:\n   ' + errors.join('\n   '));
}
await context.close();
rmSync(userDir, { recursive: true, force: true });
console.log(failed ? `\n${failed} trin fejlede` : '\nAlle e2e-trin bestået');
process.exit(failed ? 1 : 0);
