import { evaluateCondition, pathValue } from './content-registry.js';

const triggered = (state, id, kind) => kind === 'story'
  ? Boolean(state.story.completed[id] || state.story.pending.some(item => item.id === id))
  : kind === 'challenge' ? Boolean(state.challenges[id]?.completed)
    : Boolean(state.permanentUnlocks[id]);

export function processReactions(tx, graph, handlers, { derived = null } = {}) {
  const queue = [];
  const eventEntries = new WeakMap();
  const statEntries = new WeakSet();
  let sequence = 0;
  const enqueue = (entry, event = null) => {
    if (event) {
      let entries = eventEntries.get(event);
      if (!entries) { entries = new Set(); eventEntries.set(event, entries); }
      if (entries.has(entry.id)) return;
      entries.add(entry.id);
    } else {
      if (statEntries.has(entry)) return;
      statEntries.add(entry);
    }
    queue.push({ ...entry, event, sequence: sequence++ });
  };
  for (const fact of tx.facts) for (const entry of graph.eventSubscribers.get(fact.type) || []) enqueue(entry, fact);
  for (const path of tx.changedPaths) for (const entry of graph.statSubscribers.get(path) || []) enqueue(entry);
  let batches = 0;
  const maxBatches = Math.max(100, graph.definitions.length * Math.max(1, tx.facts.length));
  while (queue.length) {
    if (++batches > maxBatches) throw new Error('Reaction queue exceeded its content-scaled limit; possible content cycle');
    queue.sort((a, b) => (a.reaction.priority || 0) - (b.reaction.priority || 0)
      || graph.integerIdByString.get(a.id) - graph.integerIdByString.get(b.id) || a.sequence - b.sequence);
    const current = queue.shift();
    const definition = graph.definitionsById.get(current.id);
    if (!definition || !['story', 'trophy', 'challenge'].includes(definition.kind)) continue;
    if (triggered(tx.state, definition.id, definition.kind)) continue;
    if (current.reaction.path) {
      const threshold = current.reaction.when?.value;
      const old = tx.oldValues.get(current.reaction.path)?.value ?? pathValue(tx.state, current.reaction.path) ?? 0;
      const currentValue = pathValue(tx.state, current.reaction.path) || 0;
      if (threshold !== undefined && !(old < threshold && currentValue >= threshold)) continue;
    }
    tx.diagnostics.evaluatedRules++;
    if (!evaluateCondition(graph, current.reaction.when, { state: tx.state, event: current.event, derived })) continue;
    if (definition.kind === 'story') {
      handlers.enqueueStory(tx, definition, current.event);
      tx.critical = true;
    } else if (definition.kind === 'trophy') handlers.awardTrophy(tx, definition);
    else handlers.completeChallenge?.(tx, definition);
    handlers.applyActions(tx, definition.grants || [], definition);
    for (const fact of tx.facts) for (const entry of graph.eventSubscribers.get(fact.type) || []) {
      if (!queue.some(item => item.id === entry.id && item.event === fact) && !triggered(tx.state, entry.id, graph.definitionsById.get(entry.id)?.kind)) enqueue(entry, fact);
    }
    for (const path of tx.changedPaths) for (const entry of graph.statSubscribers.get(path) || []) {
      if (!triggered(tx.state, entry.id, graph.definitionsById.get(entry.id)?.kind) && !queue.some(item => item.id === entry.id)) enqueue(entry);
    }
    tx.diagnostics.maxQueueDepth = Math.max(tx.diagnostics.maxQueueDepth, queue.length);
  }
}
