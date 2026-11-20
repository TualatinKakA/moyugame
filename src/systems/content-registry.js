import { validateFormula } from './formula.js';

const KINDS = new Set(['building', 'upgrade', 'alignment', 'faction', 'spell', 'trophy', 'story', 'challenge', 'research', 'exchange']);
const PHASES = new Set(['raw', 'assistants', 'mana', 'buildingBase', 'buildingLocal', 'tax', 'global', 'factionCoin', 'click', 'utility']);
const OPERATORS = new Set(['always', 'selected', 'notSelected', 'buildingOwned', 'owned', 'notOwned', 'resourceAtLeast', 'statAtLeast', 'statLessThan', 'statEquals', 'eventDataEquals', 'newSave', 'spellSource', 'spellActive']);
const ACTIONS = new Set(['grantResource', 'grantUnlock', 'grantOwned', 'grantSpellSource', 'removeSpellSource', 'select', 'clearSelection', 'startTimer', 'cancelTimer', 'enqueueStory', 'markStoryCompleted', 'awardTrophy', 'completeStoryGroup', 'emitFact', 'scheduleTask']);
const EFFECT_OPERATIONS = new Set(['add', 'addPercent', 'multiply', 'multiplyPercent', 'max', 'min', 'override']);
const CONDITION_OPERATORS = new Set([...OPERATORS]);
const UI_KINDS = new Set(['buildingCard', 'upgradeCard', 'choiceCard', 'spellCard', 'trophyCard', 'storyModal', 'challengeCard', 'researchCard', 'exchangeCard']);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
function validValuePath(path, definitionsById) {
  if (['target.count', 'factionCoins.total', 'buildings.total', 'buildings.low3', 'trophies.original', 'effective.r.clicks'].includes(path)) return true;
  if (/^(derived|resources|stats|rawStats)\./.test(path)) return true;
  if (/^buildings\.tier\d+$/.test(path)) return true;
  if (/^buildings\.alignment\.[^.]+$/.test(path)) return true;
  if (path.startsWith('buildings.')) return definitionsById.get(path.slice(10))?.kind === 'building';
  return false;
}
function validDerivedEffectPath(path, phase) {
  const order = [...PHASES];
  const availableAt = path === 'derived.assistants' ? 'mana'
    : ['derived.manaMax', 'derived.manaRegen'].includes(path) ? 'buildingBase'
    : ['derived.activeSpells', 'derived.longestSpellDuration', 'derived.nightTimeActivity'].includes(path) ? 'raw'
    : path === 'derived.taxSeconds' ? 'global'
    : path === 'derived.buildingProduction' || path.startsWith('derived.outputs.') ? 'factionCoin'
    : path === 'derived.fcChance' ? 'click'
      : path === 'derived.clickReward' ? 'utility' : null;
  return availableAt !== null && order.indexOf(phase) >= order.indexOf(availableAt);
}

