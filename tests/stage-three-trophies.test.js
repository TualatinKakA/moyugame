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
async function fixture(seeded = createSaveState({ now: 1000 }), content = CONTENT) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seeded);
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}
const buildingIds = alignment => CONTENT.definitions.filter(item => item.kind === 'building'
  && (item.alignment === 'any' || item.alignment === alignment));

test('all 412 facility trophies match authoritative CSV ids raw targets and thresholds', async () => {
  const rows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/trophies-and-heritages.csv', import.meta.url), 'utf8'));
  const facilityRows = rows.filter(row => ['building-trophy', 'aggregate-building-trophy'].includes(row['来源/类型']));
  assert.equal(facilityRows.length, 412);
  assert.equal(CONTENT.definitions.filter(item => item.originalTrophy === true).length, 430);
  assert.equal(CONTENT.definitions.filter(item => item.kind === 'upgrade' && item.trophyId).length, 9);
  for (const row of facilityRows) {
    const id = row['内容ID'];
    const definition = graph.definitionsById.get(id);
    assert.ok(definition, id);
    assert.equal(definition.kind, 'trophy');
    assert.equal(definition.originalTrophy, true);
    assert.equal(definition.trophyType, row['来源/类型']);
    assert.equal(definition.effects.length, 0);
    assert.equal(definition.sourceVersion, row['原版版本']);
    assert.equal(definition.verificationStatus, 'source-confirmed');
    assert.equal(definition.ui.icon, 'assets/images/content-icons/trophies/generic-trophy.svg');
    const requirement = Number(row['条件'].match(/>=\s*(\d+)/)?.[1]);
    if (row['来源/类型'] === 'building-trophy') {
      const buildingId = row['条件'].match(/真实([A-Za-z]+)数量/)?.[1];
      const threshold = definition.reactions[0].when.all[1];
      assert.equal(definition.reactions[0].path, `buildings.${buildingId}`, id);
      assert.equal(threshold.path, `buildings.${buildingId}`, id);
      assert.equal(threshold.value, requirement, id);
    } else if (id.startsWith('buildBuildingTrophy')) {
      assert.equal(definition.reactions[0].path, 'stats.ascension.buildingsBuilt', id);
      assert.equal(definition.reactions[0].when.value, requirement, id);
    } else {
      assert.equal(id, 'theArchitect');
      assert.ok(definition.reactions.every(reaction => reaction.when.all[1].value === 100000));
    }
  }
});

test('building trophies and numbered gates use raw counts despite UD7 and produce indexed reactions', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e9;
  seeded.buildings.farm = 99;
  seeded.owned.run['undead-7'] = true;
  const game = await fixture(seeded);
  assert.equal(game.select('state').permanentUnlocks['farm-building-trophy-2'], true);
  assert.equal(game.select('state').permanentUnlocks['farm-building-trophy-3'], undefined);
  const purchase = game.dispatch({ type: 'purchase', id: 'farm' });
  assert.equal(purchase.ok, true, purchase.error?.stack);
  assert.equal(game.select('state').permanentUnlocks['farm-building-trophy-3'], true);
  assert.equal(game.select('state').permanentUnlocks['farm-building-trophy-4'], undefined);
  assert.equal(game.select('derived').outputs.farm, 2 * 175);
  assert.equal(game.select('content', { id: 'farm-tier4' }).status, 'HIDDEN_SYSTEM');
  assert.ok(purchase.diagnostics?.rules === undefined || purchase.diagnostics.rules < 40);
  const tick = game.tick(0.2);
  assert.equal(tick.ok, true);
});

test('aggregate grinder trophies use era buildingsBuilt and survive run reset', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e12;
  seeded.stats.run.coins = 1e8;
  const game = await fixture(seeded);
  const result = game.dispatch({ type: 'purchase', id: 'farm', amount: 100 });
  assert.equal(result.ok, true, result.error?.stack);
  for (const scope of ['run', 'r', 'ascension', 'total']) assert.equal(game.select('state').stats[scope].buildingsBuilt, 100);
  assert.equal(game.select('state').permanentUnlocks.buildBuildingTrophy1, true);
  assert.equal(game.select('state').permanentUnlocks.buildBuildingTrophy2, undefined);
  assert.equal(game.dispatch({ type: 'abdicate' }).ok, true);
  assert.equal(game.select('state').stats.run.buildingsBuilt, 0);
  assert.equal(game.select('state').stats.ascension.buildingsBuilt, 100);
  assert.equal(game.select('state').stats.total.buildingsBuilt, 100);
  assert.equal(game.select('state').permanentUnlocks.buildBuildingTrophy1, true);
});

