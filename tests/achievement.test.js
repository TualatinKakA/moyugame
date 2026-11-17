import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAchievementRegistry, evaluateAchievements, purchaseAchievement,
  getActiveAchievementRewards, getAchievementCost, resolveAchievementReward,
  getHighestBusinessAchievement,
} from '../src/systems/achievements.js';
import { ACHIEVEMENTS } from '../src/content/achievements/index.js';
import { createAchievementState } from '../src/core/story-state.js';
import { createCompatibilitySnapshot } from '../src/systems/conditions.js';
import { testContext, domainEvent } from './story-test-helpers.js';

function definition(overrides = {}) {
  return {
    id: 'test.achievement', category: 'gameplay', name: '测试', description: '测试成就',
    trigger: { event: 'test.completed', condition: 'always' }, acquireMode: 'auto',
    visibility: 'visible', once: 'profile',
    reward: { type: 'globalProduction', operation: 'addPercent', value: 5 },
    ...overrides,
  };
}

function achievementState() {
  return {
    coins: 1000,
    progression: { reincarnations: 0, ascension: 0 },
    stats: { total: {} },
    achievements: createAchievementState(),
  };
}

test('auto achievement activates once and exposes one structured reward', () => {
  const registry = createAchievementRegistry([definition()]);
  const state = achievementState();
  const event = domainEvent('test.completed');
  const first = evaluateAchievements(state, event, { registry, at: 10 });
  const second = evaluateAchievements(state, event, { registry, at: 20 });
  assert.deepEqual(first.activated, ['test.achievement']);
  assert.equal(first.activations.length, 1);
  assert.equal(second.changed, false);
  assert.equal(second.activations.length, 0);
  const rewards = getActiveAchievementRewards(state, { registry });
  assert.equal(rewards.length, 1);
  assert.equal(rewards[0].reward.value, 5);
  assert.equal(state.achievements.stateById['test.achievement'].status, 'active');
});

test('unmet and failed events do not create achievement state', () => {
  const registry = createAchievementRegistry([definition({ trigger: { event: 'test.completed', condition: 'never' } })], {
    conditionRegistry: {
      assertCondition: () => {},
      evaluateCondition: () => false,
    },
  });
  const state = achievementState();
  const conditionRegistry = {
    assertCondition: () => {},
    evaluateCondition: () => false,
  };
  const result = evaluateAchievements(state, domainEvent('test.completed'), { registry, conditionRegistry });
  assert.equal(result.changed, false);
  assert.deepEqual(state.achievements.stateById, {});
});

test('purchase achievement waits for availability, deducts once and applies real A rules', () => {
  const registry = createAchievementRegistry([definition({
    acquireMode: 'purchase', cost: 100, costCurrency: 'coins', freeFromAscension: 1,
    reward: {
      type: 'globalProduction', operation: 'addPercent', value: 8,
      ascension: [{ from: 1, value: 2 }],
    },
  })]);
  const state = achievementState();
  assert.deepEqual(getActiveAchievementRewards(state, { registry }), []);
  assert.equal(purchaseAchievement(state, 'test.achievement', { registry }).reason, 'locked');
  evaluateAchievements(state, domainEvent('test.completed'), { registry });
  assert.equal(state.achievements.stateById['test.achievement'].status, 'available');
  assert.deepEqual(getActiveAchievementRewards(state, { registry }), []);

  state.coins = 50;
  assert.equal(purchaseAchievement(state, 'test.achievement', { registry }).reason, 'insufficient-funds');
  assert.equal(state.coins, 50);
  state.coins = 500;
  const purchased = purchaseAchievement(state, 'test.achievement', { registry, at: 123 });
  assert.equal(purchased.ok, true);
  assert.equal(purchased.activation.reward.value, 8);
  assert.equal(state.coins, 400);
  assert.equal(state.achievements.stateById['test.achievement'].purchasedAt, 123);
  assert.equal(purchaseAchievement(state, 'test.achievement', { registry }).reason, 'already-acquired');
  assert.equal(state.coins, 400);

  state.progression.ascension = 1;
  const snapshot = createCompatibilitySnapshot(state);
  assert.equal(getAchievementCost(registry.get('test.achievement'), snapshot), 0);
  assert.equal(resolveAchievementReward(registry.get('test.achievement'), snapshot).value, 2);
});

