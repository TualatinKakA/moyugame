import test from 'node:test';
import assert from 'node:assert/strict';
import FACTIONS from '../src/content/r0r3/factions.js';
import { getFactionEffectSpecs } from '../src/content/r0r3/effect-specs.js';
import { createState, normalizeState, touchState } from '../src/core/state.js';
import { evaluateFormula, validateFormula, FormulaError } from '../src/systems/formula.js';
import { EffectAggregator, aggregateValues, createModifiers } from '../src/systems/effects.js';
import {
  computeSnapshot, computeState, buyBuilding, buyBuildingUpgrade, abdicate, snapshotCacheInfo,
} from '../src/systems/engine.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('safe formulas reject syntax, unknown names, globals and non-finite results', () => {
  assert.throws(() => evaluateFormula('x +', { x: 1 }), FormulaError);
  assert.throws(() => evaluateFormula('unknown + 1', {}), /Unknown variable/);
  assert.throws(() => evaluateFormula('globalThis.process', {}), /Unsupported token|Unknown variable/);
  assert.throws(() => evaluateFormula('1 / 0', {}), /non-finite/);
  assert.throws(() => validateFormula('min(x, y)', { allowedVariables: ['x'] }), /not declared/);
  assert.equal(evaluateFormula('max(2, min(8, x))', { x: 5 }), 5);
});

test('all faction formulas are covered by valid structured EffectSpecs', () => {
  const ids = new Set();
  for (const faction of FACTIONS) {
    for (const upgrade of faction.upgrades) {
      const specs = getFactionEffectSpecs(upgrade);
      for (const spec of specs) {
        for (const field of ['target', 'operation', 'value', 'stackingGroup', 'phase', 'source']) {
          assert.notEqual(spec[field], undefined, `${upgrade.id} misses ${field}`);
        }
        assert.ok(!ids.has(spec.id), `duplicate ${spec.id}`);
        ids.add(spec.id);
        if (spec.value.formula) {
          validateFormula(spec.value.formula, {
            contentId: spec.source,
            phase: spec.phase,
            allowedVariables: [...Object.keys(spec.value.variables || {}), 'R', 'A'],
          });
        }
      }
    }
  }
  assert.ok(ids.size > 100);
});

test('snapshot computation is pure, readonly and separate from saves', () => {
  const state = createState();
  state.coins = 1000;
  state.buildings.farm = 5;
  state.upgrades.push('farm-1');
  const before = JSON.stringify(state);
  const snapshot = computeSnapshot(state);
  assert.equal(JSON.stringify(state), before);
  assert.equal(state._derived, undefined);
  assert.equal(snapshot.outputs.farm, 20);
  assert.ok(Object.isFrozen(snapshot));
  assert.throws(() => { snapshot.production = 0; }, TypeError);
  const normalized = normalizeState({ ...state, _derived: { production: 999 } });
  assert.equal(normalized._derived, undefined);
});

test('cache hits reuse snapshots and revision changes invalidate them', () => {
  const state = createState();
  state.coins = 1000;
  const first = computeState(state);
  const second = computeState(state);
  assert.equal(first, second);
  assert.ok(snapshotCacheInfo().hits > 0);
  buyBuilding(state, 'farm', 1);
  assert.ok(state.revision > first.revision);
  assert.notEqual(computeState(state), first);
  const cached = computeState(state);
  touchState(state);
  assert.notEqual(computeState(state), cached);
});

test('dynamic formula inputs invalidate cache even without a manual revision bump', () => {
  const state = createState();
  state.upgrades.push('undead-7');
  state.buildings.farm = 1;
  const before = computeState(state).outputs.farm;
  state.stats.total.time += 100;
  const after = computeState(state).outputs.farm;
  assert.ok(after > before);
});

test('additive and multiplicative effects are order independent', () => {
  const make = (id, operation, value) => ({
    id, source: id, phase: 'global', stackingGroup: operation.startsWith('add') ? 'sum' : 'product',
    operation, resolvedValue: value,
  });
  const effects = [make('a', 'addPercent', 20), make('b', 'addPercent', 30), make('c', 'multiplyPercent', 50), make('d', 'multiply', 2)];
  const forward = aggregateValues(100, effects);
  const reverse = aggregateValues(100, [...effects].reverse());
  close(forward, reverse);
  close(forward, 450);
});

test('duplicate EffectSpec ids are ignored and reported', () => {
  const state = createState();
  const spec = getFactionEffectSpecs(FACTIONS[0].upgrades.find(u => u.code === 'FR2'))[0];
  const mods = createModifiers();
  const aggregator = new EffectAggregator(state);
  aggregator.run([spec, spec], mods);
  assert.equal(mods.buildingAdd.farm, 10000);
  assert.equal(aggregator.warnings.length, 1);
});

test('vertical slice exposes sources and abdication clears old buffs', () => {
  const state = createState();
  state.coins = 1e9;
  state.upgrades.push('fairy-1', 'fairy-2', 'farm-1');
  state.buildings.farm = 5;
  const snapshot = computeSnapshot(state);
  assert.equal(snapshot.mods.buildingBaseAdd.farm, 98);
  assert.equal(snapshot.mods.buildingAdd.farm, 10100);
  assert.ok(snapshot.sources.some(s => s.source === 'fairy-1'));
  assert.ok(snapshot.sources.some(s => s.source === 'fairy-2'));
  assert.ok(snapshot.sources.some(s => s.source === 'farm-1'));
  const next = abdicate(state);
  const reset = computeSnapshot(next);
  assert.equal(reset.mods.buildingBaseAdd.farm, undefined);
  assert.equal(reset.mods.buildingAdd.farm, undefined);
  assert.equal(reset.sources.length, 0);
});

test('Ascension context reaches Grand Balance instead of forcing A to zero', () => {
  const state = createState();
  state.alignment = 'neutral';
  state.faction = 'druid';
  state.buildings.farm = 100;
  state.buildings.inn = 50;
  state.buildings.blacksmith = 25;
  state.activeSpells.grandBalance = 20;
  state.balanceTarget = 'farm';
  const a0 = computeSnapshot(state).mods.buildingAdd.farm;
  state.progression.ascension = 1;
  const a1 = computeSnapshot(state).mods.buildingAdd.farm;
  close(a1 / a0, (3 / 4) ** (6 * 0.9));
});

test('save normalization is idempotent and does not restore derived values', () => {
  const state = createState();
  state.upgrades.push('farm-1');
  const once = normalizeState(JSON.parse(JSON.stringify(state)));
  const twice = normalizeState(JSON.parse(JSON.stringify(once)));
  assert.deepEqual(twice.buildings, once.buildings);
  assert.deepEqual(twice.upgrades, once.upgrades);
  assert.deepEqual(twice.progression, once.progression);
  assert.equal(twice.revision, once.revision);
});