test('Unitary requires every available building at exactly one and buys its upgrade separately', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e6;
  seeded.buildings = { farm: 1, inn: 1, blacksmith: 1 };
  const game = await fixture(seeded);
  assert.equal(game.select('state').permanentUnlocks.unitaryTrophy, true);
  assert.equal(game.select('state').owned.run.unitaryUpgrade, undefined);
  assert.equal(game.select('content', { id: 'unitaryUpgrade' }).status, 'PURCHASABLE');
  const before = game.select('derived').outputs.farm;
  assert.equal(game.dispatch({ type: 'purchase', id: 'unitaryUpgrade' }).ok, true);
  close(game.select('derived').outputs.farm, before * (1 + 0.1111111111));
});

test('Mathematician checks tier eleven through one and applies per-tier multipliers', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.selections.alignment = 'good';
  seeded.resources.coins = 1e42;
  seeded.buildings = Object.fromEntries(buildingIds('good').map(building => [building.id, 2 ** (11 - building.tier)]));
  const game = await fixture(seeded);
  assert.equal(game.select('state').permanentUnlocks.mathematicianTrophy, true);
  const farmBefore = game.select('derived').outputs.farm;
  const hallBefore = game.select('derived').outputs.hallOfLegends;
  assert.equal(game.dispatch({ type: 'purchase', id: 'mathematicianUpgrade' }).ok, true);
  close(game.select('derived').outputs.farm / farmBefore, 2.1);
  close(game.select('derived').outputs.hallOfLegends / hallBefore, 1.1);
});

test('Spellfury requires three other active spells at the Tax cast event', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 10000;
  seeded.resources.mana = 10000;
  for (const [index, id] of ['callToArms', 'holyLight', 'fairyChanting'].entries()) seeded.timers.spells[id] = { dueAt: 100 + index };
  const game = await fixture(seeded);
  assert.equal(game.select('state').permanentUnlocks.spellfuryTrophy, undefined);
  assert.equal(game.dispatch({ type: 'cast', id: 'taxCollection' }).ok, true);
  assert.equal(game.select('state').permanentUnlocks.spellfuryTrophy, true);
  assert.equal(game.select('state').owned.run.spellfuryUpgrade, undefined);
  const regen = game.select('derived').manaRegen;
  assert.equal(game.dispatch({ type: 'purchase', id: 'spellfuryUpgrade' }).ok, true);
  close(game.select('derived').manaRegen, regen * 1.05);
});

test('Assistant Group Squad Legion use real 20 100 and 300 assistants', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const addition = { ...template, id: 'test.assistants300', visible: { op: 'always' },
    purchase: { costs: [{ resource: 'coins', amount: { constant: 1 } }], requires: [{ op: 'notOwned', id: 'test.assistants300' }] },
    effects: [{ group: 'test.assistants300', phase: 'assistants', stat: 'assistants.count', target: { type: 'global' }, operation: 'add', value: { constant: 300 }, stacking: 'add' }] };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, addition] };
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.coins = 1e20;
  const game = await fixture(seeded, content);
  assert.equal(game.select('state').permanentUnlocks.assistantGroup, undefined);
  assert.equal(game.dispatch({ type: 'purchase', id: 'test.assistants300' }).ok, true);
  for (const id of ['assistantGroup', 'assistantSquad', 'assistantLegion']) assert.equal(game.select('state').permanentUnlocks[id], true);
  for (const [id, cost] of [['assistantUpgrade1', 1e18], ['assistantUpgrade2', 2e36], ['assistantUpgrade3', 3e54]]) {
    assert.equal(graph.definitionsById.get(id).purchase.costs[0].amount.constant, cost);
    assert.equal(game.select('content', { id }).status, id === 'assistantUpgrade1' ? 'PURCHASABLE' : 'NEED_RESOURCE');
  }
  assert.equal(game.dispatch({ type: 'purchase', id: 'assistantUpgrade1' }).ok, true);
  close(game.select('derived').globalMult, 4);
});
