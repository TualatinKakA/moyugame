import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createState, SAVE_KEY } from '../src/core/state.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 4189;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
let browser;

const visible = async (page, selector) => page.locator(selector).isVisible();
const noOverflow = async (page, label) => {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(size.document <= size.viewport, `${label}: horizontal overflow ${size.document} > ${size.viewport}`);
};
const closePanelWithWorkArea = async page => {
  await page.locator('#workArea .work-context').click();
  assert.equal(await page.locator('#mainPanel').isHidden(), true, 'clicking the work area closes the panel');
};

try {
  for (let i = 0; i < 30; i++) {
    try { await fetch(origin); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const seeded = createState();
  seeded.coins = 1e12;
  seeded.gems = 20;
  seeded.buildings.farm = 5;
  seeded.stats.run.coins = 1e12;
  seeded.stats.run.clicks = 100;
  seeded.stats.total.coins = 1e12;
  seeded.stats.total.clicks = 100;
  await context.addInitScript(({ key, json }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, json);
  }, { key: SAVE_KEY, json: JSON.stringify(seeded) });

  const page = await context.newPage();
  const errors = [];
  const missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('#retirementPanel .retirement-card').waitFor();
  await page.locator('.story-overlay').waitFor();
  await page.locator('.story-overlay [data-action="close-story"]').click();

  assert.equal(await visible(page, '#workArea #retirementPanel'), true, 'retirement lives inside workArea');
  assert.equal(await visible(page, '#facilityRail'), true, 'desktop facility rail is persistent');
  assert.equal(await page.locator('#facilityRail .building-card').count(), 3, 'Hall of Legends stays hidden before any alignment proof');
  assert.equal(await page.locator('#facilityRail .building-card button').count(), 0, 'facility card has no separate purchase button');
  assert.equal(await page.locator('#facilityRail .building-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
  const skillDescriptions = await page.locator('.skill-btn small').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent.trim(), display: getComputedStyle(node).display })));
  assert.ok(skillDescriptions.length > 0 && skillDescriptions.every(item => item.text && item.display !== 'none'), 'skill descriptions are visible');

  await page.locator('#facilityRail [data-id="farm"]').click();
  assert.equal(await page.locator('#facilityRail [data-id="farm"] [data-field="count"]').textContent(), '× 6', 'whole card purchases a facility');
  await page.locator('#facilityRail [data-action="buy-amount"][data-value="10"]').click();
  await page.locator('#facilityRail [data-id="farm"]').click();
  assert.equal(await page.locator('#facilityRail [data-id="farm"] [data-field="count"]').textContent(), '× 16', 'whole card respects bulk quantity');

  await page.locator('.app-nav [data-tab="building-upgrades"]').click();
  assert.equal(await visible(page, '#mainPanel'), true);
  assert.equal(await visible(page, '#workArea #retirementPanel'), true, 'retirement remains visible with a panel open');
  assert.equal(await visible(page, '#workArea .work-zone'), true, 'workstation remains visible with a panel open');
  const panelAndWork = await page.evaluate(() => ({ panelRight: document.querySelector('#mainPanel').getBoundingClientRect().right, workLeft: document.querySelector('#workArea').getBoundingClientRect().left }));
  assert.ok(panelAndWork.panelRight <= panelAndWork.workLeft, 'desktop auxiliary panel does not cover the workstation');
  assert.equal(await page.locator('#mainPanel .upgrade-icon.locked').count(), 0, 'locked upgrades are hidden');
  await page.locator('#mainPanel .upgrade-icon[data-kind="building"]').first().click();
  assert.equal(await visible(page, '#upgradeDetail'), true, 'upgrade icon opens its detail');
  await page.locator('#upgradeDetail [data-action="buy-building-upgrade"]').click();
  assert.equal(await page.locator('#upgradeDetail .primary').textContent(), '已生效');
  await page.evaluate(() => { window.__stableUpgradeIcon = document.querySelector('#mainPanel .upgrade-icon'); });
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__stableUpgradeIcon === document.querySelector('#mainPanel .upgrade-icon')), true, 'upgrade panel does not rebuild every second');
  await closePanelWithWorkArea(page);

  await page.evaluate(() => {
    window.__stableWork = document.querySelector('#workContent');
    window.__stableZone = document.querySelector('.work-zone');
  });
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__stableWork === document.querySelector('#workContent') && window.__stableZone === document.querySelector('.work-zone')), true, 'retirement updates do not rebuild workstation DOM');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#retirementButton').click();
  await page.locator('.story-overlay').waitFor();
  await page.locator('.story-overlay [data-action="close-story"]').click();
  if (await page.locator('.story-overlay').count()) await page.locator('.story-overlay [data-action="close-story"]').click();
  await page.locator('#retirementFeedback').waitFor({ state: 'visible' });
  assert.match(await page.locator('#retirementFeedback').textContent(), /退休完成，获得 .* 期权/);
  assert.equal(await page.locator('#pendingGemsValue').textContent(), '0');
  assert.equal(await page.locator('#retirementButton').isDisabled(), false, 'retirement remains available for the next run');
  assert.equal(await visible(page, '#workArea .work-btn'), true, 'new run workstation is immediately usable');

  await page.locator('#moreTabButton').click();
  const moreBounds = await page.locator('#mainPanel').evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    return { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2, viewportX: innerWidth / 2, viewportY: innerHeight / 2, isMoreDialog: panel.classList.contains('more-dialog') };
  });
  assert.equal(moreBounds.isMoreDialog, true, 'More uses its centered dialog variant');
  assert.ok(Math.abs(moreBounds.centerX - moreBounds.viewportX) < 2 && Math.abs(moreBounds.centerY - moreBounds.viewportY) < 2, 'More is centered on desktop');
  assert.equal(await page.locator('#mainPanel [data-action="abdicate"]').count(), 0, 'retirement is removed from More');
  assert.equal(await visible(page, '#mainPanel [data-action="reincarnate"]'), true, 'reincarnation remains in More');
  await page.locator('[data-action="close-panel"]').click();

  for (const tab of ['factions', 'audit', 'stats']) {
    await page.locator(`.app-nav [data-tab="${tab}"]`).click();
    assert.equal(await visible(page, '#mainPanel'), true, `${tab} panel opens`);
    await page.waitForTimeout(250);
    await page.locator('[data-action="close-panel"]').click();
  }

  for (const [width, height] of [[320, 568], [390, 844], [520, 740], [768, 1024], [900, 700], [1024, 768], [1440, 730], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await noOverflow(page, `${width}px`);
    assert.equal(await visible(page, '#workArea #retirementPanel'), true, `${width}px: retirement visible`);
    assert.equal(await visible(page, '#workArea .work-zone'), true, `${width}px: workstation visible`);
    if (width <= 900) {
      assert.equal(await page.locator('#facilityRail').isHidden(), true, `${width}px: desktop rail hidden`);
      await page.locator('.app-nav [data-tab="buildings"]').click();
      assert.equal(await visible(page, '#mainPanel'), true, `${width}px: drawer opens`);
      assert.equal(await page.locator('#mainPanel .building-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2, `${width}px: two facility columns`);
      const drawer = await page.locator('#mainPanel').boundingBox();
      assert.ok(drawer.height <= height * 0.45 + 2, `${width}px: drawer stays within 45% viewport height`);
      assert.equal(await visible(page, '#workArea #retirementPanel'), true, `${width}px: drawer preserves retirement`);
      assert.equal(await visible(page, '#workArea .work-zone'), true, `${width}px: drawer preserves workstation`);
      assert.equal(await page.locator('#mainPanel').evaluate(el => el.scrollWidth <= el.clientWidth), true, `${width}px: drawer has no horizontal overflow`);
      await page.locator('.app-nav [data-tab="buildings"]').click();
      assert.equal(await page.locator('#mainPanel').isHidden(), true, `${width}px: active navigation closes drawer`);
      await page.locator('.app-nav [data-tab="buildings"]').click();
      await closePanelWithWorkArea(page);
      await page.locator('.app-nav [data-tab="buildings"]').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mainPanel').isHidden(), true, `${width}px: Escape closes drawer`);
      await page.locator('.app-nav [data-tab="buildings"]').click();
      await page.evaluate(() => history.back());
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#mainPanel').isHidden(), true, `${width}px: Android/browser back closes drawer`);
    } else {
      assert.equal(await visible(page, '#facilityRail'), true, `${width}px: facility rail visible`);
      const bounds = await page.evaluate(() => ({
        zoneBottom: document.querySelector('.work-zone').getBoundingClientRect().bottom,
        buttonBottom: document.querySelector('.work-btn').getBoundingClientRect().bottom,
        logTop: document.querySelector('.event-strip').getBoundingClientRect().top,
      }));
      assert.ok(bounds.zoneBottom <= bounds.logTop + 1, `${width}px: workstation does not overlap the log`);
      assert.ok(bounds.buttonBottom <= bounds.zoneBottom + 1, `${width}px: workstation button stays inside its zone`);
    }
  }

  const liveContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const liveState = createState();
  liveState.coins = 180;
  liveState.mana = 197;
  liveState.buildings.farm = 5;
  liveState.stats.total.clicks = 1;
  await liveContext.addInitScript(({ key, json }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, json);
  }, { key: SAVE_KEY, json: JSON.stringify(liveState) });
  const livePage = await liveContext.newPage();
  livePage.on('pageerror', error => errors.push(error.message));
  await livePage.goto(origin, { waitUntil: 'domcontentloaded' });
  const liveSkill = livePage.locator('[data-action="cast"][data-id="taxCollection"]');
  assert.equal(await liveSkill.isDisabled(), true, 'skill starts disabled when mana is insufficient');
  await livePage.locator('.app-nav [data-tab="building-upgrades"]').click();
  await livePage.locator('#mainPanel .upgrade-icon[data-kind="building"]').first().click();
  const liveBuy = livePage.locator('#upgradeDetail .primary');
  assert.equal(await liveBuy.isDisabled(), true, 'upgrade starts disabled when coins are insufficient');
  await livePage.evaluate(() => {
    window.__liveDetail = document.querySelector('#upgradeDetail');
    window.__liveUpgradeIcon = document.querySelector('#mainPanel .upgrade-icon');
  });
  await livePage.waitForFunction(() => !document.querySelector('#upgradeDetail .primary').disabled, undefined, { timeout: 6000 });
  assert.equal(await livePage.evaluate(() => window.__liveDetail === document.querySelector('#upgradeDetail') && window.__liveUpgradeIcon === document.querySelector('#mainPanel .upgrade-icon')), true, 'live affordability updates reuse the same panel DOM');
  await livePage.waitForFunction(() => !document.querySelector('[data-action="cast"][data-id="taxCollection"]').disabled, undefined, { timeout: 6000 });
  assert.equal(await liveSkill.isEnabled(), true, 'skill enables automatically when mana reaches its cost');
  await liveContext.close();

  const cleanContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cleanPage = await cleanContext.newPage();
  cleanPage.on('pageerror', error => errors.push(error.message));
  await cleanPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await cleanPage.locator('[data-action="start"]').click();
  await cleanPage.locator('.story-overlay [data-action="close-story"]').click();
  await cleanPage.locator('.work-btn').click();
  await cleanPage.locator('.story-overlay [data-action="close-story"]').click();
  await cleanPage.locator('[data-action="save"]').click();
  await cleanPage.locator('#moreTabButton').click();
  cleanPage.once('dialog', dialog => dialog.accept());
  await cleanPage.locator('[data-action="hard-reset"]').click();
  await cleanPage.waitForLoadState('load');
  await cleanPage.waitForTimeout(200);
  assert.equal(await cleanPage.evaluate(key => localStorage.getItem(key), SAVE_KEY), null, 'hard reset does not resurrect a save');
  assert.equal(await cleanPage.locator('#coins').textContent(), '¥ 0');
  await cleanContext.close();

  const storyContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const storyPage = await storyContext.newPage();
  storyPage.on('pageerror', error => errors.push(error.message));
  storyPage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  storyPage.on('response', response => { if (response.status() === 404) missing.push(response.url()); });
  await storyPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await storyPage.locator('#retirementPanel .retirement-card').waitFor();
  await storyPage.locator('[data-action="start"]').click();
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  await storyPage.locator('.work-btn').click();
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  await storyPage.locator('#retirementButton').click();
  assert.match(await storyPage.locator('.story-overlay').getAttribute('data-story-id'), /intro\.retirement_denied/);
  assert.match(await storyPage.locator('.story-overlay').textContent(), /100M（¥100,000,000）/);
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  let storySave = await storyPage.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  assert.equal(storySave.stats.total.abdications || 0, 0, 'unqualified retirement does not reset the run');
  storySave.coins = 1e8;
  storySave.stats.run.coins = 1e8;
  await storyPage.addInitScript(({ key, json }) => localStorage.setItem(key, json), { key: SAVE_KEY, json: JSON.stringify(storySave) });
  await storyPage.reload({ waitUntil: 'domcontentloaded' });
  await storyPage.locator('.story-overlay').waitFor();
  assert.match(await storyPage.locator('.story-overlay').getAttribute('data-story-id'), /intro\.retirement_eligible/);
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  storyPage.once('dialog', dialog => dialog.accept());
  await storyPage.locator('#retirementButton').click();
  await storyPage.locator('.story-overlay').waitFor();
  assert.match(await storyPage.locator('.story-overlay').getAttribute('data-story-id'), /intro\.first_retirement/);
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  storySave = await storyPage.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  assert.equal(storySave.story.intro.completed, true, 'first retirement completes the intro in the saved state');
  assert.equal(storySave.stats.total.abdications, 1, 'qualified retirement settles exactly once');

  storySave.gems = 1e27;
  await storyPage.addInitScript(({ key, json }) => localStorage.setItem(key, json), { key: SAVE_KEY, json: JSON.stringify(storySave) });
  await storyPage.reload({ waitUntil: 'domcontentloaded' });
  await storyPage.locator('#moreTabButton').click();
  storyPage.once('dialog', dialog => dialog.accept());
  await storyPage.locator('[data-action="reincarnate"]').click();
  await storyPage.locator('.story-overlay').waitFor();
  assert.match(await storyPage.locator('.story-overlay').textContent(), /洲际业务域/);
  await storyPage.locator('.story-overlay [data-action="close-story"]').click();
  assert.match(await storyPage.locator('#chapterName').textContent(), /洲际业务域/);
  assert.match(await storyPage.locator('#achievementMount').textContent(), /光荣退休/);
  assert.match(await storyPage.locator('#storyArchiveMount').textContent(), /剧情回看/);
  await storyPage.locator('[data-action="close-panel"]').click();
  assert.ok(await storyPage.locator('#retirementButton').evaluate(button => button.getBoundingClientRect().height >= 44), 'mobile retirement button remains touchable');
  await storyContext.close();

  assert.deepEqual(errors, [], `browser errors: ${errors.join('\n')}`);
  assert.deepEqual(missing, [], `404 responses: ${missing.join('\n')}`);
  console.log('Browser acceptance passed: retirement, facilities, live upgrade/skill states, stable panel and workstation DOM, hard reset, and 320/390/520/768/900/1024/1440px layouts.');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
