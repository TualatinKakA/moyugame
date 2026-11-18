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
  ui: { kind: 'buildingCard', panel: 'buildings', icon: `assets/images/content-icons/buildings/${id}.svg` },
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

const BUILDING_UPGRADE_COSTS = {
  farm: [200, 6580, 1.07e7],
  inn: [2510, 82300, 1.338e8],
  blacksmith: [12070, 395020, 6.421e8],
  warriorBarracks: [36200, 1.185e6, 1.926e9],
  slavePen: [36200, 1.185e6, 1.926e9],
  knightsJoust: [112640, 3.687e6, 5.993e9],
  orcishArena: [112640, 3.687e6, 5.993e9],
  wizardTower: [764320, 2.502e7, 4.067e10],
  witchConclave: [764320, 2.502e7, 4.067e10],
  cathedral: [8.89e6, 2.91e8, 4.73e11],
  darkTemple: [8.89e6, 2.91e8, 4.73e11],
  citadel: [1.468e8, 4.806e9, 7.812e12],
  necropolis: [1.468e8, 4.806e9, 7.812e12],
  royalCastle: [2.916e9, 9.546e10, 1.552e14],
  evilFortress: [2.916e9, 9.546e10, 1.552e14],
  heavensGate: [6.436e10, 2.107e12, 3.425e15],
  hellPortal: [6.436e10, 2.107e12, 3.425e15],
};

const upgradePercent = (buildingId, index) => ['farm', 'inn', 'blacksmith'].includes(buildingId) ? [100, 200, 300][index] : 100;

export const BUILDING_UPGRADE_DEFINITIONS = BUILDING_DEFINITIONS.flatMap(building => [
  { amount: 5 },
  { amount: 25 },
  { amount: 75 },
].map((tier, index) => ({
  id: `${building.id}-tier${index + 1}`,
  kind: 'upgrade', contentVersion: 'base-v1',
  name: BUILDING_UPGRADE_NAMES[building.id][index],
  description: `${building.name}产出提高 ${upgradePercent(building.id, index)}%${index < 2 ? '，数字员工 +1' : ''}。`,
  era: { minR: 0 },
  visible: { all: [building.visible, { op: 'buildingOwned', id: building.id, value: tier.amount }] },
  unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: 'coins', amount: { constant: BUILDING_UPGRADE_COSTS[building.id][index] } }],
    requires: [{ op: 'notOwned', id: `${building.id}-tier${index + 1}` }],
  },
  effects: [{
    group: `${building.id}-tier${index + 1}`, phase: 'buildingLocal', stat: 'building.production',
    target: { type: 'buildings', ids: [building.id] }, operation: 'multiplyPercent',
    value: { constant: upgradePercent(building.id, index) }, stacking: 'multiply',
  }, ...(index < 2 ? [{
    group: `${building.id}-tier${index + 1}-assistant`, phase: 'assistants', stat: 'assistants.count',
    target: { type: 'global' }, operation: 'add', value: { constant: 1 }, stacking: 'add',
  }] : [])],
  grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'building', icon: `assets/images/content-icons/upgrades/${building.id}-tier${index + 1}.svg` },
})));
