import { subscribeGameEvent } from '../core/events.js';
import {
  createStoryState, createAchievementState, normalizeStoryState, normalizeAchievementState,
} from '../core/story-state.js';
import { conditions as defaultConditions, resolveSnapshot } from './conditions.js';
import {
  evaluateAchievements, unlockAchievement, purchaseAchievement, markAchievementRead as markRead,
} from './achievements.js';

const PRESENTATION_MODES = new Set(['modal', 'achievementCard', 'inline', 'silent', 'toast']);
const QUEUED_MODES = new Set(['modal', 'achievementCard', 'toast']);
const HISTORY_LIMIT = 200;

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function ensureState(state) {
  if (!state || typeof state !== 'object') throw new TypeError('Game state is required');
  state.story = normalizeStoryState(state.story || createStoryState());
  state.achievements = normalizeAchievementState(state.achievements || createAchievementState());
  state.schemaVersion = 3;
  return state;
}

function cycleKey(definition, snapshot) {
  if (definition.once === 'profile') return 'profile';
  if (definition.once === 'reincarnation') return String(snapshot?.progression?.reincarnations || 0);
  if (definition.once === 'ascension') return String(snapshot?.progression?.ascension || 0);
  return String(snapshot?.cycles?.run ?? snapshot?.runId ?? snapshot?.stats?.total?.abdications ?? 0);
}

function pushUnique(array, id) {
  if (!array.includes(id)) array.push(id);
}

function sortPending(state, registry) {
  state.story.pending.sort((left, right) => {
    const a = registry.get(left.id);
    const b = registry.get(right.id);
    return (a?.priority ?? 0) - (b?.priority ?? 0)
      || left.at - right.at
      || left.id.localeCompare(right.id);
  });
}

function syncIntroQueue(state) {
  state.story.intro.pending = state.story.pending
    .map(item => item.id)
    .filter(id => id.startsWith('intro.'));
}

export class StoryPersistenceError extends Error {
  constructor(cause) {
    super('Story state could not be saved; the in-memory story transaction was rolled back', { cause });
    this.name = 'StoryPersistenceError';
  }
}

export function createStoryRegistry(stories, {
  achievementRegistry,
  conditionRegistry = defaultConditions,
  images = {},
} = {}) {
  if (!Array.isArray(stories)) throw new TypeError('Stories must be an array');
  if (!achievementRegistry) throw new TypeError('Achievement registry is required');
  const byId = new Map();
  const byEvent = new Map();
  for (const story of stories) {
    if (!story || typeof story !== 'object') throw new TypeError('Story definition must be an object');
    if (typeof story.id !== 'string' || !story.id) throw new Error('Story ID is required');
    if (byId.has(story.id)) throw new Error(`Duplicate story ID: ${story.id}`);
    if (!story.title || !story.on || !Array.isArray(story.paragraphs) || !story.paragraphs.length) {
      throw new Error(`Story text and trigger are required: ${story.id}`);
    }
    if (!['run', 'reincarnation', 'ascension', 'profile'].includes(story.once)) {
      throw new Error(`Invalid story scope: ${story.id}`);
    }
    if (!Number.isFinite(story.priority)) throw new Error(`Story priority is required: ${story.id}`);
    if (!PRESENTATION_MODES.has(story.presentation?.mode)) throw new Error(`Invalid presentation mode: ${story.id}`);
    conditionRegistry.assertCondition(story.when || 'always');
    if (story.achievementId) {
      const achievement = achievementRegistry.get(story.achievementId);
      if (!achievement) throw new Error(`Unknown story achievement: ${story.id}`);
      if (achievement.storyId && achievement.storyId !== story.id) throw new Error(`Story link mismatch: ${story.id}`);
    }
    if (story.image) {
      const image = images[story.imageKey];
      if (!image || image.src !== story.image) throw new Error(`Unknown story image: ${story.id}`);
      if (!story.imageAlt || !image.alt) throw new Error(`Story image alt text is required: ${story.id}`);
    }
    byId.set(story.id, Object.freeze(story));
    const indexed = byEvent.get(story.on) || [];
    indexed.push(story);
    byEvent.set(story.on, indexed);
  }
  return Object.freeze({
    definitions: Object.freeze([...byId.values()]),
    get: id => byId.get(id),
    byEvent: event => Object.freeze([...(byEvent.get(event) || [])]),
  });
}

