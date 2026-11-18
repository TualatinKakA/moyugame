import { evaluateFormula } from './formula.js';
import { pathValue } from './content-registry.js';
import { reincarnationPower } from './progression.js';

const PHASES = ['raw', 'assistants', 'mana', 'buildingBase', 'buildingLocal', 'global', 'factionCoin', 'click', 'utility'];
const buildings = graph => graph.arraysByKind.get('building') || [];
const owned = (state, definition) => definition.kind === 'trophy' ? state.permanentUnlocks[definition.id]
  : definition.kind === 'challenge' ? state.challenges[definition.id]?.completed
    : definition.kind === 'spell' ? (() => {
    const timer = state.timers.spells[definition.id];
    return Boolean(timer && (timer.dueAt !== undefined ? timer.dueAt > state.stats.run.time : timer.remaining > 0));
  })()
    : state.owned[definition.scope]?.[definition.id] || (definition.scope === 'total' && state.permanentUnlocks[definition.id]);

function resolvePath(path, state, graph, target, derived, buildingOverrides = {}) {
  const count = id => buildingOverrides[id] ?? state.buildings[id] ?? 0;
  if (path.startsWith('derived.')) return derived?.[path.slice(8)] || 0;
  if (path === 'target.count') return count(target?.id);
  if (path === 'buildings.total') return buildings(graph).reduce((sum, item) => sum + count(item.id), 0);
  if (path === 'buildings.low3') return ['farm', 'inn', 'blacksmith'].reduce((sum, id) => sum + count(id), 0);
  if (path.startsWith('buildings.alignment.')) {
    const alignment = path.slice(20);
    return buildings(graph).filter(item => item.alignment === alignment).reduce((sum, item) => sum + count(item.id), 0);
  }
  if (path.startsWith('buildings.')) return count(path.slice(10));
  if (path === 'factionCoins.total') return Object.values(state.resources.factionCoins).reduce((sum, value) => sum + value, 0);
  if (path.startsWith('resources.')) return pathValue(state, path) || 0;
  return pathValue(state, path) || 0;
}

function targetsFor(effect, state, graph) {
  if (effect.target.type === 'buildings') return effect.target.ids;
  if (effect.target.type === 'allBuildings') return buildings(graph).map(item => item.id);
  if (effect.target.type === 'alignment') return buildings(graph).filter(item => item.alignment === effect.target.id).map(item => item.id);
  return [null];
}
function add(record, id, value) { record[id] = (record[id] || 0) + value; }
function multiply(record, id, value) { record[id] = (record[id] || 1) * value; }
function percentFactor(operation, value) { return operation === 'multiplyPercent' ? 1 + value / 100 : 1 + value / 100; }

function createModifiers() {
  return {
    globalAdd: 0, globalMult: 1, buildingAdd: {}, buildingMult: {}, buildingBaseAdd: {}, buildingCostAdd: 0,
    assistantsAdd: 0, manaMaxAdd: 0, manaRegenAdd: 0, clickAdd: 0, clickMult: 1, taxSecondsAdd: 0, gemPowerAdd: 0,
  };
}
function applyEffect(mods, effect, amount, targetId) {
  const additive = ['add', 'addPercent'].includes(effect.operation);
  if (effect.stat === 'global.production') {
    if (additive) mods.globalAdd += amount; else mods.globalMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'building.production') {
    if (additive) add(mods.buildingAdd, targetId, amount); else multiply(mods.buildingMult, targetId, percentFactor(effect.operation, amount));
  } else if (effect.stat === 'building.baseProduction') add(mods.buildingBaseAdd, targetId, amount);
  else if (effect.stat === 'building.costMultiplier') mods.buildingCostAdd += amount;
  else if (effect.stat === 'assistants.count') mods.assistantsAdd += amount;
  else if (effect.stat === 'mana.max') mods.manaMaxAdd += amount;
  else if (effect.stat === 'mana.regen') mods.manaRegenAdd += amount;
  else if (effect.stat === 'click.reward') {
    if (additive) mods.clickAdd += amount; else mods.clickMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'taxCollection.seconds') mods.taxSecondsAdd += amount;
  else if (effect.stat === 'gem.power') mods.gemPowerAdd += amount;
  else throw new Error(`Unknown derived effect stat ${effect.stat}`);
}

