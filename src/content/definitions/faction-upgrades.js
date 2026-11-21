import { factionAgreementCosts, factionUpgradeCosts } from './ascension-costs.js';

const selectedFaction = faction => ({ op: 'selected', key: 'faction', value: faction });
const owned = id => ({ op: 'owned', id });
const globalTarget = { type: 'global' };
const allBuildings = { type: 'allBuildings' };
const tierTarget = tier => ({ type: 'tier', id: tier });
const highestThreeTarget = { type: 'highestThree' };
const effect = (group, phase, stat, target, operation, value) => ({
  group, phase, stat, target, operation, value,
  stacking: ['add', 'addPercent'].includes(operation) ? 'add' : 'multiply',
});

function upgrade({ faction, number, sourceId, sourceName, name, description, effects = [], mechanics = [] }) {
  const id = `${faction}-${number}`;
  const cost = [5e7, 5e8, 5e9, 5e11, 5e12, 5e13, 5e15, 5e16, 5e17][number - 1];
  const gate = number <= 3 ? null : owned(`${faction}-${number <= 6 ? 'pact' : 'alliance'}`);
  return {
    id, kind: 'upgrade', contentVersion: 'base-v1', name, sourceName, sourceId,
    sourceVersion: '4.3.24 build 26618872', verificationStatus: 'source-confirmed', mechanics,
    description, era: { minR: 0 },
    visible: gate ? { all: [selectedFaction(faction), gate] } : selectedFaction(faction),
    unlock: { op: 'always' },
    purchase: {
      costs: factionUpgradeCosts(cost, number),
      requires: [{ op: 'notOwned', id }, selectedFaction(faction), ...(gate ? [gate] : [])],
    },
    effects, grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: 'assets/images/content-icons/red-cross.svg' },
  };
}

