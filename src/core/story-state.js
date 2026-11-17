import { REINCARNATION_ACHIEVEMENTS } from '../content/achievements/reincarnation.js';

const STATUSES = new Set(['locked', 'available', 'purchased', 'active']);
const SCOPES = new Set(['run', 'reincarnation', 'ascension', 'profile']);
const HISTORY_LIMIT = 200;

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function uniqueIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && id))];
}

function timestamp(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-HISTORY_LIMIT).flatMap(item => {
    if (typeof item === 'string') return [{ id: item, at: 0 }];
    if (!item || typeof item.id !== 'string' || !item.id) return [];
    return [{ id: item.id, at: timestamp(item.at) }];
  });
}

function normalizePending(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const pending = [];
  for (const item of value) {
    const id = typeof item === 'string' ? item : item?.id;
    if (typeof id !== 'string' || !id || seen.has(id)) continue;
    seen.add(id);
    pending.push({ id, at: timestamp(typeof item === 'object' ? item.at : 0) });
  }
  return pending;
}

function normalizeTriggered(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(uniqueIds(value).map(id => [id, { scope: 'profile', cycleKey: 'profile' }]));
  }
  if (!value || typeof value !== 'object') return {};
  const triggered = {};
  for (const [id, record] of Object.entries(value)) {
    if (!id) continue;
    const scope = SCOPES.has(record?.scope) ? record.scope : 'profile';
    triggered[id] = {
      scope,
      cycleKey: String(record?.cycleKey ?? (scope === 'profile' ? 'profile' : 0)),
      skipped: record?.skipped === true || undefined,
    };
    if (!triggered[id].skipped) delete triggered[id].skipped;
  }
  return triggered;
}

export function createStoryState() {
  return {
    intro: { unlocked: [], pending: [], read: [], completed: false },
    triggered: {},
    pending: [],
    read: [],
    triggeredAt: {},
    history: [],
    skipped: [],
  };
}

export function normalizeStoryState(saved) {
  const base = createStoryState();
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
  const intro = saved.intro && typeof saved.intro === 'object' ? saved.intro : {};
  const read = uniqueIds(saved.read?.length ? saved.read : saved.seen);
  const triggeredAt = {};
  if (saved.triggeredAt && typeof saved.triggeredAt === 'object') {
    for (const [id, at] of Object.entries(saved.triggeredAt)) {
      if (id) triggeredAt[id] = timestamp(at);
    }
  }
  return {
    intro: {
      unlocked: uniqueIds(intro.unlocked),
      pending: uniqueIds(intro.pending),
      read: uniqueIds(intro.read),
      completed: intro.completed === true,
    },
    triggered: normalizeTriggered(saved.triggered),
    pending: normalizePending(saved.pending),
    read,
    triggeredAt,
    history: normalizeHistory(saved.history),
    skipped: uniqueIds(saved.skipped),
  };
}

export function createAchievementState() {
  return { stateById: {}, progress: {}, read: [], pendingCards: [] };
}

function normalizeAchievementEntry(record, fallbackAt = 0) {
  if (!record || typeof record !== 'object') return null;
  const status = STATUSES.has(record.status) ? record.status : 'locked';
  const scope = SCOPES.has(record.scope) ? record.scope : 'profile';
  const normalized = {
    status,
    scope,
    cycleKey: String(record.cycleKey ?? (scope === 'profile' ? 'profile' : 0)),
  };
  for (const key of ['availableAt', 'purchasedAt', 'activatedAt']) {
    if (Number.isFinite(record[key])) normalized[key] = timestamp(record[key], fallbackAt);
  }
  if (Number.isFinite(record.costPaid) && record.costPaid >= 0) normalized.costPaid = record.costPaid;
  if (typeof record.costCurrency === 'string') normalized.costCurrency = record.costCurrency;
  if (record.migrated === true) normalized.migrated = true;
  return normalized;
}