export function createStoryRuntime({
  storyRegistry,
  achievementRegistry,
  conditionRegistry = defaultConditions,
  computeSnapshot,
  save,
  now = Date.now,
} = {}) {
  if (!storyRegistry || !achievementRegistry) throw new TypeError('Story and achievement registries are required');
  if (typeof save !== 'function') throw new TypeError('A save callback is required');

  function snapshotFor(state) {
    return resolveSnapshot(state, computeSnapshot);
  }

  function pending(state, queue) {
    sortPending(state, storyRegistry);
    return state.story.pending
      .filter(item => !queue || storyRegistry.get(item.id)?.presentation?.queue === queue)
      .map(item => ({ ...item, story: storyRegistry.get(item.id) }));
  }

  function persist(state, backup) {
    try {
      save(state);
    } catch (error) {
      state.story = backup.story;
      state.achievements = backup.achievements;
      for (const currency of ['coins', 'gems', 'rubies']) {
        if (currency in backup) state[currency] = backup[currency];
      }
      throw new StoryPersistenceError(error);
    }
  }

  function backupFor(state) {
    return {
      story: clone(state.story),
      achievements: clone(state.achievements),
      coins: state.coins,
      gems: state.gems,
      rubies: state.rubies,
    };
  }

  function hasTriggered(state, story, snapshot) {
    const record = state.story.triggered[story.id];
    return record && record.scope === story.once && record.cycleKey === cycleKey(story, snapshot);
  }

  function skipRetirementGuidance(state, snapshot, at) {
    const id = 'intro.retirement_eligible';
    if (state.story.triggered[id]) return false;
    state.story.triggered[id] = { scope: 'profile', cycleKey: 'profile', skipped: true };
    state.story.triggeredAt[id] = at;
    pushUnique(state.story.skipped, id);
    return true;
  }

  function triggerStory(state, story, snapshot, at) {
    if (hasTriggered(state, story, snapshot)) return null;
    const result = { id: story.id, activation: null, queued: false, skipped: false };
    state.story.triggered[story.id] = {
      scope: story.once,
      cycleKey: cycleKey(story, snapshot),
    };
    state.story.triggeredAt[story.id] = at;
    if (story.id.startsWith('intro.')) pushUnique(state.story.intro.unlocked, story.id);

    if (story.achievementId) {
      const unlocked = unlockAchievement(state, story.achievementId, {
        registry: achievementRegistry, snapshot, at,
      });
      result.activation = unlocked.activation;
    }

    const optionalIntroSuppressed = (state.story.intro.completed
      || Boolean(state.story.triggered['intro.first_retirement']))
      && ['intro.first_wage', 'intro.first_department'].includes(story.id);
    const mode = story.presentation.mode;
    if (optionalIntroSuppressed || mode === 'silent' || mode === 'inline') {
      if (optionalIntroSuppressed) {
        pushUnique(state.story.skipped, story.id);
        result.skipped = true;
      }
      pushUnique(state.story.read, story.id);
      if (story.id.startsWith('intro.')) pushUnique(state.story.intro.read, story.id);
      state.story.history.push({ id: story.id, at });
    } else if (QUEUED_MODES.has(mode)) {
      state.story.pending.push({ id: story.id, at });
      result.queued = true;
    }
    state.story.history = state.story.history.slice(-HISTORY_LIMIT);
    syncIntroQueue(state);
    return result;
  }

  function handleEvent(state, event) {
    ensureState(state);
    if (!event || typeof event.type !== 'string') throw new TypeError('A domain event is required');
    const snapshot = snapshotFor(state);
    const at = Number.isFinite(event.at) ? event.at : now();
    const backup = backupFor(state);
    const result = {
      changed: false, triggered: [], available: [], activated: [], activations: [], saved: false,
    };

    if (event.type === 'abdication.completed'
      && storyRegistry.byEvent(event.type).some(story => story.id === 'intro.first_retirement')
      && conditionRegistry.evaluateCondition('firstRetirementCompleted', { state, snapshot, event })) {
      result.changed = skipRetirementGuidance(state, snapshot, at) || result.changed;
    }

    const achievementResult = evaluateAchievements(state, event, {
      registry: achievementRegistry,
      conditionRegistry,
      snapshot,
      at,
    });
    result.changed = result.changed || achievementResult.changed;
    result.available.push(...achievementResult.available);
    result.activated.push(...achievementResult.activated);
    result.activations.push(...achievementResult.activations);

    for (const story of storyRegistry.byEvent(event.type)) {
      if (hasTriggered(state, story, snapshot)) continue;
      const context = { state, snapshot, event };
      if (!conditionRegistry.evaluateCondition(story.when || 'always', context)) continue;
      const triggered = triggerStory(state, story, snapshot, at);
      if (!triggered) continue;
      result.changed = true;
      result.triggered.push(triggered);
      if (triggered.activation) result.activations.push(triggered.activation);
    }

    if (result.changed) {
      sortPending(state, storyRegistry);
      syncIntroQueue(state);
      persist(state, backup);
      result.saved = true;
    }
    return result;
  }

  function detectState(state, at = now()) {
    return handleEvent(state, { type: 'state', at, data: {} });
  }

  let lastDetection = -Infinity;
  function handleTick(state, at = now()) {
    if (at - lastDetection < 1000) return { changed: false, skippedDetection: true };
    lastDetection = at;
    return detectState(state, at);
  }

  function closeStory(state, id, { skipped = false, replay = false, at = now() } = {}) {
    ensureState(state);
    if (replay) return { changed: false, replay: true, id };
    if (!state.story.pending.some(item => item.id === id)) {
      return { changed: false, reason: 'not-pending', id, next: pending(state)[0] || null };
    }
    const backup = backupFor(state);
    state.story.pending = state.story.pending.filter(item => item.id !== id);
    pushUnique(state.story.read, id);
    if (skipped) pushUnique(state.story.skipped, id);
    if (id.startsWith('intro.')) {
      pushUnique(state.story.intro.read, id);
      if (id === 'intro.first_retirement') state.story.intro.completed = true;
    }
    state.story.history.push({ id, at });
    state.story.history = state.story.history.slice(-HISTORY_LIMIT);
    syncIntroQueue(state);
    persist(state, backup);
    return { changed: true, saved: true, id, next: pending(state)[0] || null };
  }

  function replayStory(state, id) {
    ensureState(state);
    const story = storyRegistry.get(id);
    if (!story) throw new Error(`Unknown story: ${id}`);
    if (!state.story.read.includes(id) && !state.story.history.some(item => item.id === id)) {
      return null;
    }
    return { story, achievement: story.achievementId ? achievementRegistry.get(story.achievementId) : null };
  }

  function archive(state) {
    ensureState(state);
    return state.story.history.map(item => ({
      ...item,
      story: storyRegistry.get(item.id),
    })).filter(item => item.story);
  }

  function purchase(state, id, at = now()) {
    ensureState(state);
    const backup = backupFor(state);
    const result = purchaseAchievement(state, id, {
      registry: achievementRegistry,
      computeSnapshot,
      at,
    });
    if (result.changed) {
      persist(state, backup);
      result.saved = true;
    }
    return result;
  }

  function nextCard(state) {
    ensureState(state);
    const cards = [...state.achievements.pendingCards].sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));
    if (!cards.length) return null;
    const achievement = achievementRegistry.get(cards[0].id);
    return achievement ? { ...cards[0], achievement } : null;
  }

  function closeAchievementCard(state, id, at = now()) {
    ensureState(state);
    if (!state.achievements.pendingCards.some(item => item.id === id)) {
      return { changed: false, reason: 'not-pending', id, next: nextCard(state) };
    }
    const backup = backupFor(state);
    state.achievements.pendingCards = state.achievements.pendingCards.filter(item => item.id !== id);
    pushUnique(state.achievements.read, id);
    persist(state, backup);
    return { changed: true, saved: true, id, next: nextCard(state) };
  }

  function markAchievementRead(state, id) {
    ensureState(state);
    if (!achievementRegistry.get(id)) throw new Error(`Unknown achievement: ${id}`);
    const backup = backupFor(state);
    const changed = markRead(state, id);
    if (changed) persist(state, backup);
    return { changed, saved: changed };
  }

  function connect(getState, onUpdate = () => {}) {
    if (typeof getState !== 'function') throw new TypeError('getState must be a function');
    return subscribeGameEvent('*', event => {
      const result = handleEvent(getState(), event);
      if (result.changed) onUpdate(result);
    });
  }

  return Object.freeze({
    handleEvent,
    detectState,
    handleTick,
    closeStory,
    closeAchievementCard,
    markAchievementRead,
    replayStory,
    archive,
    purchase,
    connect,
    pending: (state, queue) => {
      ensureState(state);
      return pending(state, queue);
    },
    next: state => {
      ensureState(state);
      return pending(state)[0] || null;
    },
    nextCard,
  });
}
