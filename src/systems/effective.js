import { evaluateCondition } from './content-registry.js';

export const hasRunUpgrade = (state, id) => Boolean(state.owned.run[id]);

export function isSpellActive(state, id) {
  const timer = state.timers.spells[id];
  return Boolean(timer && (timer.dueAt !== undefined ? timer.dueAt > state.stats.run.time : timer.remaining > 0));
}

export function availableBuildings(state, graph) {
  return (graph.arraysByKind.get('building') || []).filter(definition =>
    (definition.alignment === 'any' || definition.alignment === state.selections.alignment)
    && (!definition.requiresAlignment || Boolean(state.selections.alignment)));
}

export function currentTierBuildingId(state, graph, tier) {
  return availableBuildings(state, graph).find(definition => definition.tier === tier)?.id || null;
}

export function highestThreeBuildingIds(state, graph) {
  const tiers = [...new Set(availableBuildings(state, graph).map(definition => definition.tier))].sort((a, b) => b - a).slice(0, 3);
  return availableBuildings(state, graph).filter(definition => tiers.includes(definition.tier)).map(definition => definition.id);
}

export function effectiveBuildingCount(state, graph, id, rawCount = state.buildings[id] || 0) {
  let count = rawCount;
  if (hasRunUpgrade(state, 'undead-7')) count *= 1.75;
  if (hasRunUpgrade(state, 'demon-7') && highestThreeBuildingIds(state, graph).includes(id)) count *= 2;
  return count;
}

export function elvenDiplomacyBonus(state) {
  return hasRunUpgrade(state, 'elven-7')
    ? 1.5 * Math.log(1 + (state.stats.run.factionCoins || 0)) ** 1.15
    : 0;
}

export function effectiveClicksR(state) {
  return (state.stats.r.clicks || 0) * (1 + elvenDiplomacyBonus(state) / 100);
}

export function effectiveSpellActivity(state, scope, id) {
  const value = state.stats[scope]?.spellActivity?.[id] || 0;
  return value * (hasRunUpgrade(state, 'undead-7') ? 1.75 : 1);
}

export function effectiveOfflineTime(state, scope = 'ascension') {
  return (state.stats[scope]?.offlineTime || 0) * (hasRunUpgrade(state, 'trueNightUpgrade') ? 1.5 : 1);
}

export function originalTrophyCount(state, graph) {
  return (graph.arraysByKind.get('trophy') || []).filter(definition => definition.originalTrophy === true && state.permanentUnlocks[definition.id]).length;
}

export function effectiveAssistants(state, realAssistants) {
  return realAssistants * (hasRunUpgrade(state, 'fairyChoirUpgrade') && isSpellActive(state, 'fairyChanting') ? 3 : 1);
}

export function spellDuration(state, graph, definition, derived) {
  let duration = definition.duration || 0;
  if (definition.id === 'godsHand') duration += Math.floor((state.stats.r.alignmentTime?.good || 0) ** 0.5);
  let multiplier = 1;
  if (hasRunUpgrade(state, 'angel-5')) multiplier *= 1.5;
  if (definition.id === 'nightTime' && hasRunUpgrade(state, 'undead-4')) {
    const found = state.stats.ascension.factionCoinsByFaction.undead || 0;
    multiplier *= 1 + (5 + 1.5 * Math.log(1 + found) ** 1.5) / 100;
  }
  return duration * multiplier;
}

export function longestSpellDuration(state, graph, derived) {
  let longest = 0;
  for (const definition of graph.arraysByKind.get('spell') || []) {
    if (!evaluateCondition(graph, definition.visible, { state, derived })) continue;
    longest = Math.max(longest, spellDuration(state, graph, definition, derived));
  }
  return longest;
}

export function spellCost(state, definition, baseCost) {
  let cost = Math.max(0, baseCost);
  if (hasRunUpgrade(state, 'angel-8')) cost *= 0.5;
  if (definition.id === 'taxCollection' && hasRunUpgrade(state, 'greedDriveUpgrade') && isSpellActive(state, 'goblinsGreed')) cost *= 0.9;
  return Math.max(0, Math.floor(cost));
}


export function offlineSpellCastCount(state, baseCasts, offlineManaPerSecond) {
  const bonus = hasRunUpgrade(state, 'angel-5') ? 5 * Math.log(1 + offlineManaPerSecond) : 0;
  return baseCasts * (1 + 0.01 * bonus);
}

export function nightTimeActivityR(state) {
  return (state.stats.r.spellActivity.nightTime || 0)
    + (hasRunUpgrade(state, 'undead-6') ? state.stats.ascension.offlineTime || 0 : 0);
}