export function normalizeAchievementState(saved) {
  const base = createAchievementState();
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return base;
  const stateById = {};
  for (const [id, record] of Object.entries(saved.stateById || {})) {
    const normalized = normalizeAchievementEntry(record);
    if (id && normalized) stateById[id] = normalized;
  }
  if (saved.unlocked && typeof saved.unlocked === 'object') {
    for (const [id, unlocked] of Object.entries(saved.unlocked)) {
      if (!unlocked || stateById[id]) continue;
      const at = timestamp(saved.unlockedAt?.[id]);
      stateById[id] = {
        status: 'active', scope: 'profile', cycleKey: 'profile',
        availableAt: at, purchasedAt: at, activatedAt: at, migrated: true,
      };
    }
  }
  const progress = {};
  for (const [id, record] of Object.entries(saved.progress || {})) {
    if (!id || !record || typeof record !== 'object') continue;
    progress[id] = {
      value: Number(record.value) || 0,
      target: Number(record.target) || 0,
    };
  }
  return {
    stateById,
    progress,
    read: uniqueIds(saved.read),
    pendingCards: normalizePending(saved.pendingCards),
  };
}

function isDemoSave(saved) {
  const markers = [saved?.contentVersion, ...(Array.isArray(saved?.contentPacks) ? saved.contentPacks : [])];
  return markers.some(value => typeof value === 'string' && /demo/i.test(value));
}

function emptyMigration() {
  return {
    schemaVersion: 3,
    story: createStoryState(),
    achievements: createAchievementState(),
    trophies: [],
  };
}

function migratedEntry(at) {
  return {
    status: 'active', scope: 'profile', cycleKey: 'profile',
    availableAt: at, purchasedAt: at, activatedAt: at, migrated: true,
  };
}

export function createSchema3Migration(input) {
  let saved = input;
  if (typeof saved === 'string') {
    try { saved = JSON.parse(saved); } catch { saved = null; }
  }
  if (isDemoSave(saved)) return { state: null, originalSnapshot: clone(saved), demo: true };
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return { state: emptyMigration(), originalSnapshot: clone(saved), recovered: true };
  }

  const originalSnapshot = clone(saved);
  const state = clone(saved);
  const at = timestamp(saved.lastSave, timestamp(saved.createdAt));
  state.schemaVersion = 3;
  state.story = normalizeStoryState(saved.story);
  state.achievements = normalizeAchievementState(saved.achievements);
  state.trophies = uniqueIds(saved.trophies);

  for (const id of state.trophies) {
    if (!state.achievements.stateById[id]) state.achievements.stateById[id] = migratedEntry(at);
  }

  const reincarnations = Math.max(0, Number(saved.progression?.reincarnations ?? saved.reincarnations) || 0);
  for (const definition of REINCARNATION_ACHIEVEMENTS) {
    if (definition.business.level > reincarnations) continue;
    const current = state.achievements.stateById[definition.id];
    if (current?.status === 'active') continue;
    state.achievements.stateById[definition.id] = migratedEntry(at);
  }

  return { state, originalSnapshot, demo: false, recovered: false };
}

export function migrateGameStateToSchema3(saved) {
  return createSchema3Migration(saved).state;
}

export function preserveStoryAndAchievements(previous, next) {
  if (!next || typeof next !== 'object') throw new TypeError('Next state is required');
  next.story = normalizeStoryState(clone(previous?.story));
  next.achievements = normalizeAchievementState(clone(previous?.achievements));
  next.schemaVersion = 3;
  return next;
}

export function resetContentForCycle(state, scope, cycleKey) {
  if (!['run', 'reincarnation', 'ascension'].includes(scope)) throw new Error(`Invalid cycle scope: ${scope}`);
  const story = normalizeStoryState(state.story);
  for (const [id, record] of Object.entries(story.triggered)) {
    if (record.scope === scope) delete story.triggered[id];
  }
  const achievements = normalizeAchievementState(state.achievements);
  for (const [id, record] of Object.entries(achievements.stateById)) {
    if (record.scope !== scope) continue;
    achievements.stateById[id] = { status: 'locked', scope, cycleKey: String(cycleKey) };
  }
  state.story = story;
  state.achievements = achievements;
  state.schemaVersion = 3;
  return state;
}

export function clearStoryAndAchievements(state) {
  state.story = createStoryState();
  state.achievements = createAchievementState();
  state.trophies = [];
  state.schemaVersion = 3;
  return state;
}
