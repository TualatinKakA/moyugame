import { conditions as defaultConditions, resolveSnapshot } from './conditions.js';

export const ACHIEVEMENT_CATEGORIES = Object.freeze(['story', 'gameplay', 'challenge', 'secret', 'event', 'collection']);
export const ACHIEVEMENT_STATUSES = Object.freeze(['locked', 'available', 'purchased', 'active']);
export const ACHIEVEMENT_SCOPES = Object.freeze(['run', 'reincarnation', 'ascension', 'profile']);
export const REWARD_TYPES = Object.freeze([
  'none', 'globalProduction', 'buildingProduction', 'factionProduction', 'alignmentProduction',
  'clickReward', 'baseClickReward', 'manaMax', 'manaRegen', 'assistants', 'assistantProduction',
  'factionCoinChance', 'factionCoinProduction', 'offlineProduction', 'royalExchangeBonus',
  'spellEffect', 'buildingCount', 'unlock', 'resource', 'researchSlots', 'autocast', 'heritage',
]);

const DEFAULT_BUSINESS = Object.freeze({ level: 0, scope: '地方分公司', rank: '见习员工', achievementId: null });

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function store(state) {
  if (!state.achievements || typeof state.achievements !== 'object') {
    state.achievements = { stateById: {}, progress: {}, read: [] };
  }
  if (!state.achievements.stateById || typeof state.achievements.stateById !== 'object') {
    state.achievements.stateById = {};
  }
  if (!state.achievements.progress || typeof state.achievements.progress !== 'object') {
    state.achievements.progress = {};
  }
  if (!Array.isArray(state.achievements.read)) state.achievements.read = [];
  return state.achievements;
}

function cycleKey(definition, snapshot) {
  if (definition.once === 'profile') return 'profile';
  if (definition.once === 'reincarnation') return String(snapshot?.progression?.reincarnations || 0);
  if (definition.once === 'ascension') return String(snapshot?.progression?.ascension || 0);
  return String(snapshot?.cycles?.run ?? snapshot?.runId ?? snapshot?.stats?.total?.abdications ?? 0);
}

function lockedEntry(definition, snapshot) {
  return { status: 'locked', scope: definition.once, cycleKey: cycleKey(definition, snapshot) };
}

function entryFor(state, definition, snapshot, resetCycle = false) {
  const achievements = store(state);
  let entry = achievements.stateById[definition.id];
  if (!entry || entry.scope !== definition.once || entry.cycleKey !== cycleKey(definition, snapshot)) {
    if (!resetCycle) return lockedEntry(definition, snapshot);
    entry = lockedEntry(definition, snapshot);
    achievements.stateById[definition.id] = entry;
  }
  return entry;
}

function snapshotValue(snapshot, path) {
  return String(path).split('.').reduce((value, key) => value == null ? undefined : value[key], snapshot);
}

function updateProgress(state, definition, snapshot) {
  if (!definition.progress) return false;
  const { path, target } = definition.progress;
  const value = Number(snapshotValue(snapshot, path)) || 0;
  const previous = store(state).progress[definition.id];
  if (previous && previous.value === value && previous.target === target) return false;
  store(state).progress[definition.id] = { value, target };
  return true;
}

function resolveDefinition(registry, id) {
  const definition = registry.get(id);
  if (!definition) throw new Error(`Unknown achievement: ${id}`);
  return definition;
}

