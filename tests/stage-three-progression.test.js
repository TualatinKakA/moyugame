import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph } from '../src/systems/content-registry.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage } from '../src/systems/persistence.js';
import { createSaveState } from '../src/systems/state.js';
import { ascensionForReincarnation, buildingGrowthForAscension, reincarnationPower, reincarnationRequirement } from '../src/systems/progression.js';
import { royalExchangeBonus, royalExchangeMultiplier } from '../src/systems/royal-market.js';

const graph = compileContentGraph(CONTENT);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
async function fixture(seeded = createSaveState({ now: 1000 }), content = CONTENT) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seeded);
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}
function atReincarnation(reincarnations) {
  const state = createSaveState({ now: 1000 });
  state.progression.reincarnations = reincarnations;
  state.progression.ascension = ascensionForReincarnation(reincarnations);
  state.progression.ascensionStartR = [0, 40, 100, 160, 220][state.progression.ascension];
  return state;
}

test('Ascension thresholds and building growth use R40 R100 R160 and R220', async () => {
  for (const [r, expected] of [[0, 0], [1, 0], [39, 0], [40, 1], [99, 1], [100, 2], [159, 2], [160, 3], [219, 3], [220, 4]]) {
    assert.equal(ascensionForReincarnation(r), expected, `R${r}`);
  }
  for (const [ascension, expected] of [[0, 1.15], [1, 1.03], [2, 1.015], [3, 1.01], [4, 1.0075]]) close(buildingGrowthForAscension(ascension), expected);
  const state = atReincarnation(40);
  const game = await fixture(state);
  close(game.select('derived').buildingCostMultiplier, 1.03);
  assert.equal(game.select('content', { id: 'farm-tier20' }).era, undefined);
  assert.equal(graph.definitionsById.get('farm-tier20').era.minR, 40);
  assert.equal(graph.definitionsById.get('farm-tier20').era.maxA, 2);
});

test('R1 applies every open interface including time production and Exchange', async () => {
  const state = atReincarnation(1);
  state.stats.r.time = 3600;
  state.royalExchange.fairy = 1;
  const game = await fixture(state);
  const current = game.select('derived');
  close(current.rPower.productionPercent, 50);
  close(current.rPower.timeProductionPercent, 1);
  close(current.manaMax, 1035);
  close(current.manaRegen, 3);
  close(current.assistants, 1);
  close(current.assistantProduction, 0.05 * 1.51 * 1.02 * royalExchangeMultiplier(game.select('state')));
  close(current.offlineMultiplier, 5.5);
  close(current.fcChance, 20);
  close(current.gemPowerPerGem, 0.2);
  close(royalExchangeBonus(game.select('state')), 10.5);
  close(royalExchangeMultiplier(game.select('state')), (1 + 0.01 * 10.5) ** (0.7 * 0.1 ** 0.7));
});

test('R2 R3 R4 and R5 preserve independent additive and multiplicative interfaces', () => {
  const r40 = reincarnationPower(40);
  close(r40.productionPercent, 2010);
  close(r40.manaMaxAdd, 1470);
  close(r40.assistantsAdd, 44);
  close(r40.fcChanceMultiplier, 1.015);
  close(r40.factionCoinGainMultiplier, 1.012);
  close(r40.autoClickRate, 1);
  const r100 = reincarnationPower(100);
  close(r100.productionPercent, 5635);
  close(r100.manaRegenMultiplier, 1.02);
  close(r100.factionCoinGainMultiplier, (1 + 0.012 * 61 ** 1.05) * 1.012);
  const r160 = reincarnationPower(160);
  close(r160.productionPercent, 8000 + 1210 + 1525 + 150);
  const r220 = reincarnationPower(220);
  close(r220.productionPercent, 11000 + 1810 + 3025 + 9150 + 10);
  close(r220.manaRegenMultiplier, (1 + 0.02 * 121) * 6);
  close(r220.fcChanceMultiplier, (1 + 0.015 * 181 ** 0.95) * 6);
});

test('R2 and R3 faction coin gains apply per faction before flooring', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'taxCollection');
  const spell = { ...template, id: 'test.rPowerFc', effects: [], reactions: [], castActions: [{ type: 'grantResource', resource: 'factionCoin.fairy', amount: { constant: 100 } }] };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, spell] };
  for (const r of [40, 100]) {
    const state = atReincarnation(r);
    state.resources.mana = 10000;
    const game = await fixture(state, content);
    const result = game.dispatch({ type: 'cast', id: spell.id });
    assert.equal(result.ok, true, result.error?.stack);
    const expected = Math.floor(100 * reincarnationPower(r).factionCoinGainMultiplier);
    assert.equal(game.select('state').resources.factionCoins.fairy, expected);
    assert.equal(game.select('state').stats.run.factionCoinsByFaction.fairy, expected);
  }
});

test('R2 autoclicks keep their source and floor each original update', async () => {
  const state = atReincarnation(41);
  const game = await fixture(state);
  const facts = [];
  game.subscribe(message => facts.push(...message.facts));
  for (let index = 0; index < 6; index++) assert.equal(game.tick(1).ok, true);
  const clicks = facts.filter(fact => fact.type === 'work.clicked' && fact.payload.source === 'reincarnation2');
  assert.equal(clicks.length, 2);
  assert.ok(clicks.every(fact => fact.payload.automatic));
});

