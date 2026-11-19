const selectionCost = [{ resource: 'coins', amount: { constant: 25000 } }];
const treatyCost = [{
  resource: 'factionCoin.target', amount: { constant: 20 },
  when: {
    any: [
      { op: 'statAtLeast', path: 'resources.gems', value: 1 },
      { op: 'statAtLeast', path: 'progression.reincarnations', value: 1 },
    ],
  },
}];
export const ALIGNMENT_DEFINITIONS = [
  { id: 'good', name: '理想', description: '主动点击、技能与快速扩张。' },
  { id: 'evil', name: '务实', description: '稳定产出、离线收益与高阶设施。' },
].map(item => ({
  ...item, kind: 'alignment', contentVersion: 'base-v1', era: { minR: 0 },
  visible: { op: 'always' }, unlock: { op: 'always' },
  purchase: { costs: selectionCost, requires: [{ op: 'notSelected', key: 'alignment' }] },
  effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'choiceCard', panel: 'factions', icon: `assets/images/${item.id === 'good' ? 'id-card' : 'cash'}.png` },
}));

export const FACTION_DEFINITIONS = [
  {
    id: 'fairy', kind: 'faction', contentVersion: 'base-v1', name: '产品部', sourceName: 'Fairy', alignment: 'good',
    description: '强化见习工位、茶水间与打印维修间，偏向低阶设施协同。',
    spellId: 'fairyChanting', icon: 'laptop', coinIcon: 'assets/images/laptop.png',
  },
  {
    id: 'goblin', kind: 'faction', contentVersion: 'base-v1', name: '财务部', sourceName: 'Goblin', alignment: 'evil',
    description: '将设施规模、影响力与工资结算转化为长期收益。',
    spellId: 'goblinsGreed', icon: 'cash', coinIcon: 'assets/images/cash.png',
  },
].map(faction => ({
  ...faction, era: { minR: 0 },
  visible: { op: 'selected', key: 'alignment', value: faction.alignment }, unlock: { op: 'always' },
  factionCoin: { enabled: true, dropUnlock: { op: 'always' }, baseWeight: 1, icon: faction.coinIcon },
  purchase: { costs: treatyCost, requires: [{ op: 'notSelected', key: 'faction' }] },
  effects: [], grants: [{ type: 'grantSpellSource', id: faction.spellId, source: faction.id }],
  reactions: [], scope: 'run', ui: { kind: 'choiceCard', panel: 'factions', icon: `assets/images/content-icons/factions/${faction.id}-contract-tier1.svg` },
}));

const selectedFaction = faction => ({ op: 'selected', key: 'faction', value: faction });
const owned = id => ({ op: 'owned', id });
const tierComplete = (faction, ids) => ({ all: ids.map(id => owned(`${faction}-${id}`)) });
const upgradeIcon = (faction, id) => {
  const number = Number(id.split('-').at(-1));
  const tier = Math.floor((number - 1) / 3) + 1;
  const variant = (number - 1) % 3 + 1;
  return `assets/images/content-icons/factions/${faction}-upgrade-t${tier}-${variant}.svg`;
};
const upgrade = ({ id, name, description, faction, cost, effects, gate = null }) => ({
  id, kind: 'upgrade', contentVersion: 'base-v1', name, description,
  era: { minR: 0 },
  visible: gate ? { all: [selectedFaction(faction), gate] } : selectedFaction(faction), unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: 'coins', amount: { constant: cost } }],
    requires: [{ op: 'notOwned', id }, selectedFaction(faction), ...(gate ? [gate] : [])],
  },
  effects, grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: upgradeIcon(faction, id) },
});
const agreement = ({ id, name, description, faction, cost, prerequisite, tier }) => ({
  id, kind: 'upgrade', contentVersion: 'base-v1', name, description,
  era: { minR: 0 }, visible: { all: [selectedFaction(faction), prerequisite] }, unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: `factionCoin.${faction}`, amount: { constant: cost } }],
    requires: [{ op: 'notOwned', id }, selectedFaction(faction), prerequisite],
  },
  effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: `assets/images/content-icons/factions/${faction}-contract-tier${tier}.svg` },
});
const effect = (group, phase, stat, target, operation, value) => ({
  group, phase, stat, target, operation, value, stacking: operation === 'add' ? 'add' : 'multiply',
});

