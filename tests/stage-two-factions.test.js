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
import { offlineSpellCastCount, spellDuration } from '../src/systems/effective.js';
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
function originalTrophies(count) {
  const template = CONTENT.definitions.find(item => item.kind === 'trophy');
  const additions = Array.from({ length: count }, (_, index) => ({
    ...template, id: `trophy.faction_fixture_${index}`, rewardId: `trophy.faction_fixture_${index}`,
    originalTrophy: true, effects: [], reactions: [],
  }));
  const fixtureGraph = compileContentGraph({ packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...additions] });
  const state = createSaveState();
  for (const definition of additions) state.permanentUnlocks[definition.id] = true;
  return { state, graph: fixtureGraph };
}

test('all 54 faction upgrades match CSV source ids names costs and tier gates', async () => {
  const rows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/faction-upgrades-54.csv', import.meta.url), 'utf8'));
  const prefixes = { FR: 'fairy', EL: 'elven', AN: 'angel', GB: 'goblin', UD: 'undead', DM: 'demon' };
  const runtimeMechanics = new Set(['fairy-4', 'goblin-7', 'goblin-9']);
  assert.equal(rows.length, 54);
  const definitions = CONTENT.definitions.filter(item => item.kind === 'upgrade' && item.ui.category === 'faction' && /^(fairy|elven|angel|goblin|undead|demon)-\d$/.test(item.id));
  assert.equal(definitions.length, 54);
  for (const row of rows) {
    const match = row['内容ID'].match(/^([A-Z]+)(\d)$/);
    const faction = prefixes[match[1]];
    const number = Number(match[2]);
    const id = `${faction}-${number}`;
    const definition = graph.definitionsById.get(id);
    assert.ok(definition, id);
    assert.equal(definition.sourceId, row['内容ID']);
    assert.equal(definition.sourceName, row['当前版本名称']);
    assert.equal(definition.purchase.costs[0].amount.constant, Number(row['成本A0']), `${id} cost`);
    assert.equal(definition.era.minR, 0);
    assert.ok(definition.effects.length > 0 || definition.mechanics?.length > 0 || runtimeMechanics.has(id), `${id} has no empty effect`);
    if (number >= 4) assert.ok(JSON.stringify(definition.visible).includes(`${faction}-${number <= 6 ? 'pact' : 'alliance'}`), `${id} tier gate`);
  }
});

test('six factions complete treaty, three tiers, eleven upgrades and their faction spell', async () => {
  const configs = [
    ['fairy', 'good', 'fairyChanting'], ['elven', 'good', 'moonBlessing'], ['angel', 'good', 'godsHand'],
    ['goblin', 'evil', 'goblinsGreed'], ['undead', 'evil', 'nightTime'], ['demon', 'evil', 'hellfireBlast'],
  ];
  for (const [faction, alignment, spell] of configs) {
    const seeded = createSaveState({ now: 1000 });
    seeded.resources.coins = 1e20;
    seeded.resources.mana = 1e9;
    seeded.resources.factionCoins[faction] = 1000;
    const game = await fixture(seeded);
    assert.ok(game.dispatch({ type: 'purchase', id: alignment }).ok, faction);
    assert.ok(game.dispatch({ type: 'purchase', id: faction }).ok, faction);
    for (const id of [`${faction}-1`, `${faction}-2`, `${faction}-3`, `${faction}-pact`, `${faction}-4`, `${faction}-5`, `${faction}-6`, `${faction}-alliance`, `${faction}-7`, `${faction}-8`, `${faction}-9`]) {
      const result = game.dispatch({ type: 'purchase', id });
      assert.equal(result.ok, true, `${faction}: ${id}: ${result.reason || result.error}`);
    }
    assert.equal(game.select('state').selections.faction, faction);
    const cast = game.dispatch({ type: 'cast', id: spell });
    assert.equal(cast.ok, true, `${faction}: ${cast.reason || cast.error}`);
    assert.ok(game.select('state').timers.spells[spell], `${spell} timer`);
  }
});

