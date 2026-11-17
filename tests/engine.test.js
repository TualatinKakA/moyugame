import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, saveState, normalizeState } from '../src/core/state.js';
import { applyFactionUpgrade, createModifiers } from '../src/systems/effects.js';
import { UPGRADE_BY_ID, FACTION_BY_ID } from '../src/systems/engine.js';
import {
  computeState, coinsToGems, gemsToCoins, reincarnationRequirement, buildingCost,
  buyBuilding, buyBuildingUpgrade, buyFactionUpgrade, buyProof, workClick, castSpell,
  tick, abdicate, reincarnate,
} from '../src/systems/engine.js';

const richState = () => {
  const s = createState();
  s.coins = 1e100; s.gems = 1e40; s.progression.reincarnations = 3;
  for (const key of Object.keys(s.buildings)) s.buildings[key] = 100;
  for (const key of Object.keys(s.factionCoins)) s.factionCoins[key] = 1e30;
  for (const scope of ['run', 'r', 'total']) {
    Object.assign(s.stats[scope], { time: 100000, coins: 1e90, clicks: 10000, spellsCast: 5000, factionCoins: 1e20, excavations: 500 });
  }
  return s;
};

test('initial click and building base values match R0', () => {
  const s = createState();
  assert.equal(computeState(s).clickReward, 1);
  assert.equal(computeState(s).production, 0);
  assert.equal(buildingCost(s, 'farm', 0), 10);
  assert.equal(buildingCost(s, 'farm', 1), 12);
  assert.equal(buildingCost(s, 'inn', 0), 125);
  assert.equal(buildingCost(s, 'blacksmith', 0), 600);
});

test('building purchase and first upgrade change production and assistants', () => {
  const s = createState(); s.coins = 1000;
  assert.equal(buyBuilding(s, 'farm', 1), true);
  assert.equal(computeState(s).outputs.farm, 2);
  s.coins = 1000;
  for (let i = 0; i < 4; i++) buyBuilding(s, 'farm', 1);
  assert.equal(s.buildings.farm, 5);
  assert.equal(buyBuildingUpgrade(s, 'farm-1'), true);
  assert.equal(computeState(s).outputs.farm, 20);
  assert.equal(computeState(s).assistants, 1);
});

test('coin and gem conversion round trips', () => {
  for (const n of [1, 2, 10, 100, 10000]) assert.equal(coinsToGems(gemsToCoins(n)), n);
  assert.equal(coinsToGems(100000000), 0);
  assert.equal(reincarnationRequirement(0), 1e27);
  assert.equal(reincarnationRequirement(1), 1e30);
  assert.equal(reincarnationRequirement(2), 1e33);
});

test('faction requires alignment proof and treaty', () => {
  const s = richState(); s.gems = 0; s.progression.reincarnations = 0;
  assert.equal(buyFactionUpgrade(s, 'fairy-0'), false);
  assert.equal(buyProof(s, 'good'), true);
  assert.equal(buyFactionUpgrade(s, 'fairy-0'), true);
  assert.equal(s.faction, 'fairy');
  assert.equal(buyFactionUpgrade(s, 'elf-0'), false);
});

test('FR1 uses base production and reduced building cost multiplier', () => {
  const s = richState(); s.alignment = 'good';
  assert.equal(buyFactionUpgrade(s, 'fairy-0'), true);
  assert.equal(buyFactionUpgrade(s, 'fairy-1'), true);
  const d = computeState(s);
  assert.equal(d.mods.buildingBaseAdd.farm, 98);
  assert.ok(Math.abs(d.mods.buildingCostReduce - 0.02) < 1e-9);
  assert.equal(buildingCost(s, 'farm', 2, d.mods), 13);
});

test('spell casting consumes mana and applies active effect', () => {
  const s = richState(); s.alignment = 'good'; s.faction = 'fairy'; s.mana = 10000;
  assert.equal(castSpell(s, 'fairyChanting'), true);
  assert.equal(s.mana, 9000);
  const d = computeState(s);
  assert.equal(d.mods.buildingAdd.farm, 50000);
  assert.ok(d.production > 0);
  tick(s, 0.5);
  assert.ok(s.activeSpells.fairyChanting < 10);
});

test('R1-R3 progression modifiers are scoped correctly', () => {
  const s = createState(); s.progression.reincarnations = 3;
  const d = computeState(s);
  assert.equal(d.mods.globalAdd, 150);
  assert.equal(d.mods.offlineAdd, 1500);
  assert.equal(d.mods.fcChanceAdd, 30);
  assert.ok(Math.abs(d.mods.gemPerGemAdd - 0.6) < 1e-9);
  assert.equal(s._derived.manaRegen, 7);
});

test('abdication preserves permanent content and clears the run', () => {
  const s = richState();
  s.stats.run.coins = gemsToCoins(100);
  s.trophies = ['x']; s.artifacts = ['y']; s.alignment = 'good'; s.faction = 'fairy';
  const next = abdicate(s);
  assert.equal(next.gems, s.gems + 100);
  assert.equal(next.coins, 0);
  assert.equal(next.faction, null);
  assert.deepEqual(next.trophies, ['x']);
  assert.deepEqual(next.artifacts, ['y']);
  assert.equal(next.stats.total, s.stats.total);
});

test('reincarnation resets gems and increments R only at the requirement', () => {
  const s = richState(); s.gems = 1e26; s.progression.reincarnations = 0;
  assert.equal(reincarnate(s), null);
  s.gems = 1e27;
  const next = reincarnate(s);
  assert.equal(next.progression.reincarnations, 1);
  assert.equal(next.gems, 0);
  assert.equal(next.stats.total, s.stats.total);
});

test('save excludes derived cache and normalizes persistent state', () => {
  const s = richState(); computeState(s);
  const memory = new Map();
  const storage = { setItem: (k, v) => memory.set(k, v), getItem: k => memory.get(k) };
  saveState(s, storage);
  const raw = memory.get('endless-shift-r0r3-v1');
  assert.equal(JSON.parse(raw)._derived, undefined);
  const restored = normalizeState(JSON.parse(raw));
  assert.equal(restored.progression.reincarnations, 3);
  assert.equal(restored.contentVersion, 'r0-r3-v1');
});

test('every faction effect executes without non-finite derived values', () => {
  for (const faction of Object.values(FACTION_BY_ID)) {
    const s = richState(); s.alignment = faction.alignment; s.faction = faction.id;
    for (const u of faction.upgrades) {
      const mods = createModifiers();
      applyFactionUpgrade(mods, s, u);
      for (const value of Object.values(mods)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value), `${u.id} produced ${value}`);
      }
    }
  }
});

test('clicks and ticks update all statistical scopes', () => {
  const s = createState();
  workClick(s); tick(s, 0.5);
  for (const scope of ['run', 'r', 'total']) {
    assert.equal(s.stats[scope].clicks, 1);
    assert.equal(s.stats[scope].time, 0.5);
  }
});
