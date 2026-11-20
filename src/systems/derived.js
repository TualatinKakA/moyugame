import { evaluateFormula } from './formula.js';
import { evaluateCondition, pathValue } from './content-registry.js';
import { reincarnationPower } from './progression.js';
import { royalExchangeBonus, royalExchangeCount, royalExchangeMultiplier } from './royal-market.js';
import {
  currentTierBuildingId, effectiveAssistants, effectiveBuildingCount, effectiveClicksR,
  effectiveOfflineTime, effectiveSpellActivity, highestThreeBuildingIds, isSpellActive, longestSpellDuration,
  nightTimeActivityR, originalTrophyCount,
} from './effective.js';

const PHASES = ['raw', 'assistants', 'mana', 'buildingBase', 'buildingLocal', 'tax', 'global', 'factionCoin', 'click', 'utility'];
const buildings = graph => graph.arraysByKind.get('building') || [];
const owned = (state, definition) => definition.kind === 'trophy' ? state.permanentUnlocks[definition.id]
  : definition.kind === 'challenge' ? state.challenges[definition.id]?.completed
    : definition.kind === 'spell' ? isSpellActive(state, definition.id)
    : state.owned[definition.scope]?.[definition.id] || (definition.scope === 'total' && state.permanentUnlocks[definition.id]);

export function resolveValuePath(path, { state, graph, target = null, derived = {}, buildingOverrides = {} }) {
  const count = id => effectiveBuildingCount(state, graph, id, buildingOverrides[id] ?? state.buildings[id] ?? 0);
  if (path === 'target.count') return target ? count(target.id) : 0;
  if (path === 'buildings.total') return buildings(graph).reduce((sum, item) => sum + count(item.id), 0);
  if (path === 'buildings.low3') return ['farm', 'inn', 'blacksmith'].reduce((sum, id) => sum + count(id), 0);
  if (path === 'trophies.original') return originalTrophyCount(state, graph);
  if (path === 'effective.r.clicks') return effectiveClicksR(state);
  if (path === 'derived.activeSpells') return (graph.arraysByKind.get('spell') || []).filter(item => isSpellActive(state, item.id)).length;
  if (path === 'derived.longestSpellDuration') return longestSpellDuration(state, graph, derived);
  if (path === 'derived.nightTimeActivity') return nightTimeActivityR(state);
  if (path.startsWith('derived.')) return pathValue(derived, path.slice(8)) || 0;
  const tierMatch = path.match(/^buildings\.tier(\d+)$/);
  if (tierMatch) {
    const id = currentTierBuildingId(state, graph, Number(tierMatch[1]));
    return id ? count(id) : 0;
  }
  if (path.startsWith('buildings.alignment.')) {
    const alignment = path.slice(20);
    return buildings(graph).filter(item => item.alignment === alignment).reduce((sum, item) => sum + count(item.id), 0);
  }
  if (path.startsWith('buildings.')) return count(path.slice(10));
  if (path === 'factionCoins.total') return Object.values(state.resources.factionCoins).reduce((sum, value) => sum + value, 0);
  if (path.startsWith('rawStats.')) return pathValue(state, `stats.${path.slice(9)}`) || 0;
  if (path === 'stats.r.buildingMax.tier10') {
    const id = currentTierBuildingId(state, graph, 10);
    return id ? state.stats.r.buildingMax[id] || 0 : 0;
  }
  if (path === 'stats.r.evilSpellsCast') {
    return (graph.arraysByKind.get('spell') || []).filter(item => item.alignment === 'evil')
      .reduce((sum, item) => sum + (state.stats.r.spellCasts[item.id] || 0), 0);
  }
  const maximumActivity = path.match(/^stats\.(run|r|ascension|total)\.maxSpellActivity$/);
  if (maximumActivity) {
    const scope = maximumActivity[1];
    return Object.keys(state.stats[scope].spellActivity).reduce((max, id) => Math.max(max, effectiveSpellActivity(state, scope, id)), 0);
  }
  const activity = path.match(/^stats\.(run|r|ascension|total)\.spellActivity\.([^.]+)$/);
  if (activity) return effectiveSpellActivity(state, activity[1], activity[2]);
  const offline = path.match(/^stats\.(run|r|ascension|total)\.offlineTime$/);
  if (offline) return effectiveOfflineTime(state, offline[1]);
  if (path.startsWith('resources.')) return pathValue(state, path) || 0;
  return pathValue(state, path) || 0;
}

