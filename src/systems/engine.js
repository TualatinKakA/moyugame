import { BUILDINGS, BUILDING_BY_ID, availableBuildings } from '../content/r0r3/buildings.js';
import BUILDING_UPGRADES from '../content/r0r3/building-upgrades.js';
import FACTIONS from '../content/r0r3/factions.js';
import { SPELLS, SPELL_BY_ID } from '../content/r0r3/spells.js';
import { MISC_BY_ID } from '../content/r0r3/misc-upgrades.js';
import { CHALLENGE_BY_ID } from '../content/r0r3/challenges.js';
import { createModifiers, applyFactionUpgrade } from './effects.js';
import { emptyStats, createState } from '../core/state.js';
import { evaluateFormula } from './formula.js';

export const FACTION_BY_ID = Object.fromEntries(FACTIONS.map(f => [f.id, f]));
export const ALL_UPGRADES = [...BUILDING_UPGRADES, ...FACTIONS.flatMap(f => f.upgrades.map(u => ({ ...u, faction: f.id })))];
export const UPGRADE_BY_ID = Object.fromEntries(ALL_UPGRADES.map(u => [u.id, u]));
const LOW3 = ['farm', 'inn', 'blacksmith'];

export function coinsToGems(coins) {
  return Math.floor(((1 + 4 * coins / 5e11) ** 0.5 - 1) / 2);
}
export function gemsToCoins(gems) {
  return gems * (gems + 1) * 5e11;
}
export function reincarnationRequirement(reincarnations) {
  return 1e27 * 1000 ** reincarnations;
}
export function buildingCost(state, id, offset = state.buildings[id] || 0, mods = null) {
  const b = BUILDING_BY_ID[id];
  const reduction = (mods?.buildingCostReduce || 0) + (mods?.buildingCostReduceById?.[id] || 0);
  return Math.ceil(b.cost * Math.max(1.01, 1.15 - reduction) ** offset);
}
export function buildingQuote(state, id, amount = state.settings.buyAmount, mods = null) {
  let qty = 0, cost = 0;
  const target = amount === 'max' ? 10000 : Number(amount);
  while (qty < target) {
    const next = buildingCost(state, id, (state.buildings[id] || 0) + qty, mods);
    if (amount === 'max' && cost + next > state.coins) break;
    cost += next; qty++;
  }
  return { qty, cost };
}
export function excavationCost(state, mods = null) {
  const reduction = mods?.excavationCostReduce || 0;
  return Math.ceil(1e27 * Math.max(1.01, 1.2 - reduction) ** state.excavationCount);
}
export function royalExchangeCost(state, factionId, mods = null) {
  const count = state.stats.total.exchangesByFaction?.[factionId] || 0;
  const reduction = (mods?.exchangeCostReduce || 0) + (mods?.exchangeCostReduceByFaction?.[factionId] || 0);
  return Math.ceil(100 * Math.max(1.01, 1.1 - reduction) ** count);
}

