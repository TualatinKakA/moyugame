const base = [
  ['farm', '见习工位', 1, 2, 10, 'any'],
  ['inn', '茶水间', 2, 6, 125, 'any'],
  ['blacksmith', '打印维修间', 3, 20, 600, 'any'],
];
const tiers = [
  [4, 65, 1800, 'warriorBarracks', '奋斗培训室', 'slavePen', '外包压缩舱'],
  [5, 200, 5600, 'knightsJoust', '项目擂台', 'orcishArena', '绩效竞技场'],
  [6, 650, 38000, 'wizardTower', '自动化实验室', 'witchConclave', '夜间作战室'],
  [7, 2000, 442000, 'cathedral', '企业文化礼堂', 'darkTemple', '黑盒运维中心'],
  [8, 8500, 7300000, 'citadel', '集团事业群', 'necropolis', '历史项目坟场'],
  [9, 100000, 145000000, 'royalCastle', '全球总部', 'evilFortress', '高压事业部'],
  [10, 1200000, 3200000000, 'heavensGate', '轨道办公港', 'hellPortal', '全天候工作井'],
];

const definition = (id, name, tier, rate, cost, alignment) => ({
  id, kind: 'building', contentVersion: 'base-v1', name,
  era: { minR: 0 },
  visible: alignment === 'any' ? { op: 'always' } : { op: 'selected', key: 'alignment', value: alignment },
  unlock: { op: 'always' },
  purchase: { costs: [{ resource: 'coins', amount: { constant: cost } }], growth: 1.15 },
  production: rate,
  tier,
  alignment,
  effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'buildingCard', panel: 'buildings', icon: id },
});

export const BUILDING_DEFINITIONS = [
  ...base.map(args => definition(...args)),
  ...tiers.flatMap(([tier, rate, cost, goodId, goodName, evilId, evilName]) => [
    definition(goodId, goodName, tier, rate, cost, 'good'),
    definition(evilId, evilName, tier, rate, cost, 'evil'),
  ]),
];

export const BUILDING_UPGRADE_DEFINITIONS = BUILDING_DEFINITIONS.flatMap(building => [
  { amount: 1, percent: 50, multiplier: 10 },
  { amount: 10, percent: 100, multiplier: 100 },
  { amount: 25, percent: 150, multiplier: 1000 },
].map((tier, index) => ({
  id: `${building.id}-tier${index + 1}`,
  kind: 'upgrade', contentVersion: 'base-v1',
  name: `${building.name} · 流程改善 ${index + 1}`,
  description: `${building.name}产出提高 ${tier.percent}%。`,
  era: { minR: 0 },
  visible: { all: [building.visible, { op: 'buildingOwned', id: building.id, value: tier.amount }] },
  unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: 'coins', amount: { constant: building.purchase.costs[0].amount.constant * tier.multiplier } }],
    requires: [{ op: 'notOwned', id: `${building.id}-tier${index + 1}` }],
  },
  effects: [{
    group: `${building.id}-tier${index + 1}`, phase: 'buildingLocal', stat: 'building.production',
    target: { type: 'buildings', ids: [building.id] }, operation: 'multiplyPercent',
    value: { constant: tier.percent }, stacking: 'multiply',
  }],
  grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', icon: building.id },
})));
