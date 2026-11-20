export function exchangePrice(owned, offset = 1) {
  const cumulative = q => Math.floor(20 * (1 - 1.1 ** (q + owned)) / (1 - 1.1));
  return Math.round(cumulative(offset) - cumulative(offset - 1));
}

export function exchangeQuote(state, factionId, amount = 1) {
  const owned = state.royalExchange[factionId] || 0;
  const balance = state.resources.factionCoins[factionId] || 0;
  let quantity = amount === 'max' ? 0 : Math.max(1, Math.floor(Number(amount) || 1));
  const prices = [];
  let total = 0;
  if (amount === 'max') {
    while (true) {
      const price = exchangePrice(owned, quantity + 1);
      if (total + price > balance) break;
      total += price;
      prices.push(price);
      quantity++;
    }
  } else {
    for (let index = 0; index < quantity; index++) {
      const price = exchangePrice(owned, index + 1);
      prices.push(price);
      total += price;
    }
  }
  return { owned, quantity, prices, total };
}

export function royalExchangeCount(state) {
  return Object.values(state.royalExchange).reduce((sum, value) => sum + value, 0);
}

export function royalExchangeBonus(state) {
  const elvenBonus = state.owned.run['elven-5']
    ? 1.75 * Math.log(1 + (state.stats.ascension.factionCoins || 0)) ** 1.75
    : 0;
  return 10 + elvenBonus;
}

export function royalExchangeMultiplier(state) {
  const count = royalExchangeCount(state);
  if (count === 0) return 1;
  const ascension = state.progression.ascension || 0;
  const base = 0.1;
  const exponent = 0.7 * base ** 0.7;
  const adjustedExponent = ascension > 0 ? exponent / (1 + 2.5 * Math.log(Math.max(1, ascension))) : exponent;
  return (1 + 0.01 * royalExchangeBonus(state) * count) ** adjustedExponent;
}
