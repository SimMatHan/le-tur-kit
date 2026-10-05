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
import { fullRun, riders } from './fixtures.mjs';

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

await step('Kommissæren kører alle 5 etaper via panelerne (samme resultat som håndregningen)', async () => {
  await page.evaluate((c) => {
    localStorage.setItem('le-tur-2026:content', JSON.stringify(c));
    localStorage.removeItem('le-tur-2026:game');
    location.hash = '#/1';
  }, { riders });
  await page.reload();
  await waitReload();
  const panel = page.locator('.commissioner');
  const section = (title) => panel.locator('.panel-section').filter({ has: page.locator('h3', { hasText: title }) });
  const fill = async (label, value) => {
    const f = panel.getByLabel(label, { exact: true });
    await f.fill(value);
    await f.press('Enter');
  };
  const tab = (n) => panel.locator('.stage-tab', { hasText: new RegExp(`^${n}`) }).click();
  const finish = () => panel.getByRole('button', { name: 'Afslut etapen' }).click();

  // "Kør etapen" på rutesiden åbner panelet på den rigtige etape
  const total = await slideCount();
  for (let i = 1; i <= total; i++) {
    await page.evaluate((n) => (location.hash = `#/${n}`), i);
    await page.waitForTimeout(40);
    if ((await sceneText()).includes('Ruten: Prolog')) break;
  }
  await page.mouse.move(300, 300);
  await page.locator('.run-stage').click();
  await panel.waitFor();
  expect((await panel.locator('.stage-head').innerText()).includes('Etape 1'), 'Kør etapen åbnede ikke etape 1');

  // Etape 1: stopur (røgtest) og derefter præcise tider manuelt
  await section('Stopur').getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(350);
  await section('Stopur').locator('.split-btn', { hasText: 'Anna' }).click();
  const t = await section('Stopur').locator('.split.done .split-time').first().innerText();
  expect(/^0,[2-9]|^1,/.test(t), `stopuret registrerede ikke en tid (${t})`);
  await section('Stopur').getByRole('button', { name: 'Stop' }).click();
  await section('Stopur').getByRole('button', { name: 'Nulstil ur' }).click();
  for (const [n, v] of [['Anna', '8,4'], ['Bent', '10,1'], ['Carl', '7,9'], ['Dorte', '12'], ['Erik', '9,5'], ['Frida', '15,2']]) await fill(`Tid for ${n}`, v);
  await finish();

  // Etape 2: rækkefølge, fortryd, samme kort (Carrot) og bonusser
  await tab(2);
  const order = section('Rækkefølge');
  for (const n of ['Bent', 'Anna', 'Frida']) await order.getByRole('button', { name: `+ ${n}` }).click();
  await order.getByRole('button', { name: '+ Dorte' }).click(); // fejlklik
  await page.keyboard.press('Control+z');
  expect(!(await order.locator('.order-list').innerText()).includes('Dorte'), 'Ctrl+Z fortrød ikke');
  await order.getByRole('button', { name: 'Samme kort – Carrot in the Box' }).click();
  await order.getByRole('button', { name: 'Carl' }).click();
  await order.getByRole('button', { name: 'Erik' }).click();
  await order.getByRole('button', { name: 'Kør Carrot in the Box' }).click();
  await order.getByRole('button', { name: '🥕 Vælg tredje rytter' }).click();
  const duelText = await page.locator('.scene').innerText();
  expect(/Carl\s+mod\s+Erik/i.test(duelText) && /udpeger/.test(duelText), 'Carrot-duellen vises ikke på skærmen: ' + duelText.slice(0, 200));
  await order.locator('.order-picker').getByRole('button', { name: 'Carl' }).click();
  await order.getByRole('button', { name: '+ Dorte' }).click();
  const bonus = section('Bonusser');
  await bonus.locator('.bonus-row').nth(0).getByRole('button', { name: 'Frida' }).click();
  await bonus.locator('.bonus-row').nth(1).getByRole('button', { name: 'Dorte' }).click();
  await finish();

  // Etape 3: udbrudsforsøget – Anna spiller i appen (fast blanding), resten tastes manuelt
  await tab(3);
  await page.evaluate(() => (Math.random = () => 0.99)); // sorteret bunke: 2♠, 3♠, 4♠ …
  const hl = section('Udbrudsforsøget');
  await hl.locator('.toggle', { hasText: 'Anna' }).click();
  for (let i = 0; i < 3; i++) await hl.getByRole('button', { name: '▲ Højere' }).click(); // 3♠, 4♠, 5♠
  await hl.getByRole('button', { name: '▼ Lavere' }).click(); // 6♠ – forkert
  expect((await hl.innerText()).includes('Hentet af feltet efter 3 rigtige'), 'forsøget i appen blev ikke talt rigtigt');
  const scr = await page.locator('.scene').innerText();
  expect(/Udbrudsforsøget/i.test(scr) && scr.includes('Hentet af feltet!'), 'udbrudsforsøget vises ikke på skærmen');
  await page.keyboard.press('Escape');
  for (const [n, v] of [['Bent', '2'], ['Carl', '5'], ['Dorte', '1'], ['Erik', '4'], ['Frida', '0']]) await fill(`Udbrud for ${n}`, v);
  await finish();

  // Etape 4: beerpong, terningsum og bajer-tider
  await tab(4);
  for (const n of ['Bent', 'Erik']) await section('Beerpong').locator('.toggle', { hasText: n }).click();
  await fill('Terningsum for Bent', '7');
  await fill('Terningsum for Erik', '11');
  for (const [n, v] of [['Anna', '9'], ['Bent', '14'], ['Carl', '8'], ['Dorte', '11,5'], ['Erik', '16'], ['Frida', '10']]) await fill(`Bajer-tid for ${n}`, v);
  await finish();

  // Etape 5: først Vinokourov (kun Anna ramte), derefter knock-out med fire
  await tab(5);
  const shots = section('Beerpong');
  await shots.locator('.toggle', { hasText: 'Anna' }).click();
  await panel.getByRole('button', { name: 'Vis miraklet på skærmen' }).click();
  expect((await page.locator('.scene').innerText()).toLowerCase().includes('vinokourov-mirakel'), 'Vinokourov vises ikke');
  await page.keyboard.press('Escape');
  for (const n of ['Carl', 'Dorte', 'Frida']) await shots.locator('.toggle', { hasText: n }).click();
  await page.evaluate(() => (Math.random = () => 0.99)); // deterministisk parring: (Anna–Carl), (Dorte–Frida)
  await panel.getByRole('button', { name: /Start knock-out/ }).click();
  const br = panel.locator('.bracket');
  await br.locator('.duel').nth(0).getByRole('button', { name: 'Carl' }).click();
  await br.locator('.duel').nth(1).getByRole('button', { name: 'Dorte' }).click();
  await panel.getByRole('button', { name: 'Næste runde (tilfældig parring)' }).click();
  await br.locator('.bracket-round').nth(1).getByRole('button', { name: 'Dorte' }).click();
  expect((await panel.innerText()).includes('Dorte vinder Champs-Élysées'), 'ingen vinder');
  await finish();

  // Genåbn og afslut igen
  await tab(1);
  await panel.getByRole('button', { name: 'Genåbn etapen' }).click();
  expect(/i gang/i.test(await panel.locator('.stage-head').innerText()), 'genåbning virker ikke');
  await finish();
  await page.keyboard.press('k');

  // Klassementet skal stemme med håndregningen
  await page.keyboard.press('s');
  await page.waitForTimeout(300);
  const ov = await page.locator('.scene').innerText();
  for (const s of ['Efter 5 af 5 etaper', '6,9', '+3,5', '+19,3', '80 p', '70 p', '29 p', '22 p']) expect(ov.includes(s), `klassement mangler "${s}"`);
  await page.keyboard.press('Escape');

  // Spiltilstanden overlever genindlæsning
  await page.reload();
  await waitReload();
  await page.keyboard.press('s');
  await page.waitForTimeout(300);
  expect((await page.locator('.scene').innerText()).includes('80 p'), 'resultater ikke bevaret efter genindlæsning');
  await page.keyboard.press('Escape');
});

