import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT } from '../src/content/index.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage } from '../src/systems/persistence.js';
import { createSaveState, migrateAndNormalizeState } from '../src/systems/state.js';
import { compileContentGraph } from '../src/systems/content-registry.js';
import {
  exchangePrice, exchangeQuote, royalExchangeBonus, royalExchangeCount, royalExchangeMultiplier,
} from '../src/systems/royal-market.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
async function fixture(seed = createSaveState({ now: 1000 }), content = CONTENT) {
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  adapter.save(seed);
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 1000 } });
  await game.start();
  return game;
}

test('golden 13: Exchange prices, batch quote, A exponent and EL5 bonus match source expectations', () => {
  const state = createSaveState();
  assert.deepEqual([0, 1, 2].map(owned => exchangePrice(owned)), [20, 22, 24]);
  const quote = exchangeQuote({ ...state, resources: { ...state.resources, factionCoins: { fairy: 66 } } }, 'fairy', 3);
  assert.deepEqual(quote.prices, [20, 22, 24]);
  assert.equal(quote.total, 66);
  state.royalExchange.fairy = 1;
  close(royalExchangeMultiplier(state), 1.0134008133957846);
  state.progression.ascension = 2;
  close(royalExchangeMultiplier(state), 1.0048828888233525);
  state.progression.ascension = 0;
  state.royalExchange.elven = 1;
  state.owned.run['elven-5'] = true;
  state.stats.ascension.factionCoins = Math.exp(2) - 1;
  close(royalExchangeBonus(state), 10 + 1.75 * 2 ** 1.75);
  close(royalExchangeMultiplier(state), 1.039287621085143);
});

test('Royal Exchange purchases are per-item transactional and all factions feed one multiplier', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.factionCoins.fairy = 66;
  seeded.resources.factionCoins.goblin = 20;
  seeded.buildings.farm = 1;
  const game = await fixture(seeded);
  const result = game.dispatch({ type: 'purchase', id: 'fairyExchange', amount: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.result.total, 66);
  assert.deepEqual(result.facts.filter(fact => fact.type === 'exchange.purchased').map(fact => fact.payload.price), [20, 22, 24]);
  assert.equal(game.select('state').resources.factionCoins.fairy, 0);
  assert.equal(game.select('state').royalExchange.fairy, 3);
  assert.equal(game.select('state').stats.run.exchangesBought, 3);
  assert.ok(game.dispatch({ type: 'purchase', id: 'goblinExchange' }).ok);
  assert.equal(royalExchangeCount(game.select('state')), 4);
  close(game.select('derived').exchangeMultiplier, royalExchangeMultiplier(game.select('state')));
  close(game.select('derived').outputs.farm, 2 * game.select('derived').exchangeMultiplier);
});

test('failed Exchange batch rolls back every coin and retirement resets bought counts', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.factionCoins.fairy = 65;
  seeded.resources.coins = 1e8;
  seeded.stats.run.coins = 1e8;
  const game = await fixture(seeded);
  const before = game.select('stateHash');
  const failed = game.dispatch({ type: 'purchase', id: 'fairyExchange', amount: 3 });
  assert.equal(failed.ok, false);
  assert.equal(failed.reason, 'NEED_RESOURCE');
  assert.equal(game.select('stateHash'), before);
  game.dispatch({ type: 'setting', key: 'buyAmount', value: 3 });
  assert.equal(game.select('content', { id: 'fairyExchange' }).costs[0].value, 66);
  game.select('state').resources.factionCoins.fairy = 66;
  assert.ok(game.dispatch({ type: 'purchase', id: 'fairyExchange', amount: 3 }).ok);
  assert.ok(game.dispatch({ type: 'abdicate' }).ok);
  assert.deepEqual(game.select('state').royalExchange, {});
  assert.equal(game.select('derived').exchangeMultiplier, 1);
});

test('Royal Exchange sparse save normalization preserves valid counts and quarantines unknown factions', () => {
  const saved = createSaveState();
  saved.royalExchange = { fairy: 3.9, unknown: 4 };
  const { state } = migrateAndNormalizeState(saved, compileContentGraph(CONTENT));
  assert.deepEqual(state.royalExchange, { fairy: 3 });
  assert.equal(state.quarantined.unknownIds.unknown, 4);
});

test('automatic clicks retain FR4 and EL1 source labels without becoming manual clicks', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.mana = 10000;
  seeded.owned.run['fairy-4'] = true;
  seeded.owned.run['elven-1'] = true;
  const game = await fixture(seeded);
  assert.ok(game.dispatch({ type: 'cast', id: 'callToArms' }).ok);
  const facts = [];
  game.subscribe(message => facts.push(...message.facts));
  for (let index = 0; index < 3; index++) {
    const tick = game.tick(1);
    assert.equal(tick.ok, true, tick.error?.stack);
  }
  const clicks = facts.filter(fact => fact.type === 'work.clicked');
  assert.equal(clicks.length, 4);
  assert.deepEqual(clicks.map(fact => fact.payload.source).sort(), ['elven-1', 'elven-1', 'elven-1', 'fairy-4']);
  assert.ok(clicks.every(fact => fact.payload.automatic));
  assert.equal(game.select('state').stats.run.clicks, 4);
});


test('EL1 offline autoclicks are aggregated with source labels and no online spell effects', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.owned.run['elven-1'] = true;
  const game = await fixture(seeded);
  const facts = [];
  game.subscribe(message => facts.push(...message.facts));
  const result = game.dispatch({ type: 'background.settle', seconds: 60 });
  assert.equal(result.ok, true, result.error?.stack || result.reason);
  const clicks = facts.filter(fact => fact.type === 'work.clicked');
  assert.equal(clicks.length, 180);
  assert.ok(clicks.every(fact => fact.payload.automatic && fact.payload.source === 'elven-1'));
  assert.equal(game.select('state').stats.run.clicks, 180);
  assert.equal(facts.some(fact => fact.type === 'spell.cast'), false);
});