function totalBuildings(state) {
  return Object.values(state.buildings).reduce((a, b) => a + b, 0);
}
function activeCount(state) {
  return Object.values(state.activeSpells).filter(v => v > 0).length;
}
function derivedContext(state, mods) {
  return {
    assistants: Math.max(0, Math.floor(mods.assistantsAdd * mods.assistantsMult)),
    manaMax: Math.max(1, (1000 + mods.manaMaxAdd) * mods.manaMaxMult),
    manaRegen: Math.max(0, (1 + mods.manaRegenAdd + 2 * state.reincarnations) * mods.manaRegenMult),
    exchangeBonus: Math.max(0, mods.exchangeAdd * mods.exchangeMult),
    longestSpellDuration: Math.max(0, ...SPELLS.filter(s => spellAvailable(state, s.id)).map(s => s.duration)),
  };
}
function applyBuildingUpgrades(mods, state) {
  for (const id of state.upgrades) {
    const u = BUILDING_UPGRADES.find(x => x.id === id);
    if (!u) continue;
    mods.buildingAdd[u.building] = (mods.buildingAdd[u.building] || 0) + u.bonusPercent;
    mods.assistantsAdd += u.assistants || 0;
    if (u.globalPercentPerTrophy) mods.globalAdd += u.globalPercentPerTrophy * state.trophies.length;
  }
}
function applyReincarnation(mods, state) {
  const R = state.reincarnations;
  if (R >= 1) {
    mods.globalAdd += 50 * R;
    mods.offlineAdd += 500 * R;
    mods.fcChanceAdd += 10 * R;
  }
  if (R >= 2) mods.gemPerGemAdd += 0.2 * R;
}
function applyActiveSpells(mods, state) {
  for (const [id, remaining] of Object.entries(state.activeSpells)) {
    if (remaining <= 0) continue;
    const s = SPELL_BY_ID[id];
    if (!s) continue;
    const context = {
      buildingsTotal: totalBuildings(state), clicksR: state.stats.r.clicks,
      manaRegen: state._derived.manaRegen, factionCoinsTotal: state.stats.total.factionCoins,
      trophies: state.trophies.length, gems: state.gems,
      comboCasts: state.stats.total.comboCasts || 0,
    };
    if (s.formula && s.effect) {
      const x = s.x === 'manaRegen' ? state._derived.manaRegen : context[s.x] || 0;
      const formula = id === 'comboStrike' && state.trophies.includes('perfectCombo') ? '(40 * x ^ 0.9)%' : s.formula;
      const value = evaluateFormula(formula, { x, R: state.reincarnations, A: 0 });
      if (s.effect.stat === 'globalAdd') mods.globalAdd += value;
      if (s.effect.stat === 'buildingAdd') for (const target of s.effect.targets) mods.buildingAdd[target] = (mods.buildingAdd[target] || 0) + value;
    }
    if (id === 'holyLight') mods.clickMult *= 18.5;
    if (id === 'bloodFrenzy') mods.alignmentAdd.evil += 1250;
    if (id === 'fairyChanting') {
      for (const target of LOW3) mods.buildingAdd[target] = (mods.buildingAdd[target] || 0) + 50000;
      if (state.trophies.includes('fairyChoir')) mods.assistantsMult *= 3;
    }
    if (id === 'nightTime') mods.assistantProdAdd += (state.trophies.includes('trueNight') ? 40 : 30) * state.buildings.necropolis;
    if (id === 'hellfireBlast' && state.trophies.includes('hellRush')) {
      const value = evaluateFormula(s.formula, { x: state.trophies.length });
      mods.buildingAdd.hallOfLegends = (mods.buildingAdd.hallOfLegends || 0) + value;
    }
    if (id === 'diamondPickaxe') {
      mods.clickMult *= 1 + 0.25 * state.stats.r.excavations;
      mods.fcChanceAdd += state.trophies.includes('minedwarf') ? 300 : 200;
    }
    if (id === 'brainwave') mods.globalAdd += (state.trophies.includes('facelessOvermind') ? 3 : 2) * state.spellBrainwaveStacks;
    if (id === 'lightningStrike' && mods.lightningTarget) {
      const count = state.buildings.ironStronghold;
      multiply(mods.buildingMult, mods.lightningTarget, 1 + (state.trophies.includes('lightningStorm') ? 7.5 : 5) * count);
      mods.fcChanceMult *= 1 + evaluateFormula(s.fcFormula, { x: state.gems }) / 100;
    }
    if (id === 'grandBalance' && mods.balanceTarget) {
      const counts = Object.values(state.buildings).sort((a, b) => b - a);
      const value = evaluateFormula(s.formula, { x: counts[0] || 0, y: counts[1] || 0, z: counts[2] || 0, A: 0 });
      mods.buildingAdd[mods.balanceTarget] = (mods.buildingAdd[mods.balanceTarget] || 0) + value;
    }
  }
}
function finalizeDerived(state, mods) {
  const d = derivedContext(state, mods);
  state._derived = { ...state._derived, ...d };
  return d;
}

function applyMiscUpgrades(mods, state) {
  for (const id of state.upgrades) {
    const u = MISC_BY_ID[id];
    if (!u) continue;
    mods.clickAdd += u.clickAdd || 0;
    mods.globalAdd += u.globalAdd || 0;
    mods.offlineAdd += u.offlineAdd || 0;
    mods.clickProductionShare += u.productionShare || 0;
    if (u.clickPercent) mods.clickMult *= 1 + u.clickPercent / 100;
    if (u.globalPerAssistant) mods.globalAdd += u.globalPerAssistant * (state._derived?.assistants || 0);
    if (u.alignmentAdd) mods.alignmentAdd[u.alignment || 'neutral'] += u.alignmentAdd;
    if (['gemPotency', 'gemSupremacy', 'gemSovereignty'].includes(id)) mods.gemPerGemAdd += 1;
  }
}

function applyChallengeEffects(mods, state) {
  if (state.challenges.includes('fairy1')) mods.assistantsAdd += 2 * (state.stats.total.upgradesByFaction.fairy || 0);
  if (state.challenges.includes('elf1')) mods.exchangeCostReduceByFaction.elf = 0.025;
  if (state.challenges.includes('angel1')) mods.spellCostMult *= 0.9;
  if (state.challenges.includes('demon1')) {
    const count = state.stats.total.upgradesBought;
    mods.globalAdd += count;
    mods.fcChanceAdd += count;
  }
}

export function computeState(state) {
  let mods;
  for (let pass = 0; pass < 2; pass++) {
    mods = createModifiers();
    applyReincarnation(mods, state);
    applyBuildingUpgrades(mods, state);
    for (const id of state.upgrades) {
      const u = UPGRADE_BY_ID[id];
      if (u?.faction) applyFactionUpgrade(mods, state, u);
    }
    for (const id of state.mercenary.upgrades) {
      const u = UPGRADE_BY_ID[id];
      if (u) applyFactionUpgrade(mods, state, u);
    }
    applyMiscUpgrades(mods, state);
    applyChallengeEffects(mods, state);
    const exchanges = state.stats.total.exchanges || 0;
    mods.exchangeAdd += 10 * exchanges;
    mods.globalAdd += 10 * exchanges;
    mods.lightningTarget = state.lightningTarget || null;
    mods.balanceTarget = state.balanceTarget || null;
    applyActiveSpells(mods, state);
    finalizeDerived(state, mods);
  }
  return calculateProduction(state, mods);
}

