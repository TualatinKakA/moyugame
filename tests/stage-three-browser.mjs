import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { CONTENT } from '../src/content/index.js';
import { createSaveState } from '../src/systems/state.js';
import { SAVE_KEY } from '../src/systems/persistence.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root)) { response.writeHead(403); response.end(); return; }
    const data = await readFile(file);
    const extension = file.slice(file.lastIndexOf('.'));
    if (!mime[extension]) console.error('Unregistered response type:', request.url, extension);
    response.writeHead(200, { 'content-type': mime[extension] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolveListen => server.listen(4191, '127.0.0.1', resolveListen));
let browser;
const errors = [];
const missing = [];

async function makePage(state, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(({ key, saved }) => {
    localStorage.setItem('endless-shift-user-id', '阶段三验收员');
    localStorage.setItem(key, JSON.stringify(saved));
  }, { key: SAVE_KEY, saved: state });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
  await page.goto('http://127.0.0.1:4191/', { waitUntil: 'domcontentloaded' });
  try {
    await page.locator('#retirementPanel .retirement-card').waitFor();
  } catch (error) {
    console.error('Page initialization body:', await page.locator('body').textContent());
    console.error('Page errors:', errors, 'Missing:', missing);
    throw error;
  }
  return { context, page };
}
async function closeStories(page) {
  for (let index = 0; index < 8; index++) {
    const button = page.locator('.story-overlay:visible [data-action="close-story"]');
    if (!await button.count()) return;
    await button.first().click();
  }
}
async function openTab(page, tab) { await page.locator(`.app-nav [data-tab="${tab}"]:visible`).click(); }
async function buyUpgrade(page, id) {
  const card = page.locator(`#mainPanel [data-upgrade-card="${id}"]`);
  await card.waitFor();
  await card.locator('[data-action="purchase"]').click();
}
async function storedState(page) {
  await page.locator('.top-actions [data-action="save"]').click();
  await page.waitForTimeout(80);
  return page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved.payload || saved;
  }, SAVE_KEY);
}
async function noOverflow(page, label) {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(size.document <= size.viewport, `${label}: horizontal overflow ${size.document} > ${size.viewport}`);
}
async function imagesLoaded(page) {
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
}

try {
  const executablePath = [
    process.env.CHROMIUM_PATH, chromium.executablePath(),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean).find(path => existsSync(path));
  browser = await chromium.launch({ headless: true, executablePath });

  const miscState = createSaveState({ now: Date.now() });
  miscState.resources.coins = 1e17;
  miscState.stats.total.clicks = 100000;
  miscState.buildings = { farm: 1, inn: 1, blacksmith: 1 };
  const misc = await makePage(miscState);
  await openTab(misc.page, 'misc-upgrades');
  for (let index = 1; index <= 6; index++) await buyUpgrade(misc.page, `clickingBase${index}`);
  await buyUpgrade(misc.page, 'unitaryUpgrade');
  const miscSaved = await storedState(misc.page);
  for (let index = 1; index <= 6; index++) assert.equal(miscSaved.owned.run[`clickingBase${index}`], true);
  assert.equal(miscSaved.owned.run.unitaryUpgrade, true);
  assert.equal(miscSaved.permanentUnlocks.unitaryTrophy, true);
  await imagesLoaded(misc.page);
  await misc.context.close();

  const a4State = createSaveState({ now: Date.now() });
  a4State.progression.reincarnations = 220;
  a4State.progression.ascension = 4;
  a4State.progression.ascensionStartR = 220;
  a4State.resources.coins = 1e85;
  a4State.resources.factionCoins.fairy = 1e28;
  const a4 = await makePage(a4State);
  await openTab(a4.page, 'factions');
  await a4.page.locator('[data-choice-card="good"] [data-action="purchase"]').click();
  await a4.page.locator('.story-overlay:visible [data-choice-id="confirm"]').click();
  await closeStories(a4.page);
  await a4.page.locator('[data-choice-card="fairy"] [data-action="purchase"]').click();
  await closeStories(a4.page);
  for (const id of ['fairy-1', 'fairy-2', 'fairy-3', 'fairy-pact', 'fairy-4', 'fairy-5', 'fairy-6', 'fairy-alliance', 'fairy-7', 'fairy-8', 'fairy-9']) await buyUpgrade(a4.page, id);
  const a4Saved = await storedState(a4.page);
  assert.equal(a4Saved.permanentUnlocks.fairyChampion, true);
  assert.equal(a4Saved.owned.run.fairyHeritage, undefined);
  await imagesLoaded(a4.page);
  await a4.context.close();

  const trophyState = createSaveState({ now: Date.now() });
  trophyState.stats.total.clicks = 1;
  for (const definition of CONTENT.definitions) if (definition.originalTrophy) trophyState.permanentUnlocks[definition.id] = true;
  const trophies = await makePage(trophyState);
  await trophies.page.locator('[data-tab="more"]').click();
  assert.match(await trophies.page.locator('#mainPanel').textContent(), /原版 430\/430/);
  assert.equal(await trophies.page.locator('[data-trophy-id]').count(), 0);
  await trophies.page.locator('[data-trophy-group="facility:farm"] [data-action="toggle-trophy-group"]').click();
  assert.equal(await trophies.page.locator('[data-trophy-id]').count(), 22);
  assert.equal(await trophies.page.locator('[data-trophy-id$="-building-trophy-22"]').count(), 1);
  assert.match(await trophies.page.locator('#mainPanel').textContent(), /R0 职业增益/);
  await imagesLoaded(trophies.page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await trophies.page.setViewportSize({ width, height: 900 });
    await trophies.page.waitForTimeout(100);
    await noOverflow(trophies.page, `Trophies ${width}px`);
  }
  await trophies.context.close();

  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  assert.deepEqual(missing, [], `404 responses: ${missing.join('\n')}`);
  console.log('Stage three browser acceptance passed: Misc, Secret upgrade, A4 progression, 430 trophies, assets and 320–1440px layouts.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
