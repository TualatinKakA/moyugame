import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, normalizeState } from '../src/core/state.js';
import { computeState, workClick, tick, buyBuilding, buyBuildingUpgrade, abdicate, reincarnate, reincarnationRequirement } from '../src/systems/engine.js';

test('ten-minute automated opening stays finite and progresses through facilities', () => {
  const s = createState();
  for (let second = 0; second < 600; second++) {
    workClick(s);
    tick(s, 1);
    buyBuilding(s, 'farm', 1);
    buyBuilding(s, 'inn', 1);
    buyBuilding(s, 'blacksmith', 1);
    for (const id of ['farm-1', 'farm-2', 'inn-1', 'inn-2', 'blacksmith-1', 'blacksmith-2']) buyBuildingUpgrade(s, id);
  }
  const d = computeState(s);
  assert.equal(s.stats.run.time, 600);
  assert.equal(s.stats.run.clicks, 600);
  assert.ok(s.buildings.farm > 0);
  assert.ok(d.production > 0);
  assert.ok(Number.isFinite(d.production));
  assert.ok(Number.isFinite(d.clickReward));
  assert.ok(Number.isFinite(s.coins));
  const restored = normalizeState(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.stats.run.time, 600);
  assert.ok(Number.isFinite(computeState(restored).production));
});

test('reset chain can reach R3 without changing permanent statistics object', () => {
  let s = createState();
  const total = s.stats.total;
  for (let target = 1; target <= 3; target++) {
    s.stats.run.coins = 5e15;
    s = abdicate(s);
    assert.ok(s.gems > 0);
    s.gems = reincarnationRequirement(s.progression.reincarnations);
    const next = reincarnate(s);
    assert.ok(next);
    assert.equal(next.progression.reincarnations, target);
    assert.equal(next.stats.total, total);
    s = next;
  }
  assert.equal(s.progression.reincarnations, 3);
  assert.equal(computeState(s).mods.globalAdd, 150);
});
