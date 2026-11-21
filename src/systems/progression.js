export function gemsForRunCoins(coins) {
  const value = Math.max(0, Number(coins) || 0);
  return Math.floor(((1 + 4 * value / 5e11) ** 0.5 - 1) / 2);
}
export function coinsForGems(gems) {
  const value = Math.max(0, Number(gems) || 0);
  return value * (value + 1) * 5e11;
}
export function reincarnationRequirement(reincarnations) {
  const r = Math.max(0, Math.floor(Number(reincarnations) || 0));
  return 1e27 * 1000 ** r;
}

export function ascensionForReincarnation(reincarnations) {
  const r = Math.max(0, Math.floor(Number(reincarnations) || 0));
  if (r >= 220) return 4;
  if (r >= 160) return 3;
  if (r >= 100) return 2;
  if (r >= 40) return 1;
  return 0;
}

export function ascensionStartReincarnation(ascension) {
  return [0, 40, 100, 160, 220][ascension] ?? 220;
}

export function buildingGrowthForAscension(ascension) {
  return 1 + 0.15 / Math.max(1, Math.max(0, ascension) * 5);
}

export function reincarnationPower(reincarnations, { rTime = 0 } = {}) {
  const r = Math.max(0, Math.floor(Number(reincarnations) || 0));
  const r2 = Math.max(0, r - 39);
  const r3 = Math.max(0, r - 99);
  const r4 = Math.max(0, r - 159);
  const r5 = Math.max(0, r - 219);
  return Object.freeze({
    r2, r3, r4, r5,
    productionPercent: 50 * r + 10 * r2 + 25 * r3 + 150 * r4 + 10 * r5,
    timeProductionPercent: r ** 1.75 * (Math.max(0, rTime) / 3600) ** 0.65,
    offlineMultiplier: 0.5 + 5 * r,
    manaMaxAdd: 35 * r + 70 * r2 ** 1.25,
    manaRegenAdd: 2 * r,
    manaRegenMultiplier: (1 + 0.02 * r3) * (1 + 5 * Math.sqrt(r5)),
    assistantsAdd: r + 4 * r2,
    assistantProductionPercent: 2 * r,
    exchangeBonus: 0.5 * r,
    fcChanceAdd: 10 * r,
    fcChanceMultiplier: (1 + 0.015 * r2 ** 0.95) * (1 + 5 * Math.sqrt(r5)),
    factionCoinGainMultiplier: (1 + 0.012 * r2 ** 1.05) * (1 + 0.012 * r3 ** 1.05),
    autoClickRate: Math.sqrt(r2),
    gemPowerAdd: 0.2 * r,
  });
}
