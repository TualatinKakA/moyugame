const SPELL_ICONS = { taxCollection: 'cash', callToArms: 'briefcase', holyLight: 'tower', bloodFrenzy: 'headphones', fairyChanting: 'laptop', goblinsGreed: 'coin' };
const spell = ({ id, name, description, cost, duration = 0, visible, effects = [], castActions = [], rngStream, rngPersistence, icon, alignment }) => ({
  id, kind: 'spell', contentVersion: 'base-v1', name, description,
  ...(rngStream !== undefined ? { rngStream, rngPersistence } : {}),
  ...(alignment ? { alignment } : {}),
  era: { minR: 0 }, visible, unlock: visible,
  cast: { costs: [{ resource: 'mana', amount: { constant: cost } }], requires: [visible] },
  duration, effects, grants: [], reactions: [], castActions, scope: 'run',
  ui: { kind: 'spellCard', panel: 'spells', icon: icon || `assets/images/${SPELL_ICONS[id]}.png` },
});
const effect = (group, phase, stat, target, operation, value) => ({ group, phase, stat, target, operation, value, stacking: operation === 'add' || operation === 'addPercent' ? 'add' : 'multiply' });
const globalTarget = { type: 'global' };
const redCross = 'assets/images/content-icons/red-cross.svg';

export const SPELL_DEFINITIONS = [
  spell({
    id: 'taxCollection', name: '工资结算', description: '立即获得相当于当前 {taxSeconds} 秒设施与数字员工产出的工资。', cost: 200,
    visible: { op: 'always' },
    castActions: [{ type: 'grantResource', resource: 'coins', amount: { formula: 'production * seconds', variables: { production: 'derived.production', seconds: 'derived.taxSeconds' } } }],
  }),
  spell({
    id: 'callToArms', name: '全员冲刺', description: '根据当前有效设施总数，在 {spellDuration} 秒内提高全部设施产出，当前提高 {activeGlobalPercent}%。', cost: 400, duration: 20,
    visible: { op: 'always' },
    effects: [effect('callToArms', 'global', 'global.production', globalTarget, 'addPercent', { formula: '25 + (0.3 * x) ^ 0.975', variables: { x: 'buildings.total' } })],
  }),
  spell({
    id: 'holyLight', name: '奋斗动员', description: '在 {spellDuration} 秒内提高点击收入，当前提高 1750%。', cost: 900, duration: 10, alignment: 'good',
    visible: { op: 'selected', key: 'alignment', value: 'good' },
    effects: [effect('holyLight', 'click', 'click.reward', globalTarget, 'multiplyPercent', { constant: 1750 })],
  }),
  spell({
    id: 'bloodFrenzy', name: '务实冲刺', description: '在 {spellDuration} 秒内提高全部设施产出，当前提高 1500%。', cost: 600, duration: 20, alignment: 'evil',
    visible: { op: 'selected', key: 'alignment', value: 'evil' },
    effects: [effect('bloodFrenzy', 'global', 'global.production', globalTarget, 'addPercent', { constant: 1500 })],
  }),
  spell({
    id: 'fairyChanting', name: '头脑风暴', description: '根据见习工位、茶水间与打印维修间的有效总数，在 {spellDuration} 秒内提高这三类设施产出，当前倍率 ×{effect:fairyChanting}。', cost: 800, duration: 10, alignment: 'good',
    visible: { op: 'spellSource', id: 'fairyChanting' },
    effects: [
      effect('fairyChanting', 'buildingLocal', 'building.production', { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] }, 'multiply', { formula: '20000 ^ (1 + 0.02 * x ^ 0.2)', variables: { x: 'buildings.low3' } }),
    ],
  }),
  spell({
    id: 'goblinsGreed', name: '预算腾挪', description: '根据当前期权立即获得 {castAmount:0} 点待领取部门影响力；再根据本 Era 累计发现的影响力，在 {spellDuration} 秒内提高全部设施产出，当前提高 {effect:goblinsGreed}%。', cost: 400, duration: 8, alignment: 'evil',
    visible: { op: 'spellSource', id: 'goblinsGreed' },
    castActions: [{ type: 'grantResource', resource: 'factionCoin.randomEligible', amount: { formula: '80 + 2.25 * ln(10 + gems) ^ 2.25', variables: { gems: 'resources.gems' } } }],
    effects: [effect('goblinsGreed', 'global', 'global.production', globalTarget, 'addPercent', { formula: '30 + 3 * ln(1 + x) ^ 3', variables: { x: 'stats.ascension.factionCoins' } })],
  }),
  spell({
    id: 'moonBlessing', name: '月光迭代', description: '根据本次职业有效点击数，在 {spellDuration} 秒内提高全部设施产出，当前提高 {effect:moonBlessing}%。', cost: 700, duration: 20, alignment: 'good', icon: redCross,
    visible: { op: 'spellSource', id: 'moonBlessing' },
    effects: [effect('moonBlessing', 'global', 'global.production', globalTarget, 'addPercent', { formula: '1.3 * x ^ 0.7', variables: { x: 'effective.r.clicks' } })],
  }),
  spell({
    id: 'godsHand', name: '战略赋能', description: '根据当前精力恢复提高全部设施产出，当前提高 {effect:godsHand}%；持续时间随本次职业理想立场时间增加，当前持续 {spellDuration} 秒。', cost: 900, duration: 10, alignment: 'good', icon: redCross,
    visible: { op: 'spellSource', id: 'godsHand' },
    effects: [effect('godsHand', 'global', 'global.production', globalTarget, 'addPercent', { formula: '10 * ln(1 + x) ^ 4', variables: { x: 'derived.manaRegen' } })],
  }),
  spell({
    id: 'nightTime', name: '通宵赶工', description: '根据历史项目坟场的有效数量，在 {spellDuration} 秒内提高数字员工产出，当前基础加成 +{effect:nightTime} 个百分点。', cost: 800, duration: 20, alignment: 'evil', icon: redCross,
    visible: { op: 'spellSource', id: 'nightTime' },
    effects: [effect('nightTime', 'global', 'assistants.production', globalTarget, 'addPercent', { formula: '50 + 50 * x', variables: { x: 'buildings.necropolis' } })],
  }),
  spell({
    id: 'hellfireBlast', name: '高压执行', description: '根据已解锁奖杯数，在 {spellDuration} 秒内提高高压事业部产出，当前提高 {activeProductionPercent}%；购入开场冲刺令后，同样强化全天候工作井与传奇档案馆。', cost: 900, duration: 20, alignment: 'evil', icon: redCross,
    visible: { op: 'spellSource', id: 'hellfireBlast' },
    effects: [effect('hellfireBlast', 'buildingLocal', 'building.production', { type: 'hellfire' }, 'addPercent', { formula: '120 * x ^ 0.8', variables: { x: 'trophies.original' } })],
  }),
];
