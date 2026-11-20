import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
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
    response.writeHead(200, { 'content-type': mime[extension] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404); response.end();
  }
});
await new Promise(resolveListen => server.listen(4190, '127.0.0.1', resolveListen));
let browser;
const errors = [];
const missing = [];

function seededState() {
  const state = createSaveState({ now: Date.now() });
  state.stats.total.clicks = 1;
  state.resources.coins = 1e20;
  state.resources.mana = 1e9;
  return state;
}
async function makePage(state, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(({ key, saved }) => {
    localStorage.setItem('endless-shift-user-id', '阶段二验收员');
    localStorage.setItem(key, JSON.stringify(saved));
  }, { key: SAVE_KEY, saved: state });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
  await page.goto('http://127.0.0.1:4190/', { waitUntil: 'domcontentloaded' });
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
async function openTab(page, tab) {
  await page.locator(`.app-nav [data-tab="${tab}"]:visible`).click();
}
async function buyUpgrade(page, id) {
  const card = page.locator(`#mainPanel [data-upgrade-card="${id}"]`);
  await card.waitFor();
  const result = await card.locator('[data-action="purchase"]').click();
  return result;
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
  const configs = [
    ['fairy', 'good', 'fairyChanting', 'fairyHeritage', 'fairyChoir', 'fairyChoirUpgrade'],
    ['elven', 'good', 'moonBlessing', 'elvenHeritage', 'sunBlessing', 'sunBlessingUpgrade'],
    ['angel', 'good', 'godsHand', 'angelicHeritage', 'godsRest', 'godsRestUpgrade'],
    ['goblin', 'evil', 'goblinsGreed', 'goblinHeritage', 'greedDrive', 'greedDriveUpgrade'],
    ['undead', 'evil', 'nightTime', 'undeadHeritage', 'trueNight', 'trueNightUpgrade'],
    ['demon', 'evil', 'hellfireBlast', 'demonicHeritage', 'hellRush', 'hellRushUpgrade'],
  ];
  for (const [faction, alignment, spell, heritage, trophy, spellUpgrade] of configs) {
    const seeded = seededState();
    seeded.selections.alignment = alignment;
    seeded.resources.factionCoins[faction] = 10000;
    seeded.permanentUnlocks[trophy] = true;
    const { context, page } = await makePage(seeded);
    await openTab(page, 'factions');
    assert.equal(await page.locator('#mainPanel [data-choice-card]').count(), 5, `${faction}: three same-alignment factions plus two alignment cards`);
    await page.locator(`#mainPanel [data-choice-card="${faction}"] [data-action="purchase"]`).click();
    await closeStories(page);
    for (const id of [`${faction}-1`, `${faction}-2`, `${faction}-3`, `${faction}-pact`, `${faction}-4`, `${faction}-5`, `${faction}-6`, `${faction}-alliance`, `${faction}-7`, `${faction}-8`, `${faction}-9`]) {
      await buyUpgrade(page, id);
    }
    await buyUpgrade(page, heritage);
    await buyUpgrade(page, spellUpgrade);
    await page.locator('#mainPanel [data-action="close-panel"]').click();
    await page.locator('#workContent [data-tab="skills"]').click();
    await page.locator(`[data-skill-row="${spell}"] [data-action="cast"]`).click();
    assert.match(await page.locator(`[data-skill-row="${spell}"] [data-action="cast"]`).getAttribute('class'), /active/);
    const saved = await storedState(page);
    assert.equal(saved.selections.faction, faction);
    assert.equal(saved.permanentUnlocks[`${faction}Champion`], true);
    assert.equal(saved.permanentUnlocks[trophy], true);
    assert.equal(saved.owned.run[heritage], true);
    assert.equal(saved.owned.run[spellUpgrade], true);
    assert.ok(saved.timers.spells[spell]);
    await imagesLoaded(page);
    await noOverflow(page, `${faction} desktop`);
    await context.close();
  }

  const marketState = seededState();
  marketState.selections.alignment = 'good';
  marketState.resources.factionCoins.fairy = 1000;
  marketState.permanentUnlocks.fairyChampion = true;
  const market = await makePage(marketState);
  const hallCard = market.page.locator('#facilityRail [data-building-card][data-id="hallOfLegends"]');
  await hallCard.click();
  assert.equal(await hallCard.locator('[data-field="count"]').textContent(), '× 1');
  await hallCard.hover();
  assert.match(await hallCard.locator('[data-field="hall-metrics"]').textContent(), /原版奖杯 1/);
  await openTab(market.page, 'factions');
  await market.page.locator('#mainPanel [data-action="buy-amount"][data-value="10"]').click();
  await market.page.locator('[data-exchange-card="fairyExchange"] [data-action="purchase"]').click();
  const marketSaved = await storedState(market.page);
  assert.equal(marketSaved.buildings.hallOfLegends, 1);
  assert.equal(marketSaved.royalExchange.fairy, 10);
  assert.equal(marketSaved.resources.factionCoins.fairy, 682);
  await imagesLoaded(market.page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await market.page.setViewportSize({ width, height: 900 });
    await market.page.waitForTimeout(100);
    await noOverflow(market.page, `Royal Market ${width}px`);
  }
  await market.context.close();

  const bonusState = seededState();
  bonusState.selections.alignment = 'good';
  bonusState.buildings.hallOfLegends = 750;
  bonusState.resources.coins = 1e46;
  const bonus = await makePage(bonusState);
  await openTab(bonus.page, 'building-upgrades');
  await buyUpgrade(bonus.page, 'hallBonus1');
  const bonusSaved = await storedState(bonus.page);
  assert.equal(bonusSaved.owned.run.hallBonus1, true);
  await imagesLoaded(bonus.page);
  await bonus.context.close();

  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  assert.deepEqual(missing, [], `404 responses: ${missing.join('\n')}`);
  console.log('Stage two browser acceptance passed: six faction loops, spell upgrades, Heritage, Royal Exchange batch, Hall, Hall Bonus, assets and 320–1440px layouts.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
