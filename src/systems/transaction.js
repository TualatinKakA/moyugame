import { pathValue, locatePath } from './content-registry.js';

export class TransactionError extends Error {
  constructor(message, code = 'TRANSACTION_FATAL', details = {}) {
    super(message); this.name = 'TransactionError'; this.code = code; this.details = details;
  }
}

function parts(path) {
  if (!path || typeof path !== 'string') throw new TransactionError(`Invalid state path: ${path}`);
  return path.split('.');
}

export function beginTransaction(state) {
  const changedPaths = new Set();
  const facts = [];
  const undo = [];
  const oldValues = new Map();
  const diagnostics = { evaluatedRules: 0, emittedFacts: 0, maxQueueDepth: 0 };
  let sequence = 0;
  function capture(path) {
    if (oldValues.has(path)) return;
    parts(path);
    const { parent, key } = locatePath(state, path);
    if (!parent || typeof parent !== 'object') throw new TransactionError(`Missing parent for state path: ${path}`);
    oldValues.set(path, { parent, key, had: Object.hasOwn(parent, key), value: parent[key] });
  }
  function write(path, value) {
    capture(path);
    const { parent, key } = locatePath(state, path);
    parent[key] = value;
    changedPaths.add(path);
  }
  function update(path, updater) { write(path, updater(pathValue(state, path))); }
  function remove(path) {
    capture(path);
    const { parent, key } = locatePath(state, path);
    delete parent[key];
    changedPaths.add(path);
  }
  function emit(type, payload = {}) {
    const fact = Object.freeze({ type, payload, changedPaths: [...changedPaths], sequence: sequence++ });
    facts.push(fact); diagnostics.emittedFacts++;
    return fact;
  }
  function rollback() {
    for (const { parent, key, had, value } of [...oldValues.values()].reverse()) {
      if (had) parent[key] = value; else delete parent[key];
    }
    changedPaths.clear(); facts.length = 0;
  }
  return {
    state, changedPaths, facts, undo, oldValues, diagnostics,
    capture, write, update, delete: remove, emit, rollback,
    grantOnce: new Set(), dirty: { effectGroups: new Set(), selectors: new Set(), timers: new Set() },
  };
}
