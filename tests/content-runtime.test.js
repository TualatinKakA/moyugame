import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph, ContentValidationError, formatDescription } from '../src/systems/content-registry.js';
import { createGameRuntime } from '../src/systems/runtime.js';
import { createSaveAdapter, createMemoryStorage, SAVE_KEY } from '../src/systems/persistence.js';
import { createSaveState, migrateAndNormalizeState, stateHash } from '../src/systems/state.js';
import { gemsForRunCoins, reincarnationRequirement } from '../src/systems/progression.js';

function fixture(initial = null, { failSave = false, nowStart = 1000, content = CONTENT } = {}) {
  let now = nowStart;
  const storage = createMemoryStorage();
  if (failSave) storage.setItem = () => { throw new Error('quota'); };
  const adapter = createSaveAdapter({ storage });
  if (initial) adapter.save(initial);
  const clock = { wallNow: () => now, monotonicNow: () => now };
  const game = createGameRuntime({ content, saveAdapter: adapter, clock });
  return { game, storage, adapter, clock, advance: value => { now += value; } };
}
const initial = () => {
  const state = createSaveState({ now: 1000, contentVersions: ['base-v1'] });
  state.resources.coins = 1e12; state.resources.mana = 10000;
  return state;
};
const assertClose = (actual, expected, message = '') => {
  const tolerance = 1e-9 * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message} expected ${expected}, got ${actual}`);
};

test('content graph contains only Fairy and Goblin factions with declarative prologue content', async () => {
  const { game } = fixture();
  assert.deepEqual(game.graph.arraysByKind.get('faction').map(item => item.id), ['fairy', 'goblin']);
  assert.equal(game.graph.arraysByKind.get('story').length, 8);
  assert.ok(game.graph.arraysByKind.get('trophy').length >= 8);
  assert.equal(game.graph.arraysByKind.get('building').some(item => item.alignment === 'neutral'), false);
  await game.start();
});

test('startup validation aggregates duplicate IDs and unknown actions', () => {
  const duplicate = CONTENT.definitions[0];
  const invalid = { ...CONTENT.definitions.find(item => item.kind === 'trophy'), id: 'invalid.trophy', grants: [{ type: 'notAnAction' }] };
  assert.throws(() => compileContentGraph({ definitions: [...CONTENT.definitions, duplicate, invalid], packs: CONTENT.packs }), error => {
    assert.ok(error instanceof ContentValidationError);
    assert.ok(error.errors.some(item => item.includes('duplicate global ID')));
    assert.ok(error.errors.some(item => item.includes('unknown action')));
    return true;
  });
});

test('start immediately queues prologue and first wage is persistent and idempotent', async () => {
  const { game, storage } = fixture();
  await game.start();
  assert.equal(game.dispatch({ type: 'start' }).ok, true);
  assert.deepEqual(game.select('storyQueue').map(item => item.id), ['intro.onboarding']);
  assert.ok(storage.getItem(SAVE_KEY), 'critical story start saves synchronously');
  assert.equal(game.dispatch({ type: 'story.close', id: 'intro.onboarding' }).ok, true);
  game.dispatch({ type: 'work' });
  assert.deepEqual(game.select('storyQueue').map(item => item.id), ['intro.first_wage']);
  const unlocked = Object.keys(game.select('state').permanentUnlocks);
  game.dispatch({ type: 'work' });
  assert.deepEqual(Object.keys(game.select('state').permanentUnlocks), unlocked);
  assert.equal(game.select('state').stats.total.clicks, 2);
});

test('purchase, faction selection, spell source and timer expiry use one transactional rule set', async () => {
  const { game } = fixture(initial());
  await game.start();
  assert.equal(game.dispatch({ type: 'purchase', id: 'good' }).ok, true);
  assert.equal(game.dispatch({ type: 'purchase', id: 'fairy' }).ok, true);
  assert.equal(game.dispatch({ type: 'purchase', id: 'goblin' }).reason, 'HIDDEN_SYSTEM');
  assert.equal(game.dispatch({ type: 'purchase', id: 'farm', amount: 10 }).ok, true);
  assert.equal(game.dispatch({ type: 'purchase', id: 'fairy-1' }).ok, true);
  assert.equal(game.dispatch({ type: 'cast', id: 'fairyChanting' }).ok, true);
  assert.equal(game.select('state').timers.spells.fairyChanting.dueAt, 10);
  assert.ok(game.select('derived').production > 500000);
  game.tick(10);
  assert.equal(game.select('state').timers.spells.fairyChanting, undefined);
  assert.ok(game.select('derived').production < 500000);
  assert.equal(game.select('state').owned.run['fairy-1'], true);
});

test('rejected purchase is atomic and does not change authoritative hash', async () => {
  const { game } = fixture();
  await game.start();
  const before = game.select('stateHash');
  const result = game.dispatch({ type: 'purchase', id: 'farm' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'NEED_RESOURCE');
  assert.equal(game.select('stateHash'), before);
});

test('critical save failure rolls back story, trophy and state changes', async () => {
  const { game } = fixture(null, { failSave: true });
  await game.start();
  const before = game.select('stateHash');
  const result = game.dispatch({ type: 'start' });
  assert.equal(result.ok, false);
  assert.equal(game.select('storyQueue').length, 0);
  assert.deepEqual(game.select('state').permanentUnlocks, {});
  assert.equal(game.select('stateHash'), before);
  assert.equal(game.select('saveStatus').dirty, true);
});

test('same seed, commands and ticks replay to the same hash', async () => {
  const run = async () => {
    const { game } = fixture(initial());
    await game.start();
    game.dispatch({ type: 'start' });
    game.dispatch({ type: 'story.close', id: 'intro.onboarding' });
    for (let index = 0; index < 20; index++) game.dispatch({ type: 'work' });
    game.dispatch({ type: 'purchase', id: 'good' });
    game.dispatch({ type: 'purchase', id: 'fairy' });
    for (let index = 0; index < 10; index++) game.dispatch({ type: 'work' });
    game.tick(0.2); game.tick(0.4);
    return game.select('stateHash');
  };
  assert.equal(await run(), await run());
});

test('schema 3 migration preserves supported progress and quarantines removed content', () => {
  const graph = compileContentGraph(CONTENT);
  const old = {
    schemaVersion: 3, coins: 1000, gems: 2, mana: 50,
    buildings: { farm: 5, deepMine: 9 }, upgrades: ['fairy-1', 'unknown-upgrade'],
    alignment: 'good', faction: 'fairy', activeSpells: { fairyChanting: 5 },
    trophies: ['trophy.first_click'],
    story: { pending: [], read: ['intro.onboarding'], history: [], intro: { completed: false } },
    stats: { total: { clicks: 10 }, run: { coins: 1000 } },
  };
  const { state, report } = migrateAndNormalizeState(old, graph);
  assert.equal(report.from, 3); assert.equal(report.to, 4);
  assert.equal(state.resources.coins, 1000); assert.equal(state.buildings.farm, 5);
  assert.equal(state.owned.run['fairy-1'], true);
  assert.equal(state.spellSources.fairyChanting.fairy, true);
  assert.equal(state.story.completed['intro.onboarding'], true);
  assert.equal(state.quarantined.unknownIds.deepMine, 9);
  assert.equal(state.quarantined.unknownIds['unknown-upgrade'], true);
});

test('save adapter recovers a valid previous slot without overwriting corrupt raw data', () => {
  const storage = createMemoryStorage();
  const adapter = createSaveAdapter({ storage });
  adapter.save(createSaveState());
  storage.setItem(`${SAVE_KEY}:previous`, JSON.stringify(createSaveState()));
  storage.setItem(SAVE_KEY, '{truncated');
  const loaded = adapter.load();
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.corruptedRaw, '{truncated');
  assert.equal(storage.getItem(`${SAVE_KEY}:corrupt`), '{truncated');
  assert.ok(loaded.raw);
});

test('offline settlement uses event segments rather than 200ms replay', async () => {
  const seeded = initial(); seeded.buildings.farm = 10; seeded.lastWallClock = 0;
  const { game } = fixture(seeded, { nowStart: 20000 });
  await game.start();
  assert.equal(game.select('state').resources.coins, 1e12 + 200);
  assert.equal(game.select('state').stats.total.offlineTime, 20);
});

test('abdication uses original gem growth and preserves trophies and prologue', async () => {
  const seeded = initial(); seeded.stats.run.coins = 1e12; seeded.permanentUnlocks['trophy.first_click'] = true;
  const { game } = fixture(seeded);
  await game.start();
  const retired = game.dispatch({ type: 'abdicate' });
  assert.equal(retired.ok, true); assert.equal(retired.result.earned, 1);
  assert.equal(game.select('state').resources.gems, 1);
  assert.deepEqual(game.select('state').buildings, {});
  assert.equal(game.select('state').permanentUnlocks['trophy.first_click'], true);
  assert.deepEqual(game.select('storyQueue').map(item => item.id), ['intro.first_retirement']);
  game.dispatch({ type: 'story.close', id: 'intro.first_retirement' });
  assert.equal(game.select('state').story.groups.prologue, true);
  assert.equal(game.dispatch({ type: 'reincarnate' }).ok, false, 'one gem is not enough for original R1');
});

test('original reincarnation threshold, reset and R1 power apply together', async () => {
  assert.equal(gemsForRunCoins(1e12), 1);
  assert.equal(gemsForRunCoins(3e12), 2);
  assert.equal(reincarnationRequirement(0), 1e27);
  assert.equal(reincarnationRequirement(1), 1e30);
  const seeded = initial(); seeded.resources.gems = 1e27;
  const { game } = fixture(seeded);
  await game.start();
  assert.equal(game.select('reincarnation').visible, true);
  assert.equal(game.dispatch({ type: 'reincarnate' }).ok, true);
  assert.equal(game.select('state').progression.reincarnations, 1);
  assert.equal(game.select('state').resources.gems, 0);
  assert.equal(game.select('reincarnation').visible, false);
  assert.equal(game.select('derived').manaRegen, 3);
  assert.equal(game.select('derived').fcChance, 20);
  assert.equal(game.select('derived').offlineMultiplier, 5.5);
  assert.equal(game.select('reincarnation').requirement, 1e30);
});

test('ordinary tick evaluates no content reactions and reuses derived cache', async () => {
  const { game } = fixture(initial());
  await game.start();
  let message;
  game.subscribe(value => { if (value.commandType === 'tick') message = value; });
  game.tick(0.2);
  assert.equal(message.diagnostics.lastTransaction.rules, 0);
  assert.equal(message.diagnostics.lastTransaction.queueDepth, 0);
});

test('a new trophy requires only a definition to join reactions, selectors and sparse state', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'trophy.first_click');
  const added = {
    ...template, id: 'trophy.content_update', name: '内容包更新', rewardId: 'trophy.content_update',
    description: '新增定义即可解锁。', reactions: [{ event: 'work.clicked', priority: 10 }], effects: [],
  };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, added] };
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  const game = createGameRuntime({ content, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 0 } });
  await game.start();
  assert.equal(game.dispatch({ type: 'work' }).ok, true);
  assert.equal(game.select('state').permanentUnlocks[added.id], true);
  assert.equal(game.select('content', { id: added.id }).status, 'OWNED');
});

test('story choices validate, persist and execute declarative actions once', async () => {
  const template = CONTENT.definitions.find(item => item.id === 'intro.onboarding');
  const choiceStory = {
    ...template, id: 'intro.choice_test', title: '选择测试', rewardId: 'intro.choice_test', grants: [],
    reactions: [{ event: 'game.started', priority: 1 }],
    choices: [{ id: 'accept', label: '接受', actions: [{ type: 'grantResource', resource: 'coins', amount: { constant: 5 } }] }],
  };
  const adapter = createSaveAdapter({ storage: createMemoryStorage() });
  const game = createGameRuntime({ content: { packs: CONTENT.packs, definitions: [...CONTENT.definitions, choiceStory] }, saveAdapter: adapter, clock: { wallNow: () => 1000, monotonicNow: () => 0 } });
  await game.start(); game.dispatch({ type: 'start' });
  assert.equal(game.dispatch({ type: 'story.choice', id: choiceStory.id, choiceId: 'accept' }).ok, true);
  assert.equal(game.select('state').resources.coins, 5);
  assert.equal(game.select('state').story.choices[choiceStory.id], 'accept');
  game.dispatch({ type: 'story.close', id: choiceStory.id });
  const coins = game.select('state').resources.coins;
  game.dispatch({ type: 'story.choice', id: choiceStory.id, choiceId: 'accept' });
  assert.equal(game.select('state').resources.coins, coins);
});

test('fivefold reaction content does not add work to an ordinary tick', async () => {
  const trophies = CONTENT.definitions.filter(item => item.kind === 'trophy');
  const copies = Array.from({ length: 4 }, (_, batch) => trophies.map(item => ({
    ...item, id: `${item.id}.stress${batch}`, rewardId: `${item.id}.stress${batch}`,
    reactions: item.reactions.map(reaction => ({ ...reaction })), effects: [],
  }))).flat();
  const { game } = fixture(initial());
  const stress = createGameRuntime({ content: { packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...copies] }, saveAdapter: createSaveAdapter({ storage: createMemoryStorage() }), clock: { wallNow: () => 1000, monotonicNow: () => 0 } });
  await game.start(); await stress.start();
  let message;
  stress.subscribe(value => { if (value.commandType === 'tick') message = value; });
  stress.tick(0.2);
  assert.equal(message.diagnostics.lastTransaction.rules, 0);
  assert.equal(message.diagnostics.lastTransaction.queueDepth, 0);
});

test('aggregate building dependencies invalidate the affected formula group after purchase', async () => {
  const { game } = fixture(initial());
  await game.start();
  game.dispatch({ type: 'purchase', id: 'evil' });
  game.dispatch({ type: 'purchase', id: 'goblin' });
  game.dispatch({ type: 'purchase', id: 'slavePen', amount: 10 });
  game.dispatch({ type: 'purchase', id: 'goblin-2' });
  const before = game.select('derived').outputs.slavePen;
  game.dispatch({ type: 'purchase', id: 'slavePen', amount: 10 });
  const after = game.select('derived').outputs.slavePen;
  assert.ok(after > before * 2, `expected aggregate bonus to increase: ${before} -> ${after}`);
});

test('building selector returns accurate per-second gain for the current bulk purchase', async () => {
  const { game } = fixture(initial());
  await game.start();
  const ten = game.select('content', { id: 'farm', amount: 10 });
  assert.equal(ten.quantity, 10);
  assert.equal(ten.viewModel.purchaseProduction, 20);
  game.dispatch({ type: 'purchase', id: 'farm', amount: 10 });
  const one = game.select('content', { id: 'farm', amount: 1 });
  assert.equal(one.viewModel.purchaseProduction, 2);
  assert.equal(game.select('state').resources.coins, 1e12 - ten.costs[0].value, 'preview itself does not spend resources');
});

test('Gem Power unlock applies production and FC bonuses then resets with the run', async () => {
  const seeded = initial();
  seeded.resources.gems = 100;
  seeded.buildings.farm = 10;
  seeded.stats.run.coins = 1e12;
  const { game } = fixture(seeded);
  await game.start();
  assert.equal(game.select('derived').production, 20);
  assert.equal(game.select('content', { id: 'gemPower' }).status, 'PURCHASABLE');
  assert.equal(game.dispatch({ type: 'purchase', id: 'gemPower' }).ok, true);
  assert.equal(game.select('derived').production, 60);
  assert.equal(game.select('derived').fcChance, 12);
  assert.equal(game.dispatch({ type: 'abdicate' }).ok, true);
  assert.equal(game.select('state').owned.run.gemPower, undefined);
  assert.equal(game.select('derived').production, 0);
  assert.notEqual(game.select('content', { id: 'gemPower' }).status, 'HIDDEN_SYSTEM');
});
test('player-facing names match the workplace naming reference without changing stable IDs', () => {
  const graph = compileContentGraph(CONTENT);
  const expected = {
    good: '理想', evil: '务实', holyLight: '奋斗动员', bloodFrenzy: '务实冲刺',
    'fairy-1': '需求培养土', 'fairy-2': '产品新人', 'fairy-3': '善意默认值',
    'goblin-1': '强势现金流', 'goblin-2': '外包交易', 'goblin-3': '低成本物料',
    'farm-tier1': '工位轮换', 'inn-tier1': '精品咖啡', 'blacksmith-tier1': '重型订书锤',
    warriorBarracks: '奋斗培训室', 'warriorBarracks-tier1': '青铜任务卡', 'heavensGate-tier1': '黄金钥匙',
    gemPower: '期权激励',
  };
  for (const [id, name] of Object.entries(expected)) assert.equal(graph.definitionsById.get(id).name, name, id);
});

test('mana regeneration override applies immediately and persists through the setting command', async () => {
  const { game } = fixture();
  await game.start();
  assert.equal(game.dispatch({ type: 'setting', key: 'manaRegenOverride', value: -1 }).ok, false);
  assert.equal(game.dispatch({ type: 'setting', key: 'manaRegenOverride', value: 7 }).ok, true);
  assert.equal(game.select('derived').manaRegen, 7);
  game.tick(0.5);
  assert.equal(game.select('state').resources.mana, 3.5);
  assert.equal(game.select('state').settings.manaRegenOverride, 7);
});

test('alignment commitment stays selected until retirement and awards its story trophy once', async () => {
  const { game } = fixture(initial());
  await game.start();
  assert.equal(game.dispatch({ type: 'purchase', id: 'good' }).ok, true);
  assert.equal(game.select('content', { id: 'good' }).status, 'SELECTED');
  assert.deepEqual(game.select('storyQueue').map(item => item.id), ['alignment.idealism']);
  assert.equal(game.select('state').permanentUnlocks['trophy.alignment.idealism'], true);
  assert.equal(game.dispatch({ type: 'purchase', id: 'evil' }).reason, 'LOCKED_REQUIREMENT');
  game.dispatch({ type: 'story.close', id: 'alignment.idealism' });
  assert.equal(game.dispatch({ type: 'purchase', id: 'good' }).reason, 'SELECTED');
  assert.equal(game.select('storyQueue').length, 0);

  game.select('state').stats.run.coins = 1e8;
  assert.equal(game.dispatch({ type: 'abdicate' }).ok, true);
  assert.equal(game.select('state').selections.alignment, null);
  game.dispatch({ type: 'story.close', id: 'intro.first_retirement' });
  game.select('state').resources.coins = 1e12;
  assert.equal(game.dispatch({ type: 'purchase', id: 'evil' }).ok, true);
  assert.deepEqual(game.select('storyQueue').map(item => item.id), ['alignment.pragmatism']);
  assert.equal(game.select('state').permanentUnlocks['trophy.alignment.pragmatism'], true);
  game.dispatch({ type: 'story.close', id: 'alignment.pragmatism' });
});

test('the first two upgrade tiers of every ordinary building grant exactly one assistant', () => {
  const graph = compileContentGraph(CONTENT);
  for (const building of graph.arraysByKind.get('building')) {
    for (const tier of [1, 2, 3]) {
      const upgrade = graph.definitionsById.get(`${building.id}-tier${tier}`);
      const granted = upgrade.effects
        .filter(effect => effect.stat === 'assistants.count')
        .reduce((sum, effect) => sum + effect.value.constant, 0);
      assert.equal(granted, tier <= 2 ? 1 : 0, `${upgrade.id} assistant grant`);
    }
  }
});

test('assistants produce five percent of click reward each without producing real clicks', async () => {
  const seeded = initial(); seeded.buildings.farm = 10;
  const { game } = fixture(seeded);
  await game.start();
  assert.equal(game.dispatch({ type: 'purchase', id: 'farm-tier1' }).ok, true);
  assert.equal(game.select('derived').assistants, 1);
  assert.equal(game.dispatch({ type: 'purchase', id: 'farm-tier2' }).ok, true);
  const derived = game.select('derived');
  assert.equal(derived.assistants, 2);
  assert.equal(derived.clickReward, 1);
  assert.equal(derived.buildingProduction, 60);
  assertClose(derived.assistantProduction, 0.1, 'two assistants at base click reward');
  assertClose(derived.production, 60.1, 'building plus assistant production');
  const before = game.select('state');
  const producedCoins = before.stats.run.coins;
  const clicks = before.stats.total.clicks;
  const clickCoins = before.stats.total.clickCoins;
  game.tick(2);
  assertClose(game.select('state').stats.run.coins - producedCoins, derived.production * 2, 'continuous assistant income');
  assert.equal(game.select('state').stats.total.clicks, clicks, 'assistants do not increment clicks');
  assert.equal(game.select('state').stats.total.clickCoins, clickCoins, 'assistants do not increment click income');
});

test('click skills, global skills, Gem Power and spell expiry propagate to assistant production', async () => {
  const seeded = initial(); seeded.buildings.farm = 1; seeded.resources.gems = 100;
  const { game } = fixture(seeded);
  await game.start();
  game.dispatch({ type: 'purchase', id: 'good' });
  game.dispatch({ type: 'purchase', id: 'farm-tier1' });
  game.dispatch({ type: 'purchase', id: 'gemPower' });
  let derived = game.select('derived');
  assert.equal(derived.assistants, 1);
  assert.equal(derived.buildingProduction, 9);
  assertClose(derived.assistantProduction, 0.15, 'Gem Power multiplies assistant production');

  game.dispatch({ type: 'cast', id: 'callToArms' });
  const globalActive = game.select('derived');
  const globalRatio = globalActive.buildingProduction / derived.buildingProduction;
  assert.ok(globalRatio > 1);
  assertClose(globalActive.assistantProduction, derived.assistantProduction * globalRatio, 'global spell multiplier');
  assert.equal(globalActive.clickReward, 1, 'global production does not inflate manual clicks');

  game.dispatch({ type: 'cast', id: 'holyLight' });
  derived = game.select('derived');
  assert.equal(derived.clickReward, 18.5);
  assertClose(derived.assistantProduction, globalActive.assistantProduction * 18.5, 'click skill multiplier');

  game.tick(20);
  derived = game.select('derived');
  assert.equal(derived.clickReward, 1);
  assertClose(derived.assistantProduction, 0.15, 'spell expiry restores base assistant output');
  game.dispatch({ type: 'work' });
  derived = game.select('derived');
  assert.equal(derived.clickReward, 1.05);
  assertClose(derived.assistantProduction, 0.1575, 'permanent click reward upgrade propagates');
});

test('Goblin assistant count recalculates when faction coins change', async () => {
  const seeded = initial(); seeded.resources.factionCoins.goblin = 16;
  const { game } = fixture(seeded);
  await game.start();
  game.dispatch({ type: 'purchase', id: 'evil' });
  game.dispatch({ type: 'purchase', id: 'goblin' });
  game.dispatch({ type: 'purchase', id: 'goblin-1' });
  const expected = count => Math.floor(0.5 * Math.log(1 + count) ** 2);
  assert.equal(game.select('derived').assistants, expected(16));
  game.dispatch({ type: 'cast', id: 'goblinsGreed' });
  assert.equal(game.select('state').resources.factionCoins.goblin, 36);
  assert.equal(game.select('derived').assistants, expected(36));
});

test('legacy building upgrades restore assistants through migration and abdication clears them', async () => {
  const legacy = {
    schemaVersion: 3, coins: 1e12, gems: 0, mana: 0,
    buildings: { farm: 10 }, upgrades: ['farm-tier1', 'farm-tier2'],
    stats: { run: { coins: 1e12 }, total: { clicks: 1 } },
    story: { pending: [], read: [], history: [], intro: {} },
  };
  const { game } = fixture(legacy);
  await game.start();
  assert.equal(game.select('derived').assistants, 2);
  assertClose(game.select('derived').assistantProduction, 0.1);
  assert.equal(game.dispatch({ type: 'abdicate' }).ok, true);
  assert.equal(game.select('state').owned.run['farm-tier1'], undefined);
  assert.equal(game.select('state').owned.run['farm-tier2'], undefined);
  assert.equal(game.select('derived').assistants, 0);
  assert.equal(game.select('derived').assistantProduction, 0);
});

test('reincarnation clears run-scoped assistant upgrades and their production', async () => {
  const seeded = initial(); seeded.resources.gems = 1e27; seeded.buildings.farm = 10;
  seeded.owned.run['farm-tier1'] = true; seeded.owned.run['farm-tier2'] = true;
  const { game } = fixture(seeded);
  await game.start();
  assert.equal(game.select('derived').assistants, 2);
  assert.equal(game.dispatch({ type: 'reincarnate' }).ok, true);
  assert.equal(game.select('derived').assistants, 0);
  assert.equal(game.select('derived').assistantProduction, 0);
  assert.equal(game.select('derived').production, 0);
});

test('spell descriptions resolve effect targets through current building names', () => {
  const spell = CONTENT.definitions.find(item => item.id === 'fairyChanting');
  const graph = compileContentGraph(CONTENT);
  assert.equal(formatDescription(spell, graph), '10 秒内使见习工位、茶水间与打印维修间产出提高 50000%。');
  const renamed = {
    packs: CONTENT.packs,
    definitions: CONTENT.definitions.map(item => item.id === 'farm' ? { ...item, name: '附魔工位' } : item),
  };
  const renamedGraph = compileContentGraph(renamed);
  const renamedSpell = renamedGraph.definitionsById.get('fairyChanting');
  assert.equal(formatDescription(renamedSpell, renamedGraph), '10 秒内使附魔工位、茶水间与打印维修间产出提高 50000%。');
});

test('assistant count and production modifiers compose through generic additive and multiplicative channels', async () => {
  const group = (name, phase, stat, operation, constant) => ({ group: `test.${name}`, phase, stat, target: { type: 'global' }, operation, value: { constant }, stacking: operation === 'add' || operation === 'addPercent' ? 'add' : 'multiply' });
  const extension = {
    ...CONTENT.definitions.find(item => item.id === 'gemPower'), id: 'test.assistantModifiers',
    effects: [
      group('countAdd', 'assistants', 'assistants.count', 'add', 2),
      group('countMult', 'assistants', 'assistants.count', 'multiplyPercent', 200),
      group('productionAdd', 'global', 'assistants.production', 'addPercent', 100),
      group('productionMult', 'global', 'assistants.production', 'multiplyPercent', 50),
    ],
  };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, extension] };
  const seeded = initial(); seeded.buildings.farm = 1;
  seeded.owned.run['farm-tier1'] = true; seeded.owned.run[extension.id] = true;
  const { game } = fixture(seeded, { content });
  await game.start();
  const derived = game.select('derived');
  assert.equal(derived.assistants, 9, '(1 building assistant + 2) × 3');
  assertClose(derived.assistantProduction, 1.35, '9 × 1 × 5% × 2 × 1.5');
  assertClose(derived.production, 4.35);
});

test('derived dependency fingerprints refresh assistant scaling without clearing unrelated formulas', async () => {
  const countFromFarms = {
    ...CONTENT.definitions.find(item => item.id === 'gemPower'), id: 'test.countFromFarms',
    effects: [{ group: 'test.countFromFarms', phase: 'assistants', stat: 'assistants.count', target: { type: 'global' }, operation: 'add', value: { formula: 'x', variables: { x: 'buildings.farm' } }, stacking: 'add' }],
  };
  const scaling = {
    ...CONTENT.definitions.find(item => item.id === 'gemPower'), id: 'test.assistantScaling',
    effects: [{ group: 'test.assistantScaling', phase: 'global', stat: 'global.production', target: { type: 'global' }, operation: 'addPercent', value: { formula: '10 * x', variables: { x: 'derived.assistants' } }, stacking: 'add' }],
  };
  const content = { packs: CONTENT.packs, definitions: [...CONTENT.definitions, countFromFarms, scaling] };
  const seeded = initial(); seeded.buildings.farm = 1;
  seeded.owned.run[countFromFarms.id] = true; seeded.owned.run[scaling.id] = true;
  const { game } = fixture(seeded, { content });
  await game.start();
  let derived = game.select('derived');
  assert.equal(derived.assistants, 1);
  assertClose(derived.buildingProduction, 2.2);
  assertClose(derived.assistantProduction, 0.055);
  game.dispatch({ type: 'purchase', id: 'farm' });
  derived = game.select('derived');
  assert.equal(derived.assistants, 2);
  assertClose(derived.buildingProduction, 4.8, 'derived.assistants dependency must refresh from 1 to 2');
  assertClose(derived.assistantProduction, 0.12);
});

test('conditional effects and pre-cast derived conditions support the Fairy Choir boundary', async () => {
  for (const baseAssistants of [44, 45]) {
    const choirId = `trophy.fairy_choir_test_${baseAssistants}`;
    const base = {
      ...CONTENT.definitions.find(item => item.id === 'gemPower'), id: `test.baseAssistants${baseAssistants}`,
      effects: [{ group: `test.baseAssistants${baseAssistants}`, phase: 'assistants', stat: 'assistants.count', target: { type: 'global' }, operation: 'add', value: { constant: baseAssistants }, stacking: 'add' }],
    };
    const choir = {
      ...CONTENT.definitions.find(item => item.id === 'trophy.first_click'), id: choirId, rewardId: choirId, effects: [],
      reactions: [{ event: 'spell.cast', priority: 50, when: { all: [
        { op: 'eventDataEquals', path: 'spellId', value: 'fairyChanting' },
        { op: 'statAtLeast', path: 'derived.assistants', value: 45 },
      ] } }],
    };
    const spellEffect = {
      group: `test.fairyChoir${baseAssistants}`, phase: 'assistants', stat: 'assistants.count', target: { type: 'global' },
      operation: 'multiplyPercent', value: { constant: 200 }, stacking: 'multiply', when: { op: 'owned', id: choirId },
    };
    const content = {
      packs: CONTENT.packs,
      definitions: [...CONTENT.definitions.map(item => item.id === 'fairyChanting' ? { ...item, effects: [...item.effects, spellEffect] } : item), base, choir],
    };
    const seeded = initial(); seeded.spellSources.fairyChanting = { fairy: true }; seeded.owned.run[base.id] = true;
    const { game } = fixture(seeded, { content });
    await game.start();
    assert.equal(game.select('derived').assistants, baseAssistants);
    assert.equal(game.dispatch({ type: 'cast', id: 'fairyChanting' }).ok, true);
    assert.equal(Boolean(game.select('state').permanentUnlocks[choirId]), baseAssistants === 45);
    assert.equal(game.select('derived').assistants, baseAssistants === 45 ? 135 : 44);
    game.tick(10);
    assert.equal(game.select('derived').assistants, baseAssistants, 'spell expiry removes the conditional multiplier');
  }
});
