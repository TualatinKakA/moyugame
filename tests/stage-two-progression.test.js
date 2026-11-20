import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph } from '../src/systems/content-registry.js';
import { computeDerived } from '../src/systems/derived.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage } from '../src/systems/persistence.js';
import { createSaveState } from '../src/systems/state.js';
import { nextDouble } from '../src/core/rng.js';
import { nightTimeActivityR } from '../src/systems/effective.js';
import { parseCsv } from './csv.js';

const graph = compileContentGraph(CONTENT);
const close = (actual, expected, label = '') => assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${label}: ${actual} != ${expected}`);
async function fixture(seeded = createSaveState({ now: 1000 }), content = CONTENT) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seeded);
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}
function completeFaction(game, faction) {
  for (const id of [`${faction}-1`, `${faction}-2`, `${faction}-3`, `${faction}-pact`, `${faction}-4`, `${faction}-5`, `${faction}-6`, `${faction}-alliance`, `${faction}-7`, `${faction}-8`, `${faction}-9`]) {
    const result = game.dispatch({ type: 'purchase', id });
    assert.equal(result.ok, true, `${id}: ${result.reason || result.error}`);
  }
}
function luckStreamValue() {
  const probe = createSaveState();
  for (let value = 1; value < 100000; value++) {
    probe.rng.streams['drops:factionCoin'] = { calls: 0, value };
    if (nextDouble(probe, 'drops:factionCoin') >= 0.1 && nextDouble(probe, 'drops:factionCoin') < 0.01) return value;
  }
  throw new Error('No controlled luck stream found');
}

test('stage two defines exactly six Champion and six spell trophies as original trophies', async () => {
  assert.equal(CONTENT.definitions.filter(item => item.kind === 'trophy' && item.id.endsWith('Champion')).length, 6);
  assert.equal(CONTENT.definitions.filter(item => item.kind === 'trophy' && item.originalTrophy === true).length, 12);
  assert.equal(CONTENT.definitions.filter(item => item.kind === 'upgrade' && item.id.endsWith('Heritage')).length, 6);
  assert.equal(CONTENT.definitions.filter(item => item.kind === 'upgrade' && item.trophyId).length, 6);
  const rows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/spells-and-trophies.csv', import.meta.url), 'utf8'));
  for (const row of rows.filter(item => item['类型'] === 'spell')) assert.ok(graph.definitionsById.get(row['内容ID'])?.kind === 'spell', row['内容ID']);
  for (const row of rows.filter(item => item['类型'] === 'trophy+upgrade' && item['内容ID'] !== 'spellfury')) {
    const trophy = graph.definitionsById.get(row['内容ID']);
    const upgrade = graph.definitionsById.get(`${row['内容ID']}Upgrade`);
    assert.equal(trophy?.kind, 'trophy', row['内容ID']);
    assert.equal(trophy.originalTrophy, true);
    assert.equal(upgrade?.purchase.costs[0].amount.constant, 1000000);
    assert.equal(upgrade.trophyId, trophy.id);
    assert.notEqual(trophy.id, upgrade.id);
  }
});

test('six Champion trophies unlock only after all twelve entries and Heritage remains a separate run purchase', async () => {
  const configs = [
    ['fairy', 'good', 'fairyHeritage'], ['elven', 'good', 'elvenHeritage'], ['angel', 'good', 'angelicHeritage'],
    ['goblin', 'evil', 'goblinHeritage'], ['undead', 'evil', 'undeadHeritage'], ['demon', 'evil', 'demonicHeritage'],
  ];
  for (const [faction, alignment, heritage] of configs) {
    const seeded = createSaveState({ now: 1000 });
    seeded.resources.coins = 1e20;
    seeded.resources.factionCoins[faction] = 10000;
    const game = await fixture(seeded);
    game.dispatch({ type: 'purchase', id: alignment });
    game.dispatch({ type: 'purchase', id: faction });
    assert.equal(game.select('state').permanentUnlocks[`${faction}Champion`], undefined);
    completeFaction(game, faction);
    assert.equal(game.select('state').permanentUnlocks[`${faction}Champion`], true, faction);
    assert.equal(game.select('state').owned.run[heritage], undefined);
    const purchase = game.dispatch({ type: 'purchase', id: heritage });
    assert.equal(purchase.ok, true, `${heritage}: ${purchase.reason || purchase.error}`);
    assert.equal(game.select('state').owned.run[heritage], true);
    game.select('state').stats.run.coins = 1e8;
    assert.ok(game.dispatch({ type: 'abdicate' }).ok);
    assert.equal(game.select('state').permanentUnlocks[`${faction}Champion`], true);
    assert.equal(game.select('state').owned.run[heritage], undefined);
    assert.notEqual(game.select('content', { id: heritage }).status, 'HIDDEN_SYSTEM');
  }
});

test('Heritage does not require current faction and Demonic Heritage gives golden 14 three percent', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.permanentUnlocks.demonChampion = true;
  seeded.resources.factionCoins.demon = 5000;
  seeded.selections.alignment = 'good';
  seeded.selections.faction = 'fairy';
  seeded.buildings = { farm: 1, hallOfLegends: 10 };
  const game = await fixture(seeded);
  assert.ok(game.dispatch({ type: 'purchase', id: 'demonicHeritage' }).ok);
  close(game.select('derived').outputs.farm, 2 * 1.03);
});

test('Fairy Choir unlocks from real 50 and only its purchased upgrade triples effective assistants', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const assistants = { ...template, id: 'test.assistants50', effects: [{ group: 'test.assistants50', phase: 'assistants', stat: 'assistants.count', target: { type: 'global' }, operation: 'add', value: { constant: 50 }, stacking: 'add' }] };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, assistants] };
  const seeded = createSaveState({ now: 1000 });
  seeded.owned.run['test.assistants50'] = true;
  seeded.selections.alignment = 'good';
  seeded.selections.faction = 'fairy';
  seeded.spellSources.fairyChanting = { fairy: true };
  seeded.resources.coins = 1e6;
  seeded.resources.mana = 10000;
  const game = await fixture(seeded, content);
  assert.ok(game.dispatch({ type: 'cast', id: 'fairyChanting' }).ok);
  assert.equal(game.select('state').permanentUnlocks.fairyChoir, true);
  assert.equal(game.select('state').owned.run.fairyChoirUpgrade, undefined);
  assert.equal(game.select('derived').assistants, 50);
  assert.ok(game.dispatch({ type: 'purchase', id: 'fairyChoirUpgrade' }).ok);
  assert.equal(game.select('derived').realAssistants, 50);
  assert.equal(game.select('derived').assistants, 150);
});

test('Sun Blessing unlocks on the fifth era luck and purchased upgrade autoclicks fifteen times per second', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.selections.alignment = 'good';
  seeded.selections.faction = 'elven';
  seeded.spellSources.moonBlessing = { elven: true };
  seeded.owned.run['elven-8'] = true;
  seeded.stats.ascension.elvenLuck = 4;
  seeded.resources.coins = 1e6;
  seeded.resources.mana = 10000;
  const game = await fixture(seeded);
  game.select('state').rng.streams['drops:factionCoin'] = { calls: 0, value: luckStreamValue() };
  game.dispatch({ type: 'work' });
  assert.equal(game.select('state').permanentUnlocks.sunBlessing, true);
  assert.equal(game.select('state').owned.run.sunBlessingUpgrade, undefined);
  assert.ok(game.dispatch({ type: 'purchase', id: 'sunBlessingUpgrade' }).ok);
  assert.ok(game.dispatch({ type: 'cast', id: 'moonBlessing' }).ok);
  const facts = [];
  game.subscribe(message => facts.push(...message.facts));
  for (let index = 0; index < 3; index++) game.tick(1);
  const clicks = facts.filter(fact => fact.type === 'work.clicked' && fact.payload.source === 'sunBlessingUpgrade');
  assert.equal(clicks.length, 15);
  assert.ok(clicks.every(fact => fact.payload.automatic));
});

test("God's Rest unlocks from mana stats and other spells grant one random faction its FC reward", async () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const additions = [
    { ...template, id: 'test.maxMana500', effects: [{ group: 'test.maxMana500', phase: 'mana', stat: 'mana.max', target: { type: 'global' }, operation: 'add', value: { constant: 500 }, stacking: 'add' }] },
    { ...template, id: 'test.regen74', effects: [{ group: 'test.regen74', phase: 'mana', stat: 'mana.regen', target: { type: 'global' }, operation: 'add', value: { constant: 74 }, stacking: 'add' }] },
  ];
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...additions] };
  const seeded = createSaveState({ now: 1000 });
  seeded.owned.run['test.maxMana500'] = true;
  seeded.owned.run['test.regen74'] = true;
  seeded.selections.alignment = 'good';
  seeded.selections.faction = 'angel';
  seeded.spellSources.godsHand = { angel: true };
  seeded.resources.coins = 1e6;
  seeded.resources.mana = 10000;
  const game = await fixture(seeded, content);
  assert.ok(game.dispatch({ type: 'cast', id: 'godsHand' }).ok);
  assert.equal(game.select('state').permanentUnlocks.godsRest, true);
  assert.ok(game.dispatch({ type: 'purchase', id: 'godsRestUpgrade' }).ok);
  const result = game.dispatch({ type: 'cast', id: 'taxCollection' });
  const found = result.facts.find(fact => fact.type === 'factionCoins.found' && fact.payload.source === 'godsRest');
  assert.ok(found);
  assert.equal(found.payload.amount, Math.floor(10 ** 1.1));
  assert.equal(game.select('state').stats.run.factionCoins, found.payload.amount);
});

test('Greed Drive follows exchange count and active Greed with AN8 cost ordering', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.selections.alignment = 'evil';
  seeded.selections.faction = 'goblin';
  seeded.spellSources.goblinsGreed = { goblin: true };
  seeded.royalExchange.fairy = 100;
  seeded.resources.coins = 1e6;
  seeded.resources.mana = 10000;
  const game = await fixture(seeded);
  assert.ok(game.dispatch({ type: 'cast', id: 'goblinsGreed' }).ok);
  assert.equal(game.select('state').permanentUnlocks.greedDrive, true);
  assert.ok(game.dispatch({ type: 'purchase', id: 'greedDriveUpgrade' }).ok);
  assert.equal(game.select('content', { id: 'taxCollection' }).costs[0].value, 180);
  assert.equal(game.select('content', { id: 'goblinsGreed' }).costs[0].value, 400);
});

test('True Night uses real Night Time activity plus UD6 era offline input and modifies offline time', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const offline = { ...template, id: 'test.offline500', effects: [{ group: 'test.offline500', phase: 'utility', stat: 'offline.production', target: { type: 'global' }, operation: 'addPercent', value: { constant: 500 }, stacking: 'add' }] };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, offline] };
  const seeded = createSaveState({ now: 1000 });
  seeded.selections.alignment = 'evil';
  seeded.selections.faction = 'undead';
  seeded.spellSources.nightTime = { undead: true };
  seeded.owned.run['test.offline500'] = true;
  seeded.owned.run['farm-tier1'] = true;
  seeded.owned.run['farm-tier2'] = true;
  seeded.buildings.farm = 25;
  seeded.stats.r.spellActivity.nightTime = 100;
  seeded.resources.coins = 1e8;
  seeded.resources.mana = 10000;
  const game = await fixture(seeded, content);
  assert.ok(game.dispatch({ type: 'purchase', id: 'undead-1' }).ok);
  assert.equal(game.select('state').permanentUnlocks.trueNight, true);
  assert.ok(game.dispatch({ type: 'purchase', id: 'trueNightUpgrade' }).ok);
  game.dispatch({ type: 'cast', id: 'nightTime' });
  const expected = 2 * 0.05 * (1 + (50 + 0.4 * 100 ** 0.6) / 100);
  close(game.select('derived').assistantProduction, expected);
  game.select('state').owned.run['undead-6'] = true;
  game.select('state').stats.ascension.offlineTime = 50;
  assert.equal(nightTimeActivityR(game.select('state')), 150);
});

test('Hell Rush accepts 59.999 and rejects 60 seconds while purchased upgrade expands real targets', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.selections.alignment = 'evil';
  seeded.selections.faction = 'demon';
  seeded.spellSources.hellfireBlast = { demon: true };
  seeded.permanentUnlocks.fairyChampion = true;
  seeded.buildings = { evilFortress: 1, hellPortal: 1, hallOfLegends: 1 };
  seeded.resources.coins = 1e6;
  seeded.resources.mana = 10000;
  seeded.stats.run.time = 59.999;
  const game = await fixture(seeded);
  assert.ok(game.dispatch({ type: 'cast', id: 'hellfireBlast' }).ok);
  assert.equal(game.select('state').permanentUnlocks.hellRush, true);
  close(game.select('derived').outputs.hellPortal, 1200000);
  assert.ok(game.dispatch({ type: 'purchase', id: 'hellRushUpgrade' }).ok);
  const hellfireMultiplier = 1 + 120 * 2 ** 0.8 / 100;
  close(game.select('derived').outputs.evilFortress, 100000 * hellfireMultiplier);
  close(game.select('derived').outputs.hellPortal, 1200000 * hellfireMultiplier);
  close(game.select('derived').outputs.hallOfLegends, 500000 * hellfireMultiplier);

  const lateState = createSaveState({ now: 1000 });
  lateState.spellSources.hellfireBlast = { demon: true };
  lateState.resources.mana = 10000;
  lateState.stats.run.time = 60;
  const late = await fixture(lateState);
  late.dispatch({ type: 'cast', id: 'hellfireBlast' });
  assert.equal(late.select('state').permanentUnlocks.hellRush, undefined);
});
