const story = ({ id, title, paragraphs, image, imageAlt, buttonLabel, reaction, grants = [], completionActions = [], required = true }) => ({
  id, kind: 'story', contentVersion: 'base-v1', name: title, title, paragraphs,
  image: image.startsWith('assets/') ? image : `assets/story/${image}`, imageAlt, buttonLabel,
  era: { minR: 0 }, visible: { op: 'always' }, unlock: { op: 'always' }, purchase: null,
  presentation: { mode: 'modal', required, queue: 'prologue' },
  effects: [], grants, reactions: [reaction], completionActions,
  rewardId: `${id}.rewards`, scope: 'total', ui: { kind: 'storyModal', panel: 'stories' },
});

export const STORY_DEFINITIONS = [
  story({
    id: 'intro.onboarding', title: '第一天', buttonLabel: '开始工作', image: 'intro-onboarding.svg',
    imageAlt: '空白工位前放着一张只有编号轮廓的员工工牌',
    paragraphs: ['今天是你入职的第一天。', '早上 8:59，前台递给你一张工牌。上面没有姓名，只有编号：404。', '“系统里暂时没有你的完整资料，先用这个，之后会补录。”', '你签下劳动合同，领到一台电脑和一张空白工位。人事向你介绍了公司的三项基本制度：', '工资按产出结算，设施由员工自行购置，历史贡献可以折算为期权。', '“完成首个职业周期考核后，你就可以申请退休。”'],
    reaction: { event: 'game.started', when: { op: 'newSave' }, priority: 100 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_day' }],
  }),
  story({
    id: 'intro.first_wage', title: '第一笔工资', buttonLabel: '继续工作', image: 'intro-first-wage.svg', required: false,
    imageAlt: '电脑屏幕显示一张没有员工姓名的工资单',
    paragraphs: ['账面工资＋¥1。', '账面工资是集团内部劳动核算单位，可用于本职业周期内的设施采购与生产升级。它不属于个人存款，不可提现，也不代表集团外购买力。'],
    reaction: { event: 'work.clicked', when: { op: 'statEquals', path: 'stats.total.clicks', value: 1 }, priority: 200 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_wage' }],
  }),
  story({
    id: 'intro.first_department', title: '组织的一员', buttonLabel: '查看部门记录', image: 'intro-first-department.svg', required: false,
    imageAlt: '多份部门文件通过同一条协作记录连接在一起',
    paragraphs: ['你的轮岗申请已经通过。', '从今天起，相关部门会将你的工作日志折算为部门影响力。积累背书可以调用更多协作资源，也可以学习该部门的核心制度。', '人事特别提醒：', '“退出部门只代表当前协作结束，不代表历史工作关系被删除。”'],
    reaction: { event: 'faction.joined', priority: 300 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_department' }],
  }),
  story({
    id: 'alignment.idealism', title: '理想', buttonLabel: '继续', image: 'alignment-idealism.svg',
    imageAlt: '阳光书桌上的理想立场确认书、咖啡与绿植',
    paragraphs: ['你选择「理想」。', '公司鼓励主动投入，重视价值认同、员工使命与团队协作。', '请与团队共同完成当前工作。'],
    reaction: { event: 'alignment.selected', when: { op: 'eventDataEquals', path: 'alignmentId', value: 'good' }, priority: 250 },
    grants: [{ type: 'awardTrophy', id: 'trophy.alignment.idealism' }],
  }),
  story({
    id: 'alignment.pragmatism', title: '务实', buttonLabel: '继续', image: 'alignment-pragmatism.svg',
    imageAlt: '绩效表格、计算器、文件与钢笔组成的务实工作桌面',
    paragraphs: ['你选择「务实」。', '公司重视绩效责任、结果交付、资源预算与执行纪律。', '请按既定目标完成当前工作。'],
    reaction: { event: 'alignment.selected', when: { op: 'eventDataEquals', path: 'alignmentId', value: 'evil' }, priority: 250 },
    grants: [{ type: 'awardTrophy', id: 'trophy.alignment.pragmatism' }],
  }),
  story({
    id: 'intro.retirement_denied', title: '退休申请未受理', buttonLabel: '返回工作岗位', image: 'intro-retirement-denied.svg',
    imageAlt: '退休申请被退回，人事窗口后的工牌仍然保持激活状态',
    paragraphs: ['你把退休申请递进人事窗口。系统没有盖章，只退回一张《职业周期考核未完成通知》。', '人事看了一眼你的工资单：“账面工资是本周期的劳动单位，只有本轮账面产值达到 100M，公司才会受理退休。”', '退回的申请末尾只有一行提示：请先将本轮账面产值提升至 100M，再提交退休申请。'],
    reaction: { event: 'abdication.rejected', priority: 350 },
  }),
  story({
    id: 'intro.retirement_eligible', title: '退休申请资格', buttonLabel: '查看退休结算', image: 'intro-retirement-eligible.svg', required: false,
    imageAlt: '终端显示本轮产值已经达到退休申请门槛',
    paragraphs: ['终端上的本轮产值第一次越过 100M。', '人事系统已经开放退休结算入口。你可以继续积累，也可以结束本轮并结算期权。'],
    reaction: { path: 'stats.run.coins', when: { op: 'statAtLeast', path: 'stats.run.coins', value: 1e8 }, priority: 400 },
  }),
  story({
    id: 'intro.first_retirement', title: '第一次退休', buttonLabel: '开始新的职业周期', image: 'intro-first-retirement.svg',
    imageAlt: '员工工牌进入历史档案，新的空白工位已经准备好',
    paragraphs: ['你的第一张工牌被放入历史档案。', '设施、账面工资和本轮部门关系已经结算，奖杯与序章记录将保留。', '新的工位已经准备好。合同已经归档，但公司的组织规模仍没有可确认的上限。'],
    reaction: { event: 'abdication.completed', priority: 500 },
    completionActions: [{ type: 'completeStoryGroup', group: 'prologue' }],
  }),
];
