const SPELL_ICONS = { taxCollection: 'cash', callToArms: 'briefcase', holyLight: 'tower', bloodFrenzy: 'headphones', fairyChanting: 'laptop', goblinsGreed: 'coin' };
const spell = ({ id, name, description, cost, duration = 0, visible, effects = [], castActions = [], rngStream, rngPersistence }) => ({
  id, kind: 'spell', contentVersion: 'base-v1', name, description,
  ...(rngStream !== undefined ? { rngStream, rngPersistence } : {}),
  era: { minR: 0 }, visible, unlock: visible,
  cast: { costs: [{ resource: 'mana', amount: { constant: cost } }], requires: [visible] },
  duration, effects, grants: [], reactions: [], castActions, scope: 'run',
  ui: { kind: 'spellCard', panel: 'spells', icon: `assets/images/${SPELL_ICONS[id]}.png` },
});
const effect = (group, phase, stat, target, operation, value) => ({ group, phase, stat, target, operation, value, stacking: operation === 'add' || operation === 'addPercent' ? 'add' : 'multiply' });

export const SPELL_DEFINITIONS = [
  spell({
    id: 'taxCollection', name: '工资结算', description: '立即获得 {taxSeconds} 秒设施与数字员工产出。', cost: 200,
    visible: { op: 'always' },
    castActions: [{ type: 'grantResource', resource: 'coins', amount: { formula: 'production * seconds', variables: { production: 'derived.production', seconds: 'derived.taxSeconds' } } }],
  }),
  spell({
    id: 'callToArms', name: '全员冲刺', description: '20 秒内全部设施产出提高 {activeGlobalPercent}%。', cost: 400, duration: 20,
    visible: { op: 'always' },
    effects: [effect('callToArms', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '(25 + 0.3 * x) ^ 0.975', variables: { x: 'buildings.total' } })],
  }),
  spell({
    id: 'holyLight', name: '奋斗动员', description: '10 秒内点击收入提高 1750%。', cost: 900, duration: 10,
    visible: { op: 'selected', key: 'alignment', value: 'good' },
    effects: [effect('holyLight', 'click', 'click.reward', { type: 'global' }, 'multiplyPercent', { constant: 1750 })],
  }),
  spell({
    id: 'bloodFrenzy', name: '务实冲刺', description: '20 秒内务实设施产出提高 1250%。', cost: 600, duration: 20,
    visible: { op: 'selected', key: 'alignment', value: 'evil' },
    effects: [effect('bloodFrenzy', 'buildingLocal', 'building.production', { type: 'alignment', id: 'evil' }, 'addPercent', { constant: 1250 })],
  }),
  spell({
    id: 'fairyChanting', name: '头脑风暴', description: '10 秒内使{targets:fairyChanting}产出提高 {effect:fairyChanting}%。', cost: 800, duration: 10,
    visible: { op: 'spellSource', id: 'fairyChanting' },
    effects: [
      effect('fairyChanting', 'buildingLocal', 'building.production', { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] }, 'multiplyPercent', { formula: '20000 ^ (1 + 0.02 * x ^ 0.2)', variables: { x: 'buildings.low3' } }),
    ],
  }),
  spell({
    id: 'goblinsGreed', name: '预算腾挪', description: '获得 {castAmount:0} 点待领取部门影响力，8 秒内全部产出提高 {effect:goblinsGreed}%。', cost: 400, duration: 8,
    visible: { op: 'spellSource', id: 'goblinsGreed' },
    castActions: [{ type: 'grantResource', resource: 'factionCoin.randomEligible', amount: { formula: '80 + 2.25 * ln(10 + gems) ^ 2.25', variables: { gems: 'resources.gems' } } }],
    effects: [effect('goblinsGreed', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '30 + 3 * ln(1 + x) ^ 3', variables: { x: 'stats.run.factionCoins' } })],
  }),
];
