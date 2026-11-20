import { createRngState, filterTransientRngStreams } from '../core/rng.js';
import { numeric } from './numeric.js';
import { ascensionForReincarnation } from './progression.js';

export const SCHEMA_VERSION = 5;
const SCOPES = ['run', 'r', 'ascension', 'total'];
const NUMBER_FIELDS = ['time', 'coins', 'clickCoins', 'clicks', 'spellsCast', 'factionCoins', 'buildingsMax', 'upgradesBought', 'abdications', 'reincarnations', 'offlineTime'];
const emptyStats = () => ({ ...Object.fromEntries(NUMBER_FIELDS.map(field => [field, 0])), factionCoinsByFaction: {}, spellCasts: {}, spellActivity: {}, buildingMax: {} });

export function createSaveState({ seed = 0x6d2b79f5, now = 0, contentVersions = ['base-v1'] } = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    contentVersions: [...contentVersions],
    revision: 0, createdAt: now, lastSave: now, lastWallClock: now,
    progression: { reincarnations: 0, ascension: 0, ascensionStartR: 0, ascensionHistory: [] },
    resources: { coins: 0, gems: 0, mana: 0, factionCoins: {} },
    buildings: {},
    stats: { run: emptyStats(), r: emptyStats(), ascension: emptyStats(), total: emptyStats() },
    permanentUnlocks: {}, owned: { run: {}, r: {}, ascension: {} }, spellSources: {},
    selections: { alignment: null, faction: null, bloodline: null, lineage: null, artifactSet: null },
    loadouts: { research: {}, mercenary: {} }, timers: { spells: {}, tasks: {} },
    challenges: {}, artifacts: {},
    story: { pending: [], completed: {}, rewarded: {}, choices: {}, groups: {} },
    rng: createRngState(seed), quarantined: { unknownIds: {}, invalidValues: {} },
    settings: { buyAmount: 1, quickSkills: null, manaRegenOverride: null },
  };
}

function finite(value, fallback = 0) {
  return numeric.isFinite(value) ? Number(value) : fallback;
}
function cleanNumberRecord(input, graph, kind, quarantine) {
  const output = {};
  for (const [id, value] of Object.entries(input || {})) {
    if (!graph.definitionsById.has(id) || graph.definitionsById.get(id).kind !== kind) {
      quarantine.unknownIds[id] = value; continue;
    }
    if (!numeric.isNonNegative(value)) { quarantine.invalidValues[id] = value; continue; }
    if (Number(value) > 0) output[id] = ['building', 'faction'].includes(kind) ? Math.floor(Number(value)) : Number(value);
  }
  return output;
}
function cleanBooleanRecord(input, graph, kinds, quarantine) {
  const output = {};
  for (const [id, value] of Object.entries(input || {})) {
    const definition = graph.definitionsById.get(id);
    if (!definition || !kinds.includes(definition.kind)) { quarantine.unknownIds[id] = value; continue; }
    if (value) output[id] = true;
  }
  return output;
}
function cleanStats(input = {}, graph, quarantine) {
  const output = emptyStats();
  for (const field of NUMBER_FIELDS) output[field] = Math.max(0, finite(input[field]));
  output.factionCoinsByFaction = cleanNumberRecord(input.factionCoinsByFaction, graph, 'faction', quarantine);
  output.factionCoins = Object.values(output.factionCoinsByFaction).reduce((sum, value) => sum + value, 0);
  output.spellCasts = cleanNumberRecord(input.spellCasts, graph, 'spell', quarantine);
  output.spellActivity = cleanNumberRecord(input.spellActivity, graph, 'spell', quarantine);
  output.buildingMax = cleanNumberRecord(input.buildingMax, graph, 'building', quarantine);
  return output;
}
function aliasId(id, graph) { return graph.migrationAlias[id] || id; }