await step('Klassement, stilling og podie viser resultater fra spiltilstanden (fuldt løb med 6 ryttere)', async () => {
  // Samme løb som håndregningen i src/game/scoring.test.ts (a–f = r1–r6).
  const gameState = fullRun();
  await page.evaluate(
    ([c, g]) => {
      localStorage.setItem('le-tur-2026:content', JSON.stringify(c));
      localStorage.setItem('le-tur-2026:game', JSON.stringify(g));
      location.hash = '#/1';
    },
    [{ riders }, gameState],
  );
  await page.reload();
  await waitReload();
  await page.keyboard.press('s');
  await page.waitForTimeout(300);
  if (process.env.E2E_SHOTS) await page.screenshot({ path: `${process.env.E2E_SHOTS}/klassement.png` });
  const overlay = await page.locator('.scene').innerText();
  expect(/Efter 5 af 5 etaper/.test(overlay), 'overlay viser ikke 5 etaper');
  expect(overlay.includes('6,9'), 'førerens tid 6,9 mangler');
  expect(overlay.includes('80 p') && overlay.includes('29 p'), 'point mangler');
  await page.keyboard.press('Escape');
  // Podiet er sidste slide
  await page.keyboard.press('End');
  await page.waitForTimeout(400);
  if (process.env.E2E_SHOTS) await page.screenshot({ path: `${process.env.E2E_SHOTS}/podie.png` });
  const podium = await sceneText();
  for (const n of ['Carl', 'Anna', 'Bent', 'Erik']) expect(podium.includes(n), `${n} mangler på podiet`);
  // Stilling efter etape 3: Carl fører med 4,9
  const total = await slideCount();
  for (let i = 1; i <= total; i++) {
    await page.evaluate((n) => (location.hash = `#/${n}`), i);
    await page.waitForTimeout(60);
    const t = await sceneText();
    if (t.includes('Stillingen efter etape 3')) {
      if (process.env.E2E_SHOTS) await page.screenshot({ path: `${process.env.E2E_SHOTS}/stilling-3.png` });
      expect(t.includes('4,9'), 'stilling efter etape 3 forkert');
      return;
    }
  }
  throw new Error('fandt ikke stilling efter etape 3');
});

if (errors.length) {
  failed++;
  console.log('✗ Fejl i siden:\n   ' + errors.join('\n   '));
}
await context.close();
rmSync(userDir, { recursive: true, force: true });
console.log(failed ? `\n${failed} trin fejlede` : '\nAlle e2e-trin bestået');
process.exit(failed ? 1 : 0);
