import { BUILDINGS } from '../content/r0r3/buildings.js';
import FACTIONS from '../content/r0r3/factions.js';
import BUILDING_UPGRADES from '../content/r0r3/building-upgrades.js';
import { MISC_BY_ID } from '../content/r0r3/misc-upgrades.js';
import { SPELL_BY_ID } from '../content/r0r3/spells.js';
import { getFactionEffectSpecs } from '../content/r0r3/effect-specs.js';
import { achievementEffectSpecs } from '../content/achievements/effect-specs.js';
import { evaluateFormula } from './formula.js';
import { hasTrophy, getTrophyCount } from './achievements.js';

export const EFFECT_PHASES = Object.freeze(['raw', 'assistants', 'mana', 'buildingBase', 'buildingLocal', 'global', 'factionCoin', 'click', 'utility']);
const LOW3 = ['farm', 'inn', 'blacksmith'];
const BUILDING_UPGRADE_BY_ID = Object.fromEntries(BUILDING_UPGRADES.map(u => [u.id, u]));
const FACTION_UPGRADE_BY_ID = Object.fromEntries(FACTIONS.flatMap(f => f.upgrades.map(u => [u.id, u])));

export function createModifiers() {
  return {
    globalAdd: 0, globalMult: 1, buildingAdd: {}, buildingMult: {}, buildingBaseAdd: {},
    buildingCountMult: 1, buildingCountMultById: {}, buildingCostReduceById: {}, timeAdd: 0,
    alignmentAdd: { good: 0, evil: 0, neutral: 0 },
    clickAdd: 0, clickMult: 1, clickProductionShare: 0, clickCountMult: 1,
    assistantsAdd: 0, assistantsMult: 1, assistantProdAdd: 0, assistantProdMult: 1,
    manaMaxAdd: 0, manaMaxMult: 1, manaRegenAdd: 0, manaRegenMult: 1,
    fcChanceAdd: 0, fcChanceMult: 1, fcRewardMult: 1, factionRewardMult: {},
    exchangeAdd: 0, exchangeMult: 1, exchangeCostReduce: 0, exchangeCostReduceByFaction: {},
    buildingCostReduce: 0, excavationCostReduce: 0,
    gemPerGemAdd: 0, gemPowerMult: 1, offlineAdd: 0, offlineMult: 1,
    spellCostMult: 1, spellDurationMult: 1, spellCastCountMult: 1,
    taxSecondsAdd: 0, lightningTarget: null, balanceTarget: null,
    special: new Set(),
  };
}

function addTo(record, key, amount) {
  record[key] = (record[key] || 0) + amount;
}
function multiply(record, key, factor) {
  record[key] = (record[key] || 1) * factor;
}
function factor(operation, amount) {
  return operation === 'multiplyPercent' ? 1 + amount / 100 : amount;
}
function extreme(current, amount, operation) {
  if (operation === 'max') return Math.max(current, amount);
  if (operation === 'min') return Math.min(current, amount);
  return amount;
}
function totalBuildings(state) {
  return Object.values(state.buildings).reduce((sum, count) => sum + count, 0);
}
function alignmentBuildings(state, alignment) {
  return BUILDINGS.filter(b => b.alignment === alignment).reduce((sum, b) => sum + (state.buildings[b.id] || 0), 0);
}

export function aggregateValues(baseValue, effects) {
  const rank = effect => ['add', 'addPercent', 'count'].includes(effect.operation) ? 0
    : ['multiply', 'multiplyPercent'].includes(effect.operation) ? 1 : 2;
  const ordered = [...effects].sort((a, b) => rank(a) - rank(b)
    || `${a.phase}:${a.stackingGroup}:${a.source}:${a.id}`.localeCompare(`${b.phase}:${b.stackingGroup}:${b.source}:${b.id}`));
  let result = baseValue;
  const groups = new Map();
  for (const effect of ordered) {
    const value = effect.resolvedValue;
    if (!Number.isFinite(value)) throw new Error(`Non-finite effect value for ${effect.id}`);
    if (effect.operation === 'add' || effect.operation === 'addPercent' || effect.operation === 'count') result += value;
    else if (effect.operation === 'multiply') result *= value;
    else if (effect.operation === 'multiplyPercent') result *= 1 + value / 100;
    else {
      const previous = groups.get(effect.stackingGroup) ?? result;
      groups.set(effect.stackingGroup, extreme(previous, value, effect.operation));
      result = groups.get(effect.stackingGroup);
    }
  }
  return result;
}