export const ADDITIONAL_FACTION_UPGRADE_DEFINITIONS = [
  upgrade({ faction: 'elven', number: 1, sourceId: 'EL1', sourceName: 'Elven Mint', name: '点击编译器', description: '影响力发现率乘算 +100%；每秒自动点击 3 次。', mechanics: ['autoClick'], effects: [
    effect('elven-1-chance', 'factionCoin', 'factionCoin.chance', globalTarget, 'multiplyPercent', { constant: 100 }),
  ] }),
  upgrade({ faction: 'elven', number: 2, sourceId: 'EL2', sourceName: 'Sylvan Treasure Frills', name: '连击缓存', description: '全部设施实际每秒产出的 50% 加入基础点击收入（当前 +{effect:elven-2}）。', effects: [
    effect('elven-2', 'click', 'click.base', globalTarget, 'add', { formula: '0.5 * x', variables: { x: 'derived.buildingProduction' } }),
  ] }),
  upgrade({ faction: 'elven', number: 3, sourceId: 'EL3', sourceName: 'Ancient Clicking Arts', name: '传统输入手法', description: '按本次职业有效点击数，每秒精力恢复 +{effect:elven-3}。', effects: [
    effect('elven-3', 'mana', 'mana.regen', globalTarget, 'add', { formula: '0.75 * ln(1 + x) ^ 1.5', variables: { x: 'effective.r.clicks' } }),
  ] }),
  upgrade({ faction: 'elven', number: 4, sourceId: 'EL4', sourceName: 'Elven Emissary', name: '技术特派员', description: '按理想设施数量乘算点击收入 +{effect:elven-4-click}%；离线影响力获取 ×3。', effects: [
    effect('elven-4-click', 'click', 'click.reward', globalTarget, 'multiplyPercent', { formula: '1.4 * x ^ 0.6', variables: { x: 'buildings.alignment.good' } }),
    effect('elven-4-offline', 'utility', 'offline.factionCoin', globalTarget, 'multiplyPercent', { constant: 200 }),
  ] }),
  upgrade({ faction: 'elven', number: 5, sourceId: 'EL5', sourceName: 'Elven Efficiency', name: '精英效率', description: '按本 Era 累计发现的影响力提高皇家交换加成。', mechanics: ['royalExchangeBonus'] }),
  upgrade({ faction: 'elven', number: 6, sourceId: 'EL6', sourceName: 'Secret Clicking Techniques', name: '秘传连击技巧', description: '按本次职业有效点击数使全部设施产出提高 {effect:elven-6}%。', effects: [
    effect('elven-6', 'global', 'global.production', globalTarget, 'addPercent', { formula: '1.5 * x ^ 0.5', variables: { x: 'effective.r.clicks' } }),
  ] }),
  upgrade({ faction: 'elven', number: 7, sourceId: 'EL7', sourceName: 'Elven Diplomacy', name: '跨部门接口', description: '按本轮影响力提高有效点击计数，不增加真实点击事件。', mechanics: ['effectiveClicks'] }),
  upgrade({ faction: 'elven', number: 8, sourceId: 'EL8', sourceName: 'Elven Luck', name: '技术幸运', description: '点击和数字员工可触发技术幸运，获得额外工资与随机部门影响力。', mechanics: ['elvenLuck'] }),
  upgrade({ faction: 'elven', number: 9, sourceId: 'EL9', sourceName: 'Elven Treasure Casing', name: '自动输入阵列', description: '按原版奖杯数，影响力发现率 +{effect:elven-9} 个百分点。', effects: [
    effect('elven-9', 'factionCoin', 'factionCoin.chance', globalTarget, 'add', { formula: '10 + 2.5 * x ^ 0.95', variables: { x: 'trophies.original' } }),
  ] }),

  upgrade({ faction: 'angel', number: 1, sourceId: 'AN1', sourceName: 'Holy Bells', name: '晨会钟声', description: '按有效设施总数，每秒精力恢复 +{effect:angel-1}。', effects: [
    effect('angel-1', 'mana', 'mana.regen', globalTarget, 'add', { formula: 'x ^ 0.5', variables: { x: 'buildings.total' } }),
  ] }),
  upgrade({ faction: 'angel', number: 2, sourceId: 'AN2', sourceName: 'Angelic Determination', name: '战略定力', description: '按本 Era 施法数使全部设施产出提高 {effect:angel-2}%。', effects: [
    effect('angel-2', 'global', 'global.production', globalTarget, 'addPercent', { formula: '2 * ln(1 + x) ^ 3', variables: { x: 'stats.ascension.spellsCast' } }),
  ] }),
  upgrade({ faction: 'angel', number: 3, sourceId: 'AN3', sourceName: 'Angel Feathers', name: '精力授权', description: '按当前激活技能数，影响力发现率 +{effect:angel-3} 个百分点。', effects: [
    effect('angel-3', 'factionCoin', 'factionCoin.chance', globalTarget, 'add', { formula: '4 + 4 * x', variables: { x: 'derived.activeSpells' } }),
  ] }),
  upgrade({ faction: 'angel', number: 4, sourceId: 'AN4', sourceName: 'Guardian Angels', name: '决策护航', description: '当前 Tier 7 设施基础产出 +98,000，产出提高 {effect:angel-4-production}%。', effects: [
    effect('angel-4-base', 'buildingBase', 'building.baseProduction', tierTarget(7), 'add', { constant: 98000 }),
    effect('angel-4-production', 'buildingLocal', 'building.production', tierTarget(7), 'addPercent', { formula: '40 + 40 * x ^ 0.4', variables: { x: 'target.count' } }),
  ] }),
  upgrade({ faction: 'angel', number: 5, sourceId: 'AN5', sourceName: 'Angelic Wisdom', name: '战略智慧', description: '法术持续 +50%，精力恢复 ×1.5，并按离线精力恢复修正离线施法。', mechanics: ['spellDuration', 'offlineSpellCasts'], effects: [
    effect('angel-5-mana', 'mana', 'mana.regen', globalTarget, 'multiplyPercent', { constant: 50 }),
  ] }),
  upgrade({ faction: 'angel', number: 6, sourceId: 'AN6', sourceName: 'Archangel Feathers', name: '高层精力池', description: '按当前精力恢复使全部设施产出提高 {effect:angel-6}%。', effects: [
    effect('angel-6', 'global', 'global.production', globalTarget, 'addPercent', { formula: '1.5 * ln(1 + x) ^ 3', variables: { x: 'derived.manaRegen' } }),
  ] }),
  upgrade({ faction: 'angel', number: 7, sourceId: 'AN7', sourceName: 'Magical Gates', name: '跨层资源通道', description: '按本次职业理想立场时间，最大精力 +{effect:angel-7}。', effects: [
    effect('angel-7', 'mana', 'mana.max', globalTarget, 'add', { formula: '15 + x ^ 0.7', variables: { x: 'stats.r.alignmentTime.good' } }),
  ] }),
  upgrade({ faction: 'angel', number: 8, sourceId: 'AN8', sourceName: 'Angelic Dominance', name: '战略主导权', description: '按战略赋能的 Era 活动时间提高每份期权加成 {effect:angel-8-gems}%；全法术精力消耗减半。', mechanics: ['spellCost'], effects: [
    effect('angel-8-gems', 'global', 'gem.power', globalTarget, 'add', { formula: '0.3 * x ^ 0.7', variables: { x: 'stats.ascension.spellActivity.godsHand' } }),
  ] }),
  upgrade({ faction: 'angel', number: 9, sourceId: 'AN9', sourceName: 'Wings of Liberty', name: '自由授权', description: '按最长法术持续时间使全部设施产出提高 {effect:angel-9}%。', effects: [
    effect('angel-9', 'global', 'global.production', globalTarget, 'addPercent', { formula: '6 * x ^ 0.6', variables: { x: 'derived.longestSpellDuration' } }),
  ] }),

  upgrade({ faction: 'undead', number: 1, sourceId: 'UD1', sourceName: 'The Walking Dead', name: '系统唤醒', description: '按有效数字员工数，影响力发现率 +{effect:undead-1} 个百分点。', effects: [
    effect('undead-1', 'factionCoin', 'factionCoin.chance', globalTarget, 'add', { formula: '5 + 2.5 * ln(1 + x) ^ 1.75', variables: { x: 'derived.assistants' } }),
  ] }),
  upgrade({ faction: 'undead', number: 2, sourceId: 'UD2', sourceName: 'Deadened Muscles', name: '疲劳管理', description: '按本次职业历史项目坟场最高数量，全部设施产出提高 {effect:undead-2}%。', effects: [
    effect('undead-2', 'global', 'global.production', globalTarget, 'addPercent', { formula: '40 + 4 * x ^ 0.8', variables: { x: 'stats.r.buildingMax.necropolis' } }),
  ] }),
  upgrade({ faction: 'undead', number: 3, sourceId: 'UD3', sourceName: 'Death Temples', name: '午夜运维台', description: '按本次职业历史项目坟场最高数量，每秒精力恢复 +{effect:undead-3}。', effects: [
    effect('undead-3', 'mana', 'mana.regen', globalTarget, 'add', { formula: '3 + 1.5 * x ^ 0.5', variables: { x: 'stats.r.buildingMax.necropolis' } }),
  ] }),
  upgrade({ faction: 'undead', number: 4, sourceId: 'UD4', sourceName: 'Undead Resilience', name: '非标准排班', description: '按本 Era 运维部影响力延长通宵赶工持续时间。', mechanics: ['spellDuration'] }),
  upgrade({ faction: 'undead', number: 5, sourceId: 'UD5', sourceName: 'Corpse Supply', name: '人力后备库', description: '按本 Era 游戏时间增加 {effect:undead-5} 名数字员工。', effects: [
    effect('undead-5', 'assistants', 'assistants.count', globalTarget, 'add', { formula: '5 + 0.5 * x ^ 0.7', variables: { x: 'stats.ascension.time' } }),
  ] }),
  upgrade({ faction: 'undead', number: 6, sourceId: 'UD6', sourceName: 'Plagued Buildings', name: '设施疲劳传染', description: '按本 Era 最高法术活动时间提高全部设施产出 {effect:undead-6}%，并将 Era 离线时间计入通宵赶工活动。', mechanics: ['nightTimeActivity'], effects: [
    effect('undead-6', 'global', 'global.production', globalTarget, 'addPercent', { formula: '25 + 2.5 * x ^ 0.75', variables: { x: 'stats.ascension.maxSpellActivity' } }),
  ] }),
  upgrade({ faction: 'undead', number: 7, sourceId: 'UD7', sourceName: 'Dead Fields', name: '永不打烊楼层', description: '全部设施与法术活动的有效计数提高 75%，真实采购和门槛不变。', mechanics: ['effectiveBuildings', 'effectiveSpellActivity'] }),
  upgrade({ faction: 'undead', number: 8, sourceId: 'UD8', sourceName: 'Tireless Workers', name: '不知疲倦员工', description: '按当前精力恢复乘算数字员工产出 +{effect:undead-8}%。', effects: [
    effect('undead-8', 'utility', 'assistants.production', globalTarget, 'multiplyPercent', { formula: '85 * (1.5 * ln(1 + x)) ^ 1.15', variables: { x: 'derived.manaRegen' } }),
  ] }),
  upgrade({ faction: 'undead', number: 9, sourceId: 'UD9', sourceName: 'Unholy Rituals', name: '持续运行韧性', description: '按 Era 离线时间提高在线产出 {effect:undead-9-online}%，离线产出提高 {effect:undead-9-offline}%。', effects: [
    effect('undead-9-online', 'global', 'global.production', globalTarget, 'addPercent', { formula: '50 + 7.5 * x ^ 0.75', variables: { x: 'stats.ascension.offlineTime' } }),
    effect('undead-9-offline', 'utility', 'offline.production', globalTarget, 'addPercent', { formula: '50 + 9.5 * x ^ 0.95', variables: { x: 'stats.ascension.offlineTime' } }),
  ] }),

  upgrade({ faction: 'demon', number: 1, sourceId: 'DM1', sourceName: 'Torture Chambers', name: '员工谈心室', description: '按有效数字员工数使当前 Tier 9 设施产出提高 {effect:demon-1}%。', effects: [
    effect('demon-1', 'buildingLocal', 'building.production', tierTarget(9), 'addPercent', { formula: '7 * ln(1 + x) ^ 3.5', variables: { x: 'derived.assistants' } }),
  ] }),
  upgrade({ faction: 'demon', number: 2, sourceId: 'DM2', sourceName: 'Infernal Magic', name: '执行暴君', description: '按当前 Tier 10 有效设施数，每秒精力恢复 +{effect:demon-2}。', effects: [
    effect('demon-2', 'mana', 'mana.regen', globalTarget, 'add', { formula: '3 + 1.5 * x ^ 0.5', variables: { x: 'buildings.tier10' } }),
  ] }),
  upgrade({ faction: 'demon', number: 3, sourceId: 'DM3', sourceName: 'Burning Legion', name: '燃烧执行团', description: '按本次职业 Tier 10 设施最高数量增加 {effect:demon-3} 名数字员工。', effects: [
    effect('demon-3', 'assistants', 'assistants.count', globalTarget, 'add', { formula: '6 + 1.6 * x ^ 0.6', variables: { x: 'stats.r.buildingMax.tier10' } }),
  ] }),
  upgrade({ faction: 'demon', number: 4, sourceId: 'DM4', sourceName: 'Lava Pits', name: '热点需求池', description: 'Tier 9 设施基础产出 +900,000，Tier 10 设施基础产出 +8,800,000。', effects: [
    effect('demon-4-tier9', 'buildingBase', 'building.baseProduction', tierTarget(9), 'add', { constant: 900000 }),
    effect('demon-4-tier10', 'buildingBase', 'building.baseProduction', tierTarget(10), 'add', { constant: 8800000 }),
  ] }),
  upgrade({ faction: 'demon', number: 5, sourceId: 'DM5', sourceName: 'Demon Overseers', name: '执行监工', description: '按原版奖杯数使当前最高三阶设施产出提高 {effect:demon-5}%。', effects: [
    effect('demon-5', 'buildingLocal', 'building.production', highestThreeTarget, 'addPercent', { formula: '16 + 4 * x ^ 0.8', variables: { x: 'trophies.original' } }),
  ] }),
  upgrade({ faction: 'demon', number: 6, sourceId: 'DM6', sourceName: 'Demonic Presence', name: '高压存在感', description: '按本次职业务实法术施放数，最大精力 +{effect:demon-6}。', effects: [
    effect('demon-6', 'mana', 'mana.max', globalTarget, 'add', { formula: '40 + 4 * ln(1 + x) ^ 4', variables: { x: 'stats.r.evilSpellsCast' } }),
  ] }),
  upgrade({ faction: 'demon', number: 7, sourceId: 'DM7', sourceName: 'Devil Tyrant', name: '炼狱推送算法', description: '按本次职业务实立场时间提高最高三阶设施产出 {effect:demon-7}%，其有效数量 ×2。', mechanics: ['effectiveBuildings'], effects: [
    effect('demon-7', 'buildingLocal', 'building.production', highestThreeTarget, 'addPercent', { formula: '1.5 * x ^ 0.5', variables: { x: 'stats.r.alignmentTime.evil' } }),
  ] }),
  upgrade({ faction: 'demon', number: 8, sourceId: 'DM8', sourceName: 'Evil Conquerors', name: '高压征服者', description: '按本次职业全天候工作井最高数量，全部设施产出提高 {effect:demon-8}%。', effects: [
    effect('demon-8', 'global', 'global.production', globalTarget, 'addPercent', { formula: '4 * x ^ 0.8', variables: { x: 'stats.r.buildingMax.hellPortal' } }),
  ] }),
  upgrade({ faction: 'demon', number: 9, sourceId: 'DM9', sourceName: 'Very Bad Guys', name: '狼性团队', description: '按高压执行在本次职业的活动时间，当前 Tier 10 设施产出提高 {effect:demon-9}%。', effects: [
    effect('demon-9', 'buildingLocal', 'building.production', tierTarget(10), 'addPercent', { formula: '35 + 0.7 * x ^ 0.7', variables: { x: 'stats.r.spellActivity.hellfireBlast' } }),
  ] }),
];