export function computeDerived(state, graph, groupCache = new Map(), buildingOverrides = {}) {
  const mods = createModifiers();
  const power = reincarnationPower(state.progression.reincarnations);
  mods.globalAdd += power.productionPercent;
  mods.manaRegenAdd += power.manaRegenAdd;
  const entries = [];
  for (const definition of graph.definitions) {
    if (!owned(state, definition)) continue;
    for (const effect of definition.effects || []) entries.push({ definition, effect });
  }
  entries.sort((a, b) => PHASES.indexOf(a.effect.phase) - PHASES.indexOf(b.effect.phase)
    || a.effect.group.localeCompare(b.effect.group) || a.definition.id.localeCompare(b.definition.id));
  for (const { definition, effect } of entries) {
    for (const targetId of targetsFor(effect, state, graph)) {
      const target = targetId ? graph.definitionsById.get(targetId) : null;
      const cacheKey = `${effect.group}|${targetId || 'global'}`;
      let amount = groupCache.get(cacheKey);
      if (amount === undefined) {
        const variables = Object.fromEntries(Object.entries(effect.value.variables || {}).map(([name, path]) => [name, resolvePath(path, state, graph, target, null, buildingOverrides)]));
        amount = effect.value.constant !== undefined ? Number(effect.value.constant)
          : evaluateFormula(effect.value.formula, variables, { contentId: definition.id, phase: effect.phase });
        if (!Number.isFinite(amount)) throw new Error(`Non-finite effect ${definition.id}/${effect.group}`);
        groupCache.set(cacheKey, amount);
      }
      applyEffect(mods, effect, amount, targetId);
    }
  }
  const outputs = {};
  const gemPowerMultiplier = 1 + state.resources.gems * mods.gemPowerAdd / 100;
  const globalMult = (1 + mods.globalAdd / 100) * mods.globalMult * gemPowerMultiplier;
  let buildingProduction = 0;
  for (const definition of buildings(graph)) {
    const count = buildingOverrides[definition.id] ?? state.buildings[definition.id] ?? 0;
    const base = definition.production + (mods.buildingBaseAdd[definition.id] || 0);
    const output = count * base * (1 + (mods.buildingAdd[definition.id] || 0) / 100) * (mods.buildingMult[definition.id] || 1) * globalMult;
    outputs[definition.id] = output;
    buildingProduction += output;
  }
  const assistants = Math.floor(mods.assistantsAdd);
  const production = buildingProduction + assistants;
  const gemFactionCoinChance = mods.gemPowerAdd > 0
    ? Math.floor(1.25 * Math.log(1 + state.resources.gems) ** 0.9 / Math.log(10))
    : 0;
  return Object.freeze({
    outputs, production, buildingProduction, assistants,
    clickReward: Math.max(1, (1 + mods.clickAdd / 100) * mods.clickMult),
    manaMax: Math.max(1, 1000 + mods.manaMaxAdd), manaRegen: Math.max(0, 1 + mods.manaRegenAdd),
    fcChance: 10 + power.factionCoinChanceAdd + gemFactionCoinChance, taxSeconds: Math.max(0, 30 + mods.taxSecondsAdd),
    offlineMultiplier: power.offlineMultiplier,
    buildingCostMultiplier: Math.max(1.01, 1.15 + mods.buildingCostAdd),
  });
}

export class RuntimeCache {
  constructor(state, graph) {
    this.state = state; this.graph = graph; this.snapshot = null; this.effectCache = new Map();
    this.stats = { hits: 0, misses: 0, invalidations: 0, effectGroupsInvalidated: 0 };
  }
  invalidate(changedPaths) {
    let dirty = false;
    const groups = new Set();
    for (const path of changedPaths) {
      if (/^(buildings|owned|permanentUnlocks|timers\.spells|selections|resources\.(factionCoins|gems)|progression)/.test(path)) dirty = true;
      for (const dependency of [path, 'buildings', 'owned', 'permanentUnlocks', 'timers.spells', 'resources.factionCoins']) {
        if (dependency !== path && !path.startsWith(`${dependency}.`)) continue;
        for (const group of this.graph.effectDependencies.get(dependency) || []) groups.add(group);
      }
    }
    for (const group of groups) {
      for (const key of this.effectCache.keys()) if (key.startsWith(`${group}|`)) this.effectCache.delete(key);
    }
    this.stats.effectGroupsInvalidated += groups.size;
    if (dirty || groups.size) { this.snapshot = null; this.stats.invalidations++; }
    return dirty || groups.size > 0;
  }
  get() {
    if (this.snapshot) { this.stats.hits++; return this.snapshot; }
    this.stats.misses++;
    this.snapshot = computeDerived(this.state, this.graph, this.effectCache);
    return this.snapshot;
  }
  rebuild() { this.effectCache.clear(); this.snapshot = computeDerived(this.state, this.graph, this.effectCache); return this.snapshot; }
}