test('golden 5: EL4 changes only offline FC after the initial round', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const chance = { ...template, id: 'test.fcChance15', effects: [{ ...template.effects[0], phase: 'factionCoin', stat: 'factionCoin.chance', operation: 'add', value: { constant: 15 } }] };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, chance] };
  for (const [owned, expected] of [[false, 1], [true, 3]]) {
    const seeded = createSaveState({ now: 1000 });
    seeded.buildings.farm = 25;
    seeded.owned.run['farm-tier1'] = true;
    seeded.owned.run['farm-tier2'] = true;
    seeded.owned.run['test.fcChance15'] = true;
    if (owned) seeded.owned.run['elven-4'] = true;
    const game = await fixture(seeded, content);
    assert.equal(game.select('derived').assistants, 2);
    assert.equal(game.select('derived').fcChance, 25);
    const report = game.dispatch({ type: 'background.settle', seconds: 1 }).report;
    assert.equal(report.factionCoinsPending, expected);
  }
});

test('golden 8 consumers: EL3 EL6 and Moon Blessing all read effective R clicks', () => {
  const state = createSaveState();
  state.buildings.farm = 1;
  state.stats.run.factionCoins = Math.exp(10) - 1;
  state.stats.r.clicks = 1000;
  state.owned.run['elven-3'] = true;
  state.owned.run['elven-6'] = true;
  state.owned.run['elven-7'] = true;
  state.timers.spells.moonBlessing = { dueAt: 20 };
  const derived = computeDerived(state, graph);
  const effective = 1000 * (1 + 1.5 * 10 ** 1.15 / 100);
  close(derived.manaRegen, 1 + 0.75 * Math.log(1 + effective) ** 1.5);
  const percent = 1.5 * Math.sqrt(effective) + 1.3 * effective ** 0.7;
  close(derived.outputs.farm, 2 * (1 + percent / 100));
  assert.equal(state.stats.r.clicks, 1000);
});

test('golden 7 and 11: AN4 and DM4 provide only their confirmed building effects', () => {
  const good = createSaveState();
  good.selections.alignment = 'good';
  good.buildings.cathedral = 100;
  good.owned.run['angel-4'] = true;
  good.stats.ascension.spellsCast = 10;
  const goodDerived = computeDerived(good, graph);
  close(goodDerived.unitOutputs.cathedral, 100000 * (1 + (40 + 40 * 100 ** 0.4) / 100));
  assert.equal(good.stats.ascension.spellsCast, 10);
  const evil = createSaveState();
  evil.selections.alignment = 'evil';
  evil.buildings.evilFortress = 1;
  evil.buildings.hellPortal = 1;
  evil.owned.run['demon-4'] = true;
  const evilDerived = computeDerived(evil, graph);
  assert.equal(evilDerived.unitOutputs.evilFortress, 1000000);
  assert.equal(evilDerived.unitOutputs.hellPortal, 10000000);
  assert.equal(evil.stats.run.time, 0);
  assert.deepEqual(evil.timers.spells, {});
});

test('golden 14: EL9 DM5 and Hellfire use original TrophyCount', () => {
  const { state, graph: fixtureGraph } = originalTrophies(100);
  state.owned.run['elven-9'] = true;
  close(computeDerived(state, fixtureGraph).fcChance, 10 + 10 + 2.5 * 100 ** 0.95);
  delete state.owned.run['elven-9'];
  state.selections.alignment = 'evil';
  state.buildings.evilFortress = 1;
  state.owned.run['demon-5'] = true;
  close(computeDerived(state, fixtureGraph).unitOutputs.evilFortress, 100000 * (1 + (16 + 4 * 100 ** 0.8) / 100));
  delete state.owned.run['demon-5'];
  state.timers.spells.hellfireBlast = { dueAt: 20 };
  close(computeDerived(state, fixtureGraph).unitOutputs.evilFortress, 100000 * (1 + 120 * 100 ** 0.8 / 100));
});