export function createAchievementRegistry(definitions, {
  conditionRegistry = defaultConditions,
  rewardTypes = REWARD_TYPES,
} = {}) {
  if (!Array.isArray(definitions)) throw new TypeError('Achievements must be an array');
  const byId = new Map();
  const byEvent = new Map();
  const allowedRewards = new Set(rewardTypes);

  for (const definition of definitions) {
    if (!definition || typeof definition !== 'object') throw new TypeError('Achievement definition must be an object');
    if (typeof definition.id !== 'string' || !definition.id) throw new Error('Achievement ID is required');
    if (byId.has(definition.id)) throw new Error(`Duplicate achievement ID: ${definition.id}`);
    if (!ACHIEVEMENT_CATEGORIES.includes(definition.category)) throw new Error(`Invalid achievement category: ${definition.id}`);
    if (!definition.name || !definition.description) throw new Error(`Achievement text is required: ${definition.id}`);
    if (!['auto', 'purchase'].includes(definition.acquireMode)) throw new Error(`Invalid acquireMode: ${definition.id}`);
    if (!ACHIEVEMENT_SCOPES.includes(definition.once)) throw new Error(`Invalid trigger scope: ${definition.id}`);
    if (!['visible', 'secret', 'hidden'].includes(definition.visibility)) throw new Error(`Invalid visibility: ${definition.id}`);
    if (!definition.reward || !allowedRewards.has(definition.reward.type)) throw new Error(`Unknown reward type: ${definition.id}`);
    if (definition.acquireMode === 'purchase' && (!Number.isFinite(definition.cost) || definition.cost < 0)) {
      throw new Error(`Purchase cost must be explicit and non-negative: ${definition.id}`);
    }
    if (definition.progress && (!definition.progress.path || !Number.isFinite(definition.progress.target))) {
      throw new Error(`Invalid achievement progress: ${definition.id}`);
    }
    if (definition.trigger) {
      if (typeof definition.trigger.event !== 'string' || !definition.trigger.event) {
        throw new Error(`Achievement trigger event is required: ${definition.id}`);
      }
      conditionRegistry.assertCondition(definition.trigger.condition || 'always');
      const indexed = byEvent.get(definition.trigger.event) || [];
      indexed.push(definition);
      byEvent.set(definition.trigger.event, indexed);
    } else if (!definition.storyId) {
      throw new Error(`Achievement requires a trigger or story link: ${definition.id}`);
    }
    byId.set(definition.id, Object.freeze(definition));
  }

  return Object.freeze({
    definitions: Object.freeze([...byId.values()]),
    get: id => byId.get(id),
    byEvent: event => Object.freeze([...(byEvent.get(event) || [])]),
  });
}

export function getAchievementState(state, definitionOrId, { registry, snapshot } = {}) {
  const definition = typeof definitionOrId === 'string'
    ? resolveDefinition(registry, definitionOrId)
    : definitionOrId;
  return clone(entryFor(state, definition, snapshot));
}

export function getAchievementCost(definition, snapshot) {
  const ascension = Number(snapshot?.progression?.ascension) || 0;
  if (Number.isFinite(definition.freeFromAscension) && ascension >= definition.freeFromAscension) return 0;
  let cost = definition.cost;
  if (definition.costByAscension) {
    const level = Object.keys(definition.costByAscension)
      .map(Number)
      .filter(value => Number.isFinite(value) && value <= ascension)
      .sort((a, b) => b - a)[0];
    if (level !== undefined) cost = definition.costByAscension[level];
  }
  if (Array.isArray(definition.ascensionCosts)) {
    const rule = definition.ascensionCosts
      .filter(item => (item.from || 0) <= ascension)
      .sort((a, b) => (b.from || 0) - (a.from || 0))[0];
    if (rule) cost = typeof rule === 'number' ? rule : rule.cost;
  }
  if (!Number.isFinite(cost) || cost < 0) throw new Error(`Unresolved achievement cost: ${definition.id}`);
  return cost;
}

