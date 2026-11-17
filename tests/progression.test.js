import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/core/state.js';
import { BUILDINGS } from '../src/content/r0r3/buildings.js';
import BUILDING_UPGRADES from '../src/content/r0r3/building-upgrades.js';
import FACTIONS from '../src/content/r0r3/factions.js';
import { SPELLS } from '../src/content/r0r3/spells.js';
import { CHALLENGES } from '../src/content/r0r3/challenges.js';
import { applyFactionUpgrade, createModifiers } from '../src/systems/effects.js';
import { evaluateFormula } from '../src/systems/formula.js';
import {
  computeState, buyFactionUpgrade, castSpell, workClick, tick, excavate, unlockNeutralFaction,
  completePrestigeQuest, payMercenaryTribute, mercenaryOath, joinMercenary,
  selectMercenarySpell, buyMercenaryUpgrade, applyOffline, abdicate,
} from '../src/systems/engine.js';

function rich() {
  const s = createState();
  s.coins = 1e200; s.gems = 1e20; s.reincarnations = 3; s.mana = 1e20;
  for (const id of Object.keys(s.buildings)) s.buildings[id] = 100;
  for (const id of Object.keys(s.factionCoins)) s.factionCoins[id] = 1e30;
  for (const scope of ['run', 'r', 'total']) Object.assign(s.stats[scope], {
    time: 100000, coins: 1e100, clicks: 10000, spellsCast: 5000, factionCoins: 1e20, excavations: 500,
  });
  return s;
}

test('content pack has complete current building, faction and spell inventories', () => {
  assert.equal(BUILDINGS.length, 25);
  assert.equal(BUILDING_UPGRADES.length, 475);
  assert.equal(FACTIONS.length, 11);
  assert.equal(FACTIONS.reduce((n, f) => n + f.upgrades.length, 0), 143);
  assert.equal(SPELLS.length, 15);
  assert.equal(CHALLENGES.length, 6);
  assert.equal(new Set(BUILDING_UPGRADES.map(u => u.id)).size, 475);
});

test('formula evaluator supports logarithms, powers, rounding and stats', () => {
  assert.equal(evaluateFormula('(2 * ln(1 + x) ^ 2)%', { x: Math.E - 1 }), 2);
  assert.equal(evaluateFormula('floor(2 * x ^ 0.6)%', { x: 10 }), 7);
  assert.equal(evaluateFormula('round(200 * x ^ 0.8)', { x: 1 }), 200);
  assert.equal(evaluateFormula('1000 * (12 - T)', { T: 3 }), 9000);
});

test('previously uncovered Demon and Drow upgrades now apply exact formulas', () => {
  const s = rich(); s.stats.r.buildingMax.hellPortal = 50; s.trophies = Array(7).fill('x');
  s.stats.total.evilSpellsCast = 100;
  const cases = [
    ['demon', 'DM3', 'globalAdd', 4 * 50 ** 0.8],
    ['demon', 'DM7', 'manaMaxAdd', 6 * 100 ** 0.4],
    ['demon', 'DM9', 'manaRegenAdd', 3.5 * 100 ** 0.35],
    ['demon', 'DM10', 'assistantsAdd', 1.5 * 100 ** 0.65],
  ];
  for (const [fid, code, key, expected] of cases) {
    const mods = createModifiers();
    const u = FACTIONS.find(f => f.id === fid).upgrades.find(u => u.code === code);
    applyFactionUpgrade(mods, s, u);
    assert.ok(Math.abs(mods[key] - expected) < 1e-7, code);
  }
  let mods = createModifiers();
  applyFactionUpgrade(mods, s, FACTIONS.find(f => f.id === 'demon').upgrades.find(u => u.code === 'DM6'));
  assert.ok(Object.values(mods.buildingAdd).some(v => v > 0));
  mods = createModifiers();
  applyFactionUpgrade(mods, s, FACTIONS.find(f => f.id === 'drow').upgrades.find(u => u.code === 'DW7'));
  assert.equal(mods.exchangeCostReduce, 0.02);
});

test('Goblin heritage applies the logarithmic gem production bonus', () => {
  const s = rich(); s.gems = 1e9;
  const mods = createModifiers();
  const u = FACTIONS.find(f => f.id === 'goblin').upgrades.find(u => u.code === 'GB12');
  applyFactionUpgrade(mods, s, u);
  assert.equal(mods.globalAdd, Math.floor(7.5 * Math.log10(1 + 1e9)));
});