function calculateProduction(state, mods) {
  const outputs = {};
  const gemBonus = state.upgrades.includes('gemPower')
    ? Math.max(0, 1 + state.gems * (0.02 + mods.gemPerGemAdd / 100) * mods.gemPowerMult)
    : 1;
  const global = (1 + mods.globalAdd / 100) * mods.globalMult * gemBonus;
  for (const b of BUILDINGS) {
    const count = state.buildings[b.id] * mods.buildingCountMult * (mods.buildingCountMultById[b.id] || 1);
    const base = b.rate + (mods.buildingBaseAdd[b.id] || 0);
    const trophyRate = b.perTrophy ? state.trophies.length : 1;
    const local = (1 + (mods.buildingAdd[b.id] || 0) / 100 + (mods.alignmentAdd[b.alignment] || 0) / 100);
    const localMult = mods.buildingMult[b.id] || 1;
    outputs[b.id] = count * base * trophyRate * local * localMult * global;
  }
  const assistants = Math.max(0, Math.floor(mods.assistantsAdd * mods.assistantsMult));
  const assistantOutput = assistants * 0.2 * (1 + mods.assistantProdAdd / 100) * mods.assistantProdMult * global;
  const buildingProduction = Object.values(outputs).reduce((a, b) => a + b, 0);
  const production = buildingProduction + assistantOutput;
  let clickBase = (1 + mods.clickAdd) * mods.clickCountMult;
  clickBase += production * mods.clickProductionShare;
  if (mods.special.has('goldenPots')) clickBase += LOW3.reduce((sum, id) => sum + outputs[id], 0) * 0.2;
  if (mods.special.has('sylvanTreasure')) clickBase += buildingProduction * 0.5;
  const clickReward = clickBase * mods.clickMult;
  let fcChance = Math.max(0, (10 + mods.fcChanceAdd) * mods.fcChanceMult);
  if (state.upgrades.includes('gemPower')) {
    const gemUpgrades = ['gemPotency', 'gemSupremacy', 'gemSovereignty'].filter(id => state.upgrades.includes(id)).length;
    fcChance += Math.floor((1.25 + gemUpgrades / 4) * Math.log(1 + state.gems) ** 0.9 / Math.log(10));
  }
  const exchangeBonus = Math.max(0, mods.exchangeAdd * mods.exchangeMult);
  const result = { outputs, buildingProduction, assistantOutput, production, clickReward, assistants, fcChance, exchangeBonus, mods };
  state._derived = { ...state._derived, ...result, productionTotal: production };
  return result;
}

function earnCoins(state, amount, click = false) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  state.coins += amount;
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].coins += amount;
    if (click) state.stats[scope].clickCoins += amount;
  }
}

export function buyBuilding(state, id, amount = state.settings.buyAmount) {
  const b = BUILDING_BY_ID[id];
  if (!b || !availableBuildings(state).includes(b)) return false;
  const mods = computeState(state).mods;
  const quote = buildingQuote(state, id, amount, mods);
  if (!quote.qty || state.coins < quote.cost || (amount !== 'max' && quote.qty !== Number(amount))) return false;
  state.coins -= quote.cost;
  state.buildings[id] += quote.qty;
  const total = totalBuildings(state);
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].buildingMax[id] = Math.max(state.stats[scope].buildingMax[id] || 0, state.buildings[id]);
    state.stats[scope].buildingsMax = Math.max(state.stats[scope].buildingsMax || 0, total);
  }
  return true;
}

export function buyBuildingUpgrade(state, id) {
  const u = BUILDING_UPGRADES.find(x => x.id === id);
  if (!u || state.upgrades.includes(id) || state.buildings[u.building] < u.requirement || state.coins < u.cost) return false;
  state.coins -= u.cost;
  state.upgrades.push(id);
  for (const scope of ['run', 'r', 'total']) state.stats[scope].upgradesBought++;
  return true;
}

export function requirementMet(state, req = {}) {
  const d = computeState(state);
  if (req.gems && state.gems < req.gems) return false;
  if (req.clicksTotal && state.stats.total.clicks < req.clicksTotal) return false;
  if (req.clickCoinsRun && state.stats.run.clickCoins < req.clickCoinsRun) return false;
  if (req.clickCoinsTotal && state.stats.total.clickCoins < req.clickCoinsTotal) return false;
  if (req.coinsTotal && state.stats.total.coins < req.coinsTotal) return false;
  if (req.assistants && d.assistants < req.assistants) return false;
  if (req.timeTotal && state.stats.total.time < req.timeTotal) return false;
  if (req.offlineTotal && state.stats.total.offlineTime < req.offlineTotal) return false;
  if (req.alignmentBuildings) {
    const [alignment, count] = req.alignmentBuildings;
    const owned = BUILDINGS.filter(b => b.alignment === alignment).reduce((sum, b) => sum + state.buildings[b.id], 0);
    if (owned < count) return false;
  }
  return true;
}