function resolveTargets(target, state) {
  if (!target || target.type === 'global') return [];
  if (target.type === 'building') return [BUILDINGS.find(b => b.id === target.id)].filter(Boolean);
  if (target.type === 'buildings') return target.ids.map(id => BUILDINGS.find(b => b.id === id)).filter(Boolean);
  if (target.type === 'allBuildings') return BUILDINGS;
  if (target.type === 'alignment') return BUILDINGS.filter(b => b.alignment === target.id);
  if (target.type === 'alignmentTier') return BUILDINGS.filter(b => b.alignment === state.alignment && b.tier === target.tier);
  if (target.type === 'alignmentTiers') return BUILDINGS.filter(b => b.alignment === state.alignment && target.tiers.includes(b.tier));
  if (target.type === 'highestTiers') {
    const maxTier = Math.max(...BUILDINGS.filter(b => state.buildings[b.id] > 0).map(b => b.tier), 1);
    return BUILDINGS.filter(b => b.tier >= maxTier - 2);
  }
  if (target.type === 'eachBuilding') return BUILDINGS.filter(b => target.includeUnique !== false || b.id !== 'hallOfLegends');
  throw new Error(`Unknown effect target type: ${target.type}`);
}

function resolvePath(path, state, mods, derived, target) {
  if (path.startsWith('target.')) {
    if (path === 'target.count') return state.buildings[target.id] || 0;
    if (path === 'target.tier') return target.tier;
  }
  if (path.startsWith('derived.')) return derived[path.slice(8)] ?? 0;
  if (path === 'R') return state.progression.reincarnations;
  if (path === 'A') return state.progression.ascension;
  if (path === 'T') return target?.tier || 0;
  if (path === 'coins') return state.coins;
  if (path === 'gems') return state.gems;
  if (path === 'trophies') return getTrophyCount(state);
  if (path === 'activeSpells') return Object.values(state.activeSpells).filter(v => v > 0).length;
  if (path === 'buildings.total') return totalBuildings(state);
  if (path === 'buildings.low3') return LOW3.reduce((sum, id) => sum + (state.buildings[id] || 0), 0);
  if (path === 'buildings.maxTotal.r') return state.stats.r.buildingsMax || 0;
  if (path === 'buildings.maxTotal.total') return state.stats.total.buildingsMax || 0;
  if (path.startsWith('buildings.alignment.')) return alignmentBuildings(state, path.split('.')[2]);
  if (path.startsWith('buildings.max.')) return state.stats.r.buildingMax[path.slice(14)] || 0;
  if (path.startsWith('buildings.topCounts.')) {
    const index = Number(path.split('.')[2]);
    return Object.values(state.buildings).sort((a, b) => b - a)[index] || 0;
  }
  if (path.startsWith('buildings.')) return state.buildings[path.slice(10)] || 0;
  if (path === 'clicks.r') return state.stats.r.clicks || 0;
  if (path === 'clicks.total') return state.stats.total.clicks || 0;
  if (path === 'spells.total') return state.stats.total.spellsCast || 0;
  if (path === 'spells.evilTotal') return state.stats.total.evilSpellsCast || 0;
  if (path === 'comboCasts.total') return state.stats.total.comboCasts || 0;
  if (path === 'factionCoins.total') return state.stats.total.factionCoins || 0;
  if (path.startsWith('factionCoins.')) return state.stats.total.factionCoinsByFaction[path.slice(13)] || 0;
  if (path === 'taxCasts.total') return state.stats.total.taxCasts || 0;
  if (path === 'exchanges.total') return state.stats.total.exchanges || 0;
  if (path === 'excavations.r') return state.stats.r.excavations || 0;
  if (path === 'excavations.total') return state.stats.total.excavations || 0;
  if (path === 'excavationResets') return state.excavationResets || 0;
  if (path === 'taxCollection.seconds') return 30 + mods.taxSecondsAdd;
  if (path === 'time.total') return (state.stats.total.time || 0) + mods.timeAdd;
  if (path === 'time.totalWithUndeadChallenge') return ((state.stats.total.time || 0) + mods.timeAdd) * (state.challenges.includes('undead1') ? 50 : 1);
  if (path === 'time.longestSession.r') return state.stats.r.longestSession || 0;
  if (path.startsWith('time.faction.r.')) return state.stats.r.factionTime[path.split('.')[3]] || 0;
  if (path.startsWith('time.faction.total.')) return state.stats.total.factionTime[path.split('.')[3]] || 0;
  if (path === 'offline.r') return state.stats.r.offlineTime || 0;
  if (path === 'upgrades.total') return state.stats.total.upgradesBought || 0;
  if (path.startsWith('upgrades.') && path.endsWith('.total')) return state.stats.total.upgradesByFaction[path.split('.')[1]] || 0;
  if (path === 'brainwave.stacks') return state.spellBrainwaveStacks || 0;
  throw new Error(`Unknown EffectSpec variable path: ${path}`);
}

