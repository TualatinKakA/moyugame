import { validateFormula } from './formula.js';

const KINDS = new Set(['building', 'upgrade', 'alignment', 'faction', 'spell', 'trophy', 'story', 'challenge', 'research']);
const PHASES = new Set(['raw', 'assistants', 'mana', 'buildingBase', 'buildingLocal', 'global', 'factionCoin', 'click', 'utility']);
const OPERATORS = new Set(['always', 'selected', 'notSelected', 'buildingOwned', 'owned', 'notOwned', 'resourceAtLeast', 'statAtLeast', 'statEquals', 'eventDataEquals', 'newSave', 'spellSource']);
const ACTIONS = new Set(['grantResource', 'grantUnlock', 'grantOwned', 'grantSpellSource', 'removeSpellSource', 'select', 'clearSelection', 'startTimer', 'cancelTimer', 'enqueueStory', 'markStoryCompleted', 'awardTrophy', 'completeStoryGroup', 'emitFact', 'scheduleTask']);
const EFFECT_OPERATIONS = new Set(['add', 'addPercent', 'multiply', 'multiplyPercent', 'max', 'min', 'override']);
const CONDITION_OPERATORS = new Set([...OPERATORS]);
const UI_KINDS = new Set(['buildingCard', 'upgradeCard', 'choiceCard', 'spellCard', 'trophyCard', 'storyModal', 'challengeCard', 'researchCard']);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
function validValuePath(path, definitionsById) {
  if (path === 'target.count' || path === 'factionCoins.total' || path === 'buildings.total') return true;
  if (/^(derived|resources|stats)\./.test(path)) return true;
  if (/^buildings\.alignment\.[^.]+$/.test(path)) return true;
  if (path.startsWith('buildings.')) return definitionsById.get(path.slice(10))?.kind === 'building';
  return false;
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

function dependenciesFor(condition) {
  if (!condition) return [];
  if (condition.all || condition.any) return [...new Set((condition.all || condition.any).flatMap(dependenciesFor))];
  if (condition.not) return dependenciesFor(condition.not);
  switch (condition.op) {
    case 'selected': case 'notSelected': return [`selections.${condition.key}`];
    case 'buildingOwned': return [`buildings.${condition.id}`];
    case 'owned': case 'notOwned': return ['owned', 'permanentUnlocks'];
    case 'resourceAtLeast': return [condition.resource.startsWith('factionCoin.') ? `resources.factionCoins.${condition.resource.slice(12)}` : `resources.${condition.resource}`];
    case 'statAtLeast': case 'statEquals': return [condition.path];
    case 'spellSource': return [`spellSources.${condition.id}`];
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
      case 'statAtLeast': return ({ state }) => (pathValue(state, node.path) || 0) >= node.value;
      case 'statEquals': return ({ state }) => (pathValue(state, node.path) || 0) === node.value;
      case 'eventDataEquals': return ({ event }) => event?.payload?.[node.path] === node.value;
      case 'newSave': return ({ state }) => state.stats.total.clicks === 0 && Object.keys(state.buildings).length === 0 && !state.selections.faction;
      case 'spellSource': return ({ state }) => Boolean(state.spellSources[node.id] && Object.keys(state.spellSources[node.id]).length);
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
    for (const [field, index] of [['visible', visibilityDependents], ['unlock', visibilityDependents]]) {
      const compiled = compile(definition[field], definition.id);
      for (const path of compiled.dependencies) indexDependency(index, path, definition.id);
    }
    for (const condition of definition.purchase?.requires || []) {
      for (const path of compile(condition, definition.id).dependencies) indexDependency(purchaseDependents, path, definition.id);
    }
    for (const cost of definition.purchase?.costs || definition.cast?.costs || []) validateValue(cost.amount, definition.id, errors);
    for (const effect of definition.effects || []) {
      if (!effect.group || !PHASES.has(effect.phase) || !effect.stat || !effect.target || !EFFECT_OPERATIONS.has(effect.operation) || !effect.stacking) {
        errors.push(`${definition.id}: invalid effect schema`); continue;
      }
      validateValue(effect.value, definition.id, errors);
      effectOrderByPhase.get(effect.phase).push(effect.group);
      for (const path of Object.values(effect.value.variables || {})) {
        indexDependency(effectDependencies, path, effect.group);
        if (path.startsWith('buildings.')) indexDependency(effectDependencies, 'buildings', effect.group);
        if (path === 'factionCoins.total') indexDependency(effectDependencies, 'resources.factionCoins', effect.group);
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