export class ContentValidationError extends Error {
  constructor(errors) {
    super(`ContentGraph validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
    this.name = 'ContentValidationError';
    this.code = 'CONTENT_FATAL';
    this.errors = errors;
  }
}

export function locatePath(state, path) {
  let parent = state;
  let segments = String(path).split('.');
  while (segments.length > 1) {
    let matched = 0;
    for (let length = segments.length - 1; length > 0; length--) {
      const candidate = segments.slice(0, length).join('.');
      if (parent && typeof parent === 'object' && Object.hasOwn(parent, candidate)) { matched = length; break; }
    }
    if (!matched) break;
    parent = parent[segments.slice(0, matched).join('.')];
    segments = segments.slice(matched);
  }
  return { parent, key: segments.join('.') };
}

export function resourcePath(state, resource, targetId = null) {
  if (!resource.startsWith('factionCoin.')) return `resources.${resource}`;
  const selector = resource.slice(12);
  const factionId = selector === 'current' ? state.selections.faction
    : selector === 'target' ? targetId
      : ['randomEligible', 'randomUnlocked'].includes(selector) ? null : selector;
  return factionId ? `resources.factionCoins.${factionId}` : null;
}

export function pathValue(state, path) {
  let value = state;
  let segments = String(path).split('.');
  while (segments.length) {
    if (!value || typeof value !== 'object') return undefined;
    const direct = segments.join('.');
    if (Object.hasOwn(value, direct)) return value[direct];
    let matched = 0;
    for (let length = segments.length - 1; length > 0; length--) {
      const candidate = segments.slice(0, length).join('.');
      if (Object.hasOwn(value, candidate)) { matched = length; break; }
    }
    if (!matched) return undefined;
    value = value[segments.slice(0, matched).join('.')];
    segments = segments.slice(matched);
  }
  return value;
}

export function formatDescription(definition, graph) {
  return String(definition?.description || '').replace(/\{targets:([^}]+)\}/g, (_, group) => {
    const effect = definition.effects?.find(item => item.group === group);
    if (effect?.target.type !== 'buildings') return '';
    const names = effect.target.ids.map(id => graph.definitionsById.get(id)?.name || id);
    return names.length > 1 ? `${names.slice(0, -1).join('、')}与${names.at(-1)}` : names[0] || '';
  });
}

function dependenciesFor(condition) {
  if (!condition) return [];
  if (condition.all || condition.any) return [...new Set((condition.all || condition.any).flatMap(dependenciesFor))];
  if (condition.not) return dependenciesFor(condition.not);
  switch (condition.op) {
    case 'selected': case 'notSelected': return [`selections.${condition.key}`];
    case 'buildingOwned': return [`buildings.${condition.id}`];
    case 'owned': case 'notOwned': return ['owned', 'permanentUnlocks'];
    case 'resourceAtLeast': return [condition.resource.startsWith('factionCoin.') ? `resources.factionCoins.${condition.resource.slice(12)}` : `resources.${condition.resource}`];
    case 'statAtLeast': case 'statLessThan': case 'statEquals': return [condition.path];
    case 'spellSource': return [`spellSources.${condition.id}`];
    case 'spellActive': return ['timers.spells', 'stats.run.time'];
    case 'newSave': return ['stats.total.clicks', 'buildings', 'selections.faction'];
    default: return [];
  }
}

function compileCondition(condition, sourceId, errors) {
  if (!condition) return { evaluate: () => true, dependencies: [] };
  const compile = node => {
    if (!node || typeof node !== 'object') { errors.push(`${sourceId}: invalid condition`); return () => false; }
    if (node.all || node.any) {
      const key = node.all ? 'all' : 'any';
      if (!Array.isArray(node[key]) || !node[key].length) { errors.push(`${sourceId}: ${key} requires children`); return () => false; }
      const children = node[key].map(compile);
      return context => key === 'all' ? children.every(child => child(context)) : children.some(child => child(context));
    }
    if (node.not) { const child = compile(node.not); return context => !child(context); }
    if (!CONDITION_OPERATORS.has(node.op)) { errors.push(`${sourceId}: unknown condition operator ${node.op}`); return () => false; }
    switch (node.op) {
      case 'always': return () => true;
      case 'selected': return ({ state }) => state.selections[node.key] === node.value;
      case 'notSelected': return ({ state }) => !state.selections[node.key];
      case 'buildingOwned': return ({ state }) => (state.buildings[node.id] || 0) >= node.value;
      case 'owned': return ({ state }) => Boolean(state.permanentUnlocks[node.id] || Object.values(state.owned).some(scope => scope[node.id]));
      case 'notOwned': return ({ state }) => !state.permanentUnlocks[node.id] && !Object.values(state.owned).some(scope => scope[node.id]);
      case 'resourceAtLeast': return ({ state }) => (node.resource.startsWith('factionCoin.') ? state.resources.factionCoins[node.resource.slice(12)] : state.resources[node.resource]) >= node.value;
      case 'statAtLeast': return ({ state, derived }) => ((node.path.startsWith('derived.') ? pathValue(derived, node.path.slice(8)) : pathValue(state, node.path)) || 0) >= node.value;
      case 'statLessThan': return ({ state, derived }) => ((node.path.startsWith('derived.') ? pathValue(derived, node.path.slice(8)) : pathValue(state, node.path)) || 0) < node.value;
      case 'statEquals': return ({ state, derived }) => ((node.path.startsWith('derived.') ? pathValue(derived, node.path.slice(8)) : pathValue(state, node.path)) || 0) === node.value;
      case 'eventDataEquals': return ({ event }) => event?.payload?.[node.path] === node.value;
      case 'newSave': return ({ state }) => state.stats.total.clicks === 0 && Object.keys(state.buildings).length === 0 && !state.selections.faction;
      case 'spellSource': return ({ state }) => Boolean(state.spellSources[node.id] && Object.keys(state.spellSources[node.id]).length);
      case 'spellActive': return ({ state }) => {
        const timer = state.timers.spells[node.id];
        return Boolean(timer && (timer.dueAt !== undefined ? timer.dueAt > state.stats.run.time : timer.remaining > 0));
      };
      default: return () => false;
    }
  };
  return { evaluate: compile(condition), dependencies: dependenciesFor(condition) };
}

function validateValue(value, sourceId, errors) {
  if (!value || typeof value !== 'object') { errors.push(`${sourceId}: effect/cost value is required`); return; }
  if (value.constant !== undefined && !Number.isFinite(Number(value.constant))) errors.push(`${sourceId}: non-finite constant`);
  if (value.formula) {
    try { validateFormula(value.formula, { contentId: sourceId }); }
    catch (error) { errors.push(error.message); }
  }
  if (!value.formula && value.constant === undefined) errors.push(`${sourceId}: value requires constant or formula`);
}

export function compileContentGraph(content, { aliases = {}, mode = 'development' } = {}) {
  const errors = [];
  const definitions = content.definitions || [];
  const definitionsById = new Map();
  const arraysByKind = new Map();
  const compiledConditions = new Map();
  const conditionCache = new WeakMap();
  const eventSubscribers = new Map();
  const statSubscribers = new Map();
  const visibilityDependents = new Map();
  const purchaseDependents = new Map();
  const effectDependencies = new Map();
  const effectOrderByPhase = new Map([...PHASES].map(phase => [phase, []]));
  const effectEntriesByPhase = new Map([...PHASES].map(phase => [phase, []]));
  const rngPersistence = { 'drops:factionCoin': 'transient' };

  const indexDependency = (index, path, id) => {
    if (!path) return;
    if (!index.has(path)) index.set(path, []);
    index.get(path).push(id);
  };
  const compile = (condition, id) => {
    const compiled = compileCondition(condition, id, errors);
    compiledConditions.set(`${id}:${condition === undefined ? 'default' : JSON.stringify(condition)}`, compiled);
    if (condition && typeof condition === 'object') conditionCache.set(condition, compiled);
    return compiled;
  };

  for (const definition of definitions) {
    if (!definition?.id || !KINDS.has(definition.kind)) { errors.push(`${definition?.id || 'unknown'}: invalid id/kind`); continue; }
    if (definitionsById.has(definition.id)) { errors.push(`${definition.id}: duplicate global ID`); continue; }
    definitionsById.set(definition.id, definition);
    if (!arraysByKind.has(definition.kind)) arraysByKind.set(definition.kind, []);
    arraysByKind.get(definition.kind).push(definition);
    for (const field of ['contentVersion', 'era', 'scope', 'ui']) if (!definition[field]) errors.push(`${definition.id}: missing ${field}`);
    if (!definition.ui?.kind || !definition.ui?.panel || !UI_KINDS.has(definition.ui.kind)) errors.push(`${definition.id}: UI kind/panel must be registered`);
    if ((definition.kind === 'trophy' || definition.kind === 'story') && !definition.rewardId) errors.push(`${definition.id}: permanent reward requires rewardId`);
    if (['spell', 'upgrade'].includes(definition.kind)) {
      const hasStream = definition.rngStream !== undefined;
      const hasPersistence = definition.rngPersistence !== undefined;
      if (hasStream && (typeof definition.rngStream !== 'string' || !definition.rngStream.trim())) errors.push(`${definition.id}: rngStream must be non-empty`);
      if (hasPersistence && !['saved', 'transient'].includes(definition.rngPersistence)) errors.push(`${definition.id}: unknown rngPersistence ${definition.rngPersistence}`);
      if (hasPersistence && !hasStream) errors.push(`${definition.id}: rngPersistence requires rngStream`);
      if (hasStream && typeof definition.rngStream === 'string' && definition.rngStream.trim()) {
        const strategy = definition.rngPersistence || 'saved';
        if (rngPersistence[definition.rngStream] && rngPersistence[definition.rngStream] !== strategy) errors.push(`${definition.id}: conflicting rngPersistence for ${definition.rngStream}`);
        else rngPersistence[definition.rngStream] = strategy;
      }
    } else if (definition.rngStream !== undefined || definition.rngPersistence !== undefined) errors.push(`${definition.id}: RNG metadata requires a spell or upgrade`);
    for (const [field, index] of [['visible', visibilityDependents], ['unlock', visibilityDependents]]) {
      const compiled = compile(definition[field], definition.id);
      for (const path of compiled.dependencies) indexDependency(index, path, definition.id);
    }
    for (const condition of definition.purchase?.requires || definition.cast?.requires || []) {
      for (const path of compile(condition, definition.id).dependencies) indexDependency(purchaseDependents, path, definition.id);
    }
    for (const cost of definition.purchase?.costs || definition.cast?.costs || []) {
      validateValue(cost.amount, definition.id, errors);
      if (['factionCoin.randomEligible', 'factionCoin.randomUnlocked'].includes(cost.resource)) errors.push(`${definition.id}: random FC is not a payable resource`);
      if (cost.when) for (const path of compile(cost.when, `${definition.id}/cost`).dependencies) indexDependency(purchaseDependents, path, definition.id);
    }
    if (definition.factionCoin) {
      if (definition.kind !== 'faction') errors.push(`${definition.id}: factionCoin config requires a faction`);
      if (definition.factionCoin.enabled !== true) errors.push(`${definition.id}: factionCoin.enabled must be true for FC factions`);
      compile(definition.factionCoin.dropUnlock, `${definition.id}/factionCoin.dropUnlock`);
      if (!Number.isFinite(definition.factionCoin.baseWeight) || definition.factionCoin.baseWeight <= 0) errors.push(`${definition.id}: factionCoin.baseWeight must be positive`);
    }
    for (const effect of definition.effects || []) {
      if (!effect.group || !PHASES.has(effect.phase) || !effect.stat || !effect.target || !EFFECT_OPERATIONS.has(effect.operation) || !effect.stacking) {
        errors.push(`${definition.id}: invalid effect schema`); continue;
      }
      validateValue(effect.value, definition.id, errors);
      if (effect.stat === 'assistants.count' && !['add', 'multiply', 'multiplyPercent'].includes(effect.operation)) errors.push(`${definition.id}: unsupported assistants.count operation ${effect.operation}`);
      if (effect.stat === 'assistants.production' && !['addPercent', 'multiply', 'multiplyPercent'].includes(effect.operation)) errors.push(`${definition.id}: unsupported assistants.production operation ${effect.operation}`);
      effectOrderByPhase.get(effect.phase).push(effect.group);
      effectEntriesByPhase.get(effect.phase).push(Object.freeze({ definition, effect }));
      const effectCondition = compile(effect.when, `${definition.id}/${effect.group}`);
      for (const path of effectCondition.dependencies) indexDependency(effectDependencies, path, effect.group);
      for (const path of Object.values(effect.value.variables || {})) {
        indexDependency(effectDependencies, path, effect.group);
        if (path.startsWith('buildings.')) indexDependency(effectDependencies, 'buildings', effect.group);
        if (path === 'factionCoins.total') indexDependency(effectDependencies, 'resources.factionCoins', effect.group);
        if (path === 'trophies.original') indexDependency(effectDependencies, 'permanentUnlocks', effect.group);
        if (path === 'effective.r.clicks') indexDependency(effectDependencies, 'stats.r.clicks', effect.group);
        if (path.startsWith('rawStats.')) indexDependency(effectDependencies, `stats.${path.slice(9)}`, effect.group);
        if (['derived.activeSpells', 'derived.longestSpellDuration'].includes(path)) indexDependency(effectDependencies, 'timers.spells', effect.group);
        if (path === 'derived.nightTimeActivity') {
          indexDependency(effectDependencies, 'stats.r.spellActivity.nightTime', effect.group);
          indexDependency(effectDependencies, 'stats.ascension.offlineTime', effect.group);
        }
        if (path === 'stats.r.evilSpellsCast') indexDependency(effectDependencies, 'stats.r.spellCasts', effect.group);
        const maximumActivity = path.match(/^stats\.(run|r|ascension|total)\.maxSpellActivity$/);
        if (maximumActivity) indexDependency(effectDependencies, `stats.${maximumActivity[1]}.spellActivity`, effect.group);
      }
      for (const id of effect.target.ids || []) indexDependency(effectDependencies, `buildings.${id}`, effect.group);
      indexDependency(effectDependencies, definition.kind === 'spell' ? 'timers.spells' : definition.kind === 'trophy' ? 'permanentUnlocks' : 'owned', effect.group);
    }
    for (const action of [...(definition.grants || []), ...(definition.castActions || []), ...(definition.completionActions || [])]) {
      if (!ACTIONS.has(action.type)) errors.push(`${definition.id}: unknown action ${action.type}`);
      if (action.amount) validateValue(action.amount, definition.id, errors);
    }
    for (const choice of definition.choices || []) {
      if (!choice.id || !choice.label) errors.push(`${definition.id}: story choice requires id/label`);
      compile(choice.when, definition.id);
      for (const action of choice.actions || []) if (!ACTIONS.has(action.type)) errors.push(`${definition.id}: unknown choice action ${action.type}`);
    }
    for (const reaction of definition.reactions || []) {
      if (!reaction.event && !reaction.path) { errors.push(`${definition.id}: reaction requires event or stat path`); continue; }
      const compiled = compile(reaction.when, definition.id);
      const entry = { id: definition.id, reaction, when: compiled };
      const index = reaction.event ? eventSubscribers : statSubscribers;
      const key = reaction.event || reaction.path;
      indexDependency(index, key, entry);
      if (reaction.path) for (const path of compiled.dependencies) if (path !== reaction.path) indexDependency(statSubscribers, path, entry);
    }
  }

  for (const definition of definitions) {
    for (const match of String(definition.description || '').matchAll(/\{targets:([^}]+)\}/g)) {
      const effect = definition.effects?.find(item => item.group === match[1]);
      if (effect?.target.type !== 'buildings' || !effect.target.ids?.length) errors.push(`${definition.id}: invalid description target group ${match[1]}`);
    }
    for (const effect of definition.effects || []) for (const path of Object.values(effect.value.variables || {})) {
      if (path.startsWith('derived.') && !validDerivedEffectPath(path, effect.phase)) errors.push(`${definition.id}: unavailable or cyclic derived dependency ${path} in ${effect.phase}`);
    }
    for (const value of [
      ...(definition.effects || []).map(effect => effect.value),
      ...(definition.purchase?.costs || definition.cast?.costs || []).map(cost => cost.amount),
      ...(definition.castActions || []).map(action => action.amount),
    ].filter(Boolean)) {
      for (const path of Object.values(value.variables || {})) if (!validValuePath(path, definitionsById)) errors.push(`${definition.id}: unknown value dependency ${path}`);
    }
    for (const action of [...(definition.grants || []), ...(definition.completionActions || [])]) {
      if (['awardTrophy', 'grantSpellSource', 'enqueueStory'].includes(action.type) && !definitionsById.has(action.id)) errors.push(`${definition.id}: unknown action target ${action.id}`);
      if (action.type === 'awardTrophy' && definitionsById.get(action.id)?.kind !== 'trophy') errors.push(`${definition.id}: ${action.id} is not a trophy`);
      if (action.type === 'grantSpellSource' && definitionsById.get(action.id)?.kind !== 'spell') errors.push(`${definition.id}: ${action.id} is not a spell`);
    }
    for (const effect of definition.effects || []) for (const id of effect.target.ids || []) {
      if (definitionsById.get(id)?.kind !== 'building') errors.push(`${definition.id}: unknown building target ${id}`);
    }
  }

  if (errors.length) {
    if (mode === 'production') throw new ContentValidationError(errors);
    throw new ContentValidationError(errors);
  }
  for (const entries of effectEntriesByPhase.values()) entries.sort((a, b) => a.effect.group.localeCompare(b.effect.group) || a.definition.id.localeCompare(b.definition.id));
  for (const definition of definitions) deepFreeze(definition);
  const sortedIds = [...definitionsById.keys()].sort();
  const integerIdByString = new Map(sortedIds.map((id, index) => [id, index]));
  const freezeIndex = index => new Map([...index].map(([key, value]) => [key, Object.freeze([...value])]));
  const graph = {
    definitions: Object.freeze([...definitions]),
    definitionsById,
    arraysByKind,
    integerIdByString,
    stringIdByInteger: Object.freeze(sortedIds),
    compiledConditions,
    conditionCache,
    eventSubscribers: freezeIndex(eventSubscribers),
    statSubscribers: freezeIndex(statSubscribers),
    visibilityDependents: freezeIndex(visibilityDependents),
    purchaseDependents: freezeIndex(purchaseDependents),
    effectDependencies: freezeIndex(effectDependencies),
    effectOrderByPhase: freezeIndex(effectOrderByPhase),
    effectEntriesByPhase: freezeIndex(effectEntriesByPhase),
    rngPersistence: Object.freeze({ ...rngPersistence }),
    migrationAlias: Object.freeze({ ...aliases }),
    contentVersions: Object.freeze((content.packs || []).map(pack => pack.version)),
  };
  return Object.freeze(graph);
}

export function evaluateCondition(graph, condition, context) {
  if (!condition) return true;
  const compiled = graph.conditionCache.get(condition);
  if (compiled) return compiled.evaluate(context);
  throw new Error(`Uncompiled condition used at runtime; register it in ContentGraph first`);
}
