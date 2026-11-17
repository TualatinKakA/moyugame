import { BUILDINGS } from '../content/r0r3/buildings.js';
import FACTIONS from '../content/r0r3/factions.js';

export const SAVE_KEY = 'endless-shift-r0r3-v1';
export const CONTENT_VERSION = 'r0-r3-v1';

export const emptyStats = () => ({
  time: 0, coins: 0, clickCoins: 0, clicks: 0, spellsCast: 0, manaProduced: 0,
  factionCoins: 0, excavations: 0, assistantsMax: 0, manaMax: 0, manaRegenMax: 0,
  buildingsMax: 0, upgradesBought: 0, longestSession: 0, offlineTime: 0,
  factionTime: {}, factionCoinsByFaction: {}, buildingMax: {}, upgradesByFaction: {},
});

export function createState() {
  return {
    contentVersion: CONTENT_VERSION,
    coins: 0, gems: 0, rubies: 0, reincarnations: 0,
    alignment: null, faction: null, prestige: null,
    buildings: Object.fromEntries(BUILDINGS.map(b => [b.id, 0])),
    factionCoins: Object.fromEntries(FACTIONS.map(f => [f.id, 0])),
    upgrades: [], activeSpells: {}, spellBrainwaveStacks: 0,
    mana: 0, trophies: [], artifacts: [], challenges: [], excavationCount: 0, excavationResets: 0,
    unlocked: { archaeology: false, survey: false, underworld: false, mercenary: false },
    mercenary: { upgrades: [], spells: [] },
    stats: { run: emptyStats(), r: emptyStats(), total: emptyStats() },
    settings: { buyAmount: 1, muted: true, offlineEfficiency: 0.5 },
    lastSave: Date.now(), rngState: 0x6d2b79f5,
  };
}

export function normalizeState(saved) {
  const base = createState();
  if (!saved || typeof saved !== 'object') return base;
  const state = {
    ...base, ...saved,
    buildings: { ...base.buildings, ...(saved.buildings || {}) },
    factionCoins: { ...base.factionCoins, ...(saved.factionCoins || {}) },
    unlocked: { ...base.unlocked, ...(saved.unlocked || {}) },
    mercenary: { ...base.mercenary, ...(saved.mercenary || {}) },
    settings: { ...base.settings, ...(saved.settings || {}) },
    stats: {
      run: { ...base.stats.run, ...(saved.stats?.run || {}) },
      r: { ...base.stats.r, ...(saved.stats?.r || {}) },
      total: { ...base.stats.total, ...(saved.stats?.total || {}) },
    },
  };
  for (const scope of ['run', 'r', 'total']) {
    for (const key of ['factionTime', 'factionCoinsByFaction', 'buildingMax', 'upgradesByFaction']) {
      state.stats[scope][key] = { ...base.stats[scope][key], ...(saved.stats?.[scope]?.[key] || {}) };
    }
  }
  state.coins = Math.max(0, Number(state.coins) || 0);
  state.gems = Math.max(0, Number(state.gems) || 0);
  state.reincarnations = Math.max(0, Math.floor(Number(state.reincarnations) || 0));
  state.upgrades = Array.isArray(state.upgrades) ? state.upgrades : [];
  state.trophies = Array.isArray(state.trophies) ? state.trophies : [];
  state.artifacts = Array.isArray(state.artifacts) ? state.artifacts : [];
  state.challenges = Array.isArray(state.challenges) ? state.challenges : [];
  state.activeSpells = state.activeSpells && typeof state.activeSpells === 'object' ? state.activeSpells : {};
  return state;
}

export function saveState(state, storage = globalThis.localStorage) {
  state.lastSave = Date.now();
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