export function buyMiscUpgrade(state, id) {
  const u = MISC_BY_ID[id];
  if (!u || state.upgrades.includes(id) || state.coins < u.cost || !requirementMet(state, u.req)) return false;
  state.coins -= u.cost;
  state.upgrades.push(id);
  for (const scope of ['run', 'r', 'total']) state.stats[scope].upgradesBought++;
  return true;
}

function factionRequirements(state, faction) {
  if (['titan', 'druid', 'faceless'].includes(faction.id) && !state.artifacts.includes(`${faction.id}Unlock`)) return false;
  if (['dwarf', 'drow'].includes(faction.id)) {
    if (!state.unlocked.underworld || !state.artifacts.includes(`${faction.id}Quest`)) return false;
    const base = FACTION_BY_ID[state.faction];
    if (!base || base.alignment !== faction.alignment) return false;
    if (!state.upgrades.includes(`${base.id}-8`)) return false;
  }
  return true;
}

function payFactionCost(state, u) {
  if (u.cost === 0) return true;
  const text = u.costText || '';
  const matches = [...text.matchAll(/([A-Za-z]+) Coins/gi)];
  if (u.currency === 'coins') {
    if (state.coins < u.cost) return false;
    state.coins -= u.cost;
    return true;
  }
  if (matches.length) {
    const costs = matches.map(m => ({ amount: u.cost, faction: m[1].toLowerCase() }));
    const normalized = costs.map(c => ({ ...c, faction: c.faction === 'elven' ? 'elf' : c.faction === 'dwarven' ? 'dwarf' : c.faction === 'demons' ? 'demon' : c.faction }));
    if (normalized.some(c => (state.factionCoins[c.faction] || 0) < c.amount)) return false;
    for (const c of normalized) state.factionCoins[c.faction] -= c.amount;
    return true;
  }
  const fid = u.currency;
  if ((state.factionCoins[fid] || 0) < u.cost) return false;
  state.factionCoins[fid] -= u.cost;
  return true;
}

function numCost(text) {
  const sci = text.match(/\(([\d.]+e\d+)\)/i);
  if (sci) return Number(sci[1]);
  const m = text.match(/([\d,.]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : 0;
}

export function buyFactionUpgrade(state, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u?.faction || state.upgrades.includes(id)) return false;
  const faction = FACTION_BY_ID[u.faction];
  if (state.alignment !== faction.alignment) return false;
  if (!['dwarf', 'drow'].includes(faction.id) && state.faction && state.faction !== faction.id) return false;
  if (['dwarf', 'drow'].includes(faction.id) && !state.faction) return false;
  if (u.kind !== 'treaty' && faction.id !== state.faction && faction.id !== state.prestige) return false;
  if (u.kind === 'treaty' && state.faction === 'mercenary') return false;
  if (!factionRequirements(state, faction)) return false;
  const same = faction.upgrades.filter(x => x.kind !== 'heritage');
  if (u.kind !== 'treaty' && !state.upgrades.includes(`${faction.id}-0`)) return false;
  if (u.tier >= 2 && ![1, 2, 3].every(n => state.upgrades.includes(`${faction.id}-${n}`))) return false;
  if (u.tier >= 2 && !state.upgrades.includes(`${faction.id}-4`)) return false;
  if (u.tier >= 3 && ![5, 6, 7].every(n => state.upgrades.includes(`${faction.id}-${n}`))) return false;
  if (u.tier >= 3 && !state.upgrades.includes(`${faction.id}-8`)) return false;
  if (u.kind === 'heritage' && (state.stats.total.upgradesByFaction[faction.id] || 0) < 12) return false;
  const effective = { ...u };
  if (u.kind === 'treaty' && ['fairy', 'goblin'].includes(faction.id) && !(state.reincarnations === 0 && state.gems === 0)) effective.cost = 20;
  if (!payFactionCost(state, effective)) return false;
  state.upgrades.push(id);
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].upgradesBought++;
    state.stats[scope].upgradesByFaction[faction.id] = (state.stats[scope].upgradesByFaction[faction.id] || 0) + 1;
  }
  if (u.kind === 'treaty') {
    if (['dwarf', 'drow'].includes(faction.id)) state.prestige = faction.id;
    else {
      state.faction = faction.id;
      state.alignment = faction.alignment;
      state.facelessStreak = faction.id === 'faceless' ? (state.facelessStreak || 0) + 1 : 0;
      if (state.facelessStreak >= 5 && !state.trophies.includes('facelessOvermind')) state.trophies.push('facelessOvermind');
    }
  }
  if (faction.id === 'fairy' && challengeReady(state, 'fairy1') && state.stats.run.time <= 60 && (state.stats.run.upgradesByFaction.fairy || 0) >= 12) {
    const onlyLow3 = BUILDINGS.filter(b => !LOW3.includes(b.id)).every(b => state.buildings[b.id] === 0);
    if (onlyLow3) completeChallenge(state, 'fairy1');
  }
  checkChallenges(state);
  return true;
}

