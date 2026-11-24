import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph } from '../src/systems/content-registry.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage } from '../src/systems/persistence.js';
import { createSaveState } from '../src/systems/state.js';
import { parseCsv } from './csv.js';

const graph = compileContentGraph(CONTENT);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
async function fixture(seeded = createSaveState({ now: 1000 })) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seeded);
  const game = createGameRuntime({ content: CONTENT, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}

test('all 46 Misc entries match CSV names costs status and opening boundaries', async () => {
  const rows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/misc-upgrades.csv', import.meta.url), 'utf8'));
  assert.equal(rows.length, 46);
  assert.equal(CONTENT.definitions.filter(item => item.miscStatus).length, 46);
  rows.forEach((row, index) => {
    const id = row['内容ID'];
    const definition = graph.definitionsById.get(id) || CONTENT.definitions.find(item => item.miscId === id);
    assert.ok(definition, id);
    assert.equal(definition.sourceName, row['来源/类型'], id);
    assert.equal(definition.sourceVersion, row['原版版本'], id);
    assert.equal(definition.miscStatus, index < 27 ? 'complete' : index < 36 ? 'dependency' : 'unavailable', id);
    if (!['proofOfGood', 'proofOfEvil'].includes(id)) {
      assert.equal(definition.purchase.costs[0].amount.constant, Number(row['成本']) || 0, id);
      assert.equal(definition.kind, 'upgrade');
    } else {
      assert.equal(definition.purchase.costs[0].amount.constant, 25000);
      assert.equal(definition.kind, 'alignment');
    }
    if (index >= 36) assert.equal(definition.visible.not.op, 'always', `${id} remains closed`);
  });
});

test('four alignment production upgrades use raw building gates and multiply to sixteen', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.progression = { ...seeded.progression, reincarnations: 40, ascension: 1, ascensionStartR: 40 };
  seeded.selections.alignment = 'good';
  seeded.resources.coins = 1e125;
  seeded.buildings.cathedral = 20000;
  seeded.owned.run['undead-7'] = true;
  const game = await fixture(seeded);
  const before = game.select('derived').unitOutputs.cathedral;
  for (let index = 1; index <= 4; index++) {
    const id = `goodProduction${index}`;
    assert.equal(game.select('content', { id }).status, 'PURCHASABLE', id);
    assert.equal(game.dispatch({ type: 'purchase', id }).ok, true, id);
  }
  close(game.select('derived').unitOutputs.cathedral / before, 16);
  const rawState = createSaveState({ now: 1000 });
  rawState.selections.alignment = 'good';
  rawState.buildings.cathedral = 749;
  rawState.owned.run['undead-7'] = true;
  const rawGame = await fixture(rawState);
  assert.equal(rawGame.select('content', { id: 'goodProduction1' }).status, 'HIDDEN_SYSTEM');
});

test('treasure upgrades preserve separate click global and run-coins inputs', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e18;
  seeded.buildings.farm = 10;
  seeded.stats.run.clickCoins = 5e15;
  seeded.stats.run.coins = 1e17;
  const game = await fixture(seeded);
  for (let index = 1; index <= 5; index++) {
    assert.equal(game.dispatch({ type: 'purchase', id: `clickingProduction${index}` }).ok, true);
    assert.equal(game.dispatch({ type: 'purchase', id: `clickingTotalProduction${index}` }).ok, true);
  }
  const current = game.select('derived');
  close(current.globalMult, 1.25 ** 5);
  close(current.clickReward, (1 + 0.05 * current.buildingProduction) * 1.25 ** 5);
  assert.equal(game.dispatch({ type: 'abdicate' }).ok, true);
  for (let index = 1; index <= 5; index++) {
    assert.equal(game.select('state').owned.run[`clickingProduction${index}`], undefined);
    assert.equal(game.select('state').owned.run[`clickingTotalProduction${index}`], undefined);
  }
});

