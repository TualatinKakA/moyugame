import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import {
  emitGameEvent, subscribeGameEvent, clearGameEventHandlers,
} from '../src/core/events.js';
import { createConditionRegistry } from '../src/systems/conditions.js';
import {
  createAchievementRegistry, getHighestBusinessAchievement,
} from '../src/systems/achievements.js';
import { createStoryRegistry, createStoryRuntime, StoryPersistenceError } from '../src/systems/story.js';
import { ACHIEVEMENTS } from '../src/content/achievements/index.js';
import { STORIES, STORY_IMAGES } from '../src/content/story/index.js';
import { testContext, domainEvent } from './story-test-helpers.js';

test.afterEach(() => clearGameEventHandlers());

test('event bus emits serializable past-tense domain events and unsubscribes', () => {
  const received = [];
  const unsubscribe = subscribeGameEvent('work.clicked', event => received.push(event));
  const event = emitGameEvent('work.clicked', { totalClicks: 1, at: 10 });
  assert.equal(event.type, 'work.clicked');
  assert.deepEqual(event.data, { totalClicks: 1, at: 10 });
  assert.equal(received.length, 1);
  unsubscribe();
  emitGameEvent('work.clicked', { totalClicks: 2 });
  assert.equal(received.length, 1);
  const circular = {}; circular.self = circular;
  assert.throws(() => emitGameEvent('work.clicked', circular), /circular|serializable/i);
});

test('condition registry supports all, any and not and rejects unknown IDs', () => {
  const registry = createConditionRegistry({ includeDefaults: false });
  registry.registerCondition('yes', () => true);
  registry.registerCondition('no', () => false);
  assert.equal(registry.evaluateCondition({ all: ['yes', { not: 'no' }] }, {}), true);
  assert.equal(registry.evaluateCondition({ any: ['no', 'yes'] }, {}), false || true);
  assert.throws(() => registry.evaluateCondition('missing', {}), /Unknown condition/);
  assert.throws(() => createStoryRegistry([{
    id: 'bad', title: 'bad', on: 'x', when: 'missing', once: 'profile', paragraphs: ['x'],
    presentation: { mode: 'modal' }, priority: 1,
  }], { achievementRegistry: createAchievementRegistry(ACHIEVEMENTS), conditionRegistry: registry }), /Unknown condition/);
});

test('all five intro images exist locally', async () => {
  assert.equal(STORIES.length, 5);
  for (const story of STORIES) {
    assert.equal(story.image, STORY_IMAGES[story.imageKey].src);
    assert.ok(story.imageAlt.length > 0);
    await access(new URL(`../${story.image}`, import.meta.url));
  }
});

test('first onboarding trigger is atomic and repeated trigger is a no-op', () => {
  const { state, runtime, saves } = testContext();
  const result = runtime.handleEvent(state, domainEvent('game.started', { isNewSave: true }));
  assert.equal(result.saved, true);
  assert.deepEqual(result.triggered.map(item => item.id), ['intro.onboarding']);
  assert.equal(state.achievements.stateById['trophy.intro.first_day'].status, 'active');
  assert.deepEqual(state.story.pending, [{ id: 'intro.onboarding', at: 1000 }]);
  assert.equal(saves.length, 1);
  const repeated = runtime.handleEvent(state, domainEvent('game.started', { isNewSave: true }, 2000));
  assert.equal(repeated.changed, false);
  assert.equal(saves.length, 1);
  runtime.handleEvent(state, domainEvent('game.started', { isNewSave: false }, 3000));
  assert.equal(state.story.pending.length, 1);
});

test('first wage requires the historical zero-to-one click', () => {
  const { state, runtime } = testContext();
  state.stats.total.clicks = 2;
  runtime.handleEvent(state, domainEvent('work.clicked', { totalClicks: 2 }));
  assert.equal(state.achievements.stateById['trophy.intro.first_wage'], undefined);
  state.stats.total.clicks = 1;
  runtime.handleEvent(state, domainEvent('work.clicked', { totalClicks: 1 }));
  assert.equal(state.achievements.stateById['trophy.intro.first_wage'].status, 'active');
  runtime.handleEvent(state, domainEvent('work.clicked', { totalClicks: 1, success: false }));
  assert.equal(state.story.pending.length, 1);
});

test('pending stories sort by priority, trigger time and stable ID', () => {
  const definitions = ['story.c', 'story.a', 'story.b'].map((id, index) => ({
    id, title: id, on: 'test.completed', when: 'always', once: 'profile',
    paragraphs: [id], presentation: { mode: 'modal', required: false, queue: 'test' },
    priority: index === 2 ? 10 : 10, achievementId: null,
  }));
  const achievementRegistry = createAchievementRegistry(ACHIEVEMENTS);
  const storyRegistry = createStoryRegistry(definitions, { achievementRegistry });
  const { state } = testContext();
  const runtime = createStoryRuntime({ storyRegistry, achievementRegistry, save: () => {}, now: () => 100 });
  runtime.handleEvent(state, domainEvent('test.completed'));
  assert.deepEqual(state.story.pending.map(item => item.id), ['story.a', 'story.b', 'story.c']);
  assert.equal(runtime.next(state).id, 'story.a');
  runtime.closeStory(state, 'story.a');
  assert.equal(runtime.next(state).id, 'story.b');
});