function applyPercent(record, key, amount, operation) {
  if (operation === 'multiply' || operation === 'multiplyPercent') multiply(record, key, factor(operation, amount));
  else if (['max', 'min', 'override'].includes(operation)) record[key] = extreme(record[key] || 0, amount, operation);
  else addTo(record, key, amount);
}
function applyScalar(mods, addKey, multKey, amount, operation) {
  if (operation === 'multiply' || operation === 'multiplyPercent') mods[multKey] *= factor(operation, amount);
  else if (['max', 'min', 'override'].includes(operation)) mods[addKey] = extreme(mods[addKey], amount, operation);
  else mods[addKey] += amount;
}

function applyEffectToModifiers(mods, state, spec, amount, target) {
  const { stat, operation } = spec;
  if (stat === 'special') {
    if (operation !== 'unlock') throw new Error(`Special effect ${spec.id} must use unlock`);
    mods.special.add(spec.value.constant);
    return;
  }
  if (stat === 'global.production') applyScalar(mods, 'globalAdd', 'globalMult', amount, operation);
  else if (stat === 'building.production') {
    if (spec.target.type === 'alignment' && !['multiply', 'multiplyPercent'].includes(operation)) {
      applyPercent(mods.alignmentAdd, spec.target.id, amount, operation);
    } else applyPercent(operation === 'multiply' || operation === 'multiplyPercent' ? mods.buildingMult : mods.buildingAdd, target.id, amount, operation);
  } else if (stat === 'building.baseProduction') applyPercent(mods.buildingBaseAdd, target.id, amount, operation);
  else if (stat === 'building.costMultiplier') {
    if (spec.target.type === 'allBuildings') {
      if (['max', 'min', 'override'].includes(operation)) mods.buildingCostReduce = extreme(mods.buildingCostReduce, -amount, operation);
      else mods.buildingCostReduce -= amount;
    } else mods.buildingCostReduceById[target.id] = (mods.buildingCostReduceById[target.id] || 0) - amount;
  } else if (stat === 'building.count') {
    if (spec.target.type === 'allBuildings') mods.buildingCountMult *= factor(operation, amount);
    else multiply(mods.buildingCountMultById, target.id, factor(operation, amount));
  } else if (stat === 'assistants.count') applyScalar(mods, 'assistantsAdd', 'assistantsMult', amount, operation);
  else if (stat === 'assistants.production') applyScalar(mods, 'assistantProdAdd', 'assistantProdMult', amount, operation);
  else if (stat === 'mana.max') applyScalar(mods, 'manaMaxAdd', 'manaMaxMult', amount, operation);
  else if (stat === 'mana.regen') applyScalar(mods, 'manaRegenAdd', 'manaRegenMult', amount, operation);
  else if (stat === 'factionCoin.chance') applyScalar(mods, 'fcChanceAdd', 'fcChanceMult', amount, operation);
  else if (stat === 'factionCoin.reward') multiply(mods.factionRewardMult, spec.target.id, factor(operation, amount));
  else if (stat === 'click.reward') applyScalar(mods, 'clickAdd', 'clickMult', amount, operation);
  else if (stat === 'click.count') mods.clickCountMult *= factor(operation, amount);
  else if (stat === 'click.productionShare') mods.clickProductionShare += amount;
  else if (stat === 'exchange.bonus') applyScalar(mods, 'exchangeAdd', 'exchangeMult', amount, operation);
  else if (stat === 'exchange.costMultiplier') {
    if (spec.target.type === 'faction') mods.exchangeCostReduceByFaction[spec.target.id] = (mods.exchangeCostReduceByFaction[spec.target.id] || 0) - amount;
    else mods.exchangeCostReduce -= amount;
  } else if (stat === 'offline.production') applyScalar(mods, 'offlineAdd', 'offlineMult', amount, operation);
  else if (stat === 'gem.perGem') mods.gemPerGemAdd += amount;
  else if (stat === 'gem.power') mods.gemPowerMult *= factor(operation, amount);
  else if (stat === 'spell.cost') mods.spellCostMult *= factor(operation, amount);
  else if (stat === 'spell.duration') mods.spellDurationMult *= factor(operation, amount);
  else if (stat === 'spell.castCount') mods.spellCastCountMult *= factor(operation, amount);
  else if (stat === 'taxCollection.seconds') mods.taxSecondsAdd += amount;
  else if (stat === 'excavation.costMultiplier') mods.excavationCostReduce -= amount;
  else if (stat === 'time.playtime') mods.timeAdd += amount;
  else throw new Error(`Unknown EffectSpec stat: ${stat}`);
}

