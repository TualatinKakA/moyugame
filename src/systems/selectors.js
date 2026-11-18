import { evaluateCondition, formatDescription, pathValue } from './content-registry.js';
import { evaluateFormula } from './formula.js';
import { computeDerived } from './derived.js';

function amountValue(state, derived, amount) {
  if (amount.constant !== undefined) return Number(amount.constant);
  const variables = Object.fromEntries(Object.entries(amount.variables || {}).map(([name, path]) => [name, path.startsWith('derived.') ? derived[path.slice(8)] || 0 : pathValue(state, path) || 0]));
  return evaluateFormula(amount.formula, variables);
}

export function buildingQuote(state, graph, derived, id, amount = 1) {
  const definition = graph.definitionsById.get(id);
  const count = state.buildings[id] || 0;
  const base = definition.purchase.costs[0].amount.constant;
  const growth = derived.buildingCostMultiplier;
  const quantityFor = value => {
    if (value !== 'max') return Math.max(1, Number(value) || 1);
    if (state.resources.coins < base * growth ** count) return 0;
    return Math.max(1, Math.floor(Math.log(state.resources.coins * (growth - 1) / (base * growth ** count) + 1) / Math.log(growth)));
  };
  const quantity = quantityFor(amount);
  const cost = quantity ? base * growth ** count * (growth ** quantity - 1) / (growth - 1) : 0;
  return { quantity, cost };
}

function contentDependencies(definition) {
  const paths = new Set(['revision']);
  const collect = condition => {
    if (!condition) return;
    if (condition.all || condition.any) (condition.all || condition.any).forEach(collect);
    if (condition.not) collect(condition.not);
    if (condition.path) paths.add(condition.path);
    if (condition.key) paths.add(`selections.${condition.key}`);
    if (condition.id) { paths.add(`buildings.${condition.id}`); paths.add(`owned`); paths.add(`spellSources.${condition.id}`); }
    if (condition.resource) paths.add(`resources.${condition.resource}`);
  };
  collect(definition.visible); collect(definition.unlock);
  (definition.purchase?.requires || definition.cast?.requires || []).forEach(collect);
  for (const cost of definition.purchase?.costs || definition.cast?.costs || []) paths.add(`resources.${cost.resource}`);
  paths.add('timers.spells'); paths.add('permanentUnlocks');
  if (definition.kind === 'spell') paths.add('stats.run.time');
  if (definition.kind === 'building') paths.add('resources.gems');
  paths.delete('revision');
  return [...paths];
}

export function selectContent(state, graph, derived, id, args = {}) {
  const definition = graph.definitionsById.get(id);
  if (!definition) return { id, status: 'HIDDEN_SYSTEM', reasons: [{ code: 'UNKNOWN_CONTENT' }] };
  const context = { state, derived };
  if (!evaluateCondition(graph, definition.visible, context)) return { id, status: 'HIDDEN_SYSTEM', reasons: [{ code: 'NOT_VISIBLE' }], viewModel: null };
  const selected = definition.kind === 'alignment' || definition.kind === 'faction' ? state.selections[definition.kind] === id : false;
  const isOwned = Boolean(state.permanentUnlocks[id] || state.challenges[id]?.completed || Object.values(state.owned).some(scope => scope[id]));
  const requirements = definition.purchase?.requires || definition.cast?.requires || [];
  const unlocked = requirements.every(condition => evaluateCondition(graph, condition, context));
  let costs = (definition.purchase?.costs || definition.cast?.costs || []).map(cost => ({ ...cost, value: amountValue(state, derived, cost.amount) }));
  let quantity = null;
  let purchaseProduction = 0;
  if (definition.kind === 'building') {
    const quote = buildingQuote(state, graph, derived, id, args.amount ?? state.settings.buyAmount);
    quantity = quote.quantity;
    costs = [{ resource: 'coins', value: quote.cost }];
    if (quantity > 0) {
      const preview = computeDerived(state, graph, new Map(), { [id]: (state.buildings[id] || 0) + quantity });
      purchaseProduction = Math.max(0, preview.production - derived.production);
    }
  }
  const affordable = costs.every(cost => {
    const available = cost.resource.startsWith('factionCoin.') ? state.resources.factionCoins[cost.resource.slice(12)] : state.resources[cost.resource];
    return (available || 0) >= cost.value;
  });
  let status = 'AVAILABLE_UNAFFORDABLE';
  if (selected) status = 'SELECTED';
  else if (isOwned && definition.kind !== 'building') status = 'OWNED';
  else if (!unlocked) status = 'LOCKED_REQUIREMENT';
  else if (!affordable || quantity === 0) status = 'NEED_RESOURCE';
  else status = 'PURCHASABLE';
  return {
    id, status, reasons: [], costs, quantity,
    viewModel: {
      id, kind: definition.kind, uiKind: definition.ui.kind, name: definition.name,
      description: formatDescription(definition, graph), quantity,
      active: Boolean(state.timers.spells[id] && (state.timers.spells[id].dueAt !== undefined ? state.timers.spells[id].dueAt > state.stats.run.time : state.timers.spells[id].remaining > 0)),
      remaining: state.timers.spells[id] ? Math.max(0, (state.timers.spells[id].dueAt ?? state.stats.run.time + state.timers.spells[id].remaining) - state.stats.run.time) : 0,
      count: state.buildings[id] || 0,
      output: derived.outputs[id] || 0,
      purchaseProduction,
      status,
    },
  };
}

export class SelectorCache {
  constructor() { this.entries = new Map(); this.keysByDependency = new Map(); }
  get(state, graph, derived, id, args = {}) {
    const key = `${id}:${args.amount ?? state.settings.buyAmount}`;
    const dependencies = contentDependencies(graph.definitionsById.get(id));
    const derivedDependent = dependencies.some(path => path.startsWith('derived.'));
    const cached = this.entries.get(key);
    if (cached && (!cached.derivedDependent || cached.derived === derived)) return cached.value;
    const value = selectContent(state, graph, derived, id, args);
    this.entries.set(key, { value, derived, derivedDependent });
    for (const dependency of dependencies) {
      if (!this.keysByDependency.has(dependency)) this.keysByDependency.set(dependency, new Set());
      this.keysByDependency.get(dependency).add(key);
    }
    return value;
  }
  invalidate(changedPaths) {
    for (const path of changedPaths) {
      const keys = new Set(this.keysByDependency.get(path) || []);
      for (const dependency of ['owned', 'permanentUnlocks', 'timers.spells', 'spellSources', 'selections', 'buildings', 'resources.factionCoins']) {
        if (path.startsWith(`${dependency}.`)) for (const key of this.keysByDependency.get(dependency) || []) keys.add(key);
      }
      for (const key of keys) this.entries.delete(key);
    }
  }
  clear() { this.entries.clear(); this.keysByDependency.clear(); }
}