export function buyProof(state, alignment) {
  if (state.faction || state.prestige) return false;
  if (state.alignment === alignment) return true;
  if (alignment === 'neutral' && !state.artifacts.some(a => ['titanUnlock', 'druidUnlock', 'facelessUnlock'].includes(a))) return false;
  const cost = alignment === 'neutral' ? 1e16 : 25000;
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.alignment = alignment;
  state.faction = null;
  state.prestige = null;
  return true;
}

export function spellAvailable(state, id) {
  const s = SPELL_BY_ID[id];
  if (!s) return false;
  if (['taxCollection', 'callToArms'].includes(id)) return true;
  if (s.alignment) return state.alignment === s.alignment;
  if (state.faction && FACTION_BY_ID[state.faction]?.spell === id) return true;
  if (state.prestige && FACTION_BY_ID[state.prestige]?.spell === id) return true;
  return state.mercenary.spells.includes(id);
}

function nextRandom(state) {
  let x = state.rngState >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rngState = x >>> 0;
  return (state.rngState >>> 0) / 4294967296;
}
function coinFactions(state) {
  const ids = ['fairy', 'elf', 'angel', 'goblin', 'undead', 'demon'];
  for (const id of ['titan', 'druid', 'faceless']) if (state.artifacts.includes(`${id}Unlock`)) ids.push(id);
  for (const id of ['dwarf', 'drow']) if (state.artifacts.includes(`${id}Quest`)) ids.push(id);
  return ids;
}
function findFactionCoins(state, amount, forced = null) {
  const choices = coinFactions(state);
  const id = forced || choices[Math.floor(nextRandom(state) * choices.length)] || 'fairy';
  const mods = computeState(state).mods;
  const reward = amount * mods.fcRewardMult * (mods.factionRewardMult[id] || 1);
  state.factionCoins[id] = (state.factionCoins[id] || 0) + reward;
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].factionCoins += reward;
    state.stats[scope].factionCoinsByFaction[id] = (state.stats[scope].factionCoinsByFaction[id] || 0) + reward;
  }
  if (state.activeSpells.diamondPickaxe > 0) {
    state.stats.run.diamondCoins = (state.stats.run.diamondCoins || 0) + reward;
    if (state.stats.run.diamondCoins >= 30000 && !state.trophies.includes('minedwarf')) state.trophies.push('minedwarf');
  }
  checkChallenges(state);
  return { id, amount: reward };
}
function triggerElvenLuck(state, assistantTriggered = false) {
  const d = computeState(state);
  const perAssistant = d.assistants ? d.assistantOutput / d.assistants : 0;
  const amount = 2500 * (d.buildingProduction + perAssistant) * (assistantTriggered ? Math.max(1, d.assistants) : 1);
  earnCoins(state, amount, true);
  findFactionCoins(state, d.fcChance * (state.reincarnations + 1));
}

export function workClick(state) {
  const d = computeState(state);
  earnCoins(state, d.clickReward, true);
  for (const scope of ['run', 'r', 'total']) state.stats[scope].clicks++;
  if (nextRandom(state) < d.fcChance / 100) findFactionCoins(state, 1);
  if (d.mods.special.has('elvenLuck') && nextRandom(state) < 0.01) triggerElvenLuck(state);
  return d.clickReward;
}

export function castSpell(state, id, free = false) {
  const s = SPELL_BY_ID[id];
  if (!s || !spellAvailable(state, id)) return false;
  const mods = computeState(state).mods;
  let cost = free ? 0 : Math.max(0, s.cost * mods.spellCostMult - (id === 'goblinsGreed' && state.trophies.includes('greedDrive') ? 150 : 0));
  if (id === 'grandBalance' && state.trophies.includes('hallsBalance')) cost = Math.max(0, cost - 200);
  if (state.mana < cost) return false;
  state.mana -= cost;
  const count = mods.spellCastCountMult;
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].spellsCast += count;
    state.stats[scope].spellsById = state.stats[scope].spellsById || {};
    state.stats[scope].spellsById[id] = (state.stats[scope].spellsById[id] || 0) + count;
  }
  if (id === 'taxCollection') {
    for (const scope of ['run', 'r', 'total']) state.stats[scope].taxCasts = (state.stats[scope].taxCasts || 0) + count;
    earnCoins(state, computeState(state).production * (30 + mods.taxSecondsAdd));
    if (state.trophies.includes('coinPillage')) findFactionCoins(state, 30);
  }
  if (id === 'goblinsGreed') findFactionCoins(state, evaluateFormula(s.instantFactionCoins, { x: state.gems }), 'goblin');
  if (id === 'comboStrike') {
    for (const scope of ['run', 'r', 'total']) state.stats[scope].comboCasts = (state.stats[scope].comboCasts || 0) + count;
  }
  if (id === 'lightningStrike') {
    const targets = availableBuildings(state).filter(b => state.buildings[b.id] > 0);
    state.lightningTarget = targets[Math.floor(nextRandom(state) * targets.length)]?.id || null;
  }
  if (id === 'grandBalance') {
    const outputs = computeState(state).outputs;
    const targets = Object.entries(outputs).filter(([, value]) => value > 0).sort((a, b) => a[1] - b[1]);
    state.balanceTarget = targets[0]?.[0] || null;
  }
  if (id === 'brainwave') state.spellBrainwaveStacks = 0;
  if (s.duration > 0) state.activeSpells[id] = (id === 'grandBalance' && state.trophies.includes('hallsBalance') ? 24 : s.duration) * mods.spellDurationMult;
  checkSpellTrophies(state, id);
  if (id === 'holyLight') {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      state.stats.run.daytimeHoly = (state.stats.run.daytimeHoly || 0) + count;
      if (state.stats.run.time <= 1200 && state.stats.run.daytimeHoly >= 50 && challengeReady(state, 'angel1')) completeChallenge(state, 'angel1');
    }
  }
  if (id !== 'godsHand' && state.activeSpells.godsHand > 0 && state.trophies.includes('godsRest')) findFactionCoins(state, Math.floor(computeState(state).fcChance ** 1.1));
  if (mods.special.has('goblinBank') && id !== 'taxCollection') castSpell(state, 'taxCollection', true);
  return true;
}

