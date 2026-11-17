import { BUILDINGS, buildingIdFromSource } from '../content/r0r3/buildings.js';
import { evaluateFormula } from './formula.js';

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

function addTo(record, key, value) {
  record[key] = (record[key] || 0) + value;
}
function multiply(record, key, value) {
  record[key] = (record[key] || 1) * value;
}
function production(mods, target, value, mode = 'add') {
  const apply = id => {
    if (mode === 'mult') multiply(mods.buildingMult, id, 1 + value / 100);
    else addTo(mods.buildingAdd, id, value);
  };
  if (target === 'all') {
    if (mode === 'mult') mods.globalMult *= 1 + value / 100;
    else mods.globalAdd += value;
  } else if (['good', 'evil', 'neutral'].includes(target)) {
    if (mode === 'mult') {
      for (const b of BUILDINGS.filter(b => b.alignment === target)) multiply(mods.buildingMult, b.id, 1 + value / 100);
    } else mods.alignmentAdd[target] += value;
  } else if (Array.isArray(target)) target.forEach(apply);
  else if (target) apply(target);
}

function formulaValue(upgrade, state, mods, formula, effectText, tier = 0) {
  const x = inferX(`${effectText} ${formula}`, state, mods, tier);
  const y = /excavation resets/i.test(formula) ? 0 : 0;
  return evaluateFormula(formula, { x, y, R: state.progression.reincarnations, T: tier, A: 0 });
}

function inferX(text, state, mods, tier) {
  const t = text.toLowerCase();
  const count = id => state.buildings[id] || 0;
  const max = id => state.stats.r.buildingMax[id] || 0;
  const low3 = count('farm') + count('inn') + count('blacksmith');
  const byAlignment = a => BUILDINGS.filter(b => b.alignment === a).reduce((sum, b) => sum + count(b.id), 0);
  if (/farms, inns,? and blacksmiths/.test(t)) return low3;
  for (const b of [...BUILDINGS].sort((a, b) => b.sourceName.length - a.sourceName.length)) {
    if (t.includes(b.sourceName.toLowerCase())) return /highest|max/.test(t) ? max(b.id) : count(b.id);
  }
  if (/good buildings/.test(t)) return byAlignment('good');
  if (/evil buildings/.test(t)) return byAlignment('evil');
  if (/neutral buildings/.test(t)) return byAlignment('neutral');
  if (/highest amount of buildings|buildings owned \(max\)/.test(t)) return state.stats.r.buildingsMax || 0;
  if (/buildings you own|total buildings|amount of buildings|building count/.test(t)) return Object.values(state.buildings).reduce((a, b) => a + b, 0);
  if (/clicks made in this reincarnation/.test(t)) return state.stats.r.clicks;
  if (/clicks made|amount of clicks|clicks made in this game/.test(t)) return state.stats.total.clicks;
  if (/tax collection.*seconds|seconds.*tax collection/.test(t)) return 30 + mods.taxSecondsAdd;
  if (/tax collections? cast/.test(t)) return state.stats.total.taxCasts || 0;
  if (/evil spells cast/.test(t)) return state.stats.total.evilSpellsCast || 0;
  if (/spells cast in this game|amount of spells cast/.test(t)) return state.stats.total.spellsCast;
  if (/active spells|amount of active spells/.test(t)) return Object.keys(state.activeSpells).filter(id => state.activeSpells[id] > 0).length;
  if (/combo strike/.test(t)) return state.stats.total.comboCasts || 0;
  if (/maximum mana/.test(t)) return state._derived?.manaMax || 1000 + mods.manaMaxAdd;
  if (/mana regeneration/.test(t)) return state._derived?.manaRegen || 1 + mods.manaRegenAdd;
  if (/royal exchange bonus/.test(t)) return state._derived?.exchangeBonus || mods.exchangeAdd;
  if (/royal exchanges/.test(t)) return state.stats.total.exchanges || 0;
  if (/excavations/.test(t)) return /total|all game/.test(t) ? state.stats.total.excavations : state.stats.r.excavations;
  if (/longest game session/.test(t)) return state.stats.r.longestSession;
  if (/time spent as good/.test(t)) return state.stats.r.factionTime.good || 0;
  if (/time spent.*evil|time spent being evil/.test(t)) return state.stats.r.factionTime.evil || 0;
  if (/time spent as neutral/.test(t)) return state.stats.r.factionTime.neutral || 0;
  if (/time spent.*faceless/.test(t)) return state.stats.total.factionTime.faceless || 0;
  if (/offline/.test(t)) return state.stats.r.offlineTime;
  if (/time spent|playtime|how long/.test(t)) return state.stats.total.time + mods.timeAdd;
  if (/troph/.test(t)) return state.trophies.length;
  if (/gems/.test(t)) return state.gems;
  if (/gold owned|coins owned|amount of coins/.test(t)) return state.coins;
  if (/upgrades purchased/.test(t)) return state.stats.total.upgradesBought;
  if (/faction coins found in this reincarnation/.test(t)) return state.stats.r.factionCoins;
  for (const id of ['fairy', 'elf', 'elven', 'angel', 'goblin', 'undead', 'demon', 'titan', 'druid', 'faceless', 'dwarf', 'dwarven', 'drow']) {
    if (t.includes(id + ' coins') || t.includes(id + ' faction coins')) {
      const fid = id === 'elven' ? 'elf' : id === 'dwarven' ? 'dwarf' : id;
      return state.stats.total.factionCoinsByFaction[fid] || 0;
    }
  }
  if (/faction coins found|faction coins gained|faction coins collected/.test(t)) return state.stats.total.factionCoins;
  if (/assistants/.test(t)) return state._derived?.assistants || mods.assistantsAdd;
  return 0;
}

