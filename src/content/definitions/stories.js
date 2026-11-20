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
    id: 'intro.onboarding', title: '第一天', buttonLabel: '打卡入职', image: 'intro-onboarding.svg',
    imageAlt: '空白工位前放着一张只有编号轮廓的员工工牌',
    paragraphs: [
      '今天是你入职的第一天。',
      '早上 8:59，前台递给你一张工牌。上面没有姓名，只有一行默认编号：404。',
      '“系统建档延迟，暂时用这张临时卡，后续会自动补录。”',
      '你签下制式劳动合同，领到一台终端和一张空白工位。人事用毫无起伏的语调念完员工手册第一页：',
      '“账面工资按有效产出核算，工位设施由员工自行采购，历史贡献可在周期结束时折算为集团期权。完成首个职业周期考核后，你就可以提交退休申请了。”',
    ],
    reaction: { event: 'game.started', when: { op: 'newSave' }, priority: 100 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_day' }],
  }),
  story({
    id: 'intro.first_wage', title: '第一笔工资', buttonLabel: '继续工作', image: 'intro-first-wage.svg', required: false,
    imageAlt: '电脑屏幕显示一张没有员工姓名的工资单',
    paragraphs: [
      '账面工资 ＋¥1。',
      '终端弹出一条入账回执，员工姓名栏依然留白。',
      '附注说明：账面工资为集团内部劳动核算单位，仅限用于本职业周期内的设施采购与产线升级。它不属于个人存款，不可提现，亦不具备集团外的任何购买力。',
    ],
    reaction: { event: 'work.clicked', when: { op: 'statEquals', path: 'stats.total.clicks', value: 1 }, priority: 200 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_wage' }],
  }),
  story({
    id: 'intro.first_department', title: '组织的一员', buttonLabel: '查看部门记录', image: 'intro-first-department.svg', required: false,
    imageAlt: '多份部门文件通过同一条协作记录连接在一起',
    paragraphs: [
      '你的轮岗审批已经通过。',
      '从现在起，系统会将你的日常工作日志自动折算为该部门的「影响力」背书。积累背书可调用部门协作资源，并解锁其核心制度。',
      '人事在回执末尾附了一条加粗备注：“退出部门仅代表当前协作流程终止，不代表你的历史工作关系已被删除。”',
    ],
    reaction: { event: 'faction.joined', priority: 300 },
    grants: [{ type: 'awardTrophy', id: 'trophy.intro.first_department' }],
  }),
  story({
    id: 'alignment.idealism', title: '理想', buttonLabel: '继续', image: 'alignment-idealism.svg',
    imageAlt: '阳光书桌上的理想立场确认书、咖啡与绿植',
    paragraphs: [
      '立场评估已归档：「理想」。',
      '集团高度认可你的自驱力与价值认同。在这里，工作不只是按时交付，更是个人使命与团队愿景的深度共振。',
      '毕竟，把公司当成家的人，从来不会计较下班时间。',
    ],
    reaction: { event: 'alignment.selected', when: { op: 'eventDataEquals', path: 'alignmentId', value: 'good' }, priority: 250 },
    grants: [{ type: 'awardTrophy', id: 'trophy.alignment.idealism' }],
  }),
  story({
    id: 'alignment.pragmatism', title: '务实', buttonLabel: '继续', image: 'alignment-pragmatism.svg',
    imageAlt: '绩效表格、计算器、文件与钢笔组成的务实工作桌面',
    paragraphs: [
      '立场评估已归档：「务实」。',
      '集团欣赏不谈情怀、只看产出的职业态度。情绪没有折算公式，唯有可量化的结果、预算控制与执行纪律才具备考核价值。',
      '请盯紧你的指标——数字不会说谎，也不需要安慰。',
    ],
    reaction: { event: 'alignment.selected', when: { op: 'eventDataEquals', path: 'alignmentId', value: 'evil' }, priority: 250 },
    grants: [{ type: 'awardTrophy', id: 'trophy.alignment.pragmatism' }],
  }),
  story({
    id: 'intro.retirement_denied', title: '退休申请未受理', buttonLabel: '返回工位', image: 'intro-retirement-denied.svg',
    imageAlt: '退休申请被退回，人事窗口后的工牌仍然保持激活状态',
    paragraphs: [
      '你将退休申请递进人事窗口。',
      '扫描仪甚至没有亮起绿灯，出纸口直接吐出一张《职业周期考核未达标通知书》。',
      '窗口后的职员头也不抬，用红笔在你的工资单上圈出总额：“账面工资是本周期的唯一考核指标。累计产值未满 100M，系统无法生成退休审批单。”',
    ],
    reaction: { event: 'abdication.rejected', priority: 350 },
  }),
  story({
    id: 'intro.retirement_eligible', title: '退休申请资格', buttonLabel: '查看退休结算', image: 'intro-retirement-eligible.svg', required: false,
    imageAlt: '终端显示本轮产值已经达到退休申请门槛',
    paragraphs: [
      '终端屏幕跳出一条绿色提示：首个职业周期考核已达标（100M）。',
      '人事系统正式向你开放了退休结算入口。你可以继续留任刷高业绩，也可以现在就办理手续，将本轮贡献折算为期权。',
      '你拨通内线再次确认：“办完退休，我和公司的劳动合同就彻底终止了，对吗？”',
      '电话那头传来标准而礼貌的答复：“是的。退休生效后，您与当前岗位的劳动关系将全部结清。”',
    ],
    reaction: { path: 'stats.run.coins', when: { op: 'statAtLeast', path: 'stats.run.coins', value: 1e8 }, priority: 400 },
  }),
  story({
    id: 'intro.first_retirement', title: '第一次退休', buttonLabel: '开始新的职业周期', image: 'intro-first-retirement.svg',
    imageAlt: '员工工牌进入历史档案，新的空白工位已经准备好',
    paragraphs: [
      '退休那天，人事为你戴上大红花，主管和你握手合影，茶水间的蛋糕上裱着“光荣退休”。你交回工牌，抱着纸箱走出大楼，生平第一次看见下午五点的太阳。',
      '第二天清晨，闹钟照常响起。你伸手去按，动作却猛地僵在半空——那是一只年轻人的手。腰背不再酸痛，镜子里的人头发乌黑，床头柜上躺着四十二年前流行过的旧款手机。墙上的日历，停在你第一次入职的那一天。',
      '你赶到公司时，时钟刚好跳向 8:59。前台抬起头，像四十二年前一样递来一张工牌，语气和停顿分毫不差：“系统里暂时没有你的完整资料，先用这张 404，之后会补录。”',
      '你僵在原地没有去接，手指却在口袋里触到一张硬纸。抽出来一看，是昨天那张《光荣退休证明》——红花的花瓣还夹在折痕里，落款日期却清晰地印着四十二年后。',
      '你失魂落魄地坐回那张空白工位前，面前的终端自动亮起，开始初始化档案：「正在写入员工资料……」',
      '屏幕诡异地卡顿了一秒，一行暗红报错一闪而过：「写入失败：该记录已存在。」',
      '紧接着，报错消失，屏幕切回崭新的入职欢迎页。不远处，人事正微笑着向你招手：“别发呆了，新人，今天开始计算工龄。”',
    ],
    reaction: { event: 'abdication.completed', priority: 500 },
    completionActions: [{ type: 'completeStoryGroup', group: 'prologue' }],
  }),
];
