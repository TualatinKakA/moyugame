export class NumericError extends Error {
  constructor(message) { super(message); this.name = 'NumericError'; this.code = 'NUMERIC_NON_FINITE'; }
}

const finite = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new NumericError(`Non-finite numeric value: ${value}`);
  return number;
};

export function createNumericAdapter() {
  return Object.freeze({
    add: (a, b) => finite(finite(a) + finite(b)),
    sub: (a, b) => finite(finite(a) - finite(b)),
    multiply: (a, b) => finite(finite(a) * finite(b)),
    divide: (a, b) => {
      const divisor = finite(b);
      if (divisor === 0) throw new NumericError('Division by zero');
      return finite(finite(a) / divisor);
    },
    pow: (a, b) => finite(finite(a) ** finite(b)),
    log: a => finite(Math.log(finite(a))),
    ln: a => finite(Math.log(finite(a))),
    sqrt: a => finite(Math.sqrt(finite(a))),
    floor: a => Math.floor(finite(a)),
    ceil: a => Math.ceil(finite(a)),
    compare: (a, b) => finite(a) < finite(b) ? -1 : finite(a) > finite(b) ? 1 : 0,
    min: (a, b) => Math.min(finite(a), finite(b)),
    max: (a, b) => Math.max(finite(a), finite(b)),
    isFinite: value => Number.isFinite(Number(value)),
    isNonNegative: value => Number.isFinite(Number(value)) && Number(value) >= 0,
    parse: finite,
    serialize: value => finite(Object.is(Number(value), -0) ? 0 : value),
  });
}

export const numeric = createNumericAdapter();