export const FACTION_UPGRADE_DEFINITIONS = [
  upgrade({ id: 'fairy-1', name: '需求培养土', description: '见习工位基础产出 +98，设施价格增长系数降低。', faction: 'fairy', cost: 5e7, effects: [
    effect('fairy-1-base', 'buildingBase', 'building.baseProduction', { type: 'buildings', ids: ['farm'] }, 'add', { constant: 98 }),
    effect('fairy-1-cost', 'raw', 'building.costMultiplier', { type: 'global' }, 'add', { constant: -0.02 }),
  ] }),
  upgrade({ id: 'fairy-2', name: '产品新人', description: '见习工位、茶水间与打印维修间产出提高 10,000%。', faction: 'fairy', cost: 5e8, effects: [
    effect('fairy-2', 'buildingLocal', 'building.production', { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] }, 'multiplyPercent', { constant: 10000 }),
  ] }),
  upgrade({ id: 'fairy-3', name: '善意默认值', description: '按理想设施数量提高精力上限。', faction: 'fairy', cost: 5e9, effects: [
    effect('fairy-3', 'mana', 'mana.max', { type: 'global' }, 'add', { formula: '1.3 * x ^ 0.7', variables: { x: 'buildings.alignment.good' } }),
  ] }),
  agreement({ id: 'fairy-pact', name: '产品部协作协议', description: '消耗 100 产品部影响力，解锁 Tier 2 部门强化。', faction: 'fairy', cost: 100, tier: 2, prerequisite: tierComplete('fairy', [1, 2, 3]) }),
  upgrade({ id: 'fairy-4', name: '团队补给站', description: '茶水间基础产出 +234，设施价格增长系数降低 0.02。', faction: 'fairy', cost: 5e11, gate: owned('fairy-pact'), effects: [
    effect('fairy-4-base', 'buildingBase', 'building.baseProduction', { type: 'buildings', ids: ['inn'] }, 'add', { constant: 234 }),
    effect('fairy-4-cost', 'raw', 'building.costMultiplier', { type: 'global' }, 'add', { constant: -0.02 }),
  ] }),
  upgrade({ id: 'fairy-5', name: '黄金需求池', description: '将见习工位、茶水间与打印维修间产出的 20% 加入基础点击收入。', faction: 'fairy', cost: 5e12, gate: owned('fairy-pact'), effects: [
    effect('fairy-5', 'click', 'click.base', { type: 'global' }, 'add', { formula: '0.2 * (farm + inn + blacksmith)', variables: { farm: 'derived.outputs.farm', inn: 'derived.outputs.inn', blacksmith: 'derived.outputs.blacksmith' } }),
  ] }),
  upgrade({ id: 'fairy-6', name: '技能封装术', description: '打印维修间按 2.75 × 数量^0.275 提高精力恢复。', faction: 'fairy', cost: 5e13, gate: owned('fairy-pact'), effects: [
    effect('fairy-6', 'mana', 'mana.regen', { type: 'global' }, 'add', { formula: '2.75 * x ^ 0.275', variables: { x: 'buildings.blacksmith' } }),
  ] }),
  agreement({ id: 'fairy-alliance', name: '产品部战略协议', description: '消耗 500 产品部影响力，解锁 Tier 3 部门强化。', faction: 'fairy', cost: 500, tier: 3, prerequisite: { all: [owned('fairy-pact'), tierComplete('fairy', [4, 5, 6])] } }),
  upgrade({ id: 'fairy-7', name: '星屑组件库', description: '打印维修间基础产出 +580，设施价格增长系数降低 0.02。', faction: 'fairy', cost: 5e15, gate: owned('fairy-alliance'), effects: [
    effect('fairy-7-base', 'buildingBase', 'building.baseProduction', { type: 'buildings', ids: ['blacksmith'] }, 'add', { constant: 580 }),
    effect('fairy-7-cost', 'raw', 'building.costMultiplier', { type: 'global' }, 'add', { constant: -0.02 }),
  ] }),
  upgrade({ id: 'fairy-8', name: '全端需求联动', description: '按见习工位、茶水间与打印维修间总数提高全部设施产出。', faction: 'fairy', cost: 5e16, gate: owned('fairy-alliance'), effects: [
    effect('fairy-8', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '0.75 * x ^ 0.75', variables: { x: 'buildings.low3' } }),
  ] }),
  upgrade({ id: 'fairy-9', name: '群脑评审', description: '按见习工位、茶水间与打印维修间总数增加数字员工。', faction: 'fairy', cost: 5e17, gate: owned('fairy-alliance'), effects: [
    effect('fairy-9', 'assistants', 'assistants.count', { type: 'global' }, 'add', { formula: '1.2 * x ^ 0.6', variables: { x: 'buildings.low3' } }),
  ] }),
  upgrade({ id: 'goblin-1', name: '强势现金流', description: '按历史部门影响力增加数字员工。', faction: 'goblin', cost: 5e7, effects: [
    effect('goblin-1', 'assistants', 'assistants.count', { type: 'global' }, 'add', { formula: '0.5 * ln(1 + x) ^ 2', variables: { x: 'stats.run.factionCoins' } }),
  ] }),
  upgrade({ id: 'goblin-2', name: '外包交易', description: '按务实设施数量提高全部设施产出。', faction: 'goblin', cost: 5e8, effects: [
    effect('goblin-2', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '2 * x ^ 0.7', variables: { x: 'buildings.alignment.evil' } }),
  ] }),
  upgrade({ id: 'goblin-3', name: '低成本物料', description: '按设施总数增加工资结算的结算秒数。', faction: 'goblin', cost: 5e9, effects: [
    effect('goblin-3', 'tax', 'taxCollection.seconds', { type: 'global' }, 'add', { formula: 'x ^ 0.5', variables: { x: 'buildings.total' } }),
  ] }),
  agreement({ id: 'goblin-pact', name: '财务部协作协议', description: '消耗 100 财务部影响力，解锁 Tier 2 部门强化。', faction: 'goblin', cost: 100, tier: 2, prerequisite: tierComplete('goblin', [1, 2, 3]) }),
  upgrade({ id: 'goblin-4', name: '灰色采购市', description: '期权产出倍率 ×2.5；按本轮工资结算次数提高离线产出。', faction: 'goblin', cost: 5e11, gate: owned('goblin-pact'), effects: [
    effect('goblin-4-gems', 'global', 'gem.power', { type: 'global' }, 'multiplyPercent', { constant: 150 }),
    effect('goblin-4-offline', 'utility', 'offline.production', { type: 'global' }, 'addPercent', { formula: 'log10(1 + x) ^ 2', variables: { x: 'stats.run.spellCasts.taxCollection' } }),
  ] }),
  upgrade({ id: 'goblin-5', name: '财务精算师', description: '按当前工资乘算提高精力恢复。', faction: 'goblin', cost: 5e12, gate: owned('goblin-pact'), effects: [
    effect('goblin-5', 'mana', 'mana.regen', { type: 'global' }, 'multiplyPercent', { formula: '0.75 * log10(1 + x) ^ 1.25', variables: { x: 'resources.coins' } }),
  ] }),
  upgrade({ id: 'goblin-6', name: '成本角斗场', description: '按工资结算的结算秒数提高全部设施产出。', faction: 'goblin', cost: 5e13, gate: owned('goblin-pact'), effects: [
    effect('goblin-6', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '12 * ln(1 + x) ^ 3', variables: { x: 'derived.taxSeconds' } }),
  ] }),
  agreement({ id: 'goblin-alliance', name: '财务部战略协议', description: '消耗 500 财务部影响力，解锁 Tier 3 部门强化。', faction: 'goblin', cost: 500, tier: 3, prerequisite: { all: [owned('goblin-pact'), tierComplete('goblin', [4, 5, 6])] } }),
  upgrade({ id: 'goblin-7', name: '集团资金池', description: '每次施放其他技能时，免费追加一次工资结算。', faction: 'goblin', cost: 5e15, gate: owned('goblin-alliance'), effects: [] }),
  upgrade({ id: 'goblin-8', name: '账面富贵', description: '按本次职业内夜间作战室的历史最高数量提高影响力发现率。', faction: 'goblin', cost: 5e16, gate: owned('goblin-alliance'), effects: [
    effect('goblin-8', 'factionCoin', 'factionCoin.chance', { type: 'global' }, 'add', { formula: 'floor(2 * x ^ 0.6)', variables: { x: 'stats.r.buildingMax.witchConclave' } }),
  ] }),
  upgrade({ id: 'goblin-9', name: '全绿预算折扣', description: '每 10 分钟随机获得 1–2500 秒当前总产出，离线也会触发。', faction: 'goblin', cost: 5e17, gate: owned('goblin-alliance'), effects: [] }),
];