test('A4 applies treaty agreement and all nine faction upgrade costs without bypassing gates', async () => {
  const state = atReincarnation(220);
  state.resources.coins = 1e85;
  state.resources.factionCoins.fairy = 1e28;
  const game = await fixture(state);
  assert.equal(game.dispatch({ type: 'purchase', id: 'good' }).ok, true);
  assert.equal(game.select('content', { id: 'fairy' }).costs[0].value, 1e15);
  assert.equal(game.dispatch({ type: 'purchase', id: 'fairy' }).ok, true);
  const ids = ['fairy-1', 'fairy-2', 'fairy-3', 'fairy-pact', 'fairy-4', 'fairy-5', 'fairy-6', 'fairy-alliance', 'fairy-7', 'fairy-8', 'fairy-9'];
  for (const id of ids) {
    const model = game.select('content', { id });
    if (id.endsWith('-pact')) assert.equal(model.costs[0].value, 1e21);
    else if (id.endsWith('-alliance')) assert.equal(model.costs[0].value, 1e27);
    else {
      const number = Number(id.at(-1));
      const group = Math.floor((number - 1) / 3);
      assert.equal(model.costs[0].value, 1e51 * 1000 ** (number - 1) * 1000 ** (0.5 * group * (group + 1)), id);
    }
    const result = game.dispatch({ type: 'purchase', id });
    assert.equal(result.ok, true, `${id}: ${result.reason || result.error}`);
  }
  assert.equal(game.select('state').permanentUnlocks.fairyChampion, true);
  assert.equal(game.select('content', { id: 'fairyHeritage' }).status, 'HIDDEN_SYSTEM');
  for (const id of ['gemUpgrade1', 'assistantUpgrade1', 'unitaryUpgrade']) assert.equal(game.select('content', { id }).status, 'HIDDEN_SYSTEM');
});

test('A1 legacy spell and secret upgrade costs are free only with their permanent prerequisites', async () => {
  const state = atReincarnation(40);
  state.selections.alignment = 'good';
  state.selections.faction = 'fairy';
  state.permanentUnlocks.fairyChoir = true;
  state.permanentUnlocks.unitaryTrophy = true;
  const game = await fixture(state);
  assert.equal(game.select('content', { id: 'fairyChoirUpgrade' }).costs[0].value, 0);
  assert.equal(game.dispatch({ type: 'purchase', id: 'fairyChoirUpgrade' }).ok, true);
  assert.equal(game.select('content', { id: 'unitaryUpgrade' }).costs[0].value, 0);
  assert.equal(game.dispatch({ type: 'purchase', id: 'unitaryUpgrade' }).ok, true);
  const lockedState = atReincarnation(40);
  const locked = await fixture(lockedState);
  assert.equal(locked.select('content', { id: 'fairyChoirUpgrade' }).status, 'HIDDEN_SYSTEM');
});

test('crossing R40 clears Era state while preserving total history and permanent trophies', async () => {
  const state = atReincarnation(39);
  state.resources.gems = reincarnationRequirement(39);
  state.stats.ascension.buildingsBuilt = 1000;
  state.stats.ascension.factionCoinsByFaction.fairy = 100;
  state.stats.ascension.factionCoins = 100;
  state.stats.total.buildingsBuilt = 1000;
  state.permanentUnlocks.buildBuildingTrophy4 = true;
  const game = await fixture(state);
  const result = game.dispatch({ type: 'reincarnate' });
  assert.equal(result.ok, true, result.error?.stack);
  assert.equal(game.select('state').progression.reincarnations, 40);
  assert.equal(game.select('state').progression.ascension, 1);
  assert.equal(game.select('state').progression.ascensionStartR, 40);
  assert.equal(game.select('state').stats.ascension.buildingsBuilt, 0);
  assert.equal(game.select('state').stats.ascension.factionCoins, 0);
  assert.equal(game.select('state').stats.total.buildingsBuilt, 1000);
  assert.equal(game.select('state').permanentUnlocks.buildBuildingTrophy4, true);
});

test('save normalization replaces obsolete custom Ascension values with R thresholds', async () => {
  for (const [r, ascension, expected] of [[1, 1, 0], [39, 1, 0], [100, 1, 2], [220, 2, 4]]) {
    const state = atReincarnation(r);
    state.progression.ascension = ascension;
    const game = await fixture(state);
    assert.equal(game.select('state').progression.ascension, expected);
    assert.equal(game.select('state').progression.ascensionStartR, [0, 40, 100, 160, 220][expected]);
  }
});

test('R1 time production invalidates its derived snapshot as R time advances', async () => {
  const game = await fixture(atReincarnation(1));
  const before = game.select('derived');
  assert.equal(before.rPower.timeProductionPercent, 0);
  assert.equal(game.tick(1).ok, true);
  const after = game.select('derived');
  assert.ok(after.rPower.timeProductionPercent > 0);
  assert.ok(after.globalMult > before.globalMult);
});
