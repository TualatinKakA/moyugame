const cache = new Map();

function cleanFormula(formula) {
  let text = String(formula || '0').split(/,?\s+where\s+/i)[0].replace(/%/g, '').replace(/as a percent/ig, '').trim();
  text = text.replace(/\bln\s*\(/g, 'log(').replace(/\^/g, '**');
  let balance = 0;
  for (const char of text) {
    if (char === '(') balance++;
    if (char === ')') balance--;
  }
  while (balance < 0 && text.endsWith(')')) {
    text = text.slice(0, -1);
    balance++;
  }
  return text;
}

export function evaluateFormula(formula, context = {}) {
  const cleaned = cleanFormula(formula);
  try {
    if (!cache.has(cleaned)) {
      cache.set(cleaned, new Function('x', 'y', 'R', 'T', 'A', 'ctx', `const {log, log10, floor, ceil, round, min, max} = ctx; return (${cleaned});`));
    }
    const result = cache.get(cleaned)(
      context.x ?? 0, context.y ?? 0, context.R ?? 0, context.T ?? 0, context.A ?? 0,
      { log: Math.log, log10: Math.log10, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max },
    );
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

export function formulaContext(stats, x, extras = {}) {
  return { ...stats, ...extras, x: typeof x === 'string' ? stats[x] ?? 0 : x };
}