test('golden 12: Gem Power upgrades and GB8 use the original per-Gem bonus and ascension curve', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.gems = Math.exp(10) - 1;
  seeded.resources.coins = 1e110;
  const game = await fixture(seeded);
  assert.equal(game.select('derived').globalMult, 1);
  assert.equal(game.select('derived').fcChance, 10);
  assert.equal(game.dispatch({ type: 'purchase', id: 'gemPower' }).ok, true);
  assert.equal(game.select('derived').fcChance, 14);
  close(game.select('derived').globalMult, 1 + 0.01 * (seeded.resources.gems * 2) ** 0.9);
  const upgradedState = createSaveState({ now: 1000 });
  upgradedState.resources.gems = seeded.resources.gems;
  upgradedState.stats.run.coins = 1e8;
  for (const id of ['gemPower', 'gemUpgrade1', 'gemUpgrade2', 'gemUpgrade3']) upgradedState.owned.run[id] = true;
  const upgraded = await fixture(upgradedState);
  assert.equal(upgraded.select('derived').fcChance, 17);
  close(upgraded.select('derived').globalMult, 1 + 0.01 * (seeded.resources.gems * 5) ** 0.9);
  upgradedState.owned.run['goblin-8'] = true;
  const blackMarket = await fixture(upgradedState);
  close(blackMarket.select('derived').globalMult, 1 + 0.01 * (seeded.resources.gems * 11) ** 0.9);
  assert.equal(blackMarket.dispatch({ type: 'abdicate' }).ok, true);
  for (const id of ['gemPower', 'gemUpgrade1', 'gemUpgrade2', 'gemUpgrade3']) assert.equal(blackMarket.select('state').owned.run[id], undefined);
  assert.equal(blackMarket.select('derived').globalMult, 1);
  assert.equal(blackMarket.select('derived').fcChance, 10);

  const a4State = createSaveState({ now: 1000 });
  a4State.progression = { ...a4State.progression, reincarnations: 220, ascension: 4, ascensionStartR: 220 };
  a4State.resources.gems = seeded.resources.gems;
  a4State.owned.run.gemPower = true;
  const a4 = await fixture(a4State);
  const a4Derived = a4.select('derived');
  close(a4Derived.gemPowerPerGem, 46);
  close(a4Derived.globalMult, (1 + (a4Derived.rPower.productionPercent + a4Derived.rPower.timeProductionPercent) / 100)
    * (1 + 0.01 * (seeded.resources.gems * 46)));
});

test('six ClickingBase upgrades aggregate offline clicks without replaying click events', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e17;
  seeded.stats.total.clicks = 100000;
  const game = await fixture(seeded);
  for (let index = 1; index <= 6; index++) {
    assert.equal(game.select('content', { id: `clickingBase${index}` }).status, 'PURCHASABLE');
    assert.equal(game.dispatch({ type: 'purchase', id: `clickingBase${index}` }).ok, true);
  }
  close(game.select('derived').clickReward, 50050505000);
  const before = {
    coins: game.select('state').resources.coins,
    clickCoins: game.select('state').stats.run.clickCoins,
    rng: JSON.stringify(game.select('state').rng),
  };
  const facts = [];
  game.subscribe(message => facts.push(...message.facts));
  const result = game.dispatch({ type: 'background.settle', seconds: 5400 });
  assert.equal(result.ok, true, result.error?.stack);
  assert.equal(game.select('state').stats.run.clicks, 32400);
  assert.equal(game.select('state').stats.total.clicks, 132400);
  assert.equal(game.select('state').resources.coins, before.coins);
  assert.equal(game.select('state').stats.run.clickCoins, before.clickCoins);
  assert.equal(JSON.stringify(game.select('state').rng), before.rng);
  assert.equal(facts.filter(fact => fact.type === 'work.clicked').length, 0);
  assert.equal(facts.some(fact => fact.type === 'spell.cast'), false);
});

test('Offline upgrades read cumulative run plus R plus total seconds and stack real bonuses', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e55;
  for (const scope of ['run', 'r', 'total']) seeded.stats[scope].offlineTime = 43200;
  const game = await fixture(seeded);
  for (let index = 1; index <= 3; index++) {
    assert.equal(game.select('content', { id: `offlineUpgrade${index}` }).status, 'PURCHASABLE');
    assert.equal(game.dispatch({ type: 'purchase', id: `offlineUpgrade${index}` }).ok, true);
  }
  close(game.select('derived').offlineMultiplier, 11.5);
  assert.equal(game.select('state').permanentUnlocks.trueNight, true);
});