function migrateLegacy(old, state, graph) {
  state.createdAt = finite(old.createdAt, state.createdAt);
  state.lastSave = finite(old.lastSave, state.lastSave);
  state.lastWallClock = state.lastSave;
  state.revision = Math.max(0, Math.floor(finite(old.revision)));
  state.progression.reincarnations = Math.max(0, Math.floor(finite(old.progression?.reincarnations ?? old.reincarnations)));
  state.resources.coins = Math.max(0, finite(old.coins));
  state.resources.gems = Math.max(0, finite(old.gems));
  state.resources.mana = Math.max(0, finite(old.mana));
  state.resources.factionCoins = cleanNumberRecord(old.factionCoins, graph, 'faction', state.quarantined);
  state.buildings = cleanNumberRecord(old.buildings, graph, 'building', state.quarantined);
  for (const scope of SCOPES) state.stats[scope] = cleanStats(old.stats?.[scope], graph, state.quarantined);
  for (const id of old.challenges || []) {
    if (graph.definitionsById.get(id)?.kind === 'challenge') state.challenges[id] = { completed: true, scope: graph.definitionsById.get(id).scope };
    else state.quarantined.unknownIds[id] = true;
  }
  for (const id of old.upgrades || []) {
    const alias = aliasId(id, graph);
    if (graph.definitionsById.get(alias)?.kind === 'upgrade') state.owned.run[alias] = true;
    else state.quarantined.unknownIds[id] = true;
  }
  for (const [id, value] of Object.entries(old.activeSpells || {})) {
    const alias = aliasId(id, graph);
    if (graph.definitionsById.get(alias)?.kind === 'spell' && finite(value) > 0) state.timers.spells[alias] = { remaining: finite(value) };
  }
  state.selections.alignment = graph.definitionsById.get(old.alignment)?.kind === 'alignment' ? old.alignment : null;
  state.selections.faction = graph.definitionsById.get(old.faction)?.kind === 'faction' ? old.faction : null;
  const faction = state.selections.faction && graph.definitionsById.get(state.selections.faction);
  if (faction?.spellId) state.spellSources[faction.spellId] = { [faction.id]: true };
  const oldStory = old.story || {};
  state.story.pending = (oldStory.pending || []).map(item => typeof item === 'string' ? item : item.id).filter(id => graph.definitionsById.get(id)?.kind === 'story').map(id => ({ id, at: 0 }));
  for (const id of [...(oldStory.read || []), ...(oldStory.history || []).map(item => item.id)]) {
    if (graph.definitionsById.get(id)?.kind === 'story') state.story.completed[id] = true;
  }
  if (oldStory.intro?.completed) state.story.groups.prologue = true;
  const unlocked = [...(old.trophies || []), ...Object.entries(old.achievements?.stateById || {}).filter(([, value]) => value.status === 'active').map(([id]) => id)];
  for (const id of unlocked) if (graph.definitionsById.get(id)?.kind === 'trophy') state.permanentUnlocks[id] = true;
  state.settings.buyAmount = [1, 10, 'max'].includes(old.settings?.buyAmount) ? old.settings.buyAmount : 1;
  state.settings.quickSkills = Array.isArray(old.settings?.quickSkills) ? old.settings.quickSkills.filter(id => graph.definitionsById.get(id)?.kind === 'spell') : null;
  state.settings.manaRegenOverride = old.settings?.manaRegenOverride == null ? null : Math.max(0, finite(old.settings.manaRegenOverride));
  if (Number.isFinite(old.rngState)) state.rng = createRngState(old.rngState);
}

