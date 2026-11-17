export const ALIGNMENTS = {
  good: { id: 'good', name: '进取', description: '偏向主动点击、技能和快速扩张。' },
  evil: { id: 'evil', name: '强压', description: '偏向稳定产出、离线和高阶设施。' },
  neutral: { id: 'neutral', name: '均衡', description: '混合主动与被动机制。' },
};

const common = [
  ['farm', 'Farm', '见习工位', 1, 2, 10, 'any'],
  ['inn', 'Inn', '茶水间', 2, 6, 125, 'any'],
  ['blacksmith', 'Blacksmith', '打印维修间', 3, 20, 600, 'any'],
];
const tierData = [
  [4, 65, 1800, 'Warrior Barracks', '奋斗培训室', 'Slave Pen', '外包压缩舱', 'Deep Mine', '数据挖掘站'],
  [5, 200, 5600, "Knight's Joust", '项目擂台', 'Orcish Arena', '绩效竞技场', 'Stone Pillars', '流程支柱'],
  [6, 650, 38000, 'Wizard Tower', '自动化实验室', 'Witch Conclave', '夜间作战室', 'Alchemist Lab', '方案实验室'],
  [7, 2000, 442000, 'Cathedral', '企业文化礼堂', 'Dark Temple', '黑盒运维中心', 'Monastery', '专注修行室'],
  [8, 8500, 7300000, 'Citadel', '集团事业群', 'Necropolis', '历史项目坟场', 'Labyrinth', '组织迷宫'],
  [9, 100000, 145000000, 'Royal Castle', '全球总部', 'Evil Fortress', '高压事业部', 'Iron Stronghold', '钢铁交付中心'],
  [10, 1200000, 3200000000, "Heaven's Gate", '轨道办公港', 'Hell Portal', '全天候工作井', 'Ancient Pyramid', '远古项目库'],
];

export const BUILDING_ALIASES = {
  Farms: 'farm', Inns: 'inn', Inns: 'inn', Blacksmiths: 'blacksmith',
  'Deep Mines': 'deepMine', 'Stone Pillars': 'stonePillars', 'Alchemist Labs': 'alchemistLab',
  Monasteries: 'monastery', Labyrinths: 'labyrinth', 'Iron Strongholds': 'ironStronghold',
  'Ancient Pyramids': 'ancientPyramid', 'Warrior Barracks': 'warriorBarracks',
  'Knights Jousts': 'knightsJoust', 'Knights Joust': 'knightsJoust', 'Wizard Towers': 'wizardTower',
  Cathedrals: 'cathedral', Citadels: 'citadel', 'Royal Castles': 'royalCastle',
  "Heaven's Gates": 'heavensGate', 'Slave Pens': 'slavePen', 'Orcish Arenas': 'orcishArena',
  'Witch Conclaves': 'witchConclave', 'Dark Temples': 'darkTemple', Necropolises: 'necropolis',
  'Evil Fortresses': 'evilFortress', 'Hell Portals': 'hellPortal', 'Halls of Legends': 'hallOfLegends',
  'Hall of Legends': 'hallOfLegends',
};

export const BUILDINGS = [
  ...common.map(([id, sourceName, name, tier, rate, cost, alignment]) => ({ id, sourceName, name, tier, rate, cost, alignment })),
  ...tierData.flatMap(([tier, rate, cost, goodSource, goodName, evilSource, evilName, neutralSource, neutralName]) => [
    { id: 'warriorBarracks', sourceName: goodSource, name: goodName, tier, rate, cost, alignment: 'good' },
    { id: 'slavePen', sourceName: evilSource, name: evilName, tier, rate, cost, alignment: 'evil' },
    { id: 'deepMine', sourceName: neutralSource, name: neutralName, tier, rate, cost, alignment: 'neutral' },
  ].map((b, index) => {
    const ids = {
      good: ['warriorBarracks', 'knightsJoust', 'wizardTower', 'cathedral', 'citadel', 'royalCastle', 'heavensGate'],
      evil: ['slavePen', 'orcishArena', 'witchConclave', 'darkTemple', 'necropolis', 'evilFortress', 'hellPortal'],
      neutral: ['deepMine', 'stonePillars', 'alchemistLab', 'monastery', 'labyrinth', 'ironStronghold', 'ancientPyramid'],
    };
    return { ...b, id: ids[b.alignment][tier - 4] };
  })),
  { id: 'hallOfLegends', sourceName: 'Hall of Legends', name: '传奇工位', tier: 11, rate: 250000, cost: 200000000000, alignment: 'any', perTrophy: true },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
export const BUILDING_BY_SOURCE = Object.fromEntries(BUILDINGS.map(b => [b.sourceName, b]));

export function buildingIdFromSource(name) {
  if (BUILDING_ALIASES[name]) return BUILDING_ALIASES[name];
  const singular = name.replace(/s$/, '');
  return BUILDING_ALIASES[singular] || BUILDING_BY_SOURCE[name]?.id || BUILDING_BY_SOURCE[singular]?.id || null;
}

export function availableBuildings(state) {
  return BUILDINGS.filter(b => b.alignment === 'any' || b.alignment === state.alignment);
}