function targetsFor(effect, state, graph) {
  if (effect.target.type === 'buildings') return effect.target.ids;
  if (effect.target.type === 'allBuildings') return buildings(graph).map(item => item.id);
  if (effect.target.type === 'otherBuildings') return buildings(graph).filter(item => item.id !== effect.target.id).map(item => item.id);
  if (effect.target.type === 'alignment') return buildings(graph).filter(item => item.alignment === effect.target.id).map(item => item.id);
  if (effect.target.type === 'tier') {
    const id = currentTierBuildingId(state, graph, effect.target.id);
    return id ? [id] : [];
  }
  if (effect.target.type === 'highestThree') return highestThreeBuildingIds(state, graph);
  if (effect.target.type === 'hellfire') return [
    'evilFortress', ...(state.owned.run.hellRushUpgrade ? ['hellPortal', 'hallOfLegends'] : []),
  ];
  return [null];
}
function add(record, id, value) { record[id] = (record[id] || 0) + value; }
function multiply(record, id, value) { record[id] = (record[id] || 1) * value; }
function percentFactor(operation, value) { return operation === 'multiply' ? value : 1 + value / 100; }

function createModifiers() {
  return {
    globalAdd: 0, globalMult: 1, buildingAdd: {}, buildingMult: {}, buildingBaseAdd: {}, buildingCostAdd: 0, buildingCostAddById: {},
    assistantsAdd: 0, assistantsMult: 1, assistantProdAdd: 0, assistantProdMult: 1, assistantFcMult: 1,
    manaMaxAdd: 0, manaRegenAdd: 0, manaRegenMult: 1, clickBaseAdd: 0, clickAdd: 0, clickMult: 1,
    taxSecondsAdd: 0, gemPowerAdd: 0, gemPowerMult: 1, offlineAdd: 0, offlineMult: 1, offlineFcMult: 1,
    fcChanceAdd: 0, fcChanceMult: 1, hallPrestigeAdd: 0,
  };
}
function applyEffect(mods, effect, amount, targetId) {
  const additive = ['add', 'addPercent'].includes(effect.operation);
  if (effect.stat === 'global.production') {
    if (additive) mods.globalAdd += amount; else mods.globalMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'building.production') {
    if (additive) add(mods.buildingAdd, targetId, amount); else multiply(mods.buildingMult, targetId, percentFactor(effect.operation, amount));
  } else if (effect.stat === 'building.baseProduction') add(mods.buildingBaseAdd, targetId, amount);
  else if (effect.stat === 'hall.prestige') mods.hallPrestigeAdd += amount;
  else if (effect.stat === 'building.costMultiplier') {
    if (targetId) add(mods.buildingCostAddById, targetId, amount); else mods.buildingCostAdd += amount;
  } else if (effect.stat === 'assistants.count') {
    if (effect.operation === 'add') mods.assistantsAdd += amount; else mods.assistantsMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'assistants.production') {
    if (effect.operation === 'addPercent') mods.assistantProdAdd += amount; else mods.assistantProdMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'assistants.factionCoin') {
    mods.assistantFcMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else if (effect.stat === 'mana.max') mods.manaMaxAdd += amount;
  else if (effect.stat === 'mana.regen') {
    if (effect.operation === 'add') mods.manaRegenAdd += amount;
    else mods.manaRegenMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else if (effect.stat === 'click.base') mods.clickBaseAdd += amount;
  else if (effect.stat === 'click.reward') {
    if (additive) mods.clickAdd += amount; else mods.clickMult *= percentFactor(effect.operation, amount);
  } else if (effect.stat === 'taxCollection.seconds') mods.taxSecondsAdd += amount;
  else if (effect.stat === 'gem.power') {
    if (additive) mods.gemPowerAdd += amount;
    else mods.gemPowerMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else if (effect.stat === 'offline.production') {
    if (additive) mods.offlineAdd += amount;
    else mods.offlineMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else if (effect.stat === 'offline.factionCoin') {
    mods.offlineFcMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else if (effect.stat === 'factionCoin.chance') {
    if (additive) mods.fcChanceAdd += amount;
    else mods.fcChanceMult *= effect.operation === 'multiply' ? amount : percentFactor(effect.operation, amount);
  } else throw new Error(`Unknown derived effect stat ${effect.stat}`);
}

export function getEffectiveGems(state) {
  return state.resources.gems;
}

export function getGemBonus() {
  return 0;
}

export function computeDerived(state, graph, groupCache = new Map(), buildingOverrides = {}) {
  const mods = createModifiers();
  const power = reincarnationPower(state.progression.reincarnations);
  mods.globalAdd += power.productionPercent;
  mods.manaRegenAdd += power.manaRegenAdd;
  const context = {};
  let globalMult = 1;
  for (const phase of PHASES) {
    for (const { definition, effect } of graph.effectEntriesByPhase.get(phase) || []) {
      if (!owned(state, definition)) continue;
      if (effect.when && !evaluateCondition(graph, effect.when, { state, derived: context })) continue;
      for (const targetId of targetsFor(effect, state, graph)) {
        const target = targetId ? graph.definitionsById.get(targetId) : null;
        const cacheKey = `${effect.group}|${targetId || 'global'}`;
        const derivedPaths = [...new Set(Object.values(effect.value.variables || {}).filter(path => path.startsWith('derived.')))];
        const fingerprint = derivedPaths.map(path => `${path}:${resolveValuePath(path, { state, graph, target, derived: context, buildingOverrides })}`).join('|');
        const cached = groupCache.get(cacheKey);
        let amount;
        if (cached && cached.fingerprint === fingerprint) amount = cached.value;
        else {
          const variables = Object.fromEntries(Object.entries(effect.value.variables || {}).map(([name, path]) => [
            name, resolveValuePath(path, { state, graph, target, derived: context, buildingOverrides }),
          ]));
          amount = effect.value.constant !== undefined ? Number(effect.value.constant)
            : evaluateFormula(effect.value.formula, variables, { contentId: definition.id, phase: effect.phase });
          if (!Number.isFinite(amount)) throw new Error(`Non-finite effect ${definition.id}/${effect.group}`);
          groupCache.set(cacheKey, { fingerprint, value: amount });
        }
        applyEffect(mods, effect, amount, targetId);
      }
    }
    if (phase === 'assistants') {
      context.realAssistants = Math.max(0, Math.floor(mods.assistantsAdd * mods.assistantsMult));
      context.assistants = effectiveAssistants(state, context.realAssistants);
    }
    if (phase === 'mana') {
      context.manaMax = Math.max(1, 1000 + mods.manaMaxAdd);
      context.manaRegen = state.settings.manaRegenOverride ?? Math.max(0, (1 + mods.manaRegenAdd) * mods.manaRegenMult);
    }
    if (phase === 'tax') context.taxSeconds = Math.max(0, 30 + mods.taxSecondsAdd);
    if (phase === 'global') {
      const outputs = {};
      const unitOutputs = {};
      const gemPowerMultiplier = (1 + getEffectiveGems(state) * mods.gemPowerAdd / 100) * mods.gemPowerMult;
      globalMult = (1 + mods.globalAdd / 100) * mods.globalMult * gemPowerMultiplier * royalExchangeMultiplier(state);
      let buildingProduction = 0;
      const rawBuildingTotal = buildings(graph).reduce((sum, item) => sum + (buildingOverrides[item.id] ?? state.buildings[item.id] ?? 0), 0);
      const rawHallCount = buildingOverrides.hallOfLegends ?? state.buildings.hallOfLegends ?? 0;
      const hallPrestigeMultiplier = 1 + 0.01 * mods.hallPrestigeAdd * Math.max(0, rawBuildingTotal - rawHallCount);
      context.hallBaseProduction = (250000 + (mods.buildingBaseAdd.hallOfLegends || 0)) * originalTrophyCount(state, graph);
      context.hallPrestigeMultiplier = hallPrestigeMultiplier;
      for (const definition of buildings(graph)) {
        const count = effectiveBuildingCount(state, graph, definition.id, buildingOverrides[definition.id] ?? state.buildings[definition.id] ?? 0);
        const base = definition.id === 'hallOfLegends'
          ? context.hallBaseProduction
          : definition.production + (mods.buildingBaseAdd[definition.id] || 0);
        const prestige = definition.id === 'hallOfLegends' ? hallPrestigeMultiplier : 1;
        const unitOutput = base * (1 + (mods.buildingAdd[definition.id] || 0) / 100) * (mods.buildingMult[definition.id] || 1) * prestige * globalMult;
        const output = count * unitOutput;
        unitOutputs[definition.id] = unitOutput;
        outputs[definition.id] = output;
        buildingProduction += output;
      }
      Object.assign(context, { outputs, unitOutputs, buildingProduction, globalMult });
    }
    if (phase === 'factionCoin') {
      const gemChance = mods.gemPowerAdd > 0
        ? Math.floor(0.5 * (1.25 + getGemBonus() / 4) * Math.log(1 + getEffectiveGems(state)) ** 0.9)
        : 0;
      context.fcChance = (10 + gemChance + mods.fcChanceAdd) * mods.fcChanceMult;
    }
    if (phase === 'click') context.clickReward = Math.max(1, (1 + mods.clickBaseAdd) * (1 + mods.clickAdd / 100) * mods.clickMult);
  }
  const { outputs, unitOutputs, buildingProduction, assistants, realAssistants, clickReward, taxSeconds, manaMax, manaRegen } = context;
  const assistantProduction = Math.max(0, assistants * clickReward * 0.05
    * (1 + mods.assistantProdAdd / 100) * mods.assistantProdMult * globalMult);
  const production = buildingProduction + assistantProduction;
  return Object.freeze({
    outputs, unitOutputs, production, buildingProduction, assistantProduction, assistants, realAssistants, clickReward,
    manaMax, manaRegen, manaPerSecond: manaRegen,
    fcChance: context.fcChance, taxSeconds,
    assistantFactionCoinMultiplier: mods.assistantFcMult,
    offlineFactionCoinMultiplier: mods.offlineFcMult,
    originalTrophies: originalTrophyCount(state, graph),
    exchangeCount: royalExchangeCount(state), exchangeBonus: royalExchangeBonus(state), exchangeMultiplier: royalExchangeMultiplier(state),
    hallBaseProduction: context.hallBaseProduction || 0, hallPrestigeMultiplier: context.hallPrestigeMultiplier || 1,
    globalMult: context.globalMult || 1,
    offlineMultiplier: power.offlineMultiplier * (1 + mods.offlineAdd / 100) * mods.offlineMult,
    buildingCostMultiplier: Math.max(1.01, 1.15 + mods.buildingCostAdd),
    buildingCostMultipliers: Object.fromEntries(buildings(graph).map(definition => [definition.id,
      Math.max(1.01, 1.15 + mods.buildingCostAdd + (mods.buildingCostAddById[definition.id] || 0)),
    ])),
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
      if (/^(buildings|royalExchange|owned|permanentUnlocks|timers\.spells|selections|resources\.(factionCoins|gems)|progression|settings\.manaRegenOverride)/.test(path)) dirty = true;
      const parents = [];
      let parentPath = path;
      while (parentPath.includes('.')) { parentPath = parentPath.slice(0, parentPath.lastIndexOf('.')); parents.push(parentPath); }
      for (const dependency of [path, ...parents, 'buildings', 'owned', 'permanentUnlocks', 'timers.spells', 'resources.factionCoins']) {
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
