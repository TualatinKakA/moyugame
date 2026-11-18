import { compileContentGraph, evaluateCondition, pathValue, resourcePath } from './content-registry.js';
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
import { gemsForRunCoins, reincarnationRequirement } from './progression.js';

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
  const diagnostics = { lastTransaction: null, recoveredSave: false, migration: null, offlineTruncated: false, lastOfflineReport: null };

  function notify(type, transaction = null) {
    const message = { type, commandType: transaction?.commandType || null, revision: state?.revision || 0, changedPaths: transaction ? [...transaction.changedPaths] : [], facts: transaction?.facts || [], diagnostics };
    for (const listener of listeners) listener(message);
  }
  function rebuildScheduler() {
    scheduler.clear();
    if (!state) return;
    for (const [id, timer] of Object.entries(state.timers.spells)) scheduler.register(`spell:${id}`, timer.dueAt, { kind: 'spell', id });
    for (const [id, timer] of Object.entries(state.timers.tasks)) {
      if (id !== 'greenFingersDiscount') scheduler.register(`task:${id}`, timer.dueAt, { kind: 'task', id });
    }
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
    const transactionDerived = cache.get();
    activeTransaction = transaction;
    try {
      const result = callback(transaction);
      if (result?.rejected) { transaction.rollback(); return { ok: false, reason: result.reason }; }
      processReactions(transaction, graph, { enqueueStory, awardTrophy, applyActions, completeChallenge }, { derived: transactionDerived });
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

  function grantFactionCoins(tx, { factionId, amount, source, sourceId = null, mode = 'online' }) {
    const definition = graph.definitionsById.get(factionId);
    if (definition?.kind !== 'faction' || definition.factionCoin?.enabled !== true) throw new Error(`Invalid faction coin target ${factionId}`);
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid faction coin amount for ${sourceId || source}`);
    if (amount === 0) return false;
    increment(tx, `resources.factionCoins.${factionId}`, amount);
    for (const scope of ['run', 'r', 'ascension', 'total']) {
      increment(tx, `stats.${scope}.factionCoins`, amount);
      increment(tx, `stats.${scope}.factionCoinsByFaction.${factionId}`, amount);
    }
    tx.emit('factionCoins.found', { factionId, amount, source, sourceId, mode });
    return true;
  }

  function eligibleFactionCoins(currentState) {
    return (graph.arraysByKind.get('faction') || []).filter(definition => definition.factionCoin?.enabled === true
      && evaluateCondition(graph, definition.factionCoin.dropUnlock, { state: currentState, derived: cache.get() }));
  }

  function random(tx, stream) {
    if (!tx.oldValues.has('rng')) tx.write('rng', { seed: tx.state.rng.seed, streams: JSON.parse(JSON.stringify(tx.state.rng.streams)) });
    return drawRandom(tx.state, stream);
  }

  function chooseFactionCoin(tx, entries, stream) {
    if (!entries.length) return null;
    const totalWeight = entries.reduce((sum, definition) => sum + definition.factionCoin.baseWeight, 0);
    let roll = random(tx, stream) * totalWeight;
    for (const definition of entries) {
      roll -= definition.factionCoin.baseWeight;
      if (roll < 0) return definition.id;
    }
    return entries.at(-1).id;
  }

  function settleAssistantFactionCoins(tx, delta, offline, derived) {
    const entries = eligibleFactionCoins(tx.state);
    const total = derived.assistants * 0.2 * (derived.fcChance / 100) * derived.clickReward * delta;
    if (!entries.length || total <= 0) return;
    const amount = total / entries.length;
    for (const definition of entries) grantFactionCoins(tx, {
      factionId: definition.id, amount, source: 'assistant', mode: offline ? 'offline' : 'online',
    });
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
        if (amount === 0) continue;
        if (action.resource.startsWith('factionCoin.')) {
          const randomEligible = ['factionCoin.randomEligible', 'factionCoin.randomUnlocked'].includes(action.resource);
          const factionId = randomEligible ? chooseFactionCoin(tx, eligibleFactionCoins(tx.state), `drops:${definition.id}`) : null;
          const path = randomEligible ? null : resourcePath(tx.state, action.resource, definition.id);
          const targetFaction = factionId || path?.slice('resources.factionCoins.'.length);
          if (!targetFaction) throw new Error(`No eligible faction for ${action.resource}`);
          grantFactionCoins(tx, { factionId: targetFaction, amount, source: definition.kind, sourceId: definition.id });
        } else {
          increment(tx, `resources.${action.resource}`, amount);
        }
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
    const paths = costs.map(cost => resourcePath(tx.state, cost.resource, definition.id));
    for (let index = 0; index < costs.length; index++) {
      const path = paths[index];
      if (!path || (pathValue(tx.state, path) || 0) < costs[index].value) return false;
    }
    for (let index = 0; index < costs.length; index++) increment(tx, paths[index], -costs[index].value);
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
          const buildingMax = tx.state.stats[scope].buildingMax[id] || 0;
          if (tx.state.buildings[id] > buildingMax) tx.write(`stats.${scope}.buildingMax.${id}`, tx.state.buildings[id]);
        }
        tx.emit('building.purchased', { buildingId: id, quantity });
      } else {
        if (definition.kind === 'alignment' || definition.kind === 'faction') {
          tx.write(`selections.${definition.kind}`, id);
          tx.emit(definition.kind === 'faction' ? 'faction.joined' : 'alignment.selected', { [`${definition.kind}Id`]: id });
        } else {
          tx.write(`owned.${definition.scope}.${id}`, true);
          if (id === 'goblin-9') tx.write('timers.tasks.greenFingersDiscount', { dueAt: tx.state.stats.run.time + 600 });
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
      const eligible = eligibleFactionCoins(tx.state);
      if (eligible.length && random(tx, 'drops:manualClick') < cache.get().fcChance / 100) {
        const factionId = chooseFactionCoin(tx, eligible, 'drops:manualClick');
        grantFactionCoins(tx, { factionId, amount: cache.get().clickReward, source: 'manualClick' });
      }
      tx.emit('work.clicked', { reward });
    });
  }

  function recordSpellCast(tx, id) {
    for (const scope of ['run', 'r', 'ascension', 'total']) {
      increment(tx, `stats.${scope}.spellsCast`, 1);
      increment(tx, `stats.${scope}.spellCasts.${id}`, 1);
    }
  }

  function cast(id) {
    return runTransaction('cast', tx => {
      const definition = graph.definitionsById.get(id);
      if (!definition || definition.kind !== 'spell') return { rejected: true, reason: 'UNKNOWN_SPELL' };
      if (!evaluateCondition(graph, definition.visible, { state: tx.state, derived: cache.get() })) return { rejected: true, reason: 'UNAVAILABLE_CONTEXT' };
      const selected = selectContent(tx.state, graph, cache.get(), id);
      if (!payCosts(tx, definition, selected.costs)) return { rejected: true, reason: 'NEED_RESOURCE' };
      recordSpellCast(tx, id);
      if (definition.duration > 0) tx.write(`timers.spells.${id}`, { dueAt: tx.state.stats.run.time + definition.duration });
      applyActions(tx, definition.castActions || [], definition);
      tx.emit('spell.cast', { spellId: id, free: false });
      if (id !== 'taxCollection' && tx.state.owned.run['goblin-7']) {
        const taxCollection = graph.definitionsById.get('taxCollection');
        applyActions(tx, taxCollection.castActions || [], taxCollection);
        recordSpellCast(tx, 'taxCollection');
        tx.emit('spell.cast', { spellId: 'taxCollection', free: true });
      }
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
      if (!choice || !tx.state.story.pending.some(item => item.id === id) || !evaluateCondition(graph, choice.when || null, { state: tx.state, derived: cache.get() })) return { rejected: true, reason: 'INVALID_STORY_CHOICE' };
      tx.write(`story.choices.${id}`, choiceId);
      applyActions(tx, choice.actions || [], definition);
      tx.critical = true;
      tx.emit('story.choice', { storyId: id, choiceId });
    });
  }
  function resetRun(tx, { includeR = false, preserveAllChallenges = false } = {}) {
    const fresh = createSaveState({ seed: tx.state.rng.seed, now: clock.wallNow(), contentVersions: graph.contentVersions });
    for (const key of ['buildings', 'selections', 'spellSources', 'timers']) tx.write(key, resettable(tx.state)[key]);
    const preservedChallenges = Object.fromEntries(Object.entries(tx.state.challenges).filter(([id]) => {
      const scope = graph.definitionsById.get(id)?.scope;
      if (preserveAllChallenges) return true;
      return includeR ? ['ascension', 'total'].includes(scope) : ['r', 'ascension', 'total'].includes(scope);
    }));
    tx.write('challenges', preservedChallenges);
    tx.write('stats.run', fresh.stats.run);
    if (includeR) tx.write('stats.r', fresh.stats.r);
    tx.write('owned.run', {});
    if (includeR) tx.write('owned.r', {});
    tx.write('resources.coins', 0); tx.write('resources.mana', 0);
    tx.write('resources.factionCoins', {});
    cache.invalidate(tx.changedPaths);
  }
  function abdicate() {
    return runTransaction('abdicate', tx => {
      const runCoins = tx.state.stats.run.coins || 0;
      const earned = gemsForRunCoins(runCoins);
      const firstRetirement = (tx.state.stats.total.abdications || 0) === 0;
      const eligible = firstRetirement ? runCoins >= 1e8 : true;
      if (!eligible) { tx.emit('abdication.rejected', { reason: 'TARGET_NOT_MET' }); return { rejected: false }; }
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
      const requirement = reincarnationRequirement(tx.state.progression.reincarnations);
      if (tx.state.resources.gems < requirement) return { rejected: true, reason: 'NEED_RESOURCE' };
      tx.write('resources.gems', 0);
      tx.write('resources.factionCoins', {});
      const nextReincarnation = (tx.state.progression?.reincarnations || 0) + 1;
      increment(tx, 'stats.total.reincarnations', 1);
      resetRun(tx, { includeR: true, preserveAllChallenges: true });
      tx.write('progression', {
        reincarnations: nextReincarnation,
        ascension: 0, ascensionStartR: 0, ascensionHistory: [],
      });
      // progression is runtime metadata, kept sparse outside the content-owned maps.
      tx.critical = true;
      tx.emit('reincarnation.completed', { reincarnations: tx.state.progression.reincarnations });
    });
  }

  function triggerGreenFingersDiscount(tx, task, offline, derived) {
    const count = Math.floor((tx.state.stats.run.time - task.dueAt) / 600) + 1;
    let seconds = 0;
    let earned = 0;
    for (let index = 0; index < count; index++) {
      const rollSeconds = 1 + Math.floor(random(tx, 'greenFingersDiscount') * 2500);
      const reward = derived.production * rollSeconds;
      seconds += rollSeconds;
      earned += reward;
      increment(tx, 'resources.coins', reward);
      for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.coins`, reward);
    }
    tx.write('timers.tasks.greenFingersDiscount', { dueAt: task.dueAt + count * 600 });
    tx.emit('greenFingersDiscount.triggered', { count, seconds, earned, mode: offline ? 'offline' : 'online' });
  }

  function tickSimulation(tx, delta, offline = false) {
    const derived = cache.get();
    const production = derived.production * (offline ? derived.offlineMultiplier : 1);
    for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.time`, delta);
    increment(tx, 'resources.coins', production * delta);
    for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.coins`, production * delta);
    tx.write('resources.mana', Math.min(derived.manaMax, tx.state.resources.mana + derived.manaRegen * delta));
    settleAssistantFactionCoins(tx, delta, offline, derived);
    const greenFingersTimer = tx.state.timers.tasks.greenFingersDiscount;
    if (tx.state.owned.run['goblin-9'] && greenFingersTimer && greenFingersTimer.dueAt <= tx.state.stats.run.time) {
      triggerGreenFingersDiscount(tx, greenFingersTimer, offline, derived);
    }
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
    if (seconds <= 0 || cache.get().production <= 0) return null;
    const plan = planOfflineSegments(seconds, state, scheduler);
    diagnostics.offlineTruncated = plan.truncated;
    let report = null;
    const result = runTransaction('offline', tx => {
      const before = tx.state.resources.coins;
      const beforeFactionFound = { ...tx.state.stats.run.factionCoinsByFaction };
      for (const segment of plan.segments) tickSimulation(tx, segment, true);
      const earned = tx.state.resources.coins - before;
      const factionCoinsFound = {};
      for (const definition of graph.arraysByKind.get('faction') || []) {
        if (definition.factionCoin?.enabled !== true) continue;
        const amount = (tx.state.stats.run.factionCoinsByFaction[definition.id] || 0) - (beforeFactionFound[definition.id] || 0);
        if (amount > 0) factionCoinsFound[definition.id] = amount;
      }
      for (const scope of ['run', 'r', 'ascension', 'total']) increment(tx, `stats.${scope}.offlineTime`, seconds - plan.remaining);
      report = { seconds, earned, segments: plan.segments.length, truncated: plan.truncated, factionCoinsFound };
      tx.emit('offline.settled', report);
      tx.critical = true;
    });
    if (result.ok) diagnostics.lastOfflineReport = report;
    return result.ok ? report : null;
  }
  function updateSetting(key, value) {
    if (!['buyAmount', 'quickSkills', 'manaRegenOverride'].includes(key)) return { ok: false, reason: 'UNKNOWN_SETTING' };
    if (key === 'manaRegenOverride' && value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0)) return { ok: false, reason: 'INVALID_SETTING' };
    return runTransaction('setting', tx => { tx.write(`settings.${key}`, key === 'manaRegenOverride' && value !== null ? Number(value) : value); });
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
    for (const [id, timer] of Object.entries(state.timers.tasks)) {
      if (timer.dueAt === undefined) state.timers.tasks[id] = { dueAt: state.stats.run.time + (timer.remaining || 0) };
    }
    if (state.owned.run['goblin-9'] && !state.timers.tasks.greenFingersDiscount) {
      state.timers.tasks.greenFingersDiscount = { dueAt: state.stats.run.time + 600 };
    }
    if (!state.owned.run['goblin-9']) delete state.timers.tasks.greenFingersDiscount;
    cache = new RuntimeCache(state, graph);
    cache.rebuild(); rebuildScheduler(); started = true; stopped = false;
    const away = Math.max(0, (clock.wallNow() - state.lastWallClock) / 1000);
    if (away > 10) settleOffline(away);
    notify('start');
    return { ok: true, migration: migrated.report, recovered: diagnostics.recoveredSave, offlineReport: diagnostics.lastOfflineReport };
  }
  function select(selector, args = {}) {
    if (!state) return null;
    if (selector === 'content') return selectors.get(state, graph, cache.get(), args.id, args);
    if (selector === 'derived') return cache.get();
    if (selector === 'factionCoins') {
      const derived = cache.get();
      const factions = (graph.arraysByKind.get('faction') || []).filter(definition => definition.factionCoin?.enabled === true);
      const pool = eligibleFactionCoins(state).map(definition => ({ factionId: definition.id, weight: definition.factionCoin.baseWeight }));
      const assistantPerSecond = pool.length ? derived.assistants * 0.2 * (derived.fcChance / 100) * derived.clickReward : 0;
      const assistantShare = pool.length ? assistantPerSecond / pool.length : 0;
      return {
        chance: derived.fcChance,
        balances: Object.fromEntries(factions.map(definition => [definition.id, state.resources.factionCoins[definition.id] || 0])),
        found: Object.fromEntries(['run', 'r', 'ascension', 'total'].map(scope => [scope, state.stats[scope].factionCoins || 0])),
        foundByFaction: Object.fromEntries(['run', 'r', 'ascension', 'total'].map(scope => [scope,
          Object.fromEntries(factions.map(definition => [definition.id, state.stats[scope].factionCoinsByFaction[definition.id] || 0])),
        ])),
        pool,
        assistant: {
          totalPerSecond: assistantPerSecond,
          perFaction: Object.fromEntries(pool.map(entry => [entry.factionId, assistantShare])),
        },
      };
    }
    if (selector === 'state') return state;
    if (selector === 'graph') return graph;
    if (selector === 'storyQueue') return state.story.pending.map(item => graph.definitionsById.get(item.id));
    if (selector === 'retirement') {
      const earned = gemsForRunCoins(state.stats.run.coins || 0);
      const firstRetirement = (state.stats.total.abdications || 0) === 0;
      return { earned, eligible: firstRetirement ? state.stats.run.coins >= 1e8 : true, target: firstRetirement ? 1e8 : 0 };
    }
    if (selector === 'reincarnation') {
      const requirement = reincarnationRequirement(state.progression.reincarnations);
      return { requirement, visible: state.resources.gems >= requirement, nextR: state.progression.reincarnations + 1 };
    }
    if (selector === 'stateHash') return stateHash(state);
    if (selector === 'lastOfflineReport') return diagnostics.lastOfflineReport;
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
