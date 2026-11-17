import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/core/state.js';
import { abdicate } from '../src/systems/engine.js';
import {
  createSchema3Migration, migrateGameStateToSchema3, normalizeStoryState,
  normalizeAchievementState, preserveStoryAndAchievements, resetContentForCycle,
  clearStoryAndAchievements,
} from '../src/core/story-state.js';
import { testContext, domainEvent } from './story-test-helpers.js';

test('schema 2 migration preserves gameplay, maps trophies and backfills business without replay', () => {
  const legacy = createState();
  legacy.coins = 1234;
  legacy.gems = 99;
  legacy.progression.reincarnations = 3;
  legacy.progression.ascension = 2;
  legacy.trophies = ['fairyChoir', 'fairyChoir', 'trueNight'];
  legacy.stats.run.coins = 5678;
  legacy.lastSave = 456;
  const migration = createSchema3Migration(legacy);
  const migrated = migration.state;
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.coins, 1234);
  assert.equal(migrated.gems, 99);
  assert.equal(migrated.stats.run.coins, 5678);
  assert.equal(migrated.progression.ascension, 2);
  assert.equal(migrated.achievements.stateById.fairyChoir.status, 'active');
  assert.equal(migrated.achievements.stateById.fairyChoir.migrated, true);
  assert.equal(migrated.achievements.stateById['trophy.reincarnation.1'].status, 'active');
  assert.equal(migrated.achievements.stateById['trophy.reincarnation.3'].status, 'active');
  assert.equal(migrated.achievements.stateById['trophy.reincarnation.7'], undefined);
  assert.deepEqual(migrated.story.pending, []);
  assert.deepEqual(migrated.story.history, []);
  assert.deepEqual(migration.originalSnapshot, legacy);
  assert.notEqual(migration.originalSnapshot, legacy);
  assert.deepEqual(migrateGameStateToSchema3(migrated), migrated);
});

test('migration never migrates Demo and recovers damaged input safely', () => {
  const demo = createState();
  demo.contentVersion = 'endless-shift-demo-v1';
  assert.equal(migrateGameStateToSchema3(demo), null);
  const recovered = createSchema3Migration('{broken');
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.state.schemaVersion, 3);
  assert.deepEqual(recovered.state.story.pending, []);
  assert.deepEqual(migrateGameStateToSchema3(recovered.state), recovered.state);
});

test('normalizers remove duplicates and ignore malformed UI data', () => {
  const story = normalizeStoryState({
    pending: ['a', { id: 'a', at: 2 }, { id: 'b', at: 3 }, { bad: true }],
    seen: ['a', 'a'], triggered: ['a'],
    history: [{ id: 'a', at: 1 }, 'b'],
  });
  assert.deepEqual(story.pending, [{ id: 'a', at: 0 }, { id: 'b', at: 3 }]);
  assert.deepEqual(story.read, ['a']);
  assert.equal(story.triggered.a.scope, 'profile');
  const achievements = normalizeAchievementState({
    unlocked: { old: true }, unlockedAt: { old: 12 }, read: ['old', 'old'],
  });
  assert.equal(achievements.stateById.old.status, 'active');
  assert.equal(achievements.stateById.old.activatedAt, 12);
  assert.deepEqual(achievements.read, ['old']);
});

test('soft reset preserves story and achievements while hard reset clears only their domain', () => {
  const { state, runtime } = testContext();
  runtime.handleEvent(state, domainEvent('game.started', { isNewSave: true }));
  state.stats.total.time = 100;
  state.stats.run.coins = 1e8;
  const reset = abdicate(state);
  assert.deepEqual(reset.story, state.story);
  preserveStoryAndAchievements(state, reset);
  assert.deepEqual(reset.story, state.story);
  assert.deepEqual(reset.achievements, state.achievements);
  assert.equal(reset.stats.total.time, 100);
  clearStoryAndAchievements(reset);
  assert.deepEqual(reset.story.pending, []);
  assert.deepEqual(reset.achievements.stateById, {});
  assert.deepEqual(reset.trophies, []);
});

test('cycle reset clears only the requested scope', () => {
  const { state } = testContext();
  state.story.triggered = {
    permanent: { scope: 'profile', cycleKey: 'profile' },
    repeatable: { scope: 'run', cycleKey: '0' },
  };
  state.achievements.stateById = {
    permanent: { status: 'active', scope: 'profile', cycleKey: 'profile' },
    repeatable: { status: 'active', scope: 'run', cycleKey: '0' },
  };
  resetContentForCycle(state, 'run', 1);
  assert.equal(state.story.triggered.repeatable, undefined);
  assert.equal(state.story.triggered.permanent.scope, 'profile');
  assert.equal(state.achievements.stateById.repeatable.status, 'locked');
  assert.equal(state.achievements.stateById.repeatable.cycleKey, '1');
  assert.equal(state.achievements.stateById.permanent.status, 'active');
});
