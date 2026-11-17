export const SPELLS = [
  { id: 'taxCollection', name: '工资结算', cost: 200, duration: 0, kind: 'instant', description: '立即获得 30 秒建筑与数字员工产出。' },
  { id: 'callToArms', name: '全员冲刺', cost: 400, duration: 20, description: '按设施总数提高全部设施产出。', formula: '((25 + 0.3 * x) ^ 0.975)%', x: 'buildingsTotal', effect: { stat: 'globalAdd', mode: 'add' } },
  { id: 'holyLight', name: '奋斗动员', cost: 900, duration: 10, alignment: 'good', description: '点击收入提高 1750%。', effect: { stat: 'clickMult', value: 18.5 } },
  { id: 'bloodFrenzy', name: '强压冲刺', cost: 600, duration: 20, alignment: 'evil', description: '强压设施产出提高 1250%。', effect: { stat: 'alignmentAdd', alignment: 'evil', value: 1250 } },
  { id: 'fairyChanting', name: '头脑风暴', cost: 1000, duration: 10, faction: 'fairy', description: '见习工位、茶水间、打印维修间产出提高 50000%。', effect: { stat: 'buildingAdd', targets: ['farm', 'inn', 'blacksmith'], value: 50000 } },
  { id: 'moonBlessing', name: '月光迭代', cost: 700, duration: 20, faction: 'elf', description: '按本次职业点击次数提高全部设施产出。', formula: '(0.7 * x ^ 0.7)%', x: 'clicksR', effect: { stat: 'globalAdd', mode: 'add' } },
  { id: 'godsHand', name: '全员动员', cost: 900, duration: 20, faction: 'angel', description: '按精力恢复速度提高全部设施产出。', formula: '(120 * x)%', x: 'manaRegen', effect: { stat: 'globalAdd', mode: 'add' } },
  { id: 'goblinsGreed', name: '预算腾挪', cost: 800, duration: 5, faction: 'goblin', description: '立即按当前期权获得影响力，并按本轮影响力提高产出。', formula: '(0.75 * ln(1 + x) ^ 3.15)%', x: 'factionCoinsTotal', effect: { stat: 'globalAdd', mode: 'add' }, instantFactionCoins: '20 + ln(1 + x) ^ 3', instantX: 'gems' },
  { id: 'nightTime', name: '通宵赶工', cost: 1000, duration: 20, faction: 'undead', description: '每座历史项目坟场使数字员工产出提高 30%。', effect: { stat: 'assistantAddPerBuilding', building: 'necropolis', value: 30 } },
  { id: 'hellfireBlast', name: '高压执行', cost: 1000, duration: 20, faction: 'demon', description: '按成就数提高高压事业部与全天候工作井产出。', formula: '(round(200 * x ^ 0.8))%', x: 'trophies', effect: { stat: 'buildingAdd', targets: ['evilFortress', 'hellPortal'], mode: 'add' } },
  { id: 'lightningStrike', name: '定点扩容', cost: 600, duration: 10, faction: 'titan', description: '随机强化一类设施，每座钢铁交付中心使倍率提高 500%；同时按期权提高影响力发现率。', randomTarget: true, effect: { stat: 'lightning', perBuilding: 'ironStronghold', value: 500 }, fcFormula: '(10 + log10(1 + x) ^ 2)%', fcX: 'gems' },
  { id: 'grandBalance', name: '流程均衡', cost: 1000, duration: 20, faction: 'druid', description: '按数量最多的三类设施，强化当前最低产出的设施。', balanceTarget: true, formula: '(25 * (x * y * z / (A + 3) ^ 6) ^ 0.9)%', effect: { stat: 'balance', mode: 'add' } },
  { id: 'brainwave', name: '灵感累积', cost: 600, duration: 600, faction: 'faceless', description: '生效期间，每秒累计增加全部设施产出 2%。', effect: { stat: 'brainwave', value: 2 } },
  { id: 'diamondPickaxe', name: '工程审计', cost: 1000, duration: 12, faction: 'dwarf', description: '每次审计使点击收入提高 25%，影响力发现率提高 200%。', effect: { stat: 'diamond', clickPerExcavation: 25, fcAdd: 200 } },
  { id: 'comboStrike', name: '影子连击', cost: 800, duration: 16, faction: 'drow', description: '按本轮影子连击释放次数提高全部设施产出。', formula: '(30 * x ^ 0.9)%', x: 'comboCasts', effect: { stat: 'globalAdd', mode: 'add' } },
];

export const SPELL_BY_ID = Object.fromEntries(SPELLS.map(s => [s.id, s]));
