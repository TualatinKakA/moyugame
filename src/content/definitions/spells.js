const SPELL_ICONS = { taxCollection: 'cash', callToArms: 'briefcase', holyLight: 'tower', bloodFrenzy: 'headphones', fairyChanting: 'laptop', goblinsGreed: 'coin' };
const spell = ({ id, name, description, cost, duration = 0, visible, effects = [], castActions = [] }) => ({
  id, kind: 'spell', contentVersion: 'base-v1', name, description,
  era: { minR: 0 }, visible, unlock: visible,
  cast: { costs: [{ resource: 'mana', amount: { constant: cost } }], requires: [visible] },
  duration, effects, grants: [], reactions: [], castActions, scope: 'run',
  ui: { kind: 'spellCard', panel: 'spells', icon: `assets/images/${SPELL_ICONS[id]}.png` },
});
const effect = (group, phase, stat, target, operation, value) => ({ group, phase, stat, target, operation, value, stacking: operation === 'add' || operation === 'addPercent' ? 'add' : 'multiply' });

export const SPELL_DEFINITIONS = [
  spell({
    id: 'taxCollection', name: '工资结算', description: '立即获得当前结算秒数的设施与数字员工产出。', cost: 200,
    visible: { op: 'always' },
    castActions: [{ type: 'grantResource', resource: 'coins', amount: { formula: 'production * seconds', variables: { production: 'derived.production', seconds: 'derived.taxSeconds' } } }],
  }),
  spell({
    id: 'callToArms', name: '全员冲刺', description: '20 秒内按设施总数提高全部设施产出。', cost: 400, duration: 20,
    visible: { op: 'always' },
    effects: [effect('callToArms', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '(25 + 0.3 * x) ^ 0.975', variables: { x: 'buildings.total' } })],
  }),
  spell({
    id: 'holyLight', name: '自驱动员', description: '10 秒内点击收入提高 1750%。', cost: 900, duration: 10,
    visible: { op: 'selected', key: 'alignment', value: 'good' },
    effects: [effect('holyLight', 'click', 'click.reward', { type: 'global' }, 'multiplyPercent', { constant: 1750 })],
  }),
  spell({
    id: 'bloodFrenzy', name: '强压冲刺', description: '20 秒内强压设施产出提高 1250%。', cost: 600, duration: 20,
    visible: { op: 'selected', key: 'alignment', value: 'evil' },
    effects: [effect('bloodFrenzy', 'buildingLocal', 'building.production', { type: 'alignment', id: 'evil' }, 'addPercent', { constant: 1250 })],
  }),
  spell({
    id: 'fairyChanting', name: '头脑风暴', description: '10 秒内使三类基础设施工位产出提高 50000%。', cost: 1000, duration: 10,
    visible: { op: 'spellSource', id: 'fairyChanting' },
    effects: [effect('fairyChanting', 'buildingLocal', 'building.production', { type: 'buildings', ids: ['farm', 'inn', 'blacksmith'] }, 'multiplyPercent', { constant: 50000 })],
  }),
  spell({
    id: 'goblinsGreed', name: '预算腾挪', description: '立即按期权获得部门影响力，并按历史影响力提高产出。', cost: 800, duration: 5,
    visible: { op: 'spellSource', id: 'goblinsGreed' },
    castActions: [{ type: 'grantResource', resource: 'factionCoin.current', amount: { formula: '20 + ln(1 + gems) ^ 3', variables: { gems: 'resources.gems' } } }],
    effects: [effect('goblinsGreed', 'global', 'global.production', { type: 'global' }, 'addPercent', { formula: '0.75 * ln(1 + x) ^ 3.15', variables: { x: 'factionCoins.total' } })],
  }),
];