function completeChallenge(state, id) {
  if (!state.challenges.includes(id)) state.challenges.push(id);
}
function challengeReady(state, id) {
  const c = CHALLENGE_BY_ID[id];
  return state.reincarnations >= 2 && state.faction === c.faction && state.trophies.includes(c.requiredTrophy);
}
function checkChallenges(state) {
  if (challengeReady(state, 'elf1') && state.stats.run.time <= 3600 && (state.stats.run.factionCoinsByFaction.elf || 0) > 400000) completeChallenge(state, 'elf1');
  if (challengeReady(state, 'demon1') && !state.upgrades.includes('gemPower') && state.stats.run.excavations === 0 && (state.stats.run.factionCoinsByFaction.demon || 0) >= 5000) completeChallenge(state, 'demon1');
  if (challengeReady(state, 'undead1') && state.stats.total.time >= 24047) completeChallenge(state, 'undead1');
}

function checkSpellTrophies(state, id) {
  const d = computeState(state);
  const unlock = (trophy, condition = true) => { if (condition && !state.trophies.includes(trophy)) state.trophies.push(trophy); };
  if (id === 'fairyChanting') unlock('fairyChoir', d.assistants >= 45);
  if (id === 'moonBlessing') { const h = new Date().getHours(); unlock('sunBlessing', h >= 6 && h < 13); }
  if (id === 'godsHand') unlock('godsRest', new Date().getUTCDay() === 0);
  if (id === 'nightTime') { const h = new Date().getHours(); unlock('trueNight', h >= 23 || h < 6); }
  if (id === 'hellfireBlast') unlock('hellRush', state.stats.run.time <= 60);
  if (id === 'lightningStrike') unlock('lightningStorm', (state.stats.run.spellsById?.[id] || 0) >= 100);
  if (id === 'grandBalance') unlock('hallsBalance', state.balanceTarget === 'hallOfLegends');
  if (id === 'comboStrike') unlock('perfectCombo', (state.stats.run.spellsById?.[id] || 0) >= 100);
  if (id === 'taxCollection') unlock('coinPillage', (state.stats.run.taxCasts || 0) >= 150);
}

