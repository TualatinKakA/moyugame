import { BUILDING_UPGRADE_DATA } from './building-upgrades-data.js';

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

const ascensionIs = value => ({ op: 'statEquals', path: 'progression.ascension', value });
const ASCENSION_ONE = ascensionIs(1);
const ASCENSION_TWO_PLUS = { op: 'statAtLeast', path: 'progression.ascension', value: 2 };

const dynamicCost = (building, data, ascension) => ({
  resource: 'coins',
  amount: { formula: `round(${building.purchase.costs[0].amount.constant} * ${1 + 0.15 / (ascension * 5 || 1)} ^ ${data.requirement}) * ${10 * data.tier}` },
  when: ascensionIs(ascension),
});
const upgradeCosts = (building, data) => {
  if (building.id === 'farm' && data.tier === 1) return [{ resource: 'coins', amount: { constant: 0 } }];
  const paid = [dynamicCost(building, data, 0), dynamicCost(building, data, 1)];
  if (data.tier >= 23) paid.push(dynamicCost(building, data, 2));
  if (data.tier <= 19) return [paid[0], { resource: 'coins', amount: { constant: 0 }, when: { op: 'statAtLeast', path: 'progression.ascension', value: 1 } }];
  if (data.tier <= 22) paid.push({ resource: 'coins', amount: { constant: 0 }, when: ASCENSION_TWO_PLUS });
  else paid[1].when = ASCENSION_ONE;
  return paid;
};

const upgradeEffects = (id, buildingId, data) => {
  const effects = [{
    group: `${id}-production`, phase: 'buildingLocal', stat: 'building.production',
    target: { type: 'buildings', ids: [buildingId] }, operation: 'multiplyPercent',
    value: { constant: data.prePercent }, stacking: 'multiply',
  }];
  if (data.assistants) effects.push({
    group: `${id}-assistant`, phase: 'assistants', stat: 'assistants.count',
    target: { type: 'global' }, operation: 'add', value: { constant: data.assistants }, stacking: 'add',
  });
  return effects;
};

const upgradeDescription = (building, data) => {
  const assistants = data.assistants ? '，数字员工 +1' : '';
  return `${building.name}产出提高 {activeProductionPercent}%${assistants}。`;
};

export const BUILDING_UPGRADE_DEFINITIONS = BUILDING_DEFINITIONS.flatMap(building =>
  BUILDING_UPGRADE_DATA[building.id].map(data => {
    const id = `${building.id}-tier${data.tier}`;
    return {
      id, kind: 'upgrade', contentVersion: 'base-v1',
      name: data.name, sourceName: data.sourceName, buildingId: building.id, tier: data.tier,
      description: upgradeDescription(building, data),
      era: { minR: data.minR, maxA: 2 },
      visible: { all: [building.visible, { op: 'buildingOwned', id: building.id, value: data.requirement }] },
      unlock: { op: 'always' },
      purchase: {
        costs: upgradeCosts(building, data),
        requires: [{ op: 'notOwned', id }],
      },
      effects: upgradeEffects(id, building.id, data),
      grants: [], reactions: [], scope: 'run',
      ui: {
        kind: 'upgradeCard', panel: 'upgrades', category: 'building',
        icon: `assets/images/content-icons/upgrades/${id}.svg`,
      },
    };
  }));