export function resolveAchievementReward(definition, snapshot) {
  const reward = clone(definition.reward || { type: 'none' });
  const ascension = Number(snapshot?.progression?.ascension) || 0;
  if (Array.isArray(reward.ascension)) {
    const rule = reward.ascension
      .filter(item => (item.from || 0) <= ascension)
      .sort((a, b) => (b.from || 0) - (a.from || 0))[0];
    delete reward.ascension;
    if (rule) {
      const { from, ...changes } = rule;
      Object.assign(reward, clone(changes));
    }
  }
  if (reward.ascensionByLevel) {
    const level = Object.keys(reward.ascensionByLevel)
      .map(Number)
      .filter(value => Number.isFinite(value) && value <= ascension)
      .sort((a, b) => b - a)[0];
    const changes = level === undefined ? undefined : reward.ascensionByLevel[level];
    delete reward.ascensionByLevel;
    if (changes) Object.assign(reward, clone(changes));
  }
  return reward;
}

export function makeAchievementAvailable(state, id, {
  registry,
  snapshot,
  at = Date.now(),
} = {}) {
  const definition = resolveDefinition(registry, id);
  const entry = entryFor(state, definition, snapshot, true);
  if (entry.status !== 'locked') return { changed: false, status: entry.status };
  entry.status = 'available';
  entry.availableAt = at;
  return { changed: true, status: entry.status };
}

export function activateAchievement(state, id, {
  registry,
  snapshot,
  at = Date.now(),
} = {}) {
  const definition = resolveDefinition(registry, id);
  const entry = entryFor(state, definition, snapshot, true);
  if (entry.status === 'active') return { changed: false, status: 'active' };
  if (entry.status !== 'available' && entry.status !== 'purchased') {
    return { changed: false, status: entry.status, reason: 'not-available' };
  }
  if (definition.acquireMode === 'purchase' && entry.status !== 'purchased') {
    return { changed: false, status: entry.status, reason: 'purchase-required' };
  }
  entry.purchasedAt = entry.purchasedAt || at;
  entry.status = 'active';
  entry.activatedAt = at;
  const reward = resolveAchievementReward(definition, snapshot);
  let card = null;
  if (definition.presentation === 'achievementCard') {
    const achievements = store(state);
    if (!Array.isArray(achievements.pendingCards)) achievements.pendingCards = [];
    if (!achievements.pendingCards.some(item => item.id === id)) {
      card = { id, at };
      achievements.pendingCards.push(card);
    }
  }
  return {
    changed: true,
    status: 'active',
    activation: reward.type === 'none' ? null : { achievementId: id, reward },
    card,
  };
}

export function unlockAchievement(state, id, options = {}) {
  const definition = resolveDefinition(options.registry, id);
  const available = makeAchievementAvailable(state, id, options);
  if (definition.acquireMode !== 'auto') return { ...available, activation: null, card: null };
  const active = activateAchievement(state, id, options);
  return {
    changed: available.changed || active.changed,
    status: active.status,
    activation: active.activation || null,
    card: active.card || null,
  };
}

export function evaluateAchievements(state, event, {
  registry,
  conditionRegistry = defaultConditions,
  snapshot,
  computeSnapshot,
  at = event?.at || Date.now(),
} = {}) {
  if (!registry) throw new TypeError('Achievement registry is required');
  const currentSnapshot = snapshot || resolveSnapshot(state, computeSnapshot);
  const result = { changed: false, available: [], activated: [], activations: [], cards: [] };
  for (const definition of registry.byEvent(event?.type)) {
    const entry = entryFor(state, definition, currentSnapshot);
    if (entry.status === 'active') continue;
    const progressChanged = updateProgress(state, definition, currentSnapshot);
    result.changed = result.changed || progressChanged;
    const context = { state, snapshot: currentSnapshot, event };
    if (!conditionRegistry.evaluateCondition(definition.trigger.condition || 'always', context)) continue;
    const unlocked = unlockAchievement(state, definition.id, {
      registry, snapshot: currentSnapshot, at,
    });
    if (!unlocked.changed) continue;
    result.changed = true;
    if (unlocked.status === 'available') result.available.push(definition.id);
    if (unlocked.status === 'active') result.activated.push(definition.id);
    if (unlocked.activation) result.activations.push(unlocked.activation);
    if (unlocked.card) result.cards.push(unlocked.card);
  }
  return result;
}