export class EffectAggregator {
  constructor(state) {
    this.state = state;
    this.sources = [];
    this.warnings = [];
    this.dependencies = new Set();
    this.seen = new Set();
  }

  run(specs, mods, derived = {}, updateDerived = null) {
    const byPhase = new Map(EFFECT_PHASES.map(phase => [phase, []]));
    for (const spec of specs) {
      if (!byPhase.has(spec.phase)) throw new Error(`Unknown effect phase ${spec.phase} in ${spec.id}`);
      byPhase.get(spec.phase).push(spec);
    }
    for (const phase of EFFECT_PHASES) {
      if (updateDerived) Object.assign(derived, updateDerived(mods, phase, derived));
      const phaseSpecs = byPhase.get(phase).sort((a, b) =>
        `${a.stackingGroup}:${a.operation}:${a.source}:${a.id}`.localeCompare(`${b.stackingGroup}:${b.operation}:${b.source}:${b.id}`));
      for (const spec of phaseSpecs) this.apply(spec, mods, derived);
    }
    return { mods, derived, sources: this.sources, warnings: this.warnings, dependencies: [...this.dependencies] };
  }

  apply(spec, mods, derived) {
    for (const field of ['target', 'operation', 'value', 'stackingGroup', 'phase', 'source']) {
      if (spec[field] === undefined) throw new Error(`EffectSpec ${spec.id || 'unknown'} misses ${field}`);
    }
    if (this.seen.has(spec.id)) {
      this.warnings.push(`Duplicate effect ignored: ${spec.id}`);
      return;
    }
    this.seen.add(spec.id);
    const alignmentAdditive = spec.stat === 'building.production' && spec.target.type === 'alignment' && !['multiply', 'multiplyPercent'].includes(spec.operation);
    const perBuilding = !alignmentAdditive && (['building.production', 'building.baseProduction'].includes(spec.stat)
      || (spec.stat === 'building.count' && spec.target.type !== 'allBuildings'))
      || (spec.stat === 'building.costMultiplier' && spec.target.type === 'building');
    const targets = perBuilding ? resolveTargets(spec.target, this.state) : [];
    const iterations = perBuilding ? targets : [null];
    for (const target of iterations) {
      const variables = { R: this.state.progression.reincarnations, A: this.state.progression.ascension };
      if (spec.value.formula !== undefined) {
        for (const [name, path] of Object.entries(spec.value.variables || {})) {
          if (!path.startsWith('target.') && !path.startsWith('derived.')) this.dependencies.add(path);
          variables[name] = resolvePath(path, this.state, mods, derived, target);
        }
      }
      const amount = spec.stat === 'special' ? spec.value.constant : spec.value.constant !== undefined ? Number(spec.value.constant) : evaluateFormula(spec.value.formula, variables, {
        contentId: spec.source,
        phase: spec.phase,
      });
      if (spec.stat !== 'special' && !Number.isFinite(amount)) throw new Error(`Effect ${spec.id} produced non-finite value`);
      if (!['global', 'faction', 'eachBuilding'].includes(spec.target.type)) this.dependencies.add('buildings');
      applyEffectToModifiers(mods, this.state, spec, amount, target);
      this.sources.push({
        id: spec.id, source: spec.source, phase: spec.phase, stat: spec.stat,
        operation: spec.operation, value: amount, target: target?.id || spec.target.type,
      });
    }
  }
}

