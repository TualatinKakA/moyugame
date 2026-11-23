const HALL_VISIBLE = { not: { op: 'notSelected', key: 'alignment' } };
const hallTarget = { type: 'buildings', ids: ['hallOfLegends'] };
const otherBuildingsTarget = { type: 'otherBuildings', id: 'hallOfLegends' };
const sourceVersion = '4.3.24 build 26618872';
const verificationStatus = 'source-confirmed';

export const HALL_BUILDING_DEFINITION = {
  id: 'hallOfLegends', kind: 'building', contentVersion: 'base-v1', name: '传奇档案馆',
  sourceName: 'Hall of Legends', sourceVersion, verificationStatus,
  era: { minR: 0 }, visible: HALL_VISIBLE, unlock: { op: 'always' },
  purchase: { costs: [{ resource: 'coins', amount: { constant: 2e11 } }], growth: 1.15 },
  production: 250000, tier: 11, alignment: 'any', requiresAlignment: true,
  effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'buildingCard', panel: 'buildings', icon: 'assets/images/content-icons/buildings/hallOfLegends.svg', collectionIcon: 'assets/images/content-icons/upgrades/hallOfLegends-collection.svg', metric: 'hallOfLegends' },
};

const tiers = [
  [1, '先进代表名录', 'Legendary Representatives', 5, 1.75, 0.0025],
  [2, '骨干联席名录', 'Legendary League', 25, 1.75, 0.0025],
  [3, '攻坚标兵名录', 'Legendary Heroes', 75, 1.75, 0.0025],
  [4, '首席功臣名录', 'Legendary Champion', 150, 1.75, 0.0025],
  [5, '业务带头人录', 'Legendary Leaders', 200, 1.75, 0.0025],
  [6, '部门掌舵人录', 'Legendary Lords', 300, 2.5, 0.005],
  [7, '核心方阵名录', 'Legendary Army', 400, 2.5, 0.005],
  [8, '中枢执掌者录', 'Legendary Rulers', 500, 2.5, 0.005],
  [9, '章程起草人录', 'Legendary Makers', 600, 2.5, 0.005],
  [10, '创社元勋档案', 'Legendary Inception', 700, 2.5, 0.005],
  [11, '荣光殿堂卷宗', 'Legendary Palace', 800, 4, 0.0075],
  [12, '定鼎宗师档案', 'Legendary Gods', 900, 4, 0.0075],
  [13, '核心节点档案', 'Legendary Entities', 1000, 4, 0.0075],
  [14, '长明工号档案', 'Legendary Eternals', 1100, 4, 0.0075],
  [15, '统筹辖区档案', 'Legendary Realm', 1250, 4, 0.0075],
  [16, '跨期归档名录', 'Legendary Reunion', 1500, 7, 0.01],
  [17, '历届全会纪要', 'Legendary Meeting', 1750, 7, 0.01],
  [18, '多维并网纪要', 'Legendary Confluence', 2000, 7, 0.01],
  [19, '全体大会纪要', 'Legendary Assembly', 2500, 7, 0.01],
  [20, '深层洞库藏卷', 'Legendary Lands', 3500, 1.2, 0.001],
  [21, '在岗校验记录', 'Legendary Participation', 4000, 1.4, 0.0015],
  [22, '永续考勤记录', 'Legendary Attendance', 10000, 1.6, 0.002],
  [23, '太一庆典纪要', 'Legendary Party', 18000, 1.8, 0.0025],
];

const atAscension = value => ({ op: 'statEquals', path: 'progression.ascension', value });
const costs = [
  [4e13, 0, 0], [1.3e15, 0, 0], [2.1e18, 0, 0], [1e23, 0, 0], [1.4e26, 0, 0],
  [1.95e32, 0, 0], [2.65e38, 0, 0], [3.57e44, 0, 0], [4.72e50, 0, 0], [6.16e56, 0, 0],
  [7.96e62, 0, 0], [1.02e69, 0, 0], [1e75, 0, 0], [1.64e81, 0, 0], [2.24e90, 0, 0],
  [3.56e105, 0, 0], [5.66e120, 0, 0], [8.95e135, 0, 0], [2.11e166, 0, 0],
  [0, 5.82e87, 0], [0, 3.43e98, 0], [0, 2.03e163, 0], [0, 3.92e129, 3.92e129],
];
const upgradeCosts = tier => costs[tier - 1].map((value, ascension) => ({
  resource: 'coins', amount: { constant: value }, when: atAscension(ascension),
}));

