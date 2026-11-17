import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, loadState, saveState, SCHEMA2_BACKUP_KEY, SAVE_KEY } from '../src/core/state.js';
import { computeSnapshot, abdicate, reincarnate, reincarnationRequirement } from '../src/systems/engine.js';
import { ACHIEVEMENTS } from '../src/content/achievements/index.js';
import { STORIES, STORY_IMAGES } from '../src/content/story/index.js';
import { createAchievementRegistry, getHighestBusinessAchievement } from '../src/systems/achievements.js';
import { createStoryRegistry, createStoryRuntime } from '../src/systems/story.js';
import { resolveSnapshot } from '../src/systems/conditions.js';

function integration() {
  const state = createState();
  const achievementRegistry = createAchievementRegistry(ACHIEVEMENTS);
  const storyRegistry = createStoryRegistry(STORIES, { achievementRegistry, images: STORY_IMAGES });
  const saves = [];
  const runtime = createStoryRuntime({
    storyRegistry,
    achievementRegistry,
    computeSnapshot,
    save: current => saves.push(JSON.parse(JSON.stringify(current))),
    now: () => 1000,
  });
  return { state, runtime, achievementRegistry, saves };
}

test('real numeric snapshot combines production, stats and first retirement target', () => {
  const state = createState();
  let snapshot = resolveSnapshot(state, computeSnapshot);
  assert.equal(snapshot.stats.run.coins, 0);
  assert.equal(snapshot.retirement.eligible, false);
  assert.equal(snapshot.retirement.target, 1e8);
  state.stats.run.coins = 1e8;
  snapshot = resolveSnapshot(state, computeSnapshot);
  assert.equal(snapshot.retirement.eligible, true);
  assert.equal(snapshot.progression.reincarnations, 0);
});

test('real reset preserves intro and emits a business achievement card', () => {
  const { state, runtime, achievementRegistry } = integration();
  runtime.handleEvent(state, { type: 'game.started', at: 1, data: { isNewSave: true } });
  runtime.closeStory(state, 'intro.onboarding');
  assert.equal(abdicate(state), null);
  state.stats.run.coins = 1e8;
  const runCoins = state.stats.run.coins;
  const next = abdicate(state);
  assert.ok(next);
  runtime.handleEvent(next, {
    type: 'abdication.completed', at: 2,
    data: { saved: true, targetMet: true, firstRetirement: true, previousAbdications: 0, runCoins },
  });
  assert.equal(next.story.pending[0].id, 'intro.retirement_eligible');
  runtime.closeStory(next, 'intro.retirement_eligible');
  runtime.closeStory(next, 'intro.first_retirement');
  assert.equal(next.story.intro.completed, true);

  next.gems = reincarnationRequirement(0);
  const reincarnated = reincarnate(next);
  runtime.handleEvent(reincarnated, {
    type: 'reincarnation.completed', at: 3,
    data: { reincarnations: 1, previousReincarnations: 0 },
  });
  assert.equal(reincarnated.story.intro.completed, true);
  assert.equal(reincarnated.achievements.pendingCards[0].id, 'trophy.reincarnation.1');
  assert.equal(getHighestBusinessAchievement(reincarnated, {
    registry: achievementRegistry, computeSnapshot,
  }).scope, '洲际业务域');
});

test('purchased Rewind enters EffectSpec once and does not repeat its cost or buff', () => {
  const { state, runtime } = integration();
  state.coins = 1e27;
  runtime.handleEvent(state, {
    type: 'abdication.completed', at: 1,
    data: { runCoins: 1e27 },
  });
  assert.equal(state.achievements.stateById.rewind.status, 'available');
  assert.equal(computeSnapshot(state).mods.globalAdd, 0);
  const first = runtime.purchase(state, 'rewind');
  assert.equal(first.ok, true);
  assert.equal(state.coins, 0);
  const snapshot = computeSnapshot(state);
  assert.equal(snapshot.mods.globalAdd, 8);
  assert.equal(snapshot.sources.filter(source => source.source === 'achievement:rewind').length, 1);
  const second = runtime.purchase(state, 'rewind');
  assert.equal(second.ok, false);
  assert.equal(computeSnapshot(state).sources.filter(source => source.source === 'achievement:rewind').length, 1);
});

test('schema 2 load keeps a raw backup and saves schema 3 story data', () => {
  const legacy = createState();
  legacy.schemaVersion = 2;
  legacy.story = undefined;
  legacy.achievements = undefined;
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
  };
  memory.set(SAVE_KEY, JSON.stringify(legacy));
  const loaded = loadState(storage);
  assert.equal(loaded.schemaVersion, 3);
  assert.ok(loaded.story);
  assert.ok(loaded.achievements);
  assert.equal(memory.get(SCHEMA2_BACKUP_KEY), JSON.stringify(legacy));
  saveState(loaded, storage);
  assert.equal(JSON.parse(memory.get(SAVE_KEY)).schemaVersion, 3);
});