function makeSpec(source, index, stat, operation, effectValue, target = { type: 'global' }, phase = 'global') {
  return {
    id: `${source}:${index}`, source, stat, operation, value: effectValue, target, phase,
    stackingGroup: `${stat}:${target.id || target.type}:${operation}`,
  };
}
const constant = value => ({ constant: value });
const inline = (formula, variables) => ({ formula, variables });

function buildingSpecs(upgrade) {
  const specs = [makeSpec(upgrade.id, 0, 'building.production', 'addPercent', constant(upgrade.bonusPercent), { type: 'building', id: upgrade.building }, 'buildingLocal')];
  if (upgrade.assistants) specs.push(makeSpec(upgrade.id, 1, 'assistants.count', 'add', constant(upgrade.assistants), { type: 'global' }, 'assistants'));
  if (upgrade.globalPercentPerTrophy) specs.push(makeSpec(upgrade.id, 2, 'global.production', 'addPercent', inline(`${upgrade.globalPercentPerTrophy} * x`, { x: 'trophies' })));
  return specs;
}

function miscSpecs(upgrade) {
  const specs = [];
  const add = (stat, operation, value, phase = 'global') => specs.push(makeSpec(upgrade.id, specs.length, stat, operation, typeof value === 'object' ? value : constant(value), { type: 'global' }, phase));
  if (upgrade.id === 'gemPower') specs.push(makeSpec(upgrade.id, specs.length, 'special', 'unlock', constant('gemPower'), { type: 'global' }, 'raw'));
  if (['gemPotency', 'gemSupremacy', 'gemSovereignty'].includes(upgrade.id)) add('gem.perGem', 'add', 1, 'utility');
  if (upgrade.clickAdd) add('click.reward', 'add', upgrade.clickAdd, 'click');
  if (upgrade.globalAdd) add('global.production', 'addPercent', upgrade.globalAdd);
  if (upgrade.offlineAdd) add('offline.production', 'addPercent', upgrade.offlineAdd, 'utility');
  if (upgrade.productionShare) add('click.productionShare', 'add', upgrade.productionShare, 'click');
  if (upgrade.clickPercent) add('click.reward', 'multiplyPercent', upgrade.clickPercent, 'click');
  if (upgrade.globalPerAssistant) add('global.production', 'addPercent', inline(`${upgrade.globalPerAssistant} * x`, { x: 'derived.assistants' }));
  if (upgrade.alignmentAdd) specs.push(makeSpec(upgrade.id, specs.length, 'building.production', 'addPercent', constant(upgrade.alignmentAdd), { type: 'alignment', id: upgrade.alignment || 'neutral' }, 'buildingLocal'));
  return specs;
}

