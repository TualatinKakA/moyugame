const legacySpellTrophies = [
  ['coinPillage', '预算腾挪', 'spell.cast', 1e33, 'coinPillage'],
  ['fairyChoir', '仙灵合唱', 'spell.cast', 1e6, 'fairyChoir'],
  ['sunBlessing', '日照祝福', 'spell.cast', 1e6, 'sunBlessing'],
  ['godsRest', '神明的休息', 'spell.cast', 1e6, 'godsRest'],
  ['greedDrive', '贪欲驱动', 'spell.cast', 1e6, 'greedDrive'],
  ['trueNight', '真正的夜晚', 'spell.cast', 1e6, 'trueNight'],
  ['hellRush', '地狱冲锋', 'spell.cast', 1e6, 'hellRush'],
  ['lightningStorm', '闪电风暴', 'spell.cast', 1e40, 'lightningStorm'],
  ['hallsBalance', '平衡大厅', 'spell.cast', 1e40, 'hallsBalance'],
  ['facelessOvermind', '无面主宰', 'faction.joined', 1e40, 'facelessOvermind'],
  ['minedwarf', '矿井矮人', 'spell.cast', 1e53, 'minedwarf'],
  ['perfectCombo', '完美连击', 'spell.cast', 1e53, 'perfectCombo'],
];

const legacy = legacySpellTrophies.map(([id, name, event, cost, effect]) => ({
  id,
  category: 'gameplay',
  name,
  description: '满足对应法术或部门记录条件后，可购买这项永久强化。',
  trigger: {
    event,
    condition: `trophyCondition${id[0].toUpperCase()}${id.slice(1)}`,
  },
  acquireMode: 'purchase',
  cost,
  costCurrency: 'coins',
  freeFromAscension: 1,
  visibility: 'visible',
  once: 'profile',
  reward: {
    type: 'spellEffect',
    operation: 'set',
    value: { effect },
    stackingGroup: `trophies.spell.${effect}`,
  },
}));

export const GAMEPLAY_ACHIEVEMENTS = [
  {
    id: 'rewind',
    category: 'secret',
    name: '循环终点',
    description: '在单轮累计生产至少 1 Oc 账面工资后完成一次退休。',
    trigger: { event: 'abdication.completed', condition: 'runCoinsAtLeast1Oc' },
    acquireMode: 'purchase',
    cost: 1e27,
    costCurrency: 'coins',
    freeFromAscension: 1,
    visibility: 'secret',
    once: 'profile',
    reward: {
      type: 'globalProduction',
      operation: 'addPercent',
      value: 8,
      stackingGroup: 'trophies.globalProduction',
      ascensionNerf: { from: 1, rule: 'rewind' },
    },
  },
  ...legacy,
];
