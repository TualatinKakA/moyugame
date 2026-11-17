import { compileContentGraph, evaluateCondition, pathValue } from './content-registry.js';
import { createSaveState, migrateAndNormalizeState, assertStateInvariants, stateHash } from './state.js';
import { beginTransaction } from './transaction.js';
import { processReactions } from './reactions.js';
import { RuntimeCache } from './derived.js';
import { SelectorCache, selectContent, buildingQuote } from './selectors.js';
import { createScheduler } from './scheduler.js';
import { createPersistence } from './persistence.js';
import { systemClock } from '../core/clock.js';
import { drawRandom } from '../core/rng.js';
import { evaluateFormula } from './formula.js';
import { planOfflineSegments } from './offline.js';

const increment = (tx, path, amount) => tx.write(path, (pathValue(tx.state, path) || 0) + amount);
const spellActive = (state, id) => {
  const timer = state.timers.spells[id];
  return Boolean(timer && (timer.dueAt !== undefined ? timer.dueAt > state.stats.run.time : timer.remaining > 0));
};
const resettable = state => ({
  buildings: {}, selections: { alignment: null, faction: null, bloodline: null, lineage: null, artifactSet: null },
  spellSources: {}, timers: { spells: {}, tasks: {} },
});

export function createGameRuntime({ content, saveAdapter, clock = systemClock, seed = 0x6d2b79f5, mode = 'development' }) {
  const graph = compileContentGraph(content, { mode });
  const persistence = createPersistence(saveAdapter, { wallNow: clock.wallNow });
  const scheduler = createScheduler();
  const listeners = new Set();
  let state = null;
  let cache = null;
  let selectors = new SelectorCache();
  let started = false;
  let activeTransaction = null;
  let stopped = false;
  const diagnostics = { lastTransaction: null, recoveredSave: false, migration: null, offlineTruncated: false };

  function notify(type, transaction = null) {
    const message = { type, commandType: transaction?.commandType || null, revision: state?.revision || 0, changedPaths: transaction ? [...transaction.changedPaths] : [], facts: transaction?.facts || [], diagnostics };
    for (const listener of listeners) listener(message);
  }
  function rebuildScheduler() {
    scheduler.clear();
    if (!state) return;
    for (const [id, timer] of Object.entries(state.timers.spells)) scheduler.register(`spell:${id}`, timer.dueAt, { kind: 'spell', id });
    for (const [id, timer] of Object.entries(state.timers.tasks)) scheduler.register(`task:${id}`, timer.dueAt, { kind: 'task', id });
  }
  function commitTransaction(transaction) {
    assertStateInvariants(state, graph);
    if (!transaction.changedPaths.size && !transaction.facts.length) return { ok: true, changed: false, facts: [] };
    transaction.write('revision', state.revision + 1);
    cache.invalidate(transaction.changedPaths);
    selectors.invalidate(transaction.changedPaths);
    const critical = Boolean(transaction.critical);
    if (critical) {
      transaction.write('lastSave', clock.wallNow());
      transaction.write('lastWallClock', clock.wallNow());
      const result = persistence.save(state);
      if (!result.ok) throw result.error;
    } else persistence.markDirty();
    rebuildScheduler();
    diagnostics.lastTransaction = { rules: transaction.diagnostics.evaluatedRules, queueDepth: transaction.diagnostics.maxQueueDepth };
    notify('commit', transaction);
    return { ok: true, changed: true, facts: transaction.facts };
  }
  function runTransaction(type, callback) {
    if (!started || stopped) return { ok: false, reason: 'RUNTIME_NOT_RUNNING' };
    if (activeTransaction) return { ok: false, reason: 'TRANSACTION_REENTRY' };
    const transaction = beginTransaction(state);
    transaction.commandType = type;
    activeTransaction = transaction;
    try {
      const result = callback(transaction);
      if (result?.rejected) { transaction.rollback(); return { ok: false, reason: result.reason }; }
      processReactions(transaction, graph, { enqueueStory, awardTrophy, applyActions, completeChallenge });
      const committed = commitTransaction(transaction);
      return { ...committed, result };
    } catch (error) {
      transaction.rollback();
      cache.rebuild(); selectors.clear(); rebuildScheduler();
      return { ok: false, reason: error.code || 'TRANSACTION_FATAL', error };
    } finally { activeTransaction = null; }
  }

  function resolveAmount(tx, amount) {
    if (amount.constant !== undefined) return Number(amount.constant);
    const variables = Object.fromEntries(Object.entries(amount.variables || {}).map(([name, path]) => {
      if (path.startsWith('derived.')) return [name, cache.get()[path.slice(8)] || 0];
      if (path === 'factionCoins.total') return [name, Object.values(tx.state.resources.factionCoins).reduce((sum, value) => sum + value, 0)];
      return [name, pathValue(tx.state, path) || 0];
    }));
    return evaluateFormula(amount.formula, variables);
  }
  function awardTrophy(tx, definition) {
    if (tx.state.permanentUnlocks[definition.id]) return;
    tx.write(`permanentUnlocks.${definition.id}`, true);
    tx.emit('trophy.unlocked', { trophyId: definition.id, rewardId: definition.rewardId });
  }
  function completeChallenge(tx, definition) {
    tx.write(`challenges.${definition.id}`, { completed: true, scope: definition.scope });
    tx.emit('challenge.completed', { challengeId: definition.id });
  }
  function enqueueStory(tx, definition, event = null) {
    if (tx.state.story.completed[definition.id] || tx.state.story.pending.some(item => item.id === definition.id)) return;
    const pending = [...tx.state.story.pending, { id: definition.id, at: clock.wallNow() }];
    pending.sort((a, b) => {
      const ar = graph.definitionsById.get(a.id).reactions[0]?.priority || 0;
      const br = graph.definitionsById.get(b.id).reactions[0]?.priority || 0;
      return ar - br || graph.integerIdByString.get(a.id) - graph.integerIdByString.get(b.id);
    });
    tx.write('story.pending', pending);
    tx.emit('story.queued', { storyId: definition.id, sourceEvent: event?.type || null });
  }
  function applyActions(tx, actions, definition) {
    for (const action of actions) {
      if (action.type === 'grantResource') {
        const amount = resolveAmount(tx, action.amount);
        if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid grantResource amount for ${definition.id}`);
        const faction = action.resource === 'factionCoin.current' ? tx.state.selections.faction : null;
        const path = action.resource.startsWith('factionCoin.') ? `resources.factionCoins.${faction || action.resource.slice(12)}` : `resources.${action.resource}`;
        if (action.resource === 'factionCoin.current' && !faction) throw new Error('No faction selected for dynamic factionCoin grant');
        increment(tx, path, amount);
        tx.emit('resource.granted', { resource: action.resource, amount });
      } else if (action.type === 'grantUnlock') {
        tx.write(`permanentUnlocks.${action.id}`, true);
      } else if (action.type === 'grantOwned') {
        tx.write(`owned.${action.scope || definition.scope}.${action.id}`, true);
      } else if (action.type === 'grantSpellSource') {
        const sources = { ...(tx.state.spellSources[action.id] || {}), [action.source]: true };
        tx.write(`spellSources.${action.id}`, sources);
      } else if (action.type === 'removeSpellSource') {
        const sources = { ...(tx.state.spellSources[action.id] || {}) }; delete sources[action.source];
        tx.write(`spellSources.${action.id}`, sources);
      } else if (action.type === 'select') {
        tx.write(`selections.${action.key}`, action.value);
      } else if (action.type === 'clearSelection') {
        tx.write(`selections.${action.key}`, null);
      } else if (action.type === 'startTimer') {
        const dueAt = tx.state.stats.run.time + action.duration;
        tx.write(`timers.tasks.${action.id}`, { dueAt });
      } else if (action.type === 'cancelTimer') {
        tx.delete(`timers.spells.${action.id}`); tx.delete(`timers.tasks.${action.id}`);
      } else if (action.type === 'enqueueStory') {
        enqueueStory(tx, graph.definitionsById.get(action.id));
      } else if (action.type === 'markStoryCompleted') {
        tx.write(`story.completed.${action.id}`, true);
      } else if (action.type === 'awardTrophy') {
        awardTrophy(tx, graph.definitionsById.get(action.id));
      } else if (action.type === 'completeStoryGroup') {
        tx.write(`story.groups.${action.group}`, true);
      } else if (action.type === 'emitFact') {
        tx.emit(action.event, action.payload || {});
      } else if (action.type === 'scheduleTask') {
        tx.write(`timers.tasks.${action.id}`, { dueAt: tx.state.stats.run.time + action.delay });
      } else throw new Error(`Unknown action ${action.type}`);
    }
  }

  function payCosts(tx, definition, costs) {
    for (const cost of costs) {
      const path = cost.resource.startsWith('factionCoin.') ? `resources.factionCoins.${cost.resource.slice(12)}` : `resources.${cost.resource}`;
      if ((pathValue(tx.state, path) || 0) < cost.value) return false;
    }
    for (const cost of costs) {
      const path = cost.resource.startsWith('factionCoin.') ? `resources.factionCoins.${cost.resource.slice(12)}` : `resources.${cost.resource}`;
      increment(tx, path, -cost.value);
    }
    return true;
  }

  function purchase(id, amount) {
    return runTransaction('purchase', tx => {
      const definition = graph.definitionsById.get(id);
      if (!definition) return { rejected: true, reason: 'UNKNOWN_CONTENT' };
      const selected = selectContent(tx.state, graph, cache.get(), id, { amount });
      if (['HIDDEN_SYSTEM', 'LOCKED_REQUIREMENT', 'OWNED', 'SELECTED'].includes(selected.status)) return { rejected: true, reason: selected.status };
      if (selected.status === 'NEED_RESOURCE') return { rejected: true, reason: 'NEED_RESOURCE' };
      if (!payCosts(tx, definition, selected.costs)) return { rejected: true, reason: 'NEED_RESOURCE' };
      if (definition.kind === 'building') {
        const quantity = selected.quantity;
        increment(tx, `buildings.${id}`, quantity);
        for (const scope of ['run', 'r', 'ascension', 'total']) {
          const currentMax = tx.state.stats[scope].buildingsMax || 0;
          const total = Object.values(tx.state.buildings).reduce((sum, count) => sum + count, 0);
          if (total > currentMax) tx.write(`stats.${scope}.buildingsMax`, total);
        }
        tx.emit('building.purchased', { buildingId: id, quantity });
      } else {
        if (definition.kind === 'alignment' || definition.kind === 'faction') {
          tx.write(`selections.${definition.kind}`, id);
          tx.emit(definition.kind === 'faction' ? 'faction.joined' : 'alignment.selected', { [`${definition.kind}Id`]: id });
        } else {
          tx.write(`owned.${definition.scope}.${id}`, true);
          if (definition.kind === 'upgrade') for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.upgradesBought`, 1);
          tx.emit('upgrade.purchased', { upgradeId: id });
        }
        applyActions(tx, definition.grants || [], definition);
      }
      return { id };
    });
  }

  function work() {
    return runTransaction('work', tx => {
      const reward = cache.get().clickReward;
      increment(tx, 'resources.coins', reward);
      for (const scope of ['run', 'r', 'ascension', 'total']) {
        increment(tx, `stats.${scope}.clicks`, 1);
        increment(tx, `stats.${scope}.coins`, reward);
        increment(tx, `stats.${scope}.clickCoins`, reward);
      }
      if (tx.state.selections.faction) {
        tx.write('rng', { seed: tx.state.rng.seed, streams: JSON.parse(JSON.stringify(tx.state.rng.streams)) });
        if (drawRandom(tx.state, 'drops') < cache.get().fcChance / 100) {
          const faction = tx.state.selections.faction;
          increment(tx, `resources.factionCoins.${faction}`, 1);
          for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.factionCoins`, 1);
        }
      }
      tx.emit('work.clicked', { reward });
    });
  }

  function cast(id) {
    return runTransaction('cast', tx => {
      const definition = graph.definitionsById.get(id);
      if (!definition || definition.kind !== 'spell') return { rejected: true, reason: 'UNKNOWN_SPELL' };
      if (!evaluateCondition(graph, definition.visible, { state: tx.state })) return { rejected: true, reason: 'UNAVAILABLE_CONTEXT' };
      const selected = selectContent(tx.state, graph, cache.get(), id);
      if (!payCosts(tx, definition, selected.costs)) return { rejected: true, reason: 'NEED_RESOURCE' };
      for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.spellsCast`, 1);
      if (definition.duration > 0) tx.write(`timers.spells.${id}`, { dueAt: tx.state.stats.run.time + definition.duration });
      applyActions(tx, definition.castActions || [], definition);
      tx.emit('spell.cast', { spellId: id, free: false });
    });
  }

  function closeStory(id, { skipped = false } = {}) {
    return runTransaction('story.close', tx => {
      const definition = graph.definitionsById.get(id);
      if (!definition || definition.kind !== 'story' || !tx.state.story.pending.some(item => item.id === id)) return { rejected: true, reason: 'STORY_NOT_PENDING' };
      tx.write('story.pending', tx.state.story.pending.filter(item => item.id !== id));
      tx.write(`story.completed.${id}`, true);
      tx.write(`story.rewarded.${id}`, true);
      applyActions(tx, definition.completionActions || [], definition);
      tx.critical = true;
      tx.emit('story.completed', { storyId: id, skipped });
    });
  }
  function storyChoice(id, choiceId) {
    return runTransaction('story.choice', tx => {
      const definition = graph.definitionsById.get(id);
      const choice = definition?.choices?.find(item => item.id === choiceId);
      if (!choice || !tx.state.story.pending.some(item => item.id === id) || !evaluateCondition(graph, choice.when || null, { state: tx.state })) return { rejected: true, reason: 'INVALID_STORY_CHOICE' };
      tx.write(`story.choices.${id}`, choiceId);
      applyActions(tx, choice.actions || [], definition);
      tx.critical = true;
      tx.emit('story.choice', { storyId: id, choiceId });
    });
  }
  function resetRun(tx, { includeR = false } = {}) {
    const fresh = createSaveState({ seed: tx.state.rng.seed, now: clock.wallNow(), contentVersions: graph.contentVersions });
    for (const key of ['buildings', 'selections', 'spellSources', 'timers']) tx.write(key, resettable(tx.state)[key]);
    const preservedChallenges = Object.fromEntries(Object.entries(tx.state.challenges).filter(([id]) => {
      const scope = graph.definitionsById.get(id)?.scope;
      return includeR ? ['ascension', 'total'].includes(scope) : ['r', 'ascension', 'total'].includes(scope);
    }));
    tx.write('challenges', preservedChallenges);
    tx.write('stats.run', fresh.stats.run);
    if (includeR) tx.write('stats.r', fresh.stats.r);
    tx.write('owned.run', {});
    if (includeR) tx.write('owned.r', {});
    tx.write('resources.coins', 0); tx.write('resources.mana', 0);
    tx.write('resources.factionCoins', includeR ? {} : tx.state.resources.factionCoins);
    cache.invalidate(tx.changedPaths);
  }
  function abdicate() {
    return runTransaction('abdicate', tx => {
      const earned = Math.floor(Math.sqrt((tx.state.stats.run.coins || 0) / 1e8));
      if (earned < 1) { tx.emit('abdication.rejected', { reason: 'TARGET_NOT_MET' }); return { rejected: false }; }
      increment(tx, 'resources.gems', earned);
      increment(tx, 'stats.total.abdications', 1);
      resetRun(tx);
      tx.critical = true;
      tx.emit('abdication.completed', { earned });
      return { earned };
    });
  }
  function reincarnate() {
    return runTransaction('reincarnate', tx => {
      if (tx.state.resources.gems < 1) return { rejected: true, reason: 'NEED_RESOURCE' };
      tx.write('resources.gems', 0);
      tx.write('resources.factionCoins', {});
      const nextReincarnation = (tx.state.progression?.reincarnations || 0) + 1;
      increment(tx, 'stats.total.reincarnations', 1);
      resetRun(tx, { includeR: true });
      tx.write('progression', {
        reincarnations: nextReincarnation,
        ascension: 0, ascensionStartR: 0, ascensionHistory: [],
      });
      // progression is runtime metadata, kept sparse outside the content-owned maps.
      tx.critical = true;
      tx.emit('reincarnation.completed', { reincarnations: tx.state.progression.reincarnations });
    });
  }

  function tickSimulation(tx, delta) {
    const derived = cache.get();
    for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.time`, delta);
    increment(tx, 'resources.coins', derived.production * delta);
    for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.coins`, derived.production * delta);
    tx.write('resources.mana', Math.min(derived.manaMax, tx.state.resources.mana + derived.manaRegen * delta));
    const due = scheduler.due(tx.state.stats.run.time);
    for (const task of due) {
      if (task.payload.kind === 'spell') {
        if (spellActive(tx.state, task.payload.id) || tx.state.timers.spells[task.payload.id]) {
          tx.delete(`timers.spells.${task.payload.id}`);
          tx.emit('spell.expired', { spellId: task.payload.id });
        }
      } else {
        tx.delete(`timers.tasks.${task.payload.id}`);
        tx.emit('task.due', { taskId: task.payload.id });
      }
    }
    if (due.length) { cache.invalidate(tx.changedPaths); cache.get(); }
  }
  function tick(deltaSeconds) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return { ok: false, reason: 'INVALID_DELTA' };
    const delta = Math.min(deltaSeconds, 3600);
    const result = runTransaction('tick', tx => { tickSimulation(tx, delta); });
    persistence.tick(state);
    return result;
  }
  function settleOffline(seconds) {
    if (seconds <= 0 || cache.get().production <= 0) return;
    const plan = planOfflineSegments(seconds, state, scheduler);
    diagnostics.offlineTruncated = plan.truncated;
    runTransaction('offline', tx => {
      const before = tx.state.resources.coins;
      for (const segment of plan.segments) tickSimulation(tx, segment);
      const earned = tx.state.resources.coins - before;
      for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.offlineTime`, seconds - plan.remaining);
      tx.emit('offline.settled', { seconds, earned, segments: plan.segments.length, truncated: plan.truncated });
      tx.critical = true;
    });
  }
  function updateSetting(key, value) {
    if (!['buyAmount', 'quickSkills'].includes(key)) return { ok: false, reason: 'UNKNOWN_SETTING' };
    return runTransaction('setting', tx => { tx.write(`settings.${key}`, value); });
  }

  async function start() {
    const loaded = saveAdapter.load();
    const migrated = migrateAndNormalizeState(loaded.raw, graph, { now: clock.wallNow(), seed });
    state = migrated.state;
    diagnostics.recoveredSave = Boolean(loaded.recovered);
    diagnostics.migration = migrated.report;
    for (const [id, timer] of Object.entries(state.timers.spells)) {
      if (timer.dueAt === undefined) state.timers.spells[id] = { dueAt: state.stats.run.time + timer.remaining };
    }
    cache = new RuntimeCache(state, graph);
    cache.rebuild(); rebuildScheduler(); started = true; stopped = false;
    const away = Math.max(0, (clock.wallNow() - state.lastWallClock) / 1000);
    if (away > 10) settleOffline(away);
    notify('start');
    return { ok: true, migration: migrated.report, recovered: diagnostics.recoveredSave };
  }
  function select(selector, args = {}) {
    if (!state) return null;
    if (selector === 'content') return selectors.get(state, graph, cache.get(), args.id, args);
    if (selector === 'derived') return cache.get();
    if (selector === 'state') return state;
    if (selector === 'graph') return graph;
    if (selector === 'storyQueue') return state.story.pending.map(item => graph.definitionsById.get(item.id));
    if (selector === 'retirement') {
      const earned = Math.floor(Math.sqrt((state.stats.run.coins || 0) / 1e8));
      return { earned, eligible: earned >= 1, target: 1e8 };
    }
    if (selector === 'stateHash') return stateHash(state);
    if (selector === 'saveStatus') return { dirty: persistence.saveDirty, error: persistence.lastSaveError };
    throw new Error(`Unknown selector ${selector}`);
  }
  async function save() {
    if (!state) return { ok: false };
    state.lastSave = clock.wallNow(); state.lastWallClock = clock.wallNow();
    const result = persistence.save(state);
    notify('save');
    return result;
  }
  function stop() { stopped = true; }

  return Object.freeze({
    start, stop, select, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(command) {
      switch (command.type) {
        case 'start': return runTransaction('start', tx => tx.emit('game.started', {}));
        case 'work': return work();
        case 'purchase': return purchase(command.id, command.amount);
        case 'cast': return cast(command.id);
        case 'story.close': return closeStory(command.id, command);
        case 'story.choice': return storyChoice(command.id, command.choiceId);
        case 'abdicate': return abdicate();
        case 'reincarnate': return reincarnate();
        case 'setting': return updateSetting(command.key, command.value);
        default: return { ok: false, reason: 'UNKNOWN_COMMAND' };
      }
    },
    tick, save,
    get graph() { return graph; },
  });
}
