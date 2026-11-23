const redCross = 'assets/images/content-icons/red-cross.svg';
const sourceVersion = '4.3.24 build 26618872';
const verificationStatus = 'source-confirmed';
const owned = id => ({ op: 'owned', id });
const globalTarget = { type: 'global' };
const displayNames = {
  goodProduction1: '理想员工认证', goodProduction2: '理想员工复核', goodProduction3: '理想员工表彰', goodProduction4: '理想员工公告',
  evilProduction1: '务实团队认证', evilProduction2: '务实团队复核', evilProduction3: '务实团队表彰', evilProduction4: '务实团队公告',
  clickingProduction1: '达标创收指标', clickingProduction2: '丰厚创收指标', clickingProduction3: '超额创收指标', clickingProduction4: '巨额创收指标', clickingProduction5: '溢出创收指标',
  clickingTotalProduction1: '一期资本沉淀', clickingTotalProduction2: '扩充资本沉淀', clickingTotalProduction3: '离岸资本沉淀', clickingTotalProduction4: '重资产资本池', clickingTotalProduction5: '主权级资本池',
  gemUpgrade1: '期权行权增值', gemUpgrade2: '期权池控盘', gemUpgrade3: '绝对期权主权',
  assistantUpgrade2: '数字员工联合', assistantUpgrade3: '数字员工垄断',
  clickingBase1: '结实的工牌', clickingBase2: '耐用的工牌', clickingBase3: '加固的工牌', clickingBase4: '三线出入证', clickingBase5: '防磁金属牌', clickingBase6: '永恒零号牌',
  offlineUpgrade1: '缺席打卡', offlineUpgrade2: '失踪考勤', offlineUpgrade3: '不存在工号',
  grindingDedication: '均衡奉献', neutralUnavailable1: '均衡协作协议', neutralUnavailable2: '真正均衡',
  neutralUnavailable3: '均衡认证', neutralUnavailable4: '均衡验证', neutralUnavailable5: '均衡确认', neutralUnavailable6: '均衡公告',
  secondAlignment1: '秩序治理协议', secondAlignment2: '混沌执行协议', secondAlignment3: '平衡决策协议',
};
const effect = (group, phase, stat, operation, value, target = globalTarget) => ({
  group, phase, stat, target, operation, value, stacking: ['add', 'addPercent'].includes(operation) ? 'add' : 'multiply',
});
const visibleAtLeast = (path, value) => ({ op: 'statAtLeast', path, value });
const unavailable = { not: { op: 'always' } };

function upgrade({ id, name, sourceName, description, cost, visible, effects = [], era = { minR: 0 }, miscStatus = 'complete', mechanics = [] }) {
  return {
    id, kind: 'upgrade', contentVersion: 'base-v1', name: displayNames[id] || name, sourceName, sourceVersion, verificationStatus,
    miscStatus, statScope: 'run', resetScope: 'run', mechanics, description, era,
    visible, unlock: { op: 'always' },
    purchase: { costs: [{ resource: 'coins', amount: { constant: cost } }], requires: [{ op: 'notOwned', id }] },
    effects, grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'general', icon: redCross },
  };
}

const alignmentProduction = [
  ['good', 'Heroic', '理想', [1e14, 1e20, 1e124, 1e31]],
  ['evil', 'Villainous', '务实', [1e14, 1e20, 1e124, 1e31]],
].flatMap(([alignment, prefix, label, costs]) => ['Certificate', 'Validation', 'Affirmation', 'Proclamation'].map((suffix, index) => {
  const id = `${alignment}Production${index + 1}`;
  const requirement = [750, 1500, 12000, 20000][index];
  return upgrade({
    id, name: `${label}组织${['证明', '核验', '确认', '宣告'][index]}`, sourceName: `${prefix} ${suffix}`,
    description: `${label}立场设施产出 ×2。`, cost: costs[index],
    visible: { all: [{ op: 'selected', key: 'alignment', value: alignment }, visibleAtLeast(`derived.raw${alignment === 'good' ? 'Good' : 'Evil'}Buildings`, requirement)] },
    effects: [effect(id, 'buildingLocal', 'building.production', 'multiply', { constant: 2 }, { type: 'alignment', id: alignment })],
    era: { minR: 0, maxA: 3, ...(index === 3 ? { minA: 1 } : {}) },
  });
}));

