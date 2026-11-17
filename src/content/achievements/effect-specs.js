import { createAchievementRegistry, getActiveAchievementRewards } from '../../systems/achievements.js';
import { ACHIEVEMENTS } from './index.js';

const registry = createAchievementRegistry(ACHIEVEMENTS);
const REWARD_STATS = {
  globalProduction: ['global.production', 'global'],
  buildingProduction: ['building.production', 'buildingLocal'],
  clickReward: ['click.reward', 'click'],
  manaMax: ['mana.max', 'mana'],
  manaRegen: ['mana.regen', 'mana'],
  assistants: ['assistants.count', 'assistants'],
  assistantProduction: ['assistants.production', 'assistants'],
  factionCoinChance: ['factionCoin.chance', 'factionCoin'],
  offlineProduction: ['offline.production', 'utility'],
  royalExchangeBonus: ['exchange.bonus', 'global'],
};

export function achievementEffectSpecs(state) {
  const rewards = getActiveAchievementRewards(state, { registry });
  const specs = [];
  for (const { achievementId, reward } of rewards) {
    if (reward.type === 'spellEffect') continue;
    const mapping = REWARD_STATS[reward.type];
    if (!mapping) throw new Error(`Achievement reward ${reward.type} has no EffectSpec adapter`);
    const value = Number(reward.value);
    if (!Number.isFinite(value)) throw new Error(`Achievement reward ${achievementId} requires a numeric constant adapter`);
    const [stat, phase] = mapping;
    specs.push({
      id: `achievement:${achievementId}:0`,
      source: `achievement:${achievementId}`,
      stat,
      operation: reward.operation,
      value: { constant: value },
      target: reward.target || { type: 'global' },
      phase: reward.phase || phase,
      stackingGroup: reward.stackingGroup || `${stat}:${reward.operation}`,
    });
  }
  return specs;
}
