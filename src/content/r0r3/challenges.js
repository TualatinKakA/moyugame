export const CHALLENGES = [
  { id: 'fairy1', faction: 'fairy', name: '低阶突袭', sourceName: 'Pixie Mischief', requiredTrophy: 'fairyChoir', description: 'R2 起，仅使用见习工位、茶水间和打印维修间，在新一轮 60 秒内购齐产品部全部 12 项分层升级。', reward: '每拥有一项产品部关联升级，数字员工 +2。' },
  { id: 'elf1', faction: 'elf', name: '高效文明', sourceName: 'Advanced Civilization', requiredTrophy: 'sunBlessing', description: 'R2 起，在新一轮 1 小时内获得超过 400K 技术部影响力。', reward: '技术部资源置换价格系数降低 0.025。' },
  { id: 'angel1', faction: 'angel', name: '高效魔法', sourceName: 'Efficient Magic', requiredTrophy: 'godsRest', description: 'R2 起，在新一轮 20 分钟内，于本地白天 6:00～18:00 释放 50 次奋斗动员。', reward: '全部技能精力消耗降低 10%。' },
  { id: 'goblin1', faction: 'goblin', name: '折扣季节', sourceName: 'Discount Season', requiredTrophy: 'greedDrive', description: 'R2 起，让随机预算收益单次超过 1000 秒产出；每次触发有 60% 完成机会。', reward: '随机预算触发间隔降至 2 分钟，并附带 10 次免费工资结算。' },
  { id: 'undead1', faction: 'undead', name: '离线耐性', sourceName: 'Deadly Impatience', requiredTrophy: 'trueNight', description: 'R2 起，夜班部累计游戏时间达到 6 小时 40 分 47 秒。', reward: '夜班部手册的时间累计速度提高 5000%。' },
  { id: 'demon1', faction: 'demon', name: '成就收集', sourceName: 'Trophy Collectors', requiredTrophy: 'hellRush', description: 'R2 起，在未启用期权激励、未使用审计的条件下累计 5000 运营部影响力。', reward: '按全部历史升级数量提高全部设施产出和影响力发现率。' },
];
export const CHALLENGE_BY_ID = Object.fromEntries(CHALLENGES.map(c => [c.id, c]));
