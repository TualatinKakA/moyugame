import { BUILDINGS } from '../content/r0r3/buildings.js';
import FACTIONS from '../content/r0r3/factions.js';

export const SAVE_KEY = 'endless-shift-r0r3-v1';
export const CONTENT_VERSION = 'r0-r3-v1';
export const CURRENT_SCHEMA_VERSION = 2;
export const STAT_SCOPES = ['run', 'r', 'ascension', 'total'];

export const emptyStats = () => ({
  time: 0, coins: 0, clickCoins: 0, clicks: 0, spellsCast: 0, manaProduced: 0,
  factionCoins: 0, excavations: 0, assistantsMax: 0, manaMax: 0, manaRegenMax: 0,
  buildingsMax: 0, upgradesBought: 0, longestSession: 0, offlineTime: 0,
  factionTime: {}, factionCoinsByFaction: {}, buildingMax: {}, upgradesByFaction: {},
});

export function createState() {
  const now = Date.now();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    contentPacks: [CONTENT_VERSION],
    createdAt: now, sessionStartedAt: now, lastSave: now,
    progression: {
      reincarnations: 0,
      ascension: 0,
      ascensionStartR: 0,
      ascensionHistory: [],
    },
    coins: 0, gems: 0, rubies: 0,
    alignment: null, faction: null, prestige: null,
    buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, 0])),
    factionCoins: Object.fromEntries(FACTIONS.map(f => [f.id, 0])),
    upgrades: [], activeSpells: {}, spellBrainwaveStacks: 0,
    mana: 0, trophies: [], artifacts: [], challenges: [], excavationCount: 0, excavationResets: 0,
    unlocked: { archaeology: false, survey: false, underworld: false, mercenary: false },
    mercenary: { upgrades: [], spells: [] },
    stats: { run: emptyStats(), r: emptyStats(), ascension: emptyStats(), total: emptyStats() },
    settings: { buyAmount: 1, muted: true, offlineEfficiency: 0.5 },
    rngState: 0x6d2b79f5,
  };
}

export function normalizeState(saved) {
  const base = createState();
  if (!saved || typeof saved !== 'object') return base;
  const savedProgression = saved.progression && typeof saved.progression === 'object' ? saved.progression : {};
  const state = {
    ...base, ...saved,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contentPacks: Array.isArray(saved.contentPacks) && saved.contentPacks.length ? [...saved.contentPacks] : [saved.contentVersion || CONTENT_VERSION],
    progression: {
      ...base.progression, ...savedProgression,
      reincarnations: savedProgression.reincarnations ?? saved.reincarnations ?? 0,
      ascensionHistory: Array.isArray(savedProgression.ascensionHistory) ? [...savedProgression.ascensionHistory] : [],
    },
    buildings: { ...base.buildings, ...(saved.buildings || {}) },
    factionCoins: { ...base.factionCoins, ...(saved.factionCoins || {}) },
    unlocked: { ...base.unlocked, ...(saved.unlocked || {}) },
    mercenary: { ...base.mercenary, ...(saved.mercenary || {}) },
    settings: { ...base.settings, ...(saved.settings || {}) },
    stats: Object.fromEntries(STAT_SCOPES.map(scope => [scope, { ...base.stats[scope], ...(saved.stats?.[scope] || {}) }])),
  };
  for (const scope of STAT_SCOPES) {
    for (const key of ['factionTime', 'factionCoinsByFaction', 'buildingMax', 'upgradesByFaction']) {
      state.stats[scope][key] = { ...base.stats[scope][key], ...(saved.stats?.[scope]?.[key] || {}) };
    }
  }
  state.progression.reincarnations = Math.max(0, Math.floor(Number(state.progression.reincarnations) || 0));
  state.progression.ascension = Math.max(0, Math.floor(Number(state.progression.ascension) || 0));
  state.progression.ascensionStartR = Math.max(0, Math.floor(Number(state.progression.ascensionStartR) || 0));
  state.coins = Math.max(0, Number(state.coins) || 0);
  state.gems = Math.max(0, Number(state.gems) || 0);
  state.createdAt = Number(saved.createdAt) || base.createdAt;
  state.lastSave = Number(saved.lastSave) || base.lastSave;
  state.sessionStartedAt = Date.now();
  state.upgrades = Array.isArray(state.upgrades) ? state.upgrades : [];
  state.trophies = Array.isArray(state.trophies) ? state.trophies : [];
  state.artifacts = Array.isArray(state.artifacts) ? state.artifacts : [];
  state.challenges = Array.isArray(state.challenges) ? state.challenges : [];
  state.activeSpells = state.activeSpells && typeof state.activeSpells === 'object' ? state.activeSpells : {};
  return state;
}

export const migrateState = normalizeState;

export function saveState(state, storage = globalThis.localStorage) {
  state.lastSave = Date.now();
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  const { _derived, ...persistent } = state;
  storage.setItem(SAVE_KEY, JSON.stringify({ ...persistent, lastSave: state.lastSave }));
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createState();
  } catch {
    return createState();
  }
}
