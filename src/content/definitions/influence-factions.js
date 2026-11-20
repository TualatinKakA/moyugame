const treatyCost = [{ resource: 'factionCoin.target', amount: { constant: 20 } }];

export const INFLUENCE_FACTION_DEFINITIONS = [
  { id: 'elven', name: '技术部', sourceName: 'Elven', alignment: 'good', spellId: 'moonBlessing', description: '通过点击、技术幸运与部门交换扩大收益。' },
  { id: 'angel', name: '战略部', sourceName: 'Angel', alignment: 'good', spellId: 'godsHand', description: '将精力恢复、施法时间与战略部署转化为产出。' },
  { id: 'undead', name: '运维部', sourceName: 'Undead', alignment: 'evil', spellId: 'nightTime', description: '强化数字员工、离线产出与持续运行能力。' },
  { id: 'demon', name: '执行部', sourceName: 'Demon', alignment: 'evil', spellId: 'hellfireBlast', description: '以高阶设施、奖杯和高压执行推动产出。' },
].map(faction => ({
  ...faction,
  kind: 'faction', contentVersion: 'base-v1', era: { minR: 0 },
  visible: { op: 'selected', key: 'alignment', value: faction.alignment }, unlock: { op: 'always' },
  factionCoin: {
    enabled: true, dropUnlock: { op: 'always' }, baseWeight: 1,
    icon: `assets/images/content-icons/factions/${faction.id}.svg`,
  },
  purchase: { costs: treatyCost, requires: [{ op: 'notSelected', key: 'faction' }] },
  effects: [], grants: [{ type: 'grantSpellSource', id: faction.spellId, source: faction.id }], reactions: [], scope: 'run',
  ui: { kind: 'choiceCard', panel: 'factions', icon: 'assets/images/content-icons/red-cross.svg' },
}));
