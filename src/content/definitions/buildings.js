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

const BUILDING_ICONS = {
  farm: 'briefcase', inn: 'coffee', blacksmith: 'keyboard', warriorBarracks: 'laptop', slavePen: 'headphones',
  knightsJoust: 'id-card', orcishArena: 'cash', wizardTower: 'monitor', witchConclave: 'headphones',
  cathedral: 'tower', darkTemple: 'tower', citadel: 'briefcase', necropolis: 'tower',
  royalCastle: 'cash', evilFortress: 'briefcase', heavensGate: 'monitor', hellPortal: 'tower',
};
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
  ui: { kind: 'buildingCard', panel: 'buildings', icon: `assets/images/${BUILDING_ICONS[id]}.png` },
});

export const BUILDING_DEFINITIONS = [
  ...base.map(args => definition(...args)),
  ...tiers.flatMap(([tier, rate, cost, goodId, goodName, evilId, evilName]) => [
    definition(goodId, goodName, tier, rate, cost, 'good'),
    definition(evilId, evilName, tier, rate, cost, 'evil'),
  ]),
];

const BUILDING_UPGRADE_NAMES = {
  farm: ['工位轮换', '精力灌溉', '职业带教师'],
  inn: ['精品咖啡', '工位虫害消杀', '丝滑午休毯'],
  blacksmith: ['重型订书锤', '标准打印模具', '高温装订炉'],
  warriorBarracks: ['青铜任务卡', '铁纪早操', '钢铁答辩'],
  slavePen: ['更小的工位', '惩罚教鞭', '选择性招聘'],
  knightsJoust: ['尖头需求枪', '高机动项目组', '受训答辩手'],
  orcishArena: ['不公正评委', '废除规则', '追加淘汰'],
  wizardTower: ['自动化法阵', '算力引导', '高级算法师'],
  witchConclave: ['午夜例会', '黑箱作业', '密谋小组'],
  cathedral: ['黄金价值观十字', '创始人纪念堂', '价值观圣像'],
  darkTemple: ['故障献祭台', '暗箱仪式', '黑盒核心'],
  citadel: ['事业群守卫训练', '瞭望员', '跨部门信号火'],
  necropolis: ['被删档的墓穴', '腐烂项目遗体', '项目灵魂存储'],
  royalCastle: ['加固城墙', '总部气氛组', '舒适总裁椅'],
  evilFortress: ['带刺围墙', '深入地牢', '黑曜王座'],
  heavensGate: ['黄金钥匙', '飞行云平台', '自动闸门'],
  hellPortal: ['持续痛苦', '无尽悲伤', '永恒煎熬'],
};

export const BUILDING_UPGRADE_DEFINITIONS = BUILDING_DEFINITIONS.flatMap(building => [
  { amount: 1, percent: 50, multiplier: 10 },
  { amount: 10, percent: 100, multiplier: 100 },
  { amount: 25, percent: 150, multiplier: 1000 },
].map((tier, index) => ({
  id: `${building.id}-tier${index + 1}`,
  kind: 'upgrade', contentVersion: 'base-v1',
  name: BUILDING_UPGRADE_NAMES[building.id][index],
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
  ui: { kind: 'upgradeCard', panel: 'upgrades', icon: building.ui.icon },
})));
