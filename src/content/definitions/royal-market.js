const factions = [
  ['fairy', '产品部'], ['elven', '技术部'], ['angel', '战略部'],
  ['goblin', '财务部'], ['undead', '运维部'], ['demon', '执行部'],
];

export const ROYAL_EXCHANGE_DEFINITIONS = factions.map(([factionId, factionName]) => ({
  id: `${factionId}Exchange`, kind: 'exchange', contentVersion: 'base-v1',
  name: `${factionName}统筹调拨`, sourceName: 'Royal Exchange', sourceVersion: '4.3.24 build 26618872',
  factionId, repeatable: true, verificationStatus: 'source-confirmed',
  description: `逐枚消耗${factionName}影响力，所有部门的统筹调拨共同强化全部设施。`,
  era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' },
  purchase: { costs: [], requires: [] }, effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'exchangeCard', panel: 'factions', icon: 'assets/images/content-icons/red-cross.svg' },
}));