function numericEffect(text, upgrade, state, mods, formulaIndex = 0) {
  if (upgrade.formulas?.[formulaIndex]) return formulaValue(upgrade, state, mods, upgrade.formulas[formulaIndex], text);
  const percent = text.match(/(?:by|by an additional|increased by)\s*(?:\+)?([\d,.]+)\s*%/i);
  if (percent) return Number(percent[1].replace(/,/g, ''));
  const flat = text.match(/\+([\d,.]+)(?:\s|$)/);
  if (flat) return Number(flat[1].replace(/,/g, ''));
  const count = text.match(/(\d+)\s+additional assistant/i);
  return count ? Number(count[1]) : 0;
}

function genericEffect(mods, state, upgrade, text, value, formulaIndex) {
  const t = text.toLowerCase();
  const multi = /multiplicatively/.test(t);
  const mode = multi ? 'mult' : 'add';
  const hasPercent = /%/.test(upgrade.formulas?.[formulaIndex] || '') || /%/.test(text);
  const pct = v => hasPercent ? v : v * 100;

  if (/reduce.*building cost|building cost multiplier/.test(t)) { mods.buildingCostReduce += 0.02; return 1; }
  if (/excavation cost multiplier/.test(t)) { mods.excavationCostReduce += 0.02; return 1; }
  if (/royal exchange cost multiplier|cost multiplier for royal exchanges/.test(t)) { mods.exchangeCostReduce += 0.02; return 1; }
  if (/spell casts count/.test(t)) { mods.spellCastCountMult *= 1 + 100 / 100; return 1; }
  if (/cost of all spells/.test(t)) { mods.spellCostMult *= 0.5; return 1; }
  if (/spell durations? (?:are|is) increased/.test(t)) { mods.spellDurationMult *= 1.5; return 1; }
  if (/gem production bonus/.test(t)) { mods.gemPerGemAdd += 1; return 1; }
  if (/production bonus from gems/.test(t)) { mods.gemPowerMult *= multi ? 1 + value / 100 : 2.5; return 1; }
  if (/offline production/.test(t)) { mods.offlineAdd += value; return 1; }
  if (/royal exchange bonus/.test(t)) { mods.exchangeAdd += value; return 1; }
  if (/maximum mana|max mana/.test(t)) {
    if (multi && hasPercent) mods.manaMaxMult *= 1 + value / 100;
    else mods.manaMaxAdd += value;
    return 1;
  }
  if (/mana regeneration|mana regen/.test(t)) {
    if (multi && hasPercent) mods.manaRegenMult *= 1 + value / 100;
    else mods.manaRegenAdd += value;
    return 1;
  }
  if (/faction coin find chance|chance to find faction coins/.test(t)) {
    if (multi) mods.fcChanceMult *= 1 + value / 100;
    else mods.fcChanceAdd += value;
    return 1;
  }
  if (/production of assistants|assistant production/.test(t)) {
    if (multi) mods.assistantProdMult *= 1 + value / 100;
    else mods.assistantProdAdd += value;
    return 1;
  }
  if (/gain.*assistants|increase assistants|additional assistant|attract.*assistants/.test(t)) {
    if (multi && hasPercent) mods.assistantsMult *= 1 + value / 100;
    else mods.assistantsAdd += value;
    return 1;
  }
  if (/clicking reward|click reward/.test(t)) {
    if (/base clicking reward.*(?:production|building production)/.test(t) || /of your building production/.test(t)) {
      const share = /20%/.test(t) ? 0.2 : /50%/.test(t) ? 0.5 : 0.01;
      mods.clickProductionShare += share;
    } else if (/\+25,000 per trophy/.test(t)) mods.clickAdd += 25000 * state.trophies.length;
    else if (multi || hasPercent) mods.clickMult *= 1 + value / 100;
    else mods.clickAdd += value;
    return 1;
  }
  if (/buildings count/.test(t)) { mods.buildingCountMult *= 1 + value / 100; return 1; }
  if (/production|produce|output/.test(t)) {
    const targets = [];
    for (const b of BUILDINGS) if (t.includes(b.sourceName.toLowerCase())) targets.push(b.id);
    if (/three highest building tiers/.test(t)) {
      const maxTier = Math.max(...BUILDINGS.filter(b => state.buildings[b.id] > 0).map(b => b.tier), 1);
      for (const b of BUILDINGS.filter(b => b.tier >= maxTier - 2)) targets.push(b.id);
    }
    let target = targets.length ? [...new Set(targets)] : 'all';
    if (/good buildings/.test(t)) target = 'good';
    if (/evil buildings/.test(t)) target = 'evil';
    if (/neutral buildings/.test(t)) target = 'neutral';
    if (/base production/.test(t) && !multi) {
      for (const id of targets) addTo(mods.buildingBaseAdd, id, value);
    } else production(mods, target, value, mode);
    return 1;
  }
  if (/clicks count more/.test(t)) { mods.clickCountMult *= 1 + value / 100; return 1; }
  if (/tax collection.*worth more seconds/.test(t)) { mods.taxSecondsAdd += value; return 1; }
  return 0;
}