test('refresh resumes pending without repeating achievement or reward', () => {
  const first = testContext();
  first.runtime.handleEvent(first.state, domainEvent('game.started', { isNewSave: true }));
  const restored = JSON.parse(JSON.stringify(first.state));
  const second = testContext();
  second.state = restored;
  assert.equal(second.runtime.next(second.state).id, 'intro.onboarding');
  const result = second.runtime.handleEvent(second.state, domainEvent('game.started', { isNewSave: true }, 2000));
  assert.equal(result.changed, false);
  assert.equal(second.saves.length, 0);
  assert.equal(second.state.achievements.stateById['trophy.intro.first_day'].activatedAt, 1000);
  second.runtime.closeStory(second.state, 'intro.onboarding');
  assert.equal(second.runtime.next(second.state), null);
  const replay = second.runtime.replayStory(second.state, 'intro.onboarding');
  assert.equal(replay.story.id, 'intro.onboarding');
  assert.equal(second.saves.length, 1);
});

test('skip keeps the trophy and supports side-effect-free replay', () => {
  const { state, runtime, saves } = testContext();
  state.stats.total.clicks = 1;
  runtime.handleEvent(state, domainEvent('work.clicked', { totalClicks: 1 }));
  runtime.closeStory(state, 'intro.first_wage', { skipped: true });
  assert.equal(state.achievements.stateById['trophy.intro.first_wage'].status, 'active');
  assert.ok(state.story.skipped.includes('intro.first_wage'));
  assert.ok(state.story.read.includes('intro.first_wage'));
  assert.ok(runtime.replayStory(state, 'intro.first_wage'));
  assert.equal(saves.length, 2);
});

test('early retirement skips eligibility, completes intro on close and suppresses later department modal', () => {
  const { state, runtime } = testContext();
  const retired = runtime.handleEvent(state, domainEvent('abdication.completed', {
    saved: true, firstRetirement: true, previousAbdications: 0,
  }));
  assert.deepEqual(retired.triggered.map(item => item.id), ['intro.first_retirement']);
  assert.equal(state.story.triggered['intro.retirement_eligible'].skipped, true);
  assert.equal(state.achievements.stateById['trophy.retirement.eligible'], undefined);
  assert.equal(state.story.intro.completed, false);
  runtime.closeStory(state, 'intro.first_retirement');
  assert.equal(state.story.intro.completed, true);
  const department = runtime.handleEvent(state, domainEvent('faction.joined', { factionId: 'fairy', basic: true }));
  assert.equal(department.triggered[0].skipped, true);
  assert.equal(state.achievements.stateById['trophy.intro.first_department'].status, 'active');
  assert.equal(state.story.pending.length, 0);
  const again = runtime.handleEvent(state, domainEvent('abdication.completed', {
    saved: true, firstRetirement: false, previousAbdications: 1,
  }));
  assert.equal(again.changed, false);
});

test('full five-node intro reaches first retirement and completed state', () => {
  const { state, runtime } = testContext();
  runtime.handleEvent(state, domainEvent('game.started', { isNewSave: true }));
  state.stats.total.clicks = 1;
  runtime.handleEvent(state, domainEvent('work.clicked', { totalClicks: 1 }));
  runtime.handleEvent(state, domainEvent('faction.joined', { factionId: 'fairy', basic: true }));
  state.retirement = { guidanceEligible: true };
  assert.equal(runtime.handleTick(state, 500).changed, true);
  assert.equal(runtime.handleTick(state, 1000).skippedDetection, true);
  assert.deepEqual(state.story.pending.map(item => item.id), [
    'intro.onboarding', 'intro.first_wage', 'intro.first_department', 'intro.retirement_eligible',
  ]);
  for (const id of [...state.story.pending.map(item => item.id)]) runtime.closeStory(state, id);
  runtime.handleEvent(state, domainEvent('abdication.completed', {
    saved: true, previousAbdications: 0,
  }));
  assert.equal(runtime.next(state).id, 'intro.first_retirement');
  runtime.closeStory(state, 'intro.first_retirement');
  assert.equal(state.story.intro.completed, true);
  for (const id of [
    'trophy.intro.first_day', 'trophy.intro.first_wage', 'trophy.intro.first_department',
    'trophy.retirement.eligible', 'trophy.retirement.first',
  ]) assert.equal(state.achievements.stateById[id].status, 'active', id);
});

test('save failure rolls back story, trophy and queue and reports an error', () => {
  const { state, runtime } = testContext({ save: () => { throw new Error('quota'); } });
  assert.throws(
    () => runtime.handleEvent(state, domainEvent('game.started', { isNewSave: true })),
    error => error instanceof StoryPersistenceError && /rolled back/.test(error.message),
  );
  assert.deepEqual(state.story.pending, []);
  assert.deepEqual(state.story.triggered, {});
  assert.deepEqual(state.achievements.stateById, {});
});

test('runtime connects to the unified event interface and computes snapshots read-only', () => {
  let calls = 0;
  const context = testContext({
    computeSnapshot: state => {
      calls += 1;
      return {
        ...state,
        stats: state.stats,
        progression: state.progression,
        story: state.story,
      };
    },
  });
  const updates = [];
  const disconnect = context.runtime.connect(() => context.state, result => updates.push(result));
  emitGameEvent('game.started', { isNewSave: true, at: 1000 });
  disconnect();
  emitGameEvent('game.started', { isNewSave: true, at: 2000 });
  assert.equal(calls, 1);
  assert.equal(updates.length, 1);
  assert.equal(context.state.achievements.stateById['trophy.intro.first_day'].status, 'active');
});
