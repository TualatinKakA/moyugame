export const GENERAL_UPGRADE_DEFINITIONS = [
  {
    id: 'gemPower', kind: 'upgrade', contentVersion: 'base-v1', name: '期权激励',
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
    ui: { kind: 'upgradeCard', panel: 'upgrades', icon: 'assets/images/coin.png' },
  },
];
