import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT } from '../src/content/index.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage } from '../src/systems/persistence.js';
import { createSaveState } from '../src/systems/state.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
async function fixture(seeded, content = CONTENT) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seeded);
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}
function mechanicDefinitions(assistants, chance) {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  return [
    { ...template, id: 'test.goldenAssistants', effects: [{ group: 'test.goldenAssistants', phase: 'assistants', stat: 'assistants.count', target: { type: 'global' }, operation: 'add', value: { constant: assistants }, stacking: 'add' }] },
    { ...template, id: 'test.goldenChance', effects: [{ group: 'test.goldenChance', phase: 'factionCoin', stat: 'factionCoin.chance', target: { type: 'global' }, operation: 'add', value: { constant: chance - 10 }, stacking: 'add' }] },
  ];
}
function targetedRangeValue(stream, min, max, target) {
  const modulus = 2147483647;
  return Math.max(1, Math.round(((target - min) / (max - min)) * modulus / 16807));
}

test('golden 1: Assistant online candidates and offline round values stay distinct', async () => {
  for (const [assistants, chance, online, offline] of [[1, 10, [0, 3], 0], [2, 25, [0, 3], 1], [2, 125, [6, 9], 3]]) {
    const additions = mechanicDefinitions(assistants, chance);
    const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...additions] };
    const seeded = createSaveState({ now: 1000 });
    seeded.owned.run.testGolden = undefined;
    seeded.owned.run['test.goldenAssistants'] = true;
    seeded.owned.run['test.goldenChance'] = true;
    const onlineGame = await fixture(seeded, content);
    for (let index = 0; index < 3; index++) onlineGame.tick(1);
    const found = onlineGame.select('state').stats.total.factionCoins;
    assert.ok(online.includes(found), `online A${assistants}/c${chance}: ${found}`);
    const offlineGame = await fixture(seeded, content);
    assert.equal(offlineGame.dispatch({ type: 'background.settle', seconds: 1 }).report.factionCoinsPending, offline);
  }
});

test('golden 2: shared FC cache uses no equal shares at 99 or 100 and one share each at 106', async () => {
  for (const amount of [99, 100, 106]) {
    const template = CONTENT.definitions.find(item => item.id === 'taxCollection');
    const spell = {
      ...template, id: `test.cache${amount}`, duration: 0, effects: [], reactions: [],
      cast: { costs: [], requires: [{ op: 'always' }] },
      castActions: [{ type: 'grantResource', resource: 'factionCoin.randomEligible', amount: { constant: amount } }],
    };
    const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, spell] };
    const game = await fixture(createSaveState({ now: 1000 }), content);
    const cast = game.dispatch({ type: 'cast', id: spell.id });
    assert.ok(cast.ok, cast.error?.stack || cast.reason);
    assert.equal(game.select('factionCoins').pending, amount);
    game.tick(0.2);
    const found = game.select('state').stats.run.factionCoinsByFaction;
    assert.equal(Object.values(found).reduce((sum, value) => sum + value, 0), amount);
    assert.ok(Object.values(found).every(Number.isInteger));
    if (amount === 106) for (const faction of ['fairy', 'elven', 'angel', 'goblin', 'undead', 'demon']) assert.ok(found[faction] >= 1);
  }
});

test('golden 3: Greed Q is exact and same-cast derived Tax cannot see queued found', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.spellSources.goblinsGreed = { goblin: true };
  seeded.owned.run['goblin-7'] = true;
  seeded.resources.mana = 10000;
  seeded.buildings.farm = 10;
  seeded.stats.ascension.factionCoinsByFaction.fairy = 1000;
  const game = await fixture(seeded);
  const cast = game.dispatch({ type: 'cast', id: 'goblinsGreed' });
  assert.equal(cast.ok, true);
  close(game.select('factionCoins').pending, 94.69494001738587);
  assert.equal(game.select('state').stats.ascension.factionCoins, 1000);
  assert.ok(cast.facts.some(fact => fact.type === 'spell.cast' && fact.payload.spellId === 'taxCollection' && fact.payload.free));
  close(game.select('derived').outputs.farm, 20 * (1 + (30 + 3 * Math.log(1001) ** 3) / 100));
  game.tick(0.2);
  assert.equal(game.select('state').stats.ascension.factionCoins, 1094);
  close(game.select('derived').outputs.farm, 20 * (1 + (30 + 3 * Math.log(1095) ** 3) / 100));
});

test('golden 16: GFD online fires once and offline applies one multiplier without replaying rewards', async () => {
  const onlineState = createSaveState({ now: 1000 });
  onlineState.buildings.farm = 10;
  onlineState.owned.run['farm-tier1'] = true;
  onlineState.owned.run['farm-tier2'] = true;
  onlineState.owned.run['goblin-9'] = true;
  onlineState.timers.tasks.greenFingersDiscount = { dueAt: 120 };
  const online = await fixture(onlineState);
  online.select('state').rng.streams.greenFingersDiscount = { calls: 0, value: targetedRangeValue('greenFingersDiscount', 1, 1500, 500) };
  const snapshot = online.select('derived');
  const expectedRoll = 1 + 1499 * ((targetedRangeValue('greenFingersDiscount', 1, 1500, 500) * 16807) / 2147483647);
  const tick = online.tick(120);
  const triggers = tick.facts.filter(fact => fact.type === 'greenFingersDiscount.triggered');
  assert.equal(triggers.length, 1);
  close(triggers[0].payload.seconds, 500, 1e-5);
  const composite = snapshot.buildingProduction + snapshot.assistantProduction * (1 + 0.01 * 120 ** 0.8);
  close(triggers[0].payload.earned, composite * expectedRoll);
  assert.equal(online.select('state').timers.tasks.greenFingersDiscount.dueAt, 240);

  const offlineState = createSaveState({ now: 1000 });
  offlineState.buildings.farm = 10;
  offlineState.owned.run['farm-tier1'] = true;
  offlineState.owned.run['farm-tier2'] = true;
  offlineState.owned.run['goblin-9'] = true;
  offlineState.timers.tasks.greenFingersDiscount = { dueAt: 120 };
  const offline = await fixture(offlineState);
  offline.select('state').rng.streams.greenFingersDiscount = { calls: 0, value: targetedRangeValue('greenFingersDiscount', 2000, 10000, 5000) };
  const facts = [];
  offline.subscribe(message => facts.push(...message.facts));
  const before = offline.select('state').resources.coins;
  const derived = offline.select('derived');
  const result = offline.dispatch({ type: 'background.settle', seconds: 7200 });
  assert.equal(result.ok, true);
  close(result.report.greenFingersMultiplier, 51, 1e-6);
  close(offline.select('state').resources.coins - before, derived.production * derived.offlineMultiplier * 51 * 7200, 1e-6);
  assert.equal(facts.filter(fact => fact.type === 'greenFingersDiscount.triggered').length, 0);
  assert.equal(offline.select('state').rng.streams.greenFingersDiscount.calls, 1);
  assert.equal(offline.select('state').timers.tasks.greenFingersDiscount.dueAt, 7320);
});
