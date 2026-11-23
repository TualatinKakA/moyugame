import { BUILDING_DEFINITIONS } from './buildings.js';
import { HALL_BUILDING_DEFINITION } from './hall.js';

const redCross = 'assets/images/content-icons/red-cross.svg';
const sourceVersion = '4.3.24 build 26618872';
const verificationStatus = 'source-confirmed';
const owned = id => ({ op: 'owned', id });
const selected = alignment => ({ op: 'selected', key: 'alignment', value: alignment });
const globalTarget = { type: 'global' };
const buildings = [...BUILDING_DEFINITIONS, HALL_BUILDING_DEFINITION];
const thresholds = [1, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 3500, 5000, 7500, 12000, 20000];
const sourceNames = {
  farm: 'Farm', inn: 'Inn', blacksmith: 'Blacksmith', warriorBarracks: 'Warrior Barracks', slavePen: 'Slave Pen',
  knightsJoust: "Knight's Joust", orcishArena: 'Orcish Arena', wizardTower: 'Wizard Tower', witchConclave: 'Witch Conclave',
  cathedral: 'Cathedral', darkTemple: 'Dark Temple', citadel: 'Citadel', necropolis: 'Necropolis',
  royalCastle: 'Royal Castle', evilFortress: 'Evil Fortress', heavensGate: "Heaven's Gate", hellPortal: 'Hell Portal',
};

function trophy({ id, name, sourceName, description, reactions, trophyType, group = 'original' }) {
  return {
    id, kind: 'trophy', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
    originalTrophy: true, trophyType, statScope: 'run', rounding: 'threshold', resetScope: 'total',
    description, era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' },
    purchase: null, effects: [], grants: [], reactions, rewardId: id, scope: 'total',
    ui: { kind: 'trophyCard', panel: 'trophies', trophyGroup: group, icon: redCross },
  };
}
const reconcile = (path, when) => [
  { path, when, priority: 30 },
  { event: 'game.reconcile', when, priority: 30 },
];
const available = building => building.alignment !== 'any' ? selected(building.alignment)
  : building.requiresAlignment ? { not: { op: 'notSelected', key: 'alignment' } } : { op: 'always' };
const alignmentReconcile = (path, when) => [...reconcile(path, when), { event: 'alignment.selected', when, priority: 30 }];

const singleBuildingTrophies = buildings.flatMap(building => thresholds.map((threshold, index) => {
  const id = `${building.id}-building-trophy-${index + 1}`;
  const when = { all: [available(building), { op: 'statAtLeast', path: `buildings.${building.id}`, value: threshold }] };
  return trophy({
    id, name: `${building.name} · 规模奖杯 ${index + 1}`, sourceName: `${building.sourceName || sourceNames[building.id]} Building Trophy ${index + 1}`,
    description: `当前真实拥有至少 ${threshold} 个${building.name}。`, reactions: alignmentReconcile(`buildings.${building.id}`, when),
    trophyType: 'building-trophy', group: `facility:${building.id}`,
  });
}));

const grinderNames = [
  ['小型办公室', 'Village Grinder'], ['街区办公室', 'Town Grinder'], ['城市园区', 'City Grinder'],
  ['集团园区', 'Kingdom Grinder'], ['企业帝国', 'Empire Grinder'], ['全域职场', 'Realm Grinder'],
  ['历史工作狂', 'History Grinder'], ['世界工作狂', 'World Grinder'], ['宇宙工作狂', 'Universe Grinder'],
  ['多元工作狂', 'Multiverse Grinder'], ['元工作狂', 'Metagrinder'], ['超工作狂', 'Overgrinder'],
  ['真正工作狂', 'True Grinder'], ['工作大师', 'Master Grinder'], ['工作宗师', 'Grandmaster Grinder'],
];
const grinderThresholds = [100, 250, 500, 1000, 2000, 3000, 5000, 8000, 12000, 20000, 35000, 50000, 125000, 200000, 300000];
const aggregateBuildingTrophies = grinderNames.map(([name, sourceName], index) => {
  const id = `buildBuildingTrophy${index + 1}`;
  const when = { op: 'statAtLeast', path: 'stats.ascension.buildingsBuilt', value: grinderThresholds[index] };
  return trophy({
    id, name, sourceName, description: `本 Era 累计建造至少 ${grinderThresholds[index]} 个设施。`,
    reactions: reconcile('stats.ascension.buildingsBuilt', when), trophyType: 'aggregate-building-trophy', group: 'facilities',
  });
});
const architectTrophies = buildings.map(building => {
  const when = { all: [available(building), { op: 'statAtLeast', path: `buildings.${building.id}`, value: 100000 }] };
  return { path: `buildings.${building.id}`, when };
}).flatMap(({ path, when }) => alignmentReconcile(path, when));
const theArchitect = trophy({
  id: 'theArchitect', name: '组织架构师', sourceName: 'The Architect',
  description: '任意一种设施的当前真实数量达到 100,000。', reactions: architectTrophies,
  trophyType: 'aggregate-building-trophy', group: 'facilities',
});

export const FACILITY_TROPHY_DEFINITIONS = [...singleBuildingTrophies, ...aggregateBuildingTrophies, theArchitect];

const availableBuildings = alignment => buildings.filter(building => (building.alignment === 'any' || building.alignment === alignment)
  && (!building.requiresAlignment || Boolean(alignment)));