function normalizeCurrent(saved, state, graph) {
  state.createdAt = finite(saved.createdAt, state.createdAt);
  state.lastSave = finite(saved.lastSave, state.lastSave);
  state.lastWallClock = finite(saved.lastWallClock, state.lastSave);
  state.revision = Math.max(0, Math.floor(finite(saved.revision)));
  state.progression.reincarnations = Math.max(0, Math.floor(finite(saved.progression?.reincarnations)));
  state.progression.ascension = Math.max(
    ascensionForReincarnation(state.progression.reincarnations),
    Math.max(0, Math.floor(finite(saved.progression?.ascension))),
  );
  state.progression.ascensionStartR = [0, 1, 100, 160, 220][state.progression.ascension] ?? 220;
  for (const resource of ['coins', 'gems', 'mana']) state.resources[resource] = Math.max(0, finite(saved.resources?.[resource]));
  state.resources.factionCoins = cleanNumberRecord(saved.resources?.factionCoins, graph, 'faction', state.quarantined);
  state.buildings = cleanNumberRecord(saved.buildings, graph, 'building', state.quarantined);
  for (const scope of SCOPES) state.stats[scope] = cleanStats(saved.stats?.[scope], graph, state.quarantined);
  for (const scope of ['run', 'r', 'ascension']) state.owned[scope] = cleanBooleanRecord(saved.owned?.[scope], graph, ['upgrade', 'challenge', 'research'], state.quarantined);
  state.permanentUnlocks = cleanBooleanRecord(saved.permanentUnlocks, graph, ['trophy'], state.quarantined);
  for (const [id, value] of Object.entries(saved.challenges || {})) {
    const definition = graph.definitionsById.get(id);
    if (definition?.kind === 'challenge' && value?.completed) state.challenges[id] = { completed: true, scope: definition.scope };
    else if (definition?.kind !== 'challenge') state.quarantined.unknownIds[id] = value;
  }
  for (const [id, sources] of Object.entries(saved.spellSources || {})) {
    if (graph.definitionsById.get(id)?.kind !== 'spell') { state.quarantined.unknownIds[id] = sources; continue; }
    const valid = Object.keys(sources || {}).filter(Boolean);
    if (valid.length) state.spellSources[id] = Object.fromEntries(valid.map(source => [source, true]));
  }
  for (const key of Object.keys(state.selections)) state.selections[key] = saved.selections?.[key] ?? null;
  if (graph.definitionsById.get(state.selections.alignment)?.kind !== 'alignment') state.selections.alignment = null;
  if (graph.definitionsById.get(state.selections.faction)?.kind !== 'faction') state.selections.faction = null;
  for (const [id, timer] of Object.entries(saved.timers?.spells || {})) {
    if (graph.definitionsById.get(id)?.kind === 'spell' && finite(timer?.remaining) > 0) state.timers.spells[id] = { remaining: finite(timer.remaining) };
  }
  const greenFingersTimer = saved.timers?.tasks?.greenFingersDiscount;
  if (greenFingersTimer) {
    const remaining = greenFingersTimer.remaining !== undefined
      ? finite(greenFingersTimer.remaining)
      : finite(greenFingersTimer.dueAt) - state.stats.run.time;
    if (remaining >= 0) state.timers.tasks.greenFingersDiscount = { remaining: Math.min(120, remaining) };
  }
  state.story.pending = (saved.story?.pending || []).filter(item => graph.definitionsById.get(item.id)?.kind === 'story').map(item => ({ id: item.id, at: finite(item.at) }));
  for (const field of ['completed', 'rewarded']) for (const [id, value] of Object.entries(saved.story?.[field] || {})) {
    if (graph.definitionsById.get(id)?.kind === 'story' && value) state.story[field][id] = true;
  }
  state.story.choices = { ...(saved.story?.choices || {}) };
  state.story.groups = { ...(saved.story?.groups || {}) };
  state.settings.buyAmount = [1, 10, 'max'].includes(saved.settings?.buyAmount) ? saved.settings.buyAmount : 1;
  state.settings.quickSkills = Array.isArray(saved.settings?.quickSkills) ? saved.settings.quickSkills.filter(id => graph.definitionsById.get(id)?.kind === 'spell') : null;
  state.settings.manaRegenOverride = saved.settings?.manaRegenOverride == null ? null : Math.max(0, finite(saved.settings.manaRegenOverride));
  if (saved.rng && Number.isFinite(saved.rng.seed)) {
    const rng = filterTransientRngStreams({ seed: saved.rng.seed >>> 0, streams: saved.rng.streams || {} }, graph.rngPersistence);
    state.rng = {
      seed: rng.seed,
      streams: Object.fromEntries(Object.entries(rng.streams).filter(([, stream]) => stream && Number.isFinite(stream.calls) && stream.calls >= 0 && Number.isFinite(stream.value))),
    };
  }
  state.quarantined = {
    unknownIds: { ...state.quarantined.unknownIds, ...(saved.quarantined?.unknownIds || {}) },
    invalidValues: { ...state.quarantined.invalidValues, ...(saved.quarantined?.invalidValues || {}) },
  };
}