const treasureNames = ['Filled', 'Rich', 'Wealthy', 'Opulent', 'Overflowing'];
const treasureThresholds = [5000, 5e6, 5e9, 5e12, 5e15];
const treasureCosts = [10000, 5e7, 1e11, 1.5e14, 2e17];
const clickingProduction = treasureNames.map((sourceName, index) => {
  const id = `clickingProduction${index + 1}`;
  return upgrade({
    id, name: ['充盈储薪罐', '丰裕储薪罐', '富豪储薪罐', '华贵储薪罐', '溢流储薪罐'][index], sourceName: `${sourceName} Treasure`,
    description: '点击收入与全部设施产出 ×1.25。', cost: treasureCosts[index],
    visible: visibleAtLeast('stats.run.clickCoins', treasureThresholds[index]),
    effects: [
      effect(`${id}-building`, 'global', 'global.production', 'multiply', { constant: 1.25 }),
      effect(`${id}-click`, 'click', 'click.reward', 'multiply', { constant: 1.25 }),
    ],
  });
});

const totalTreasureNames = ['Precious', 'Ornate', 'Adorned', 'Embellished', 'Resplendent'];
const totalTreasureThresholds = [1e5, 1e8, 1e11, 1e14, 1e17];
const totalTreasureCosts = [5e4, 5e7, 5e10, 5e13, 5e16];
const clickingTotalProduction = totalTreasureNames.map((sourceName, index) => {
  const id = `clickingTotalProduction${index + 1}`;
  return upgrade({
    id, name: ['珍贵工资单', '精雕工资单', '装饰工资单', '镶金工资单', '辉煌工资单'][index], sourceName: `${sourceName} Treasure`,
    description: '将当前全部设施每秒产出的 1% 加入基础点击收入（当前 +{effect:' + id + '}）。', cost: totalTreasureCosts[index],
    visible: visibleAtLeast('stats.run.coins', totalTreasureThresholds[index]),
    effects: [effect(id, 'click', 'click.base', 'add', { formula: '0.01 * x', variables: { x: 'derived.buildingProduction' } })],
  });
});

const gemUpgrades = [
  ['gemUpgrade1', '期权浓度', 'Gem Potency', 1e6, 1e25],
  ['gemUpgrade2', '期权霸权', 'Gem Supremacy', 1e39, 1e70],
  ['gemUpgrade3', '期权主权', 'Gem Sovereignty', 1e63, 1e109],
].map(([id, name, sourceName, requirement, cost]) => upgrade({
  id, name, sourceName, description: '每份期权提供的产出加成 +1 个百分点。', cost,
  visible: visibleAtLeast('resources.gems', requirement), era: { minR: 0, maxA: 3 },
  effects: [effect(id, 'global', 'gem.power', 'add', { constant: 1 })],
})).map(definition => ({
  ...definition,
  ui: { ...definition.ui, icon: `assets/images/content-icons/misc/${definition.id}.svg` },
}));

const assistantUpgrades = [
  ['assistantUpgrade1', '数字员工工会', 'Assistant Trade Union', 'assistantGroup', 1e18],
  ['assistantUpgrade2', '数字员工辛迪加', 'Assistant Syndicate', 'assistantSquad', 2e36],
  ['assistantUpgrade3', '数字员工卡特尔', 'Assistant Cartel', 'assistantLegion', 3e54],
].map(([id, name, sourceName, trophyId, cost]) => upgrade({
  id, name, sourceName, description: '每名有效数字员工使全部设施产出提高 1%。', cost,
  visible: owned(trophyId), era: { minR: 0, maxA: 3 },
  effects: [effect(id, 'global', 'global.production', 'addPercent', { formula: 'x', variables: { x: 'derived.assistants' } })],
})).map(definition => ({
  ...definition,
  ui: { ...definition.ui, icon: `assets/images/content-icons/misc/${definition.id}.svg` },
}));