export function tick(state, delta) {
  const dt = Math.max(0, Math.min(1, Number(delta) || 0));
  if (!dt) return;
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].time += dt;
    state.stats[scope].longestSession = Math.max(state.stats[scope].longestSession, state.stats.run.time);
    if (state.alignment) state.stats[scope].factionTime[state.alignment] = (state.stats[scope].factionTime[state.alignment] || 0) + dt;
    if (state.faction) state.stats[scope].factionTime[state.faction] = (state.stats[scope].factionTime[state.faction] || 0) + dt;
  }
  const d = computeState(state);
  const manaGain = state._derived.manaRegen * dt;
  state.mana = Math.min(state._derived.manaMax, state.mana + manaGain);
  for (const scope of ['run', 'r', 'total']) {
    state.stats[scope].manaProduced += manaGain;
    state.stats[scope].assistantsMax = Math.max(state.stats[scope].assistantsMax, d.assistants);
    state.stats[scope].manaMax = Math.max(state.stats[scope].manaMax, state._derived.manaMax);
    state.stats[scope].manaRegenMax = Math.max(state.stats[scope].manaRegenMax, state._derived.manaRegen);
  }
  earnCoins(state, d.production * dt);
  const assistantFc = d.fcChance / 100 * d.assistants * dt * (d.mods.special.has('elvenEmissary') ? 3 : 1);
  const guaranteed = Math.floor(assistantFc);
  for (let i = 0; i < guaranteed; i++) findFactionCoins(state, 1);
  if (nextRandom(state) < assistantFc - guaranteed) findFactionCoins(state, 1);
  if (d.mods.special.has('elvenLuck') && nextRandom(state) < 0.01 * d.assistants * dt) triggerElvenLuck(state, true);
  if (state.activeSpells.moonBlessing > 0 && state.trophies.includes('sunBlessing')) {
    state.sunClickTimer = (state.sunClickTimer || 0) + dt;
    if (state.sunClickTimer >= 1) {
      state.sunClickTimer -= 1;
      for (let i = 0; i < 15; i++) workClick(state);
    }
  }
  if (d.mods.special.has('greenFingers')) {
    state.greenTimer = (state.greenTimer || 0) + dt;
    const interval = state.challenges.includes('goblin1') ? 120 : 600;
    if (state.greenTimer >= interval) {
      state.greenTimer -= interval;
      const seconds = 1 + nextRandom(state) * 1199;
      earnCoins(state, d.production * seconds);
      if (challengeReady(state, 'goblin1') && seconds > 1000 && nextRandom(state) < 0.6) completeChallenge(state, 'goblin1');
      if (state.challenges.includes('goblin1')) for (let i = 0; i < 10; i++) castSpell(state, 'taxCollection', true);
    }
  }
  checkChallenges(state);
  for (const [id, remaining] of Object.entries(state.activeSpells)) {
    state.activeSpells[id] = remaining - dt;
    if (id === 'brainwave' && state.activeSpells[id] > 0) state.spellBrainwaveStacks += dt;
    if (state.activeSpells[id] <= 0) {
      delete state.activeSpells[id];
      if (id === 'brainwave') state.spellBrainwaveStacks = 0;
    }
  }
}

