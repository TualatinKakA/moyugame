const levels = [
  [1, '洲际业务域', '洲际业务主管', '第一次人生合并后，其他大陆的分公司出现在了同一套返聘系统中。'],
  [3, '地球事业群', '全球业务经理', '第三次人生结算时，地球被归档为一个统一核算项目。'],
  [7, '太阳系事业部', '太阳系运营总监', '第七次人生结算时，履历中多出一段火星夜班记录。排班日期距今还有一百三十年。'],
  [15, '银河系管理域', '银河业务总裁', '第十五次人事复核将不同文明统一列为用工形式差异。'],
  [40, '全宇宙业务域', '宇宙执行官', '第四十次合同合并后，时间与因果规则出现在可修订的公司制度附录中。'],
  [100, '多元宇宙管理域', '多元宇宙理事', '第一百次档案归集显示，不同宇宙是同一劳动关系的不同执行版本。'],
  [150, '多元宇宙集群', '集群组织理事', '第一百五十次任职记录中，你开始审批包含自身申请的高层组织文件。'],
];

export const REINCARNATION_ACHIEVEMENTS = levels.map(([level, businessScope, rank, fragment]) => ({
  id: `trophy.reincarnation.${level}`,
  category: 'gameplay',
  name: level === 1 ? '二世任职' : `${level} 次投胎`,
  description: fragment,
  trigger: {
    event: 'reincarnation.completed',
    condition: `reincarnationAtLeast${level}`,
  },
  acquireMode: 'auto',
  visibility: 'visible',
  once: 'profile',
  presentation: 'achievementCard',
  business: { level, scope: businessScope, rank },
  reward: { type: 'none' },
}));

export const DEFAULT_BUSINESS = Object.freeze({
  level: 0,
  scope: '地方分公司',
  rank: '见习员工',
  achievementId: null,
});