export const ADDITIONAL_FACTION_AGREEMENT_DEFINITIONS = ['elven', 'angel', 'undead', 'demon'].flatMap(faction => {
  const names = {
    elven: ['技术部', 'Elven'], angel: ['战略部', 'Angel'], undead: ['运维部', 'Undead'], demon: ['执行部', 'Demon'],
  }[faction];
  const make = (tier, cost, prerequisite) => {
    const id = `${faction}-${tier === 2 ? 'pact' : 'alliance'}`;
    return {
      id, kind: 'upgrade', contentVersion: 'base-v1', name: `${names[0]}${tier === 2 ? '协作' : '战略'}协议`,
      sourceName: `${names[1]} ${tier === 2 ? 'Pact' : 'Alliance'}`, sourceVersion: '4.3.24 build 26618872', verificationStatus: 'source-confirmed',
      description: `消耗${names[0]}影响力，解锁 Tier ${tier} 部门强化。`,
      era: { minR: 0 }, visible: { all: [selectedFaction(faction), prerequisite] }, unlock: { op: 'always' },
      purchase: { costs: factionAgreementCosts(faction, cost), requires: [{ op: 'notOwned', id }, selectedFaction(faction), prerequisite] },
      effects: [], grants: [], reactions: [], scope: 'run',
      ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: 'assets/images/content-icons/red-cross.svg' },
    };
  };
  const complete = numbers => ({ all: numbers.map(number => owned(`${faction}-${number}`)) });
  return [
    make(2, 100, complete([1, 2, 3])),
    make(3, 500, { all: [owned(`${faction}-pact`), complete([4, 5, 6])] }),
  ];
});