test('run, reincarnation and ascension achievements only reactivate in a new cycle', () => {
  for (const scope of ['run', 'reincarnation', 'ascension']) {
    const registry = createAchievementRegistry([definition({ once: scope })]);
    const state = achievementState();
    state.cycles = { run: 0 };
    evaluateAchievements(state, domainEvent('test.completed'), { registry });
    evaluateAchievements(state, domainEvent('test.completed'), { registry });
    assert.equal(state.achievements.stateById['test.achievement'].status, 'active');
    if (scope === 'run') state.cycles.run = 1;
    else if (scope === 'reincarnation') state.progression.reincarnations = 1;
    else state.progression.ascension = 1;
    const result = evaluateAchievements(state, domainEvent('test.completed'), { registry });
    assert.equal(result.activations.length, 1, scope);
    assert.equal(state.achievements.stateById['test.achievement'].cycleKey, '1');
    assert.equal(getActiveAchievementRewards(state, { registry }).length, 1);
  }
});

test('progress uses snapshot paths without executable content conditions', () => {
  const registry = createAchievementRegistry([definition({
    trigger: { event: 'state', condition: 'always' },
    progress: { path: 'stats.run.coins', target: 100 },
  })]);
  const state = achievementState();
  state.stats.run = { coins: 40 };
  const result = evaluateAchievements(state, domainEvent('state'), { registry });
  assert.equal(result.changed, true);
  assert.deepEqual(state.achievements.progress['test.achievement'], { value: 40, target: 100 });
});

test('registry rejects duplicate IDs, unknown conditions, implicit costs and rewards', () => {
  assert.throws(() => createAchievementRegistry([definition(), definition()]), /Duplicate/);
  assert.throws(() => createAchievementRegistry([definition({ trigger: { event: 'x', condition: 'missing' } })]), /Unknown condition/);
  assert.throws(() => createAchievementRegistry([definition({ acquireMode: 'purchase', cost: undefined })]), /cost must be explicit/);
  assert.throws(() => createAchievementRegistry([definition({ reward: { type: 'inventedBuff' } })]), /Unknown reward/);
});

test('R1 completion activates business card and Ascension does not replace business scope', () => {
  const { state, runtime, achievementRegistry } = testContext();
  state.progression.reincarnations = 1;
  const result = runtime.handleEvent(state, domainEvent('reincarnation.completed', {
    reincarnations: 1, previousReincarnations: 0,
  }));
  assert.ok(result.activated.includes('trophy.reincarnation.1'));
  assert.equal(achievementRegistry.get('trophy.reincarnation.1').presentation, 'achievementCard');
  assert.equal(runtime.nextCard(state).id, 'trophy.reincarnation.1');
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(runtime.nextCard(restored).id, 'trophy.reincarnation.1');
  runtime.handleEvent(restored, domainEvent('reincarnation.completed', {
    reincarnations: 1, previousReincarnations: 0,
  }));
  assert.equal(restored.achievements.pendingCards.length, 1);
  runtime.closeAchievementCard(restored, 'trophy.reincarnation.1');
  assert.equal(runtime.nextCard(restored), null);
  assert.ok(restored.achievements.read.includes('trophy.reincarnation.1'));
  assert.equal(getHighestBusinessAchievement(state, { registry: achievementRegistry }).scope, '洲际业务域');
  state.progression.ascension = 3;
  assert.equal(getHighestBusinessAchievement(state, { registry: achievementRegistry }).scope, '洲际业务域');
  assert.equal(getHighestBusinessAchievement(state, { registry: achievementRegistry }).rank, '洲际业务主管');
});

test('runtime purchase rolls back currency and activation when saving fails', () => {
  const { state, runtime } = testContext({ save: () => { throw new Error('quota'); } });
  state.coins = 1e27;
  const snapshot = createCompatibilitySnapshot(state);
  evaluateAchievements(state, domainEvent('abdication.completed', { runCoins: 1e27 }), {
    registry: createAchievementRegistry(ACHIEVEMENTS), snapshot,
  });
  assert.equal(state.achievements.stateById.rewind.status, 'available');
  assert.throws(() => runtime.purchase(state, 'rewind'), /rolled back/);
  assert.equal(state.coins, 1e27);
  assert.equal(state.achievements.stateById.rewind.status, 'available');
});
