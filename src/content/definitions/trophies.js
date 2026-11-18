const trophy = ({ id, name, description, reaction = null, effects = [], icon = 'coin' }) => ({
  id, kind: 'trophy', contentVersion: 'base-v1', name, description,
  era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' },
  purchase: null, effects, grants: [], reactions: reaction ? [reaction] : [],
  rewardId: id, scope: 'total', ui: { kind: 'trophyCard', panel: 'trophies', icon: `assets/images/${icon}.png` },
});
const effect = (group, phase, stat, operation, value) => ({ group, phase, stat, target: { type: 'global' }, operation, value, stacking: 'add' });

export const TROPHY_DEFINITIONS = [
  trophy({ id: 'trophy.intro.first_day', name: '第一天', description: '完成第一次入职。员工资料补录状态：待处理。', icon: 'id-card' }),
  trophy({ id: 'trophy.intro.first_wage', name: '第一笔工资', description: '取得第一笔账面工资。', icon: 'cash' }),
  trophy({ id: 'trophy.intro.first_department', name: '组织的一员', description: '首次加入 Fairy 或 Goblin 部门。', icon: 'id-card' }),
  trophy({
    id: 'trophy.first_click', name: '第一次搬砖', description: '首次完成有效点击；点击收入永久提高 5%。',
    reaction: { event: 'work.clicked', when: { op: 'statEquals', path: 'stats.total.clicks', value: 1 }, priority: 50 },
    effects: [effect('trophy.first_click', 'click', 'click.reward', 'addPercent', { constant: 5 })],
  }),
  trophy({
    id: 'trophy.first_building', name: '第一处设施', description: '首次采购任意设施。',
    reaction: { event: 'building.purchased', priority: 50 },
  }),
  trophy({
    id: 'trophy.first_spell', name: '第一次施法', description: '首次释放任意技能；精力上限永久 +100。',
    reaction: { event: 'spell.cast', priority: 50 },
    effects: [effect('trophy.first_spell', 'mana', 'mana.max', 'add', { constant: 100 })],
  }),
  trophy({
    id: 'trophy.alignment.idealism', name: '理想之选', description: '', icon: 'id-card',
  }),
  trophy({
    id: 'trophy.alignment.pragmatism', name: '务实之选', description: '', icon: 'id-card',
  }),
  trophy({
    id: 'trophy.fairy_member', name: '产品部协作', description: '首次加入产品部。',
    reaction: { event: 'faction.joined', when: { op: 'eventDataEquals', path: 'factionId', value: 'fairy' }, priority: 50 },
  }),
  trophy({
    id: 'trophy.goblin_member', name: '财务部协作', description: '首次加入财务部。',
    reaction: { event: 'faction.joined', when: { op: 'eventDataEquals', path: 'factionId', value: 'goblin' }, priority: 50 },
  }),
];
