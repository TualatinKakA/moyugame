export const GENERAL_UPGRADE_DEFINITIONS = [
  {
    id: 'royalMarket', kind: 'upgrade', contentVersion: 'base-v1', name: '统筹调拨',
    sourceName: 'Royal Market', sourceVersion: '4.3.24 build 26618872', verificationStatus: 'source-confirmed',
    interaction: 'royalMarket', interactionOnly: true,
    description: '打开统筹调拨窗口，使用各部门影响力进行调拨。',
    era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' },
    purchase: { costs: [], requires: [] }, effects: [], grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'general', icon: 'assets/images/content-icons/red-cross.svg' },
  },
  {
    id: 'gemPower', kind: 'upgrade', contentVersion: 'base-v1', name: '期权激励',
    sourceName: 'Gem Power', sourceVersion: '4.3.24 build 26618872', verificationStatus: 'source-confirmed',
    miscStatus: 'complete', statScope: 'run', resetScope: 'run',
    description: '每份期权提供 2% 总产出，并略微提高影响力发现率。',
    era: { minR: 0 },
    visible: { op: 'resourceAtLeast', resource: 'gems', value: 1 },
    unlock: { op: 'always' },
    purchase: {
      costs: [{ resource: 'coins', amount: { constant: 1 } }],
      requires: [{ op: 'notOwned', id: 'gemPower' }],
    },
    effects: [{
      group: 'gemPower', phase: 'global', stat: 'gem.power', target: { type: 'global' },
      operation: 'add', value: { constant: 2 }, stacking: 'add',
    }],
    grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'general', icon: 'assets/images/coin.png' },
  },
];
