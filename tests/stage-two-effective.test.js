import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT } from '../src/content/index.js';
import { compileContentGraph, evaluateCondition } from '../src/systems/content-registry.js';
import { computeDerived } from '../src/systems/derived.js';
import { createSaveState } from '../src/systems/state.js';
import { evaluateFormula } from '../src/systems/formula.js';
import {
  effectiveAssistants, effectiveBuildingCount, effectiveClicksR, elvenDiplomacyBonus,
  originalTrophyCount, spellCost,
} from '../src/systems/effective.js';

const graph = compileContentGraph(CONTENT);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

test('golden 8: EL7 changes only the effective R click input', () => {
  const state = createSaveState();
  state.stats.run.factionCoins = Math.exp(10) - 1;
  state.stats.r.clicks = 1000;
  state.owned.run['elven-7'] = true;
  close(elvenDiplomacyBonus(state), 21.188063169341312);
  close(effectiveClicksR(state), 1211.880631693413);
  assert.equal(state.stats.r.clicks, 1000);
});

test('golden 9: UD7 production and formulas use effective buildings while gates stay raw', () => {
  const state = createSaveState();
  state.buildings.farm = 100;
  state.owned.run['undead-7'] = true;
  assert.equal(effectiveBuildingCount(state, graph, 'farm'), 175);
  assert.equal(computeDerived(state, graph).outputs.farm, 350);
  const raw150Gate = graph.definitionsById.get('farm-tier4').visible;
  assert.equal(evaluateCondition(graph, raw150Gate, { state, derived: {} }), false);
  close(evaluateFormula('25 + (0.3 * x) ^ 0.975', { x: 175 }), 72.55052549536839);
  assert.equal(state.buildings.farm, 100);
});

test('golden 10: DM7 doubles only the current highest three tiers and DM2 does not', () => {
  const state = createSaveState();
  state.selections.alignment = 'evil';
  state.buildings.hellPortal = 100;
  state.buildings.evilFortress = 100;
  state.buildings.hallOfLegends = 100;
  state.buildings.farm = 100;
  state.owned.run['demon-2'] = true;
  for (const id of ['hallOfLegends', 'hellPortal', 'evilFortress']) assert.equal(effectiveBuildingCount(state, graph, id), 100);
  state.owned.run['demon-7'] = true;
  for (const id of ['hallOfLegends', 'hellPortal', 'evilFortress']) assert.equal(effectiveBuildingCount(state, graph, id), 200);
  assert.equal(effectiveBuildingCount(state, graph, 'farm'), 100);
  assert.equal(state.buildings.hellPortal, 100);
});

test('golden 4: Fairy Choir triples effective assistants only after purchase and during Fairy Chanting', () => {
  const state = createSaveState();
  assert.equal(effectiveAssistants(state, 50), 50);
  state.owned.run.fairyChoirUpgrade = true;
  assert.equal(effectiveAssistants(state, 50), 50);
  state.timers.spells.fairyChanting = { dueAt: 10 };
  assert.equal(effectiveAssistants(state, 50), 150);
  assert.equal(state.timers.spells.fairyChanting.dueAt, 10);
});

test('golden 6: AN8 and Greed Drive apply spell cost modifiers in the original order', () => {
  const state = createSaveState();
  const tax = { id: 'taxCollection' };
  const greed = { id: 'goblinsGreed' };
  state.owned.run.greedDriveUpgrade = true;
  state.timers.spells.goblinsGreed = { dueAt: 8 };
  assert.equal(spellCost(state, tax, 200), 180);
  state.owned.run['angel-8'] = true;
  assert.equal(spellCost(state, tax, 200), 90);
  assert.equal(spellCost(state, greed, 400), 200);
  delete state.timers.spells.goblinsGreed;
  assert.equal(spellCost(state, tax, 200), 100);
});

test('golden 14 fixture: custom trophies never enter original TrophyCount', () => {
  const template = CONTENT.definitions.find(item => item.kind === 'trophy');
  const originals = Array.from({ length: 100 }, (_, index) => ({
    ...template, id: `trophy.original_fixture_${index}`, rewardId: `trophy.original_fixture_${index}`,
    originalTrophy: true, effects: [], reactions: [],
  }));
  const customGraph = compileContentGraph({ packs: CONTENT.packs, definitions: [...CONTENT.definitions, ...originals] });
  const state = createSaveState();
  for (const definition of originals) state.permanentUnlocks[definition.id] = true;
  state.permanentUnlocks['trophy.intro.first_day'] = true;
  assert.equal(originalTrophyCount(state, customGraph), 100);
  assert.equal(computeDerived(state, customGraph).originalTrophies, 100);
});