function reincarnationSpecs(state) {
  const R = state.progression.reincarnations;
  const specs = [];
  if (R >= 1) {
    specs.push(makeSpec('reincarnation', 0, 'global.production', 'addPercent', inline('50 * R', {})));
    specs.push(makeSpec('reincarnation', 1, 'offline.production', 'addPercent', inline('500 * R', {}), { type: 'global' }, 'utility'));
    specs.push(makeSpec('reincarnation', 2, 'factionCoin.chance', 'addPercent', inline('10 * R', {}), { type: 'global' }, 'factionCoin'));
  }
  if (R >= 2) specs.push(makeSpec('reincarnation', 3, 'gem.perGem', 'add', inline('0.2 * R', {}), { type: 'global' }, 'utility'));
  return specs;
}

function challengeSpecs(state) {
  const specs = [];
  for (const id of state.challenges) {
    if (id === 'fairy1') specs.push(makeSpec(id, 0, 'assistants.count', 'add', inline('2 * x', { x: 'upgrades.fairy.total' }), { type: 'global' }, 'assistants'));
    if (id === 'angel1') specs.push(makeSpec(id, 0, 'spell.cost', 'multiply', constant(0.9), { type: 'global' }, 'utility'));
    if (id === 'demon1') {
      specs.push(makeSpec(id, 0, 'global.production', 'addPercent', inline('x', { x: 'upgrades.total' })));
      specs.push(makeSpec(id, 1, 'factionCoin.chance', 'addPercent', inline('x', { x: 'upgrades.total' }), { type: 'global' }, 'factionCoin'));
    }
  }
  if (state.challenges.includes('elf1')) {
    specs.push(makeSpec('elf1', 0, 'exchange.costMultiplier', 'add', constant(-0.025), { type: 'faction', id: 'elf' }, 'utility'));
  }
  return specs;
}

const SPELL_VARIABLES = {
  buildingsTotal: 'buildings.total', clicksR: 'clicks.r', manaRegen: 'derived.manaRegen',
  factionCoinsTotal: 'factionCoins.total', trophies: 'trophies', gems: 'gems', comboCasts: 'comboCasts.total',
};
function spellSpecs(state, id) {
  const s = SPELL_BY_ID[id];
  const specs = [];
  const add = (stat, operation, value, target = { type: 'global' }, phase = 'global') => specs.push(makeSpec(`spell:${id}`, specs.length, stat, operation, typeof value === 'object' ? value : constant(value), target, phase));
  if (s.formula && s.effect && ['globalAdd', 'buildingAdd'].includes(s.effect.stat)) {
    let expression = s.formula;
    if (id === 'comboStrike' && hasTrophy(state, 'perfectCombo')) expression = '(40 * x ^ 0.9)%';
    const stat = s.effect.stat === 'globalAdd' ? 'global.production' : 'building.production';
    const target = s.effect.stat === 'globalAdd' ? { type: 'global' } : { type: 'buildings', ids: s.effect.targets };
    add(stat, 'addPercent', inline(expression, { x: SPELL_VARIABLES[s.x] }), target, s.effect.stat === 'globalAdd' ? 'global' : 'buildingLocal');
  }
  if (id === 'holyLight') add('click.reward', 'multiply', 18.5, { type: 'global' }, 'click');
  if (id === 'bloodFrenzy') add('building.production', 'addPercent', 1250, { type: 'alignment', id: 'evil' }, 'buildingLocal');
  if (id === 'fairyChanting') {
    add('building.production', 'addPercent', 50000, { type: 'buildings', ids: LOW3 }, 'buildingLocal');
    if (hasTrophy(state, 'fairyChoir')) add('assistants.count', 'multiplyPercent', 200, { type: 'global' }, 'assistants');
  }
  if (id === 'nightTime') add('assistants.production', 'addPercent', inline(`${hasTrophy(state, 'trueNight') ? 40 : 30} * x`, { x: 'buildings.necropolis' }));
  if (id === 'hellfireBlast' && hasTrophy(state, 'hellRush')) add('building.production', 'addPercent', inline(s.formula, { x: 'trophies' }), { type: 'building', id: 'hallOfLegends' }, 'buildingLocal');
  if (id === 'diamondPickaxe') {
    add('click.reward', 'multiplyPercent', inline('25 * x', { x: 'excavations.r' }), { type: 'global' }, 'click');
    add('factionCoin.chance', 'addPercent', hasTrophy(state, 'minedwarf') ? 300 : 200, { type: 'global' }, 'factionCoin');
  }
  if (id === 'brainwave') add('global.production', 'addPercent', inline(`${hasTrophy(state, 'facelessOvermind') ? 3 : 2} * x`, { x: 'brainwave.stacks' }));
  if (id === 'lightningStrike' && state.lightningTarget) {
    add('building.production', 'multiplyPercent', inline(`${hasTrophy(state, 'lightningStorm') ? 750 : 500} * x`, { x: 'buildings.ironStronghold' }), { type: 'building', id: state.lightningTarget }, 'buildingLocal');
    add('factionCoin.chance', 'multiplyPercent', inline(s.fcFormula, { x: 'gems' }), { type: 'global' }, 'factionCoin');
  }
  if (id === 'grandBalance' && state.balanceTarget) {
    add('building.production', 'addPercent', inline(s.formula, { x: 'buildings.topCounts.0', y: 'buildings.topCounts.1', z: 'buildings.topCounts.2', A: 'A' }), { type: 'building', id: state.balanceTarget }, 'buildingLocal');
  }
  return specs;
}