export function migrateAndNormalizeState(input, graph, { now = 0, seed = 0x6d2b79f5 } = {}) {
  let saved = input;
  if (typeof saved === 'string') { try { saved = JSON.parse(saved); } catch { saved = null; } }
  const state = createSaveState({ seed, now, contentVersions: graph.contentVersions });
  if (!saved || typeof saved !== 'object') return { state, report: { from: 'empty', to: SCHEMA_VERSION, migrated: false } };
  const from = Math.floor(finite(saved.schemaVersion, 1));
  if (from < 4) migrateLegacy(saved, state, graph);
  else normalizeCurrent(saved, state, graph);
  state.contentVersions = [...graph.contentVersions];
  return { state, report: { from, to: SCHEMA_VERSION, migrated: from !== SCHEMA_VERSION } };
}

export function assertStateInvariants(state, graph) {
  for (const [key, value] of Object.entries(state.resources)) {
    if (key !== 'factionCoins' && !numeric.isNonNegative(value)) throw new Error(`Invariant: invalid resource ${key}`);
  }
  for (const [id, count] of Object.entries(state.buildings)) {
    if (graph.definitionsById.get(id)?.kind !== 'building' || !Number.isSafeInteger(count) || count < 0) throw new Error(`Invariant: invalid building ${id}`);
  }
  const validFactionCoin = id => graph.definitionsById.get(id)?.factionCoin?.enabled === true;
  for (const [id, value] of Object.entries(state.resources.factionCoins)) {
    if (!validFactionCoin(id) || !numeric.isNonNegative(value)) throw new Error(`Invariant: invalid faction coin balance ${id}`);
  }
  for (const scope of SCOPES) for (const [id, value] of Object.entries(state.stats[scope].factionCoinsByFaction)) {
    if (!validFactionCoin(id) || !numeric.isNonNegative(value)) throw new Error(`Invariant: invalid faction coin found ${scope}/${id}`);
  }
  for (const scope of SCOPES) {
    for (const [id, value] of Object.entries(state.stats[scope].spellCasts)) {
      if (graph.definitionsById.get(id)?.kind !== 'spell' || !numeric.isNonNegative(value)) throw new Error(`Invariant: invalid spell cast count ${scope}/${id}`);
    }
    for (const [id, value] of Object.entries(state.stats[scope].buildingMax)) {
      if (graph.definitionsById.get(id)?.kind !== 'building' || !Number.isSafeInteger(value) || value < 0) throw new Error(`Invariant: invalid building maximum ${scope}/${id}`);
    }
  }
  const faction = state.selections.faction && graph.definitionsById.get(state.selections.faction);
  if (faction && faction.alignment !== state.selections.alignment) throw new Error('Invariant: faction alignment mismatch');
  for (const id of Object.keys(state.story.rewarded)) if (!state.story.completed[id]) throw new Error(`Invariant: story reward before completion ${id}`);
  for (const scope of ['run', 'r', 'ascension']) for (const id of Object.keys(state.owned[scope])) {
    if (!graph.definitionsById.has(id)) throw new Error(`Invariant: unknown owned ${id}`);
  }
  return true;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
export function stateHash(state) {
  const text = JSON.stringify(stable({ ...state, lastSave: 0, lastWallClock: 0, revision: 0 }));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
