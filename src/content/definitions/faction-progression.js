import { legacyCoinCosts } from './ascension-costs.js';

const redCross = 'assets/images/content-icons/red-cross.svg';
const sourceVersion = '4.3.24 build 26618872';
const verificationStatus = 'source-confirmed';
const owned = id => ({ op: 'owned', id });
const selected = faction => ({ op: 'selected', key: 'faction', value: faction });
const active = id => ({ op: 'spellActive', id });
const globalTarget = { type: 'global' };
const effect = (group, phase, stat, operation, value, when = undefined) => ({
  group, phase, stat, target: globalTarget, operation, value, ...(when ? { when } : {}),
  stacking: ['add', 'addPercent'].includes(operation) ? 'add' : 'multiply',
});
const factionData = [
  ['fairy', '产品部', 'Fairy'], ['elven', '技术部', 'Elven'], ['angel', '战略部', 'Angel'],
  ['goblin', '财务部', 'Goblin'], ['undead', '运维部', 'Undead'], ['demon', '执行部', 'Demon'],
];

function trophy({ id, name, sourceName, description, reactions }) {
  return {
    id, kind: 'trophy', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
    originalTrophy: true, description, era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' },
    purchase: null, effects: [], grants: [], reactions, rewardId: id, scope: 'total',
    ui: { kind: 'trophyCard', panel: 'trophies', icon: redCross },
  };
}

export const CHAMPION_TROPHY_DEFINITIONS = factionData.map(([faction, name, sourceName]) => trophy({
  id: `${faction}Champion`, name: `${name}核心员工`, sourceName: `${sourceName} Champion`,
  description: `在同一轮完成${name}条约、协作协议、战略协议与九项部门强化。`,
  reactions: [{
    event: 'upgrade.purchased', priority: 20,
    when: { all: [selected(faction), owned(`${faction}-pact`), owned(`${faction}-alliance`), ...Array.from({ length: 9 }, (_, index) => owned(`${faction}-${index + 1}`))] },
  }],
}));

export const HERITAGE_DEFINITIONS = [
  {
    id: 'fairyHeritage', faction: 'fairy', champion: 'fairyChampion', name: '产品部传承手册', sourceName: 'Fairy Heritage',
    description: '全部设施产出按低阶三设施有效数量提高 {effect:fairyHeritage}%。',
    effects: [effect('fairyHeritage', 'global', 'global.production', 'addPercent', { formula: '0.075 * x', variables: { x: 'buildings.low3' } })],
  },
  {
    id: 'elvenHeritage', faction: 'elven', champion: 'elvenChampion', name: '技术部传承手册', sourceName: 'Elven Heritage',
    description: '影响力发现率 +5 个百分点，点击收入提高 {effect:elvenHeritage-click}%，每秒自动点击 1 次。', mechanics: ['autoClick'],
    effects: [
      effect('elvenHeritage-chance', 'factionCoin', 'factionCoin.chance', 'add', { constant: 5 }),
      effect('elvenHeritage-click', 'click', 'click.reward', 'addPercent', { formula: '2 * ln(1 + x) ^ 2', variables: { x: 'derived.fcChance' } }),
    ],
  },
  {
    id: 'angelicHeritage', faction: 'angel', champion: 'angelChampion', name: '战略部传承手册', sourceName: 'Angelic Heritage',
    description: '精力恢复 ×1.10。',
    effects: [effect('angelicHeritage', 'mana', 'mana.regen', 'multiply', { constant: 1.1 })],
  },
  {
    id: 'goblinHeritage', faction: 'goblin', champion: 'goblinChampion', name: '财务部传承手册', sourceName: 'Goblin Heritage',
    description: '按当前期权使全部设施产出提高 {effect:goblinHeritage}%。',
    effects: [effect('goblinHeritage', 'global', 'global.production', 'addPercent', { formula: '3.75 * ln(1 + x)', variables: { x: 'resources.gems' } })],
  },
  {
    id: 'undeadHeritage', faction: 'undead', champion: 'undeadChampion', name: '运维部传承手册', sourceName: 'Undead Heritage',
    description: '按本次职业离线时间提高离线产出 {effect:undeadHeritage}%。',
    effects: [effect('undeadHeritage', 'utility', 'offline.production', 'addPercent', { formula: '0.7 * x ^ 0.7', variables: { x: 'stats.r.offlineTime' } })],
  },
  {
    id: 'demonicHeritage', faction: 'demon', champion: 'demonChampion', name: '执行部传承手册', sourceName: 'Demonic Heritage',
    description: '每座有效传奇档案馆使全部设施产出提高 0.3%（当前 {effect:demonicHeritage}%）。',
    effects: [effect('demonicHeritage', 'global', 'global.production', 'addPercent', { formula: '0.3 * x', variables: { x: 'buildings.hallOfLegends' } })],
  },
].map(definition => ({
  ...definition, kind: 'upgrade', contentVersion: 'base-v1', sourceVersion, verificationStatus,
  era: { minR: 0, maxA: 3 }, visible: owned(definition.champion), unlock: { op: 'always' },
  purchase: {
    costs: [{ resource: `factionCoin.${definition.faction}`, amount: { constant: 5000 } }],
    requires: [{ op: 'notOwned', id: definition.id }, owned(definition.champion)],
  },
  grants: [], reactions: [], scope: 'run',
  ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction: definition.faction, icon: redCross },
}));