export function pendingGems(state) {
  return Math.max(0, coinsToGems(state.stats.run.coins) - (state.gemsClaimedRun || 0));
}
export function abdicate(state) {
  const next = createState();
  const earned = pendingGems(state);
  next.gems = state.gems + earned;
  next.rubies = state.rubies;
  next.reincarnations = state.reincarnations;
  next.trophies = [...state.trophies];
  next.artifacts = [...state.artifacts];
  next.challenges = [...state.challenges];
  next.unlocked = { ...state.unlocked };
  next.mercenary = { upgrades: [], spells: [] };
  next.settings = { ...state.settings };
  next.rngState = state.rngState;
  next.excavationCount = state.excavationCount;
  next.excavationResets = state.excavationResets;
  next.stats.total = state.stats.total;
  next.stats.r = state.stats.r;
  return next;
}
export function reincarnate(state) {
  if (state.gems < reincarnationRequirement(state.reincarnations)) return null;
  const next = createState();
  next.reincarnations = state.reincarnations + 1;
  next.rubies = state.rubies;
  next.trophies = [...state.trophies];
  next.artifacts = [...state.artifacts];
  next.challenges = [...state.challenges];
  next.unlocked = { ...state.unlocked };
  next.settings = { ...state.settings };
  next.rngState = state.rngState;
  next.stats.total = state.stats.total;
  return next;
}
export function buyRoyalExchange(state, factionId, amount = 1) {
  const mods = computeState(state).mods;
  let bought = 0;
  for (let i = 0; i < amount; i++) {
    const cost = royalExchangeCost(state, factionId, mods);
    if (state.coins < cost) break;
    state.coins -= cost;
    bought++;
    for (const scope of ['run', 'r', 'total']) {
      state.stats[scope].exchanges = (state.stats[scope].exchanges || 0) + 1;
      state.stats[scope].exchangesByFaction = state.stats[scope].exchangesByFaction || {};
      state.stats[scope].exchangesByFaction[factionId] = (state.stats[scope].exchangesByFaction[factionId] || 0) + 1;
    }
  }
  return bought;
}
export function unlockArchaeology(state) {
  if (state.unlocked.archaeology || state.gems <= 1e9 || state.stats.total.coins < 1e28 || state.coins < 1e29) return false;
  state.coins -= 1e29;
  state.unlocked.archaeology = true;
  return true;
}
function addArtifact(state, id) {
  if (!state.artifacts.includes(id)) state.artifacts.push(id);
}
export function excavate(state) {
  if (!state.unlocked.archaeology) return false;
  const mods = computeState(state).mods;
  const cost = excavationCost(state, mods);
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.excavationCount++;
  for (const scope of ['run', 'r', 'total']) state.stats[scope].excavations++;
  if (nextRandom(state) < 0.35) findFactionCoins(state, 1500 + 0.05 * (state.excavationCount - 1) ** 2.75);
  const n = state.excavationCount;
  if (n >= 5) addArtifact(state, 'titanClue1');
  if (n >= 20) addArtifact(state, 'titanClue2');
  if (n >= 10) addArtifact(state, 'druidClue1');
  if (n >= 25) addArtifact(state, 'druidClue2');
  if (n >= 15) addArtifact(state, 'facelessClue1');
  if (n >= 30) addArtifact(state, 'facelessClue2');
  return true;
}
export function unlockNeutralFaction(state, id) {
  if (!['titan', 'druid', 'faceless'].includes(id) || state.artifacts.includes(`${id}Unlock`)) return false;
  if (!state.artifacts.includes(`${id}Clue1`) || !state.artifacts.includes(`${id}Clue2`)) return false;
  if (id === 'titan' && state.buildings.hallOfLegends < 300) return false;
  if (id === 'druid' && state.stats.total.factionCoins < 1e6) return false;
  if (id === 'faceless' && state.stats.total.time < 129600) return false;
  const pair = id === 'titan' ? ['angel', 'goblin'] : id === 'druid' ? ['elf', 'demon'] : ['fairy', 'undead'];
  if (state.coins < 1e30 || pair.some(fid => state.factionCoins[fid] < 25000)) return false;
  state.coins -= 1e30;
  for (const fid of pair) state.factionCoins[fid] -= 25000;
  addArtifact(state, `${id}Unlock`);
  return true;
}
export function unlockUnderworld(state) {
  if (state.unlocked.underworld || state.excavationCount < 200 || state.coins < 5e49) return false;
  state.coins -= 5e49;
  state.unlocked.underworld = true;
  return true;
}
export function completePrestigeQuest(state, id) {
  if (!state.unlocked.underworld || state.artifacts.includes(`${id}Quest`)) return false;
  if (id === 'dwarf') {
    const valid = state.alignment === 'good' && state.buildings.inn >= 800 && totalBuildings(state) >= 7000 && state.stats.r.clicks >= 10000;
    if (!valid || state.coins < 1e46 || ['fairy', 'elf', 'angel'].some(fid => state.factionCoins[fid] < 10000)) return false;
    state.coins -= 1e46;
    for (const fid of ['fairy', 'elf', 'angel']) state.factionCoins[fid] -= 10000;
  } else if (id === 'drow') {
    const valid = state.alignment === 'evil' && state.buildings.darkTemple >= 650 && state.trophies.length >= 325 && state.stats.total.spellsCast >= 10000;
    if (!valid || state.coins < 1e46 || ['goblin', 'undead', 'demon'].some(fid => state.factionCoins[fid] < 10000)) return false;
    state.coins -= 1e46;
    for (const fid of ['goblin', 'undead', 'demon']) state.factionCoins[fid] -= 10000;
  } else return false;
  addArtifact(state, `${id}Quest`);
  return true;
}
export function mercenaryTributeCost(state) {
  const periods = Math.ceil((1 + state.stats.run.time) / 60);
  return { coins: 1e60 * periods ** 3.5, factionCoins: 100000 * periods ** 0.5 };
}
export function payMercenaryTribute(state) {
  if (state.reincarnations < 3 || state.unlocked.mercenaryTribute) return false;
  const cost = mercenaryTributeCost(state);
  const factions = Object.keys(state.factionCoins);
  if (state.coins < cost.coins || factions.some(id => state.factionCoins[id] < cost.factionCoins)) return false;
  state.coins -= cost.coins;
  for (const id of factions) state.factionCoins[id] -= cost.factionCoins;
  state.unlocked.mercenaryTribute = true;
  return true;
}
export function mercenaryOath(state) {
  if (!state.unlocked.mercenaryTribute || state.unlocked.mercenary || state.coins < 1e72) return false;
  state.coins -= 1e72;
  state.unlocked.mercenary = true;
  return true;
}
export function joinMercenary(state, alignment) {
  if (!state.unlocked.mercenary || !['good', 'evil', 'neutral'].includes(alignment)) return false;
  state.faction = 'mercenary';
  state.prestige = null;
  state.alignment = alignment;
  state.mercenary = { upgrades: [], spells: [] };
  return true;
}
export function selectMercenarySpell(state, id) {
  if (state.faction !== 'mercenary' || !SPELL_BY_ID[id] || state.mercenary.spells.includes(id)) return false;
  if (state.mercenary.spells.length >= 2) return false;
  state.mercenary.spells.push(id);
  return true;
}
export function buyMercenaryUpgrade(state, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u?.faction || state.faction !== 'mercenary' || state.mercenary.upgrades.includes(id)) return false;
  const tier = u.tier;
  const count = state.mercenary.upgrades.length;
  if (tier === 2 && count < 4) return false;
  if (tier === 3 && count < 8) return false;
  if (count >= 12) return false;
  const baseCosts = { 1: 1500, 2: 3000, 3: 4500 };
  const cost = baseCosts[tier] * (1 + count % 4);
  if ((state.factionCoins[u.faction] || 0) < cost) return false;
  state.factionCoins[u.faction] -= cost;
  state.mercenary.upgrades.push(id);
  return true;
}
export function applyOffline(state, seconds) {
  const time = Math.max(0, Number(seconds) || 0);
  if (!time) return 0;
  const mods = computeState(state).mods;
  const efficiency = Math.max(0, state.settings.offlineEfficiency + mods.offlineAdd / 100) * mods.offlineMult;
  const amount = computeState(state).production * time * efficiency;
  earnCoins(state, amount);
  for (const scope of ['run', 'r', 'total']) state.stats[scope].offlineTime += time;
  return amount;
}
