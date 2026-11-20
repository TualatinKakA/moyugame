// Realm Grinder A0-compatible progression formulas used by the prologue foundation.
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
export function reincarnationPower(reincarnations) {
  const r = Math.max(0, Math.floor(Number(reincarnations) || 0));
  return Object.freeze({
    productionPercent: 50 * r,
    offlineMultiplier: 0.5 + 5 * r,
    manaRegenAdd: 2 * r,
  });
}

export function ascensionForReincarnation(reincarnations) {
  const r = Math.max(0, Math.floor(Number(reincarnations) || 0));
  if (r >= 220) return 4;
  if (r >= 160) return 3;
  if (r >= 100) return 2;
  if (r >= 1) return 1;
  return 0;
}
