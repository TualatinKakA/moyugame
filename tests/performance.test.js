import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createState } from '../src/core/state.js';
import { computeSnapshot, computeState, tick, workClick, buyBuilding, buyBuildingUpgrade } from '../src/systems/engine.js';

function seededRandom(seed) {
  return () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
}

test('randomized upgrade registration order does not change numeric results', () => {
  const ids = ['farm-1', 'farm-2', 'inn-1', 'fairy-1', 'fairy-2', 'fairy-3', 'fairy-10', 'fairy-11', 'elf-1', 'elf-2'];
  const random = seededRandom(123456);
  const expectedState = createState();
  expectedState.alignment = 'good'; expectedState.faction = 'fairy';
  expectedState.buildings.farm = 100; expectedState.buildings.inn = 50; expectedState.buildings.blacksmith = 25;
  expectedState.upgrades = [...ids];
  const expected = computeSnapshot(expectedState);
  for (let run = 0; run < 20; run++) {
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const state = createState();
    state.alignment = 'good'; state.faction = 'fairy';
    state.buildings = { ...expectedState.buildings };
    state.upgrades = shuffled;
    const actual = computeSnapshot(state);
    assert.ok(Math.abs(actual.production - expected.production) < 1e-7);
    assert.ok(Math.abs(actual.clickReward - expected.clickReward) < 1e-7);
    assert.equal(actual.assistants, expected.assistants);
  }
});

test('long opening simulation stays finite and does not accumulate derived save state', () => {
  const state = createState();
  for (let second = 0; second < 5000; second++) {
    workClick(state);
    tick(state, 1);
    buyBuilding(state, 'farm', 1);
    buyBuilding(state, 'inn', 1);
    buyBuildingUpgrade(state, 'farm-1');
    buyBuildingUpgrade(state, 'farm-2');
    buyBuildingUpgrade(state, 'inn-1');
  }
  const snapshot = computeState(state);
  assert.ok(Number.isFinite(state.coins) && state.coins >= 0);
  assert.ok(Number.isFinite(snapshot.production) && snapshot.production >= 0);
  assert.equal(state._derived, undefined);
  assert.ok(snapshot.sources.length > 0);
});

test('record snapshot and cache performance baseline', t => {
  const state = createState();
  state.coins = 1e100;
  state.gems = 1e20;
  state.progression.reincarnations = 3;
  for (const id of Object.keys(state.buildings)) state.buildings[id] = 100;
  state.upgrades = ['farm-1', 'farm-2', 'inn-1', 'fairy-1', 'fairy-2', 'fairy-3', 'fairy-10', 'fairy-11'];
  computeState(state);
  const uncachedStart = performance.now();
  for (let i = 0; i < 50; i++) computeSnapshot(state);
  const uncachedMs = performance.now() - uncachedStart;
  const cachedStart = performance.now();
  for (let i = 0; i < 500; i++) computeState(state);
  const cachedMs = performance.now() - cachedStart;
  t.diagnostic(`50 uncached snapshots: ${uncachedMs.toFixed(2)}ms; 500 cached reads: ${cachedMs.toFixed(2)}ms`);
  assert.ok(cachedMs < uncachedMs, `cache ${cachedMs}ms should be faster than full computation ${uncachedMs}ms`);
});