export const HALL_UPGRADE_DEFINITIONS = tiers.map(([tier, name, sourceName, requirement, hallMultiplier, trophyCoefficient]) => {
  const id = `hallOfLegends-tier${tier}`;
  return {
    id, kind: 'upgrade', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
    buildingId: 'hallOfLegends', tier, requirement, hallMultiplier, trophyCoefficient,
    description: `传奇档案馆产出 ×${hallMultiplier}；其他每项设施按每个奖杯提高 ${trophyCoefficient * 100}%。`,
    era: { minR: tier >= 23 ? 100 : tier >= 20 ? 40 : 0, maxA: 2 },
    visible: { all: [HALL_VISIBLE, { op: 'buildingOwned', id: 'hallOfLegends', value: requirement }] },
    unlock: { op: 'always' },
    purchase: { costs: upgradeCosts(tier, requirement), requires: [{ op: 'notOwned', id }] },
    effects: [
      { group: `${id}-hall`, phase: 'buildingLocal', stat: 'building.production', target: hallTarget, operation: 'multiply', value: { constant: hallMultiplier }, stacking: 'multiply' },
      { group: `${id}-others`, phase: 'buildingLocal', stat: 'building.production', target: otherBuildingsTarget, operation: 'multiply', value: { formula: `1 + ${trophyCoefficient} * x`, variables: { x: 'trophies.original' } }, stacking: 'multiply' },
    ],
    grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'building', icon: `assets/images/content-icons/upgrades/${id}.svg` },
  };
});

const bonuses = [
  [1, '荣誉档案库', 'Hall of Fame', 750, 1e45, 750000, 75, null],
  [2, '功勋档案库', 'Hall of Prestige', 1500, 2e90, 2000000, 150, null],
  [3, '元老档案库', 'Hall of Renown', 2250, 3e135, 7000000, 225, null],
  [4, '绝密内参卷宗', 'Legend Among Legends', 175, 1e27, 0, 0, 2],
  [5, '层层递归卷宗', "It's Legends All the Way Down", 350, 1e51, 0, 0, 3],
  [6, '档案总目索引', 'Trophies Trophy', 540, 1e108, 0, 0, 5],
];

export const HALL_BONUS_DEFINITIONS = bonuses.map(([bonus, name, sourceName, requirement, cost, baseAdd, prestigePercent, multiplier]) => {
  const id = `hallBonus${bonus}`;
  const gate = bonus <= 3
    ? { op: 'buildingOwned', id: 'hallOfLegends', value: requirement }
    : { op: 'statAtLeast', path: 'derived.originalTrophies', value: requirement };
  const effects = [];
  if (baseAdd) effects.push(
    { group: `${id}-base`, phase: 'buildingBase', stat: 'building.baseProduction', target: hallTarget, operation: 'add', value: { constant: baseAdd }, stacking: 'add' },
    { group: `${id}-prestige`, phase: 'buildingLocal', stat: 'hall.prestige', target: hallTarget, operation: 'add', value: { constant: prestigePercent }, stacking: 'add' },
  );
  if (multiplier) effects.push({ group: `${id}-multiplier`, phase: 'buildingLocal', stat: 'building.production', target: hallTarget, operation: 'multiply', value: { constant: multiplier }, stacking: 'multiply' });
  return {
    id, kind: 'upgrade', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
    buildingId: 'hallOfLegends', hallBonus: bonus, requirement, baseAdd, prestigePercent,
    description: baseAdd
      ? `每座传奇档案馆基础值 +${baseAdd}；按其他设施数量提高传奇档案馆产出。`
      : `传奇档案馆产出 ×${multiplier}。`,
    era: { minR: 0, maxA: 2 }, visible: { all: [HALL_VISIBLE, gate] }, unlock: { op: 'always' },
    purchase: { costs: [{ resource: 'coins', amount: { constant: cost } }], requires: [{ op: 'notOwned', id }] },
    effects, grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'hallBonus', icon: `assets/images/content-icons/upgrades/${id}.svg` },
  };
});
