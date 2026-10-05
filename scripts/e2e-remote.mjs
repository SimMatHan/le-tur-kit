// End-to-end-test af fjernbetjeningen mod det rigtige relæ (wrangler dev med
// Durable Objects). Skærmen åbnes fra disk (file://), telefonen som mobil.
//
// Brug: npm run build && node scripts/e2e-remote.mjs
import { chromium, devices } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { riders } from './fixtures.mjs';

const PORT = 8788;
const RELAY = `http://127.0.0.1:${PORT}`;
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

// 1) Start relæet lokalt
const wrangler = spawn('npx', ['--yes', 'wrangler@4', 'dev', '--config', 'remote/wrangler.toml', '--port', String(PORT), '--ip', '127.0.0.1'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
});
let log = '';
wrangler.stdout.on('data', (d) => (log += d));
wrangler.stderr.on('data', (d) => (log += d));
const stopRelay = () => {
  try {
    process.kill(-wrangler.pid, 'SIGTERM');
  } catch {
    /* allerede stoppet */
  }
};
process.on('exit', stopRelay);

for (let i = 0; ; i++) {
  try {
    if ((await fetch(`${RELAY}/health`)).ok) break;
  } catch {
    /* ikke klar endnu */
  }
  if (i > 90) {
    console.error('Relæet startede ikke:\n' + log);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const browser = await chromium.launch({ executablePath });
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
const shot = async (page, name) => process.env.E2E_SHOTS && page.screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png` });
const expect = (c, m) => {
  if (!c) throw new Error(m);
};
const until = async (fn, msg, ms = 5000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(msg);
};

// 2) Skærmen (file://) med 6 navngivne ryttere
const screenCtx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const screen = await screenCtx.newPage();
screen.on('dialog', (d) => d.accept());
const errors = [];
screen.on('pageerror', (e) => errors.push('skærm: ' + e.message));
await screen.addInitScript((c) => {
  if (!sessionStorage.getItem('init')) {
    sessionStorage.setItem('init', '1');
    localStorage.clear();
    localStorage.setItem('le-tur-2026:content', JSON.stringify(c));
  }
}, { riders });
await screen.goto(pathToFileURL(resolve('dist/index.html')).href + '#/1');
await screen.waitForSelector('.scene');
// Små bogstaver: overskrifter står med versaler via CSS, og innerText følger text-transform.
const screenText = async () => (await screen.locator('.scene').innerText()).toLowerCase();
const screenGame = () => screen.evaluate(() => JSON.parse(localStorage.getItem('le-tur-2026:game') || '{}'));

let link;
await step('Skærmen starter fjernbetjening og viser QR-kode og link', async () => {
  await screen.mouse.move(200, 200);
  await screen.locator('.ctrl', { hasText: 'Opsætning' }).click();
  await screen.getByLabel('Relæ-adresse').fill(RELAY);
  await screen.getByRole('button', { name: 'Start fjernbetjening' }).click();
  await screen.getByText('Forbundet til relæet').waitFor({ timeout: 8000 });
  expect(await screen.locator('.remote-qr svg').count(), 'ingen QR-kode');
  link = await screen.getByLabel('Link til telefonen').inputValue();
  await screen.getByText('ingen telefon endnu').waitFor();
  await shot(screen, 'remote-setup');
  expect(/\?remote=[A-Z2-9]{12}$/.test(link), 'forkert link: ' + link);
  await screen.keyboard.press('Escape');
});

// 3) Telefonen åbner linket (appen hentes fra relæet)
const phoneCtx = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined });
const phone = await phoneCtx.newPage();
phone.on('dialog', (d) => d.accept());
phone.on('pageerror', (e) => errors.push('telefon: ' + e.message));
const panel = phone.locator('.commissioner');

await step('Telefonen forbinder og får skærmens rytternavne', async () => {
  await phone.goto(link);
  await phone.getByText('Skærmen er forbundet').waitFor({ timeout: 8000 });
  await panel.waitFor();
  await phone.locator('.stage-tab', { hasText: /^1/ }).click();
  await panel.getByLabel('Tid for Anna', { exact: true }).waitFor();
});

await step('Slides styres fra telefonen (næste og spring til slide)', async () => {
  await phone.getByRole('button', { name: 'Næste slide' }).click();
  await until(async () => (await screen.evaluate(() => location.hash)) === '#/2', 'skærmen skiftede ikke til slide 2');
  const opts = await phone.locator('select[aria-label="Gå til slide"] option').allInnerTexts();
  const idx = opts.findIndex((t) => t.includes('Ruten: Prolog'));
  await phone.selectOption('select[aria-label="Gå til slide"]', String(idx));
  await until(async () => (await screenText()).includes('etape 1 · ruten'), 'skærmen viser ikke ruten for etape 1');
  // Panelet følger etapen
  await until(async () => (await panel.locator('.stage-head').innerText()).includes('Etape 1'), 'panelet fulgte ikke etapen');
});

await step('Tider tastet på telefonen giver klassementet på skærmen', async () => {
  for (const [n, v] of [['Anna', '8,4'], ['Bent', '10,1'], ['Carl', '7,9'], ['Dorte', '12'], ['Erik', '9,5'], ['Frida', '15,2']]) {
    const f = panel.getByLabel(`Tid for ${n}`, { exact: true });
    await f.fill(v);
    await f.press('Enter');
  }
  await until(async () => Object.keys((await screenGame()).stages?.[1]?.input?.times ?? {}).length === 6, 'tiderne nåede ikke skærmen');
  await phone.getByRole('button', { name: 'Vis klassement' }).click();
  await until(async () => /klassementet/.test(await screenText()) && (await screenText()).includes('7,9'), 'klassementet vises ikke på skærmen');
  await phone.getByRole('button', { name: 'Skjul klassement' }).click();
  await until(async () => !/klassementet/.test(await screenText()), 'klassementet blev ikke skjult');
});

await step('Fortryd på telefonen fortryder på skærmen', async () => {
  const f = panel.getByLabel('Tid for Frida', { exact: true });
  await f.fill('99');
  await f.press('Enter');
  await until(async () => (await screenGame()).stages[1].input.times.r6 === 99, 'rettelsen nåede ikke skærmen');
  await panel.getByRole('button', { name: /Fortryd/ }).click();
  await until(async () => (await screenGame()).stages[1].input.times.r6 === 15.2, 'fortryd nåede ikke skærmen');
});

await step('Stopuret startes på telefonen og vises på skærmen med samme tid', async () => {
  await panel.getByRole('button', { name: 'Vis på skærm' }).first().click();
  await until(async () => /ETAPE 1 · PROLOG/i.test(await screenText()), 'stopuret vises ikke på skærmen');
  await panel.getByRole('button', { name: 'Start' }).click();
  await phone.waitForTimeout(1500);
  await shot(phone, 'remote-phone-stopur');
  const read = async (p, sel) => parseFloat((await p.locator(sel).first().innerText()).replace(',', '.'));
  const s = await read(screen, '.proj-stopwatch .clock-face');
  const p = await read(phone, '.stopwatch .clock-face');
  expect(s >= 1 && Math.abs(s - p) <= 0.5, `ure er ude af takt: skærm ${s}, telefon ${p}`);
  await panel.getByRole('button', { name: 'Stop' }).click();
  await panel.getByRole('button', { name: 'Nulstil ur' }).click();
  await phone.getByRole('button', { name: 'Luk overlay på skærmen' }).click();
  await until(async () => !/ETAPE 1 · PROLOG/i.test(await screenText()), 'overlay blev ikke lukket');
});

await step('Udbrudsforsøget: telefonen trækker kort, skærmen viser dem', async () => {
  await phone.locator('.stage-tab', { hasText: /^3/ }).click();
  await phone.evaluate(() => (Math.random = () => 0.99)); // sorteret bunke: 2♠, 3♠, 4♠ …
  await panel.locator('.toggle', { hasText: 'Erik' }).click();
  await until(async () => /Udbrudsforsøget/i.test(await screenText()) && (await screenText()).includes('erik'), 'udbrudsforsøget vises ikke på skærmen');
  await panel.getByRole('button', { name: '▲ Højere' }).click();
  await panel.getByRole('button', { name: '▲ Højere' }).click();
  await until(async () => (await screen.locator('.playing-card').count()) === 3, 'kortene vises ikke på skærmen');
  await shot(phone, 'remote-phone-udbrud');
  await panel.getByRole('button', { name: '▼ Lavere' }).click();
  await until(async () => (await screenText()).includes('hentet af feltet!'), 'skærmen viser ikke, at rytteren er hentet');
  await shot(screen, 'remote-screen-udbrud');
  await until(async () => (await screenGame()).stages?.[3]?.input?.runs?.r5?.done === true, 'forsøget nåede ikke skærmen');
  await phone.getByRole('button', { name: 'Luk overlay på skærmen' }).click();
  await until(async () => !/Udbrudsforsøget/i.test(await screenText()), 'overlay blev ikke lukket');
});

await step('Nulstil etape fra telefonen', async () => {
  await panel.getByRole('button', { name: 'Nulstil etape 3' }).click();
  await until(async () => {
    const st = (await screenGame()).stages?.[3];
    return st && st.status === 'idle' && Object.keys(st.input.runs).length === 0;
  }, 'etape 3 blev ikke nulstillet på skærmen');
  expect((await screenGame()).stages[1].input.times.r1 === 8.4, 'andre etaper må ikke påvirkes');
});

await step('Telefonen kan genindlæses og får tilstanden igen', async () => {
  await phone.reload();
  await phone.getByText('Skærmen er forbundet').waitFor({ timeout: 8000 });
  await phone.locator('.stage-tab', { hasText: /^1/ }).click();
  await until(async () => (await panel.getByLabel('Tid for Anna', { exact: true }).inputValue()) === '8,4', 'telefonen fik ikke tilstanden igen');
});

if (errors.length) {
  failed++;
  console.log('✗ Fejl i siderne:\n   ' + errors.join('\n   '));
}
await browser.close();
stopRelay();
console.log(failed ? `\n${failed} trin fejlede` : '\nAlle fjernbetjenings-trin bestået');
process.exit(failed ? 1 : 0);