const clickingBase = [
  ['clickingBase1', '坚固储薪罐', 'Sturdy Treasure', 100, 500, 4],
  ['clickingBase2', '耐用储薪罐', 'Durable Treasure', 500, 5000, 45],
  ['clickingBase3', '强化储薪罐', 'Reinforced Treasure', 2500, 5e6, 4950],
  ['clickingBase4', '韧性储薪罐', 'Resilient Treasure', 10000, 5e9, 500000],
  ['clickingBase5', '不破储薪罐', 'Unbreakable Treasure', 50000, 5e13, 50000000],
  ['clickingBase6', '永恒储薪罐', 'Eternal Treasure', 100000, 5e16, 50000000000],
].map(([id, name, sourceName, requirement, cost, baseAdd]) => upgrade({
  id, name, sourceName, description: `基础点击收入 +${baseAdd}；离线时每秒额外自动点击 1 次。`, cost,
  visible: visibleAtLeast('stats.total.clicks', requirement), miscStatus: 'dependency', mechanics: ['offlineAutoClick'],
  effects: [effect(id, 'click', 'click.base', 'add', { constant: baseAdd })],
}));

const offlineUpgrades = [
  ['offlineUpgrade1', '缺席主管', 'Absent Ruler', 43200, 1e9, 200],
  ['offlineUpgrade2', '失踪主管', 'Missing Ruler', 86400, 1e18, 500],
  ['offlineUpgrade3', '不存在的主管', 'Nonexistent Ruler', 129600, 1e55, 1500],
].map(([id, name, sourceName, requirement, cost, percent]) => upgrade({
  id, name, sourceName, description: `离线产出提高 ${percent}%。`, cost,
  visible: { op: 'offlineTimeAtLeast', value: requirement }, miscStatus: 'dependency', mechanics: ['offlineProduction'],
  effects: [effect(id, 'utility', 'offline.production', 'addPercent', { constant: percent })],
}));

const closedNames = {
  grindingDedication: ['加班奉献', 'Grinding Dedication'],
  neutralUnavailable1: ['均衡证明', 'Proof of Neutrality'], neutralUnavailable2: ['真实均衡', 'True Neutrality'],
  neutralUnavailable3: ['均衡组织证明', 'Neutral Certificate'], neutralUnavailable4: ['均衡组织核验', 'Neutral Validation'],
  neutralUnavailable5: ['均衡组织确认', 'Neutral Affirmation'], neutralUnavailable6: ['均衡组织宣告', 'Neutral Proclamation'],
  secondAlignment1: ['秩序证明', 'Proof of Order'], secondAlignment2: ['混沌证明', 'Proof of Chaos'], secondAlignment3: ['平衡证明', 'Proof of Balance'],
};
const closedCosts = {
  grindingDedication: 5e14, neutralUnavailable2: 1e21, neutralUnavailable3: 2e30,
  neutralUnavailable4: 4e39, neutralUnavailable5: 8e150, neutralUnavailable6: 1.6e91,
};
const closed = Object.entries(closedNames).map(([id, [name, sourceName]]) => upgrade({
  id, name, sourceName, description: '', cost: closedCosts[id] || 0, visible: unavailable, miscStatus: 'unavailable', mechanics: ['unopenedSystem'],
}));

export const MISC_UPGRADE_DEFINITIONS = [
  ...alignmentProduction, ...clickingProduction, ...clickingTotalProduction, ...gemUpgrades,
  ...assistantUpgrades, ...clickingBase, ...offlineUpgrades, ...closed,
];
