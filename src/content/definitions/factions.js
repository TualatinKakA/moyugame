const selectionCost = [{ resource: 'coins', amount: { constant: 25000 } }];
export const ALIGNMENT_DEFINITIONS = [
  { id: 'good', name: '上进', description: '主动点击、技能与快速扩张。' },
  { id: 'evil', name: '狼性', description: '稳定产出、离线收益与高阶设施。' },
].map(item => ({
  ...item, kind: 'alignment', contentVersion: 'base-v1', era: { minR: 0 },
  visible: { op: 'notSelected', key: 'alignment' }, unlock: { op: 'always' },
  purchase: { costs: selectionCost, requires: [{ op: 'notSelected', key: 'alignment' }] },
  effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'choiceCard', panel: 'factions', icon: `assets/images/${item.id === 'good' ? 'id-card' : 'cash'}.png` },
}));

export const FACTION_DEFINITIONS = [
  {
    id: 'fairy', kind: 'faction', contentVersion: 'base-v1', name: '产品部', sourceName: 'Fairy', alignment: 'good',
    description: '强化见习工位、茶水间与打印维修间，偏向低阶设施协同。',
    spellId: 'fairyChanting', icon: 'laptop',
  },
  {
    id: 'goblin', kind: 'faction', contentVersion: 'base-v1', name: '财务部', sourceName: 'Goblin', alignment: 'evil',
    description: '将设施规模、影响力与工资结算转化为长期收益。',
    spellId: 'goblinsGreed', icon: 'cash',
  },
].map(faction => ({
  ...faction, era: { minR: 0 },
  visible: { op: 'selected', key: 'alignment', value: faction.alignment }, unlock: { op: 'always' },
  purchase: { costs: [], requires: [{ op: 'notSelected', key: 'faction' }] },
  effects: [], grants: [{ type: 'grantSpellSource', id: faction.spellId, source: faction.id }],
  reactions: [], scope: 'run', ui: { kind: 'choiceCard', panel: 'factions', icon: `assets/images/${faction.icon}.png` },
}));

const upgrade = ({ id, name, description, faction, cost, effects }) => ({
  id, kind: 'upgrade', contentVersion: 'base-v1', name, description,
  era: { minR: 0 },
  visible: { op: 'selected', key: 'faction', value: faction }, unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: 'coins', amount: { constant: cost } }],
    requires: [{ op: 'notOwned', id }, { op: 'selected', key: 'faction', value: faction }],
  },
  effects, grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: `assets/images/${faction === 'fairy' ? 'laptop' : 'cash'}.png` },
});
const effect = (group, phase, stat, target, operation, value) => ({
  group, phase, stat, target, operation, value, stacking: operation === 'add' ? 'add' : 'multiply',
});

export const FACTION_UPGRADE_DEFINITIONS = [
  upgrade({ id: 'fairy-1', name: '需求培养土', description: '见习工位基础产出 +98，设施价格增长系数降低。', faction: 'fairy', cost: 5e7, effects: [
    effect('fairy-1-base', 'buildingBase', 'building.baseProduction', { type: 'buildings', ids: ['farm'] }, 'add', { constant: 98 }),
    effect('fairy-1-cost', 'raw', 'building.costMultiplier', { type: 'allBuildings' }, 'add', { constant: -0.02 }),
  ] }),
  upgrade({ id: 'fairy-2', name: '产品新人', description: '见习工位、茶水间与打印维修间产出提高 10,000%。', faction: 'fairy', cost: 5e8, effects: [
    effect('fairy-2', 'buildingLocal', 'building.production', { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] }, 'multiplyPercent', { constant: 10000 }),
  ] }),
  upgrade({ id: 'fairy-3', name: '善意默认值', description: '按上进设施数量提高精力上限。', faction: 'fairy', cost: 5e9, effects: [
    effect('fairy-3', 'mana', 'mana.max', { type: 'global' }, 'add', { formula: '1.3 * x ^ 0.7', variables: { x: 'buildings.alignment.good' } }),
  ] }),
  upgrade({ id: 'goblin-1', name: '强势现金流', description: '按历史部门影响力增加数字员工。', faction: 'goblin', cost: 5e7, effects: [
    effect('goblin-1', 'assistants', 'assistants.count', { type: 'global' }, 'add', { formula: '0.5 * ln(1 + x) ^ 2', variables: { x: 'factionCoins.total' } }),
  ] }),
  upgrade({ id: 'goblin-2', name: '外包交易', description: '按强压设施数量提高全部设施产出。', faction: 'goblin', cost: 5e8, effects: [
    effect('goblin-2', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '2 * x ^ 0.7', variables: { x: 'buildings.alignment.evil' } }),
  ] }),
  upgrade({ id: 'goblin-3', name: '低成本物料', description: '按设施总数增加工资结算的结算秒数。', faction: 'goblin', cost: 5e9, effects: [
    effect('goblin-3', 'utility', 'taxCollection.seconds', { type: 'global' }, 'add', { formula: 'x ^ 0.5', variables: { x: 'buildings.total' } }),
  ] }),
];
