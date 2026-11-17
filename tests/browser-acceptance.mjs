import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createState, SAVE_KEY } from '../src/core/state.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = 4189;
const origin = `http://127.0.0.1:${port}`;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
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

  assert.equal(await visible(page, '#workArea #retirementPanel'), true, 'retirement lives inside workArea');
  assert.equal(await visible(page, '#facilityRail'), true, 'desktop facility rail is persistent');
  assert.equal(await page.locator('#facilityRail .building-card').count(), 4);
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
  await closePanelWithWorkArea(page);

  await page.evaluate(() => {
    window.__stableWork = document.querySelector('#workContent');
    window.__stableZone = document.querySelector('.work-zone');
  });
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__stableWork === document.querySelector('#workContent') && window.__stableZone === document.querySelector('.work-zone')), true, 'retirement updates do not rebuild workstation DOM');

  page.once('dialog', dialog => dialog.accept());
  await page.locator('#retirementButton').click();
  await page.locator('#retirementFeedback').waitFor({ state: 'visible' });
  assert.match(await page.locator('#retirementFeedback').textContent(), /退休完成，获得 .* 期权/);
  assert.equal(await page.locator('#pendingGemsValue').textContent(), '0');
  assert.equal(await page.locator('#retirementButton').isDisabled(), true);
  assert.equal(await visible(page, '#workArea .work-btn'), true, 'new run workstation is immediately usable');

  await page.locator('#moreTabButton').click();
  assert.equal(await page.locator('#mainPanel [data-action="abdicate"]').count(), 0, 'retirement is removed from More');
  assert.equal(await visible(page, '#mainPanel [data-action="reincarnate"]'), true, 'reincarnation remains in More');
  await page.locator('[data-action="close-panel"]').click();

  for (const [width, height] of [[320, 568], [390, 844], [520, 740], [768, 1024], [900, 700], [1024, 768], [1440, 900]]) {
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
      const bounds = await page.evaluate(() => ({ zoneBottom: document.querySelector('.work-zone').getBoundingClientRect().bottom, logTop: document.querySelector('.event-strip').getBoundingClientRect().top }));
      assert.ok(bounds.zoneBottom <= bounds.logTop + 1, `${width}px: workstation does not overlap the log`);
    }
  }

  const cleanContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cleanPage = await cleanContext.newPage();
  cleanPage.on('pageerror', error => errors.push(error.message));
  await cleanPage.goto(origin, { waitUntil: 'domcontentloaded' });
  await cleanPage.locator('[data-action="start"]').click();
  await cleanPage.locator('.work-btn').click();
  await cleanPage.locator('[data-action="save"]').click();
  await cleanPage.locator('#moreTabButton').click();
  cleanPage.once('dialog', dialog => dialog.accept());
  await cleanPage.locator('[data-action="hard-reset"]').click();
  await cleanPage.waitForLoadState('load');
  await cleanPage.waitForTimeout(200);
  assert.equal(await cleanPage.evaluate(key => localStorage.getItem(key), SAVE_KEY), null, 'hard reset does not resurrect a save');
  assert.equal(await cleanPage.locator('#coins').textContent(), '¥ 0');
  await cleanContext.close();

  assert.deepEqual(errors, [], `browser errors: ${errors.join('\n')}`);
  assert.deepEqual(missing, [], `404 responses: ${missing.join('\n')}`);
  console.log('Browser acceptance passed: retirement, facilities, upgrades, stable DOM, hard reset, and 320/390/520/768/900/1024/1440px layouts.');
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