export function applyFactionUpgrade(mods, state, upgrade) {
  const code = upgrade.code;
  if (/^(FR|EL|AN|GB|UD|DM|TT|DD|FC|DN|DW)(0|4|8)$/.test(code)) return 1;
  let applied = 0;
  const explicit = /^(FR|EL|AN|GB|DM)\d+$/.test(code) || ['UD12', 'TT5', 'TT9', 'TT10', 'TT11', 'TT12', 'DD1', 'DD3', 'DD9', 'DD11', 'DD12', 'FC1', 'DN11'].includes(code);
  const effects = upgrade.effects?.length ? upgrade.effects : [''];
  if (!explicit) effects.forEach((text, i) => {
    const formulaIndex = Math.min(i, Math.max(0, (upgrade.formulas?.length || 1) - 1));
    const value = numericEffect(text, upgrade, state, mods, formulaIndex);
    applied += genericEffect(mods, state, upgrade, text, value, formulaIndex);
  });

  const v = (index = 0, text = upgrade.effects?.[0] || '') => formulaValue(upgrade, state, mods, upgrade.formulas[index] || '0', text);
  switch (code) {
    case 'FR1': addTo(mods.buildingBaseAdd, 'farm', 98); mods.buildingCostReduce += 0.02; applied++; break;
    case 'FR2': production(mods, ['farm', 'inn', 'blacksmith'], 10000); applied++; break;
    case 'FR3': mods.manaMaxAdd += v(); applied++; break;
    case 'FR5': addTo(mods.buildingBaseAdd, 'inn', 234); mods.buildingCostReduce += 0.02; applied++; break;
    case 'FR6': mods.special.add('goldenPots'); applied++; break;
    case 'FR7': mods.manaRegenAdd += v(); applied++; break;
    case 'FR9': addTo(mods.buildingBaseAdd, 'blacksmith', 580); mods.buildingCostReduce += 0.02; applied++; break;
    case 'FR10': mods.globalAdd += v(); applied++; break;
    case 'FR11': mods.assistantsAdd += v(); applied++; break;
    case 'FR12': mods.globalAdd += 0.075 * (state.buildings.farm + state.buildings.inn + state.buildings.blacksmith); applied++; break;
    case 'EL1': mods.fcChanceMult *= 2.5; applied++; break;
    case 'EL2': mods.clickAdd += 25000 * state.trophies.length; mods.fcChanceAdd += v(); applied++; break;
    case 'EL3': mods.manaRegenAdd += v(); applied++; break;
    case 'EL5': mods.clickMult *= 1 + v() / 100; mods.special.add('elvenEmissary'); applied++; break;
    case 'EL6': mods.exchangeAdd += v(); applied++; break;
    case 'EL7': mods.globalAdd += v(); applied++; break;
    case 'EL9': mods.clickCountMult *= 1 + v() / 100; applied++; break;
    case 'EL10': mods.special.add('elvenLuck'); applied++; break;
    case 'EL11': mods.special.add('sylvanTreasure'); applied++; break;
    case 'EL12': mods.fcChanceAdd += 5; mods.clickMult *= 1 + v() / 100; applied++; break;
    case 'AN1': mods.manaRegenAdd += v(); applied++; break;
    case 'AN2': mods.globalAdd += v(); multiply(mods.factionRewardMult, 'angel', 6); applied++; break;
    case 'AN3': mods.fcChanceAdd += v(); applied++; break;
    case 'AN5': mods.spellCastCountMult *= 2; applied++; break;
    case 'AN6': mods.spellCostMult *= 0.5; applied++; break;
    case 'AN7': mods.manaRegenMult *= 1.5; applied++; break;
    case 'AN9': mods.manaMaxAdd += v(); applied++; break;
    case 'AN10': mods.spellDurationMult *= 1.5; applied++; break;
    case 'AN11': mods.globalAdd += v(); applied++; break;
    case 'AN12': mods.manaRegenMult *= 1.1; applied++; break;
    case 'GB1': mods.assistantsAdd += v(); applied++; break;
    case 'GB2': mods.globalAdd += v(); applied++; break;
    case 'GB3': mods.taxSecondsAdd += v(); applied++; break;
    case 'GB5': mods.gemPowerMult *= 2.5; mods.offlineAdd += v(); applied++; break;
    case 'GB6': mods.manaRegenMult *= 1 + v() / 100; applied++; break;
    case 'GB7': mods.globalAdd += v(); applied++; break;
    case 'GB9': mods.special.add('goblinBank'); applied++; break;
    case 'GB10': mods.fcChanceAdd += v(); applied++; break;
    case 'GB11': mods.special.add('greenFingers'); applied++; break;
    case 'GB12': mods.globalAdd += Math.floor(7.5 * Math.log10(1 + state.gems)); applied++; break;
    case 'UD12': {
      const x = (state.stats.total.time + mods.timeAdd) * (state.challenges.includes('undead1') ? 50 : 1);
      mods.assistantsAdd += evaluateFormula(upgrade.formulas[0], { x }); applied++; break;
    }
    case 'DM1': {
      const target = state.alignment === 'good' ? 'royalCastle' : state.alignment === 'evil' ? 'evilFortress' : 'ironStronghold';
      production(mods, [target], v()); applied++; break;
    }
    case 'DM2': {
      const maxTier = Math.max(...BUILDINGS.filter(b => state.buildings[b.id] > 0).map(b => b.tier), 1);
      for (const b of BUILDINGS.filter(b => b.tier >= maxTier - 2)) multiply(mods.buildingCountMultById, b.id, 1 + v() / 100);
      applied++; break;
    }
    case 'DM3': mods.globalAdd += v(); applied++; break;
    case 'DM5': addTo(mods.buildingBaseAdd, 'evilFortress', 200000); addTo(mods.buildingBaseAdd, 'hellPortal', 2000000); mods.timeAdd += 21600; applied++; break;
    case 'DM6': {
      const maxTier = Math.max(...BUILDINGS.filter(b => state.buildings[b.id] > 0).map(b => b.tier), 1);
      for (const b of BUILDINGS.filter(b => b.tier >= maxTier - 2)) production(mods, [b.id], v());
      applied++; break;
    }
    case 'DM7': mods.manaMaxAdd += v(); applied++; break;
    case 'DM9': mods.manaRegenAdd += v(); applied++; break;
    case 'DM10': mods.assistantsAdd += v(); applied++; break;
    case 'DM11': {
      const target = state.alignment === 'good' ? 'heavensGate' : state.alignment === 'evil' ? 'hellPortal' : 'ancientPyramid';
      production(mods, [target], v()); applied++; break;
    }
    case 'DM12': mods.globalAdd += 0.3 * state.buildings.hallOfLegends; applied++; break;
    case 'TT5': {
      const ids = state.alignment === 'good' ? ['warriorBarracks', 'cathedral'] : state.alignment === 'evil' ? ['slavePen', 'darkTemple'] : ['deepMine', 'monastery'];
      addTo(mods.buildingBaseAdd, ids[0], 9635); addTo(mods.buildingBaseAdd, ids[1], 98000);
      production(mods, ids, 1000); applied++; break;
    }
    case 'TT9': mods.assistantsMult *= 3; mods.assistantProdAdd += 200; applied++; break;
    case 'TT10': mods.exchangeAdd += 100; mods.exchangeCostReduce += 0.01; applied++; break;
    case 'TT11': addTo(mods.buildingCostReduceById, 'hallOfLegends', 0.01); mods.assistantProdAdd += v(); applied++; break;
    case 'TT12': mods.exchangeAdd += 15; applied++; break;
    case 'DD1': for (const b of BUILDINGS) production(mods, [b.id], 4000 * (12 - b.tier)); applied++; break;
    case 'DD3': mods.fcChanceAdd += v(); mods.fcChanceMult *= 1 + v() / 100; applied++; break;
    case 'DD9': for (const b of BUILDINGS) production(mods, [b.id], 12 * 1.8 ** (12 - b.tier)); applied++; break;
    case 'DD11': for (const b of BUILDINGS) production(mods, [b.id], 1.5 * state.buildings[b.id] ** 0.9); applied++; break;
    case 'DD12': mods.manaMaxAdd += Object.values(state.buildings).reduce((a, b) => a + b, 0) / 15; applied++; break;
    case 'FC1': {
      const target = state.alignment === 'good' ? 'citadel' : state.alignment === 'evil' ? 'necropolis' : 'labyrinth';
      production(mods, [target], v()); applied++; break;
    }
    case 'DN11': mods.manaMaxAdd += 50 + 35 * (state._derived?.longestSpellDuration || 0) ** 0.7; applied++; break;
    default: break;
  }
  return applied;
}
