import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph, evaluateCondition } from '../src/systems/content-registry.js';
import { computeDerived } from '../src/systems/derived.js';
import { createSaveState } from '../src/systems/state.js';
import { evaluateFormula } from '../src/systems/formula.js';
import { parseCsv } from './csv.js';

const graph = compileContentGraph(CONTENT);
const close = (actual, expected, label = '') => {
  const tolerance = 1e-11 * Math.max(1, Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} != ${expected}`);
};

function originalTrophyFixture(count) {
  const template = CONTENT.definitions.find(item => item.kind === 'trophy');
  const definitions = Array.from({ length: count }, (_, index) => ({
    ...template, id: `trophy.hall_fixture_${index}`, rewardId: `trophy.hall_fixture_${index}`,
    originalTrophy: true, effects: [], reactions: [],
  }));
  const fixtureGraph = compileContentGraph({ packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...definitions] });
  const state = createSaveState();
  state.selections.alignment = 'good';
  for (const definition of definitions) state.permanentUnlocks[definition.id] = true;
  return { state, graph: fixtureGraph };
}

test('all 414 numbered facility upgrades match the authoritative CSV ids names tiers gates costs and assistants', async () => {
  const rows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/facilities-and-upgrades-414.csv', import.meta.url), 'utf8'))
    .filter(row => row['记录类型'] === 'numbered-upgrade');
  const definitions = CONTENT.definitions.filter(item => item.kind === 'upgrade' && item.ui.category === 'building');
  assert.equal(rows.length, 414);
  assert.equal(definitions.length, 414);
  for (const row of rows) {
    const id = row['内容ID'];
    const definition = graph.definitionsById.get(id);
    assert.ok(definition, id);
    assert.equal(definition.sourceName, row['名称'], `${id} source name`);
    assert.equal(definition.tier, Number(row['Tier']), `${id} tier`);
    const gate = definition.visible.all?.find(condition => condition.op === 'buildingOwned');
    assert.equal(gate.id, definition.buildingId, `${id} gate building`);
    assert.equal(gate.value, Number(row['条件'].match(/>=\s*(\d+)/)?.[1] || row['条件'].match(/(\d+)/)[1]), `${id} raw requirement`);
    const assistants = definition.effects.filter(effect => effect.stat === 'assistants.count').reduce((sum, effect) => sum + effect.value.constant, 0);
    assert.equal(assistants, Number(row['Assistant奖励'] || 0), `${id} assistants`);
    for (const ascension of [0, 1, 2]) {
      const csvCost = row[`成本A${ascension}`];
      if (!csvCost || !Number.isFinite(Number(csvCost))) continue;
      const state = createSaveState();
      state.progression.ascension = ascension;
      const derived = computeDerived(state, graph);
      const cost = definition.purchase.costs.find(item => item.when && evaluateCondition(graph, item.when, { state, derived }))
        || definition.purchase.costs.find(item => !item.when && Number(item.amount.constant) === Number(csvCost));
      assert.ok(cost, `${id} A${ascension} cost definition`);
      const actual = cost.amount.constant !== undefined ? Number(cost.amount.constant) : evaluateFormula(cost.amount.formula, {});
      close(actual, Number(csvCost), `${id} A${ascension} cost`);
    }
  }
});

test('Hall body and six bonuses match their CSV costs and use the shared red cross', async () => {
  const facilityRows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/facilities-and-upgrades-414.csv', import.meta.url), 'utf8'));
  const hall = graph.definitionsById.get('hallOfLegends');
  const row = facilityRows.find(item => item['记录类型'] === 'facility' && item['内容ID'] === 'hallOfLegends');
  assert.equal(hall.tier, 11);
  assert.equal(hall.purchase.costs[0].amount.constant, Number(row['成本']));
  assert.equal(hall.ui.icon, 'assets/images/content-icons/red-cross.svg');
  const bonusRows = parseCsv(await readFile(new URL('../original_verification/remaining_1.1.0/data/hall-bonus-6.csv', import.meta.url), 'utf8'));
  assert.equal(bonusRows.length, 6);
  for (const bonusRow of bonusRows) {
    const definition = graph.definitionsById.get(bonusRow['内容ID']);
    assert.ok(definition);
    assert.equal(definition.purchase.costs[0].amount.constant, Number(bonusRow['成本']));
    assert.equal(definition.ui.icon, 'assets/images/content-icons/red-cross.svg');
    assert.ok(definition.effects.length > 0, `${definition.id} has a real effect`);
  }
});

test('golden 14: Hall base production uses exactly 100 original trophies', () => {
  const { state, graph: fixtureGraph } = originalTrophyFixture(100);
  state.buildings.hallOfLegends = 1;
  state.permanentUnlocks['trophy.intro.first_day'] = true;
  const derived = computeDerived(state, fixtureGraph);
  assert.equal(derived.originalTrophies, 100);
  assert.equal(derived.unitOutputs.hallOfLegends, 25000000);
  assert.equal(derived.outputs.hallOfLegends, 25000000);
});

test('Hall numbered upgrades apply owned group powers to Hall and trophy powers to every other building', () => {
  const { state, graph: fixtureGraph } = originalTrophyFixture(100);
  state.buildings.hallOfLegends = 1;
  state.buildings.farm = 1;
  state.owned.run['hallOfLegends-tier1'] = true;
  state.owned.run['hallOfLegends-tier2'] = true;
  const derived = computeDerived(state, fixtureGraph);
  close(derived.unitOutputs.hallOfLegends, 25000000 * 1.75 ** 2);
  close(derived.outputs.farm, 2 * 1.25 ** 2);
});

test('Hall bonuses 1-3 aggregate S once and bonuses 4-6 remain independent multipliers', () => {
  const { state, graph: fixtureGraph } = originalTrophyFixture(100);
  state.buildings.hallOfLegends = 750;
  state.buildings.farm = 10;
  state.owned.run.hallBonus1 = true;
  state.owned.run.hallBonus4 = true;
  let derived = computeDerived(state, fixtureGraph);
  close(derived.unitOutputs.hallOfLegends, 100000000 * 8.5 * 2);
  state.owned.run.hallBonus2 = true;
  derived = computeDerived(state, fixtureGraph);
  close(derived.unitOutputs.hallOfLegends, 300000000 * 23.5 * 2);
});