test('R2 challenge rewards alter their intended systems', () => {
  const s = rich();
  s.stats.total.upgradesByFaction.fairy = 12;
  s.stats.total.upgradesBought = 250;
  s.challenges = ['fairy1', 'elf1', 'angel1', 'demon1'];
  const d = computeState(s);
  assert.equal(d.mods.assistantsAdd, 24);
  assert.equal(d.mods.exchangeCostReduceByFaction.elf, 0.025);
  assert.equal(d.mods.spellCostMult, 0.9);
  assert.equal(d.mods.globalAdd, 400);
  assert.equal(d.mods.fcChanceAdd, 280);
});

test('excavation uses escalating cost and records neutral artifact clues', () => {
  const s = rich(); s.unlocked.archaeology = true;
  assert.equal(excavate(s), true);
  assert.equal(s.excavationCount, 1);
  assert.equal(s.stats.run.excavations, 501);
  for (let i = 0; i < 19; i++) excavate(s);
  assert.ok(s.artifacts.includes('titanClue1'));
  assert.ok(s.artifacts.includes('titanClue2'));
  assert.ok(s.artifacts.includes('druidClue1'));
  assert.ok(s.artifacts.includes('facelessClue1'));
});

test('neutral faction unlock enforces clues, buildings and dual currency', () => {
  const s = rich();
  s.artifacts.push('titanClue1', 'titanClue2');
  s.buildings.hallOfLegends = 300;
  assert.equal(unlockNeutralFaction(s, 'titan'), true);
  assert.ok(s.artifacts.includes('titanUnlock'));
  assert.equal(s.factionCoins.angel, 1e30 - 25000);
  assert.equal(s.factionCoins.goblin, 1e30 - 25000);
});

test('prestige quest and treaty stack with the base faction', () => {
  const s = rich(); s.alignment = 'good'; s.faction = 'fairy';
  s.unlocked.underworld = true;
  for (const id of ['farm', 'inn', 'blacksmith', 'warriorBarracks', 'knightsJoust', 'wizardTower', 'cathedral', 'citadel', 'royalCastle', 'heavensGate']) s.buildings[id] = 700;
  s.buildings.inn = 800; s.stats.r.clicks = 10000;
  assert.equal(completePrestigeQuest(s, 'dwarf'), true);
  s.upgrades.push('fairy-8');
  assert.equal(buyFactionUpgrade(s, 'dwarf-0'), true);
  assert.equal(s.faction, 'fairy');
  assert.equal(s.prestige, 'dwarf');
});

test('R3 mercenary tribute, oath and mixed upgrades work as persistent unlocks', () => {
  const s = rich(); s.reincarnations = 3;
  assert.equal(payMercenaryTribute(s), true);
  assert.equal(mercenaryOath(s), true);
  assert.equal(joinMercenary(s, 'good'), true);
  assert.equal(selectMercenarySpell(s, 'moonBlessing'), true);
  assert.equal(selectMercenarySpell(s, 'holyLight'), true);
  assert.equal(selectMercenarySpell(s, 'godsHand'), false);
  assert.equal(buyMercenaryUpgrade(s, 'fairy-1'), true);
  assert.equal(computeState(s).mods.buildingBaseAdd.farm, 98);
  const next = abdicate(s);
  assert.equal(next.unlocked.mercenary, true);
  assert.deepEqual(next.mercenary.upgrades, []);
});

test('offline production uses production, time and offline efficiency', () => {
  const s = createState(); s.buildings.farm = 5;
  const amount = applyOffline(s, 100);
  assert.equal(amount, 500);
  assert.equal(s.stats.total.offlineTime, 100);
});

test('Fairy Choir and Perfect Combo modify active spells, not only display text', () => {
  const s = rich(); s.alignment = 'good'; s.faction = 'fairy';
  s.buildings.farm = 200; s.buildings.inn = 200; s.buildings.blacksmith = 200;
  s.upgrades.push('fairy-11');
  assert.equal(castSpell(s, 'fairyChanting'), true);
  assert.ok(s.trophies.includes('fairyChoir'));
  assert.equal(computeState(s).mods.assistantsMult, 3);

  const d = rich(); d.alignment = 'evil'; d.faction = 'drow'; d.trophies = ['perfectCombo'];
  castSpell(d, 'comboStrike'); castSpell(d, 'comboStrike');
  assert.ok(Math.abs(computeState(d).mods.globalAdd - (150 + 40 * 2 ** 0.9)) < 1e-7);
});

test('Brainwave accumulates each second and clears after expiration', () => {
  const s = rich(); s.alignment = 'neutral'; s.faction = 'faceless';
  assert.equal(castSpell(s, 'brainwave'), true);
  tick(s, 0.5); tick(s, 0.5);
  assert.equal(s.spellBrainwaveStacks, 1);
  assert.equal(computeState(s).mods.globalAdd, 152);
  s.activeSpells.brainwave = 0.1;
  tick(s, 0.2);
  assert.equal(s.spellBrainwaveStacks, 0);
  assert.equal(s.activeSpells.brainwave, undefined);
});