const spellUpgrades = [
  ['fairyChoir', 'fairy', '群体脑暴', 'Fairy Choir', '头脑风暴期间有效数字员工 ×3；解锁判定仍读真实数量。', ['effectiveAssistants'], []],
  ['sunBlessing', 'elven', '日光自动迭代', 'Sun Blessing', '月光迭代期间每秒自动点击 15 次。', ['autoClick'], []],
  ['godsRest', 'angel', '周日战略休会', "God's Rest", '战略赋能期间，施放其他法术会向一个合格部门发放影响力。', ['godsRest'], []],
  ['greedDrive', 'goblin', '预算连算', 'Greed Drive', '预算腾挪期间，工资结算精力消耗 ×0.9。', ['spellCost'], []],
  ['trueNight', 'undead', '永久夜班制', 'True Night', '通宵赶工期间按真实活动时间强化数字员工，并提高离线时间有效计数。', ['offlineTime'],
    [effect('trueNight-assistants', 'global', 'assistants.production', 'addPercent', { formula: '0.4 * x ^ 0.6', variables: { x: 'derived.nightTimeActivity' } }, active('nightTime'))]],
  ['hellRush', 'demon', '开场冲刺令', 'Hell Rush', '高压执行额外强化全天候工作井与传奇档案馆。', ['hellfireTargets'], []],
];

export const SPELL_TROPHY_DEFINITIONS = [
  trophy({
    id: 'fairyChoir', name: '群体脑暴', sourceName: 'Fairy Choir', description: '施放头脑风暴时拥有至少 50 名真实数字员工。',
    reactions: [{ event: 'spell.cast', when: { all: [{ op: 'eventDataEquals', path: 'spellId', value: 'fairyChanting' }, { op: 'statAtLeast', path: 'derived.realAssistants', value: 50 }] } }],
  }),
  trophy({
    id: 'sunBlessing', name: '日光自动迭代', sourceName: 'Sun Blessing', description: '本 Era 触发至少 5 次技术幸运。',
    reactions: [{ event: 'elvenLuck.triggered', when: { op: 'statAtLeast', path: 'stats.ascension.elvenLuck', value: 5 } }],
  }),
  trophy({
    id: 'godsRest', name: '周日战略休会', sourceName: "God's Rest", description: '最大精力达到 1500，且每秒精力恢复达到 75。',
    reactions: [
      { event: 'upgrade.purchased', when: { all: [{ op: 'statAtLeast', path: 'derived.manaMax', value: 1500 }, { op: 'statAtLeast', path: 'derived.manaRegen', value: 75 }] } },
      { event: 'spell.cast', when: { all: [{ op: 'statAtLeast', path: 'derived.manaMax', value: 1500 }, { op: 'statAtLeast', path: 'derived.manaRegen', value: 75 }] } },
    ],
  }),
  trophy({
    id: 'greedDrive', name: '预算连算', sourceName: 'Greed Drive', description: '预算腾挪生效期间拥有至少 100 次皇家交换。',
    reactions: [
      { event: 'spell.cast', when: { all: [{ op: 'eventDataEquals', path: 'spellId', value: 'goblinsGreed' }, active('goblinsGreed'), { op: 'statAtLeast', path: 'derived.exchangeCount', value: 100 }] } },
      { event: 'exchange.purchased', when: { all: [active('goblinsGreed'), { op: 'statAtLeast', path: 'derived.exchangeCount', value: 100 }] } },
    ],
  }),
  trophy({
    id: 'trueNight', name: '永久夜班制', sourceName: 'True Night', description: '离线产出加成达到 200%。',
    reactions: [
      { event: 'upgrade.purchased', when: { op: 'statAtLeast', path: 'derived.offlineMultiplier', value: 3 } },
      { event: 'offline.settled', when: { op: 'statAtLeast', path: 'derived.offlineMultiplier', value: 3 } },
      { event: 'reincarnation.completed', when: { op: 'statAtLeast', path: 'derived.offlineMultiplier', value: 3 } },
    ],
  }),
  trophy({
    id: 'hellRush', name: '开场冲刺令', sourceName: 'Hell Rush', description: '在本轮真实时间 60 秒前施放高压执行。',
    reactions: [{ event: 'spell.cast', when: { all: [{ op: 'eventDataEquals', path: 'spellId', value: 'hellfireBlast' }, { op: 'statLessThan', path: 'stats.run.time', value: 60 }] } }],
  }),
];

export const SPELL_UPGRADE_DEFINITIONS = spellUpgrades.map(([trophyId, faction, name, sourceName, description, mechanics, effects]) => {
  const id = `${trophyId}Upgrade`;
  return {
    id, kind: 'upgrade', contentVersion: 'base-v1', name, sourceName, sourceVersion, verificationStatus,
    trophyId, faction, mechanics, description, era: { minR: 0 },
    visible: { all: [owned(trophyId), selected(faction)] }, unlock: { op: 'always' },
    purchase: { costs: legacyCoinCosts(1e6), requires: [{ op: 'notOwned', id }, owned(trophyId), selected(faction)] },
    effects, grants: [], reactions: [], scope: 'run',
    ui: { kind: 'upgradeCard', panel: 'upgrades', category: 'faction', faction, icon: redCross },
  };
});