export function collectEffectSpecs(state) {
  const specs = [...reincarnationSpecs(state), ...achievementEffectSpecs(state)];
  for (const id of state.upgrades) {
    if (BUILDING_UPGRADE_BY_ID[id]) specs.push(...buildingSpecs(BUILDING_UPGRADE_BY_ID[id]));
    else if (FACTION_UPGRADE_BY_ID[id]) specs.push(...getFactionEffectSpecs(FACTION_UPGRADE_BY_ID[id]));
    else if (MISC_BY_ID[id]) specs.push(...miscSpecs(MISC_BY_ID[id]));
  }
  for (const id of state.mercenary.upgrades) {
    const upgrade = FACTION_UPGRADE_BY_ID[id];
    if (upgrade) specs.push(...getFactionEffectSpecs(upgrade));
  }
  specs.push(...challengeSpecs(state));
  const exchanges = state.stats.total.exchanges || 0;
  if (exchanges) {
    specs.push(makeSpec('royalExchanges', 0, 'exchange.bonus', 'addPercent', inline('10 * x', { x: 'exchanges.total' })));
    specs.push(makeSpec('royalExchanges', 1, 'global.production', 'addPercent', inline('10 * x', { x: 'exchanges.total' })));
  }
  for (const [id, remaining] of Object.entries(state.activeSpells)) {
    if (remaining > 0 && SPELL_BY_ID[id]) specs.push(...spellSpecs(state, id));
  }
  return specs;
}

export function applyFactionUpgrade(mods, state, upgrade) {
  const specs = getFactionEffectSpecs(upgrade);
  const aggregator = new EffectAggregator(state);
  const derived = {
    assistants: Math.max(0, Math.floor(mods.assistantsAdd * mods.assistantsMult)),
    manaMax: Math.max(1, (1000 + mods.manaMaxAdd) * mods.manaMaxMult),
    manaRegen: Math.max(0, (1 + mods.manaRegenAdd + 2 * state.progression.reincarnations) * mods.manaRegenMult),
    longestSpellDuration: 0,
    fcChance: Math.max(0, (10 + mods.fcChanceAdd) * mods.fcChanceMult),
  };
  aggregator.run(specs, mods, derived);
  return specs.length;
}
