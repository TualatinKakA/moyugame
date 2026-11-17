export const ASCENSION_ACHIEVEMENTS = [
  {
    id: 'trophy.ascension.first_restatement',
    category: 'story',
    name: '账本重述',
    description: '本次组织重述仅调整账面记录方式，不改变您的历史劳动关系。',
    trigger: { event: 'ascension.completed', condition: 'ascensionAtLeast1' },
    acquireMode: 'auto',
    visibility: 'visible',
    once: 'profile',
    presentation: 'achievementCard',
    reward: { type: 'none' },
  },
];