const exactCounts = alignment => availableBuildings(alignment).map(building => ({ op: 'statEquals', path: `buildings.${building.id}`, value: 1 }));
const mathematicianCounts = alignment => Array.from({ length: 11 }, (_, index) => {
  const tier = 11 - index;
  const building = availableBuildings(alignment).find(item => item.tier === tier);
  return { op: 'statEquals', path: `buildings.${building.id}`, value: 2 ** index };
});
const secretEvents = when => [
  { event: 'building.purchased', when, priority: 25 },
  { event: 'alignment.selected', when, priority: 25 },
  { event: 'game.reconcile', when, priority: 25 },
];

export const SECRET_TROPHY_DEFINITIONS = [
  trophy({
    id: 'unitaryTrophy', name: '全设施各一', sourceName: 'Unitary',
    description: '当前立场可用的每种设施真实数量都严格等于 1。',
    reactions: secretEvents({ any: [
      { all: [selected('good'), ...exactCounts('good')] },
      { all: [selected('evil'), ...exactCounts('evil')] },
      { all: [{ op: 'notSelected', key: 'alignment' }, ...exactCounts(null)] },
    ] }), trophyType: 'secret-trophy', group: 'secrets',
  }),
  trophy({
    id: 'mathematicianTrophy', name: '组织数学家', sourceName: 'Mathematician',
    description: '当前立场 Tier 11 至 Tier 1 的设施真实数量依次为 1、2、4、8……1024。',
    reactions: secretEvents({ any: [
      { all: [selected('good'), ...mathematicianCounts('good')] },
      { all: [selected('evil'), ...mathematicianCounts('evil')] },
    ] }), trophyType: 'secret-trophy', group: 'secrets',
  }),
  trophy({
    id: 'spellfuryTrophy', name: '多线并发', sourceName: 'Spellfury',
    description: '施放工资结算时，另有至少三个技能处于激活状态。',
    reactions: [{ event: 'spell.cast', priority: 25, when: { all: [
      { op: 'eventDataEquals', path: 'spellId', value: 'taxCollection' },
      { op: 'statAtLeast', path: 'derived.activeSpells', value: 3 },
    ] } }], trophyType: 'secret-trophy', group: 'secrets',
  }),
].map(definition => ({
  ...definition,
  ui: { ...definition.ui, icon: `assets/images/content-icons/trophies/${definition.id}.svg` },
}));

export const ASSISTANT_TROPHY_DEFINITIONS = [
  ['assistantGroup', '数字员工小组', 'Assistant Group', 20],
  ['assistantSquad', '数字员工班组', 'Assistant Squad', 100],
  ['assistantLegion', '数字员工编队', 'Assistant Legion', 300],
].map(([id, name, sourceName, requirement]) => {
  const when = { op: 'statAtLeast', path: 'derived.realAssistants', value: requirement };
  return trophy({
    id, name, sourceName, description: `同时拥有至少 ${requirement} 名真实数字员工。`,
    reactions: [
      { event: 'upgrade.purchased', when, priority: 25 },
      { event: 'reincarnation.completed', when, priority: 25 },
      { event: 'game.reconcile', when, priority: 25 },
    ], trophyType: 'assistant-trophy', group: 'assistants',
  });
}).map(definition => ({
  ...definition,
  ui: { ...definition.ui, icon: `assets/images/content-icons/trophies/${definition.id}.svg` },
}));

const oldCoinCosts = cost => [
  { resource: 'coins', amount: { constant: cost }, when: { op: 'statLessThan', path: 'progression.ascension', value: 1 } },
  { resource: 'coins', amount: { constant: 0 }, when: { op: 'statAtLeast', path: 'progression.ascension', value: 1 } },
];
const secretUpgrade = ({ id, trophyId, name, sourceName, description, cost, era = { minR: 0 }, effects }) => ({
  id, kind: 'upgrade', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
  trophyId, statScope: 'run', resetScope: 'run', description, era,
  visible: owned(trophyId), unlock: { op: 'always' },
  purchase: { costs: oldCoinCosts(cost), requires: [{ op: 'notOwned', id }, owned(trophyId)] },
  effects, grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'general', icon: `assets/images/content-icons/misc/${id}.svg` },
});

export const SECRET_UPGRADE_DEFINITIONS = [
  secretUpgrade({
    id: 'unitaryUpgrade', trophyId: 'unitaryTrophy', name: '全设施各一', sourceName: 'Unitary',
    description: '全部设施产出提高 11.11111111%。', cost: 1111, era: { minR: 0, maxA: 3 },
    effects: [{ group: 'unitaryUpgrade', phase: 'global', stat: 'global.production', target: globalTarget, operation: 'addPercent', value: { constant: 11.11111111 }, stacking: 'add' }],
  }),
  secretUpgrade({
    id: 'mathematicianUpgrade', trophyId: 'mathematicianTrophy', name: '组织数学家', sourceName: 'Mathematician',
    description: '各设施按 Tier 获得独立产出倍率；Tier 1 为 ×2.1，Tier 11 为 ×1.1。', cost: 1e42, era: { minR: 0, maxA: 3 },
    effects: [{ group: 'mathematicianUpgrade', phase: 'buildingLocal', stat: 'building.production', target: { type: 'allBuildings' }, operation: 'multiply', value: { formula: '1 + 0.1 * (12 - x)', variables: { x: 'target.tier' } }, stacking: 'multiply' }],
  }),
  secretUpgrade({
    id: 'spellfuryUpgrade', trophyId: 'spellfuryTrophy', name: '多线并发', sourceName: 'Spellfury',
    description: '精力恢复 ×1.05。', cost: 4333,
    effects: [{ group: 'spellfuryUpgrade', phase: 'mana', stat: 'mana.regen', target: globalTarget, operation: 'multiply', value: { constant: 1.05 }, stacking: 'multiply' }],
  }),
];
