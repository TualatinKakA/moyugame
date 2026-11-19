export const INFLUENCE_FACTION_DEFINITIONS = [
  { id: 'elven', name: '技术部', sourceName: 'Elven', alignment: 'good', description: '提供技术部影响力。' },
  { id: 'angel', name: '战略部', sourceName: 'Angel', alignment: 'good', description: '提供战略部影响力。' },
  { id: 'undead', name: '运维部', sourceName: 'Undead', alignment: 'evil', description: '提供运维部影响力。' },
  { id: 'demon', name: '执行部', sourceName: 'Demon', alignment: 'evil', description: '提供执行部影响力。' },
].map(faction => ({
  ...faction,
  kind: 'faction', contentVersion: 'base-v1', era: { minR: 0 },
  visible: { op: 'selected', key: 'faction', value: faction.id }, unlock: { op: 'always' },
  factionCoin: {
    enabled: true, dropUnlock: { op: 'always' }, baseWeight: 1,
    icon: `assets/images/content-icons/factions/${faction.id}.svg`,
  },
  purchase: null, effects: [], grants: [], reactions: [], scope: 'run',
  ui: { kind: 'choiceCard', panel: 'factions', icon: `assets/images/content-icons/factions/${faction.id}.svg` },
}));
