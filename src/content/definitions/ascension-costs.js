const beforeA4 = { op: 'statLessThan', path: 'progression.ascension', value: 4 };
const atA4 = { op: 'statAtLeast', path: 'progression.ascension', value: 4 };
const conditionalCost = (resource, amount, when) => ({ resource, amount: { constant: amount }, when });

export function factionTreatyCosts(allowInitialFree = false) {
  const paid = allowInitialFree ? {
    all: [
      { any: [
        { op: 'statAtLeast', path: 'resources.gems', value: 1 },
        { op: 'statAtLeast', path: 'progression.reincarnations', value: 1 },
      ] },
      beforeA4,
    ],
  } : beforeA4;
  return [
    conditionalCost('factionCoin.target', 20, paid),
    conditionalCost('factionCoin.target', 1e15, atA4),
  ];
}

export function factionAgreementCosts(faction, cost) {
  return [
    conditionalCost(`factionCoin.${faction}`, cost, beforeA4),
    conditionalCost(`factionCoin.${faction}`, cost === 100 ? 1e21 : 1e27, atA4),
  ];
}

export function factionUpgradeCosts(cost, number) {
  const group = Math.floor((number - 1) / 3);
  const a4Cost = 1e51 * 1000 ** (number - 1) * 1000 ** (0.5 * group * (group + 1));
  return [
    conditionalCost('coins', cost, beforeA4),
    conditionalCost('coins', a4Cost, atA4),
  ];
}

export function legacyCoinCosts(cost) {
  return [
    conditionalCost('coins', cost, { op: 'statLessThan', path: 'progression.ascension', value: 1 }),
    conditionalCost('coins', 0, { op: 'statAtLeast', path: 'progression.ascension', value: 1 }),
  ];
}