test('golden 15: facility multipliers faction additive pool spell multiplier and global bonus keep their layers', () => {
  const template = CONTENT.definitions.find(item => item.id === 'gemPower');
  const lowThree = { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] };
  const additions = [
    { ...template, id: 'test.fr50', effects: [{ group: 'test.fr50', phase: 'buildingLocal', stat: 'building.production', target: lowThree, operation: 'addPercent', value: { constant: 50 }, stacking: 'add' }] },
    { ...template, id: 'test.global25', effects: [{ group: 'test.global25', phase: 'global', stat: 'global.production', target: { type: 'global' }, operation: 'addPercent', value: { constant: 25 }, stacking: 'add' }] },
  ];
  const fixtureGraph = compileContentGraph({ packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...additions] });
  const state = createSaveState();
  state.buildings = { farm: 10, inn: 140, blacksmith: 150 };
  state.owned.run['farm-tier1'] = true;
  state.owned.run['farm-tier2'] = true;
  state.owned.run['test.fr50'] = true;
  state.owned.run['test.global25'] = true;
  state.timers.spells.fairyChanting = { dueAt: 10 };
  const multiplier = 20000 ** (1 + 0.02 * 300 ** 0.2);
  close(multiplier, 37170.639674867496);
  close(computeDerived(state, fixtureGraph).outputs.farm, 8363393.926845187);
});

test('AN5 and UD4 modify real spell durations without changing real activity or cast counts', async () => {
  const seeded = createSaveState({ now: 1000 });
  seeded.resources.mana = 10000;
  seeded.spellSources.godsHand = { angel: true };
  seeded.spellSources.nightTime = { undead: true };
  seeded.stats.r.alignmentTime.good = 100;
  seeded.stats.ascension.factionCoinsByFaction.undead = 1000;
  seeded.owned.run['angel-5'] = true;
  seeded.owned.run['undead-4'] = true;
  const game = await fixture(seeded);
  assert.equal(spellDuration(game.select('state'), graph, graph.definitionsById.get('godsHand'), game.select('derived')), 30);
  close(offlineSpellCastCount(game.select('state'), 10, 100), 10 * (1 + 0.01 * 5 * Math.log(101)));
  assert.equal(offlineSpellCastCount(game.select('state'), 0, 100), 0, 'no autocasting source is fabricated');
  const nightExpected = 20 * 1.5 * (1 + (5 + 1.5 * Math.log(1001) ** 1.5) / 100);
  assert.equal(spellDuration(game.select('state'), graph, graph.definitionsById.get('nightTime'), game.select('derived')), nightExpected);
  game.dispatch({ type: 'cast', id: 'godsHand' });
  assert.equal(game.select('state').timers.spells.godsHand.dueAt, 30);
  assert.equal(game.select('state').stats.ascension.spellsCast, 1);
});

test('EL8 emits one real luck event with production reward and shared FC pending', async () => {
  const probe = createSaveState();
  let value = 1;
  for (; value < 100000; value++) {
    probe.rng.streams['drops:factionCoin'] = { calls: 0, value };
    const first = nextDouble(probe, 'drops:factionCoin');
    const second = nextDouble(probe, 'drops:factionCoin');
    if (first >= 0.1 && second < 0.01) break;
  }
  const seeded = createSaveState({ now: 1000 });
  seeded.buildings.farm = 1;
  seeded.owned.run['elven-8'] = true;
  const game = await fixture(seeded);
  game.select('state').rng.streams['drops:factionCoin'] = { calls: 0, value };
  const result = game.dispatch({ type: 'work' });
  assert.equal(result.ok, true);
  const luck = result.facts.find(fact => fact.type === 'elvenLuck.triggered');
  assert.ok(luck, 'controlled stream triggers EL8');
  assert.equal(luck.payload.source, 'manualClick');
  assert.equal(luck.payload.earned, 20000);
  assert.equal(game.select('state').stats.ascension.elvenLuck, 1);
  assert.equal(game.select('state').stats.run.clicks, 1);
  close(game.select('factionCoins').pending, 10);
});