function spend(state, currency, amount, options) {
  if (options.spendCurrency) {
    return options.spendCurrency({ state, currency, amount, snapshot: options.snapshot }) !== false;
  }
  if (!['coins', 'gems', 'rubies'].includes(currency)) {
    throw new Error(`Currency ${currency} requires a spendCurrency adapter`);
  }
  if ((Number(state[currency]) || 0) < amount) return false;
  state[currency] -= amount;
  return true;
}

export function purchaseAchievement(state, id, {
  registry,
  snapshot,
  computeSnapshot,
  spendCurrency,
  at = Date.now(),
} = {}) {
  const definition = resolveDefinition(registry, id);
  const currentSnapshot = snapshot || resolveSnapshot(state, computeSnapshot);
  const entry = entryFor(state, definition, currentSnapshot, true);
  if (entry.status === 'active' || entry.status === 'purchased') {
    return { ok: false, changed: false, reason: 'already-acquired', cost: 0 };
  }
  if (entry.status !== 'available') return { ok: false, changed: false, reason: 'locked', cost: 0 };
  const cost = getAchievementCost(definition, currentSnapshot);
  const currency = definition.costCurrency || 'coins';
  const balance = Number(currentSnapshot?.[currency]) || 0;
  if (balance < cost) return { ok: false, changed: false, reason: 'insufficient-funds', cost, currency };
  if (!spend(state, currency, cost, { spendCurrency, snapshot: currentSnapshot })) {
    return { ok: false, changed: false, reason: 'insufficient-funds', cost, currency };
  }
  entry.status = 'purchased';
  entry.purchasedAt = at;
  entry.costPaid = cost;
  entry.costCurrency = currency;
  const active = activateAchievement(state, id, { registry, snapshot: currentSnapshot, at });
  if (!active.changed) throw new Error(`Achievement activation failed after purchase: ${id}`);
  return {
    ok: true, changed: true, status: 'active', cost, currency,
    activation: active.activation || null, card: active.card || null,
  };
}

export function getActiveAchievementRewards(state, {
  registry,
  snapshot,
  computeSnapshot,
} = {}) {
  if (!registry) throw new TypeError('Achievement registry is required');
  const currentSnapshot = snapshot || resolveSnapshot(state, computeSnapshot);
  const rewards = [];
  for (const definition of registry.definitions) {
    const entry = entryFor(state, definition, currentSnapshot);
    if (entry.status !== 'active') continue;
    const reward = resolveAchievementReward(definition, currentSnapshot);
    if (reward.type !== 'none') rewards.push({ achievementId: definition.id, reward });
  }
  return rewards;
}

export function getHighestBusinessAchievement(state, {
  registry,
  snapshot,
  computeSnapshot,
} = {}) {
  if (!registry) throw new TypeError('Achievement registry is required');
  const currentSnapshot = snapshot || resolveSnapshot(state, computeSnapshot);
  let highest = DEFAULT_BUSINESS;
  for (const definition of registry.definitions) {
    if (!definition.business) continue;
    if (entryFor(state, definition, currentSnapshot).status !== 'active') continue;
    if (definition.business.level >= highest.level) {
      highest = {
        ...definition.business,
        achievementId: definition.id,
      };
    }
  }
  return clone(highest);
}

export function markAchievementRead(state, id) {
  const achievements = store(state);
  if (achievements.read.includes(id)) return false;
  achievements.read.push(id);
  return true;
}

export function hasTrophy(state, id) {
  return Boolean(state.trophies?.includes(id) || state.achievements?.stateById?.[id]?.status === 'active');
}

export function getTrophyCount(state) {
  return new Set([
    ...(state.trophies || []),
    ...Object.entries(state.achievements?.stateById || {})
      .filter(([, entry]) => entry.status === 'active')
      .map(([id]) => id),
  ]).size;
}
