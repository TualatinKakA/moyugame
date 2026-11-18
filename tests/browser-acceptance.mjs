import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createSaveState } from '../src/systems/state.js';
import { SAVE_KEY } from '../src/systems/persistence.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 4189;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;
const visible = (page, selector) => page.locator(selector).isVisible();
const noOverflow = async (page, label) => {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(size.document <= size.viewport, `${label}: horizontal overflow ${size.document} > ${size.viewport}`);
};
const closeStory = async (page, id) => {
  const overlay = page.locator(`.story-overlay[data-story-id="${id}"]`);
  await overlay.waitFor(); await overlay.locator('[data-action="close-story"]').click();
};

try {
  for (let index = 0; index < 30; index++) { try { await fetch(origin); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); } }
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const errors = [], missing = [];
  const watch = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
  };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); watch(page);
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.locator('[data-action="start"]').click();
  await page.locator('.story-overlay[data-story-id="intro.onboarding"]').waitFor();
  assert.equal(await page.locator('.story-title').textContent(), '第一天');
  await closeStory(page, 'intro.onboarding');
  await page.locator('.work-btn').click();
  await closeStory(page, 'intro.first_wage');
  assert.equal(await page.locator('#coins').textContent(), '¥ 1');
  assert.equal(await page.locator('#clickReward').textContent(), '¥ 1.1');
  await page.locator('#logToggle').click();
  assert.equal(await visible(page, '#eventLog'), true);
  assert.ok(await page.locator('#logClose').evaluate(button => button.getBoundingClientRect().height >= 44));
  await page.locator('#logClose').click();
  assert.equal(await page.locator('#eventLog').isHidden(), true);
  await page.locator('#logToggle').click(); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#eventLog').isHidden(), true);
  await page.locator('#logToggle').click(); await page.locator('#workArea .work-context').click();
  assert.equal(await page.locator('#eventLog').isHidden(), true);
  await context.close();

  const seeded = createSaveState({ now: 1000, contentVersions: ['base-v1'] });
  seeded.resources.coins = 1e12; seeded.resources.mana = 10000; seeded.resources.gems = 100; seeded.stats.total.clicks = 1;
  const gameContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await gameContext.addInitScript(({ key, json }) => localStorage.setItem(key, json), { key: SAVE_KEY, json: JSON.stringify(seeded) });
  const gamePage = await gameContext.newPage(); watch(gamePage);
  await gamePage.goto(origin, { waitUntil: 'domcontentloaded' });
  await gamePage.locator('#retirementPanel .retirement-card').waitFor();
  const playerCopy = await gamePage.locator('body').textContent();
  assert.doesNotMatch(playerCopy, /本地自动存档|数值规则独立配置|无外部运行依赖|内容包|schema|运行时|当前版本|本次更新|手机显示|桌面最多/);
  assert.equal(await gamePage.locator('#facilityRail [data-building-card]').count(), 3);
  await gamePage.waitForFunction(() => [...document.querySelectorAll('.building-icon, .inline-icon')].every(image => image.complete && image.naturalWidth > 0));
  assert.equal(await gamePage.locator('#facilityRail .building-icon').count(), 3);
  assert.equal(await gamePage.locator('#workContent .skill-btn .inline-icon').count(), 2);
  assert.equal(await gamePage.locator('#workContent .skill-btn').count(), 2);
  assert.equal(await gamePage.locator('#workContent .skill-bar').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
  assert.equal(await gamePage.locator('#workContent .workstation-img').count(), 1);
  assert.equal(await gamePage.locator('#workContent .keyboard-img').count(), 0);
  assert.equal(await gamePage.locator('.work-label').count(), 0);

  await gamePage.locator('.app-nav [data-tab="factions"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-choice-card]').count(), 2, 'only two alignments before selection');
  await gamePage.locator('#mainPanel [data-action="purchase"][data-id="good"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-choice-card]').count(), 1, 'selected alignment is replaced by Fairy');
  assert.equal(await gamePage.locator('#mainPanel [data-choice-card="goblin"]').count(), 0);
  await gamePage.locator('#mainPanel [data-action="purchase"][data-id="fairy"]').click();
  await closeStory(gamePage, 'intro.first_department');
  assert.equal(await gamePage.locator('#factionName').textContent(), '产品部');
  await gamePage.locator('[data-action="close-panel"]').click();

  await gamePage.locator('.app-nav [data-tab="buildings"]').click();
  await gamePage.locator('#mainPanel [data-id="farm"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-id="farm"] [data-field="count"]').textContent(), '× 1');
  await gamePage.locator('#mainPanel [data-action="buy-amount"][data-value="10"]').click();
  assert.equal(await visible(gamePage, '#mainPanel [data-id="farm"] [data-field="output"]'), true, 'mobile building card shows purchase production');
  assert.equal(await gamePage.locator('#mainPanel [data-id="farm"] [data-field="output"]').textContent(), '本次 +¥ 20 / 秒');
  await gamePage.locator('#mainPanel [data-id="farm"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-id="farm"] [data-field="count"]').textContent(), '× 11');
  await gamePage.locator('[data-action="close-panel"]').click();

  await gamePage.locator('.app-nav [data-tab="upgrades"]').click();
  await gamePage.locator('[data-upgrade-card="gemPower"]').waitFor();
  await gamePage.locator('[data-upgrade-card="gemPower"] [data-action="purchase"]').click();
  assert.equal(await gamePage.locator('#production').textContent(), '¥ 66', 'Gem Power applies 2% production per gem');
  await gamePage.locator('[data-action="close-panel"]').click();

  assert.equal(await gamePage.locator('#workContent .skill-btn').count(), 3, 'mobile quick bar caps at three');
  await gamePage.locator('#workContent [data-tab="skills"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-skill-row]').count(), 4);
  await noOverflow(gamePage, 'skill library');
  await gamePage.locator('[data-skill-row="fairyChanting"] [data-action="prioritize-skill"]').click();
  assert.equal(await gamePage.locator('#workContent .skill-btn').first().getAttribute('data-id'), 'fairyChanting');
  await gamePage.locator('[data-skill-row="fairyChanting"] [data-action="cast"]').click();
  assert.match(await gamePage.locator('#workContent [data-id="fairyChanting"]').getAttribute('class'), /active/);
  assert.match(await gamePage.locator('#toast').textContent(), /第一次施法/);
  await gamePage.locator('[data-action="close-panel"]').click();

  await gamePage.locator('#moreTabButton').click();
  assert.match(await gamePage.locator('#mainPanel').textContent(), /奖杯[\s\S]*剧情回看/);
  await gamePage.locator('[data-action="replay-story"][data-id="intro.first_department"]').last().click();
  assert.equal(await gamePage.locator('.story-overlay[data-story-id="intro.first_department"]').count(), 1);
  const hashBeforeReplay = await gamePage.evaluate(() => document.querySelector('#coins').textContent);
  await gamePage.locator('.story-overlay [data-action="close-story"]').click();
  assert.equal(await gamePage.locator('#coins').textContent(), hashBeforeReplay, 'replay does not grant rewards');
  await gamePage.locator('[data-action="close-panel"]').click();

  for (const [width, height] of [[320, 568], [390, 844], [520, 740], [768, 1024], [900, 700], [1024, 768], [1440, 730], [1440, 900]]) {
    await gamePage.setViewportSize({ width, height }); await gamePage.waitForTimeout(200);
    await noOverflow(gamePage, `${width}px`);
    assert.equal(await visible(gamePage, '#workArea #retirementPanel'), true);
    assert.equal(await visible(gamePage, '#workArea .work-zone'), true);
    const layout = await gamePage.evaluate(() => {
      const zone = document.querySelector('.work-zone').getBoundingClientRect();
      const image = document.querySelector('.workstation-img').getBoundingClientRect();
      const screen = document.querySelector('.monitor-screen').getBoundingClientRect();
      return { imageTop: image.top, imageBottom: image.bottom, zoneTop: zone.top, zoneBottom: zone.bottom, screenBottom: screen.bottom, keyboardTop: image.top + image.height * (158 / 208) };
    });
    assert.ok(layout.imageTop >= layout.zoneTop - 1, `${width}px: combined workstation is not clipped at top: ${JSON.stringify(layout)}`);
    assert.ok(layout.imageBottom <= layout.zoneBottom + 1, `${width}px: combined workstation is not clipped at bottom`);
    assert.ok(layout.screenBottom <= layout.keyboardTop + 1, `${width}px: keyboard does not cover screen`);
    if (width <= 900) {
      await gamePage.locator('.app-nav [data-tab="buildings"]').click();
      assert.equal(await visible(gamePage, '#mainPanel'), true);
      await gamePage.locator('.app-nav [data-tab="buildings"]').click();
      assert.equal(await gamePage.locator('#mainPanel').isHidden(), true);
      await gamePage.locator('.app-nav [data-tab="buildings"]').click(); await gamePage.keyboard.press('Escape');
      assert.equal(await gamePage.locator('#mainPanel').isHidden(), true);
      await gamePage.locator('.app-nav [data-tab="buildings"]').click(); await gamePage.evaluate(() => history.back());
      await gamePage.waitForTimeout(100); assert.equal(await gamePage.locator('#mainPanel').isHidden(), true);
    }
  }
  await gamePage.setViewportSize({ width: 1440, height: 900 });
  await gamePage.locator('.app-nav [data-tab="building-upgrades"]').click();
  assert.equal(await gamePage.locator('#mainPanel h2').textContent(), '设施升级');
  assert.equal(await gamePage.locator('#mainPanel [data-upgrade-card="gemPower"]').count(), 0);
  await gamePage.locator('[data-action="close-panel"]').click();
  await gamePage.locator('.app-nav [data-tab="misc-upgrades"]').click();
  assert.equal(await gamePage.locator('#mainPanel h2').textContent(), '通用升级');
  assert.equal(await gamePage.locator('#mainPanel [data-upgrade-card="gemPower"]').count(), 1);
  await gamePage.locator('[data-action="close-panel"]').click();
  await gamePage.locator('.app-nav [data-tab="factions"]').click();
  assert.equal(await gamePage.locator('#mainPanel [data-upgrade-card="fairy-1"]').count(), 1);
  await gamePage.locator('[data-action="close-panel"]').click();
  await gamePage.waitForTimeout(600);
  await gamePage.locator('#upgradeRail [data-id="fairy-1"]').click();
  assert.equal(await gamePage.locator('#upgradeRail [data-id="fairy-1"]').count(), 0, 'quick upgrade disappears after purchase');
  await gameContext.close();

  const retireState = createSaveState({ now: 1000, contentVersions: ['base-v1'] });
  retireState.stats.total.clicks = 1; retireState.stats.run.coins = 1e8; retireState.resources.coins = 1e8;
  const retireContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await retireContext.addInitScript(({ key, json }) => localStorage.setItem(key, json), { key: SAVE_KEY, json: JSON.stringify(retireState) });
  const retirePage = await retireContext.newPage(); watch(retirePage);
  await retirePage.goto(origin, { waitUntil: 'domcontentloaded' });
  retirePage.once('dialog', dialog => dialog.accept());
  await retirePage.locator('#retirementButton').click();
  await closeStory(retirePage, 'intro.first_retirement');
  assert.equal(await retirePage.locator('#gems').textContent(), '0');
  await retirePage.locator('#moreTabButton').click();
  assert.equal(await retirePage.locator('[data-action="reincarnate"]').count(), 0, 'reincarnation is hidden below the original gem requirement');
  await retireContext.close();

  const resetState = createSaveState({ now: 1000, contentVersions: ['base-v1'] });
  resetState.resources.coins = 500; resetState.stats.total.clicks = 1;
  const resetContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await resetContext.addInitScript(({ key, json }) => {
    if (!sessionStorage.getItem('acceptance-seeded')) {
      localStorage.setItem(key, json);
      sessionStorage.setItem('acceptance-seeded', '1');
    }
  }, { key: SAVE_KEY, json: JSON.stringify(resetState) });
  const resetPage = await resetContext.newPage(); watch(resetPage);
  await resetPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await resetPage.locator('#moreTabButton').click();
  resetPage.once('dialog', dialog => dialog.accept());
  await Promise.all([
    resetPage.waitForLoadState('load'),
    resetPage.locator('[data-action="hard-reset"]').click(),
  ]);
  const cleared = await resetPage.evaluate(key => ({
    main: localStorage.getItem(key),
    previous: localStorage.getItem(`${key}:previous`),
    corrupt: localStorage.getItem(`${key}:corrupt`),
  }), SAVE_KEY);
  assert.deepEqual(cleared, { main: null, previous: null, corrupt: null }, 'hard reset does not resurrect state during unload');
  assert.equal(await resetPage.locator('#intro').isVisible(), true, 'hard reset returns to the onboarding screen');
  assert.equal(await resetPage.locator('#coins').textContent(), '¥ 0');
  await resetContext.close();

  assert.deepEqual(errors, [], `browser errors: ${errors.join('\n')}`);
  assert.deepEqual(missing, [], `404 responses: ${missing.join('\n')}`);
  console.log('Browser acceptance passed: prologue, transactions, Fairy/Goblin scope, trophies/replay, skill management, workstation and responsive layouts.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
